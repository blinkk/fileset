import {Manifest} from '../manifest';
import * as upload from '../upload';

interface UploadOptions {
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
    let manifest = new Manifest();
    manifest.createFromDirectory(path);
    upload.uploadManifest(this.options.site, manifest);
  }
}