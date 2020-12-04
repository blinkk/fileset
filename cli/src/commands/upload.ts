import {Manifest} from '../manifest';
import * as upload from '../upload';

interface UploadOptions {
  bucket: string;
  site: string;
  ref: string;
  branch: string;
  redirect: string;
  config: string;
}

export class UploadCommand {
  constructor(private readonly options: UploadOptions) {
    this.options = options;
  }

  run(path: string) {
    let manifest = new Manifest(this.options.site, this.options.ref, this.options.branch);
    manifest.createFromDirectory(path);
    upload.uploadManifest(this.options.bucket, manifest);
  }
}