import * as upload from '../upload';

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

export class UploadCommand {
  constructor(private readonly options: UploadOptions) {
    this.options = options;
  }

  async run(path = './') {
    const gitData = await getGitData(path);
    const manifest = new Manifest(
      this.options.site,
      this.options.ref || gitData.ref,
      this.options.branch || gitData.branch || ''
    );
    manifest.createFromDirectory(path);
    if (!manifest.files.length) {
      console.log(`No files found in -> ${path}`);
      return;
    }
    const ttl = this.options.ttl ? new Date(this.options.ttl) : undefined;
    upload.uploadManifest(
      this.options.bucket,
      manifest,
      this.options.force,
      ttl
    );
  }
}
