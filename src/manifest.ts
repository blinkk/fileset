import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsPath from 'path';
import * as mimeTypes from 'mime-types';

const walk = function (path: string, newFiles?: string[]) {
  let files = newFiles || [];
  fs.readdirSync(path).forEach(file => {
    const absPath = fsPath.join(path, file);
    if (fs.statSync(absPath).isDirectory()) {
      files = walk(absPath, files);
    } else {
      files.push(absPath);
    }
  });
  return files;
};

export interface ManifestFile {
  hash: string;
  path: string;
  mimetype: string;
  cleanPath: string;
}

export interface Redirect {
  from: string;
  to: string;
  permanent?: boolean;
}

export interface SerializedManifest {
  site: string;
  ref: string;
  branch?: string;
  paths: Record<string, string>;
  redirects: Redirect[];
  shortSha: string;
  modified: string;
}

export class Manifest {
  site: string;
  ref: string;
  branch?: string;
  files: ManifestFile[];
  redirects: Redirect[];
  shortSha: string;

  constructor(site: string, ref: string, branch?: string) {
    this.files = [];
    this.redirects = [];
    this.site = site;
    this.ref = ref;
    this.shortSha = ref.slice(0, 7);
    this.branch = branch;
  }

  async createFromDirectory(path: string) {
    const paths = walk(path);
    paths.forEach(filePath => {
      this.addFile(filePath, path);
    });
  }

  setRedirects(redirects: Redirect[]) {
    this.redirects = redirects;
  }

  createHash(path: string) {
    const contents = fs.readFileSync(path);
    const hash = crypto.createHash('sha1');
    hash.setEncoding('hex');
    hash.write(contents);
    hash.end();
    return hash.read();
  }

  async addFile(path: string, dir: string) {
    const hash = this.createHash(path);
    const cleanPath = path
      .replace(dir.replace(/^\\+|\\+$/g, ''), '/')
      .replace('//', '/');
    const manifestFile: ManifestFile = {
      cleanPath: cleanPath,
      hash: hash,
      mimetype: mimeTypes.lookup(path) || 'application/octet-stream',
      path: path,
    };
    this.files.push(manifestFile);
  }

  async addRedirect(from: string, to: string, permanent: boolean) {
    const redirect: Redirect = {
      from: from,
      to: to,
      permanent: permanent,
    };
    this.redirects.push(redirect);
  }

  pathsToJSON() {
    const pathsToHashes: any = {};
    this.files.forEach(file => {
      pathsToHashes[file.cleanPath] = file.hash;
    });
    return pathsToHashes;
  }
}
