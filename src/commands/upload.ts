import * as fs from 'fs';
import * as fsPath from 'path';
import * as upload from '../upload';
import * as yaml from 'js-yaml';

import {Manifest} from '../manifest';
import {getGitData} from '../gitdata';

interface UploadOptions {
  bucket: string;
  force?: boolean;
  site: string;
  ref?: string;
  branch?: string;
  ttl?: string;
}

function findConfig(path: string) {
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
  // TODO: Validate config schema.
  const config = yaml.safeLoad(fs.readFileSync(configPath, 'utf8')) as Record<
    string,
    string
  >;
  return config;
}

export class UploadCommand {
  constructor(private readonly options: UploadOptions) {
    this.options = options;
  }

  async run(path = './') {
    const gitData = await getGitData(path);
    const config = findConfig(path);
    const ttl = this.options.ttl ? new Date(this.options.ttl) : undefined;
    let bucket = this.options.bucket;
    if (!bucket && config.google_cloud_project) {
      bucket = `${config.google_cloud_project}.appspot.com`;
    } else if (!bucket && process.env.GOOGLE_CLOUD_PROJECT) {
      bucket = `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
    }
    if (!bucket) {
      throw new Error(
        'Unable to determine which Google Cloud Storage bucket to use. You must specify a `google_cloud_project` in `fileset.yaml` or specify a `GOOGLE_CLOUD_PROJECT` environment variable.'
      );
    }
    const site = this.options.site || config.site;
    const manifest = new Manifest(
      site,
      this.options.ref || gitData.ref,
      this.options.branch || gitData.branch || ''
    );
    manifest.createFromDirectory(path);
    if (!manifest.files.length) {
      console.log(`No files found in -> ${path}`);
      return;
    }
    upload.uploadManifest(bucket, manifest, this.options.force, ttl);
  }
}
