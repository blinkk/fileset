import * as fs from 'fs';
import * as fsPath from 'path';
import * as manifest from '../manifest';
import * as upload from '../upload';
import * as yaml from 'js-yaml';

import {getGitData} from '../gitdata';

interface UploadOptions {
  branch?: string;
  bucket: string;
  force?: boolean;
  googleCloudProject?: string;
  ref?: string;
  site: string;
  ttl?: string;
}

interface LocalizationConfig {
  pathFormat?: string;
}

interface RedirectConfig {
  from: string;
  to: string;
  permanent?: boolean;
}

interface Config {
  google_cloud_project?: string;
  site?: string;
  localization?: LocalizationConfig;
  redirectTrailingSlashes?: boolean;
  redirects?: RedirectConfig[];
  headers?: Record<string, Record<string, string>>;
}

function findConfig(path: string): Config {
  let configPath = null;
  const immediatePath = fsPath.join(path, 'fileset.yaml');
  const ancestorPath = fsPath.join(fsPath.dirname(path), 'fileset.yaml');
  if (fs.existsSync(immediatePath)) {
    configPath = immediatePath;
  } else if (fs.existsSync(ancestorPath)) {
    configPath = ancestorPath;
  } else {
    return {};
  }
  return (yaml.safeLoad(fs.readFileSync(configPath, 'utf8')) as Config) || {};
}

export class UploadCommand {
  constructor(private readonly options: UploadOptions) {
    this.options = options;
  }

  async run(path = './') {
    const gitData = await getGitData(path);
    const config = findConfig(path);
    const ttl = this.options.ttl ? new Date(this.options.ttl) : undefined;
    const site = this.options.site || config.site;

    const googleCloudProject =
      this.options.googleCloudProject ||
      config.google_cloud_project ||
      process.env.GOOGLE_CLOUD_PROJECT;
    if (!googleCloudProject) {
      throw new Error(
        'Unable to determine which Google Cloud Storage bucket to use. You must specify a `google_cloud_project` in `fileset.yaml`, use the `-p` flag, or specify a `GOOGLE_CLOUD_PROJECT` environment variable.'
      );
    }
    const bucket = this.options.bucket || `${googleCloudProject}.appspot.com`;

    const manifestObj = new manifest.Manifest(
      (site as string) || 'default',
      this.options.ref || gitData.ref,
      this.options.branch || gitData.branch || '',
      gitData.commit
    );
    await manifestObj.createFromDirectory(path);
    if (config.redirectTrailingSlashes === false) {
      manifestObj.redirectTrailingSlashes = config.redirectTrailingSlashes;
    }
    if (config.localization) {
      if (config.localization.pathFormat) {
        manifestObj.localizationPathFormat = config.localization.pathFormat;
      }
    }
    if (config.redirects) {
      manifestObj.setRedirects(config.redirects as manifest.Redirect[]);
    }
    if (config.headers) {
      manifestObj.setHeaders(
        config.headers as Record<string, Record<string, string>>
      );
    }
    if (!manifestObj.files.length) {
      console.log(`No files found in -> ${path}`);
      return;
    }
    await upload.uploadManifest(
      googleCloudProject as string,
      bucket,
      manifestObj,
      this.options.force,
      ttl
    );
  }
}
