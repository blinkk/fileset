import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsPath from 'path';
import * as mimeTypes from 'mime-types';
import { map } from 'async';


const walk = function(path: string, newFiles ?: string[]) {
  let files = newFiles || [];
  fs.readdirSync(path).forEach((file) => {
    let absPath = fsPath.join(path, file);
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

export interface PathToHash {
  path?: string;
}

export class Manifest {
  site: string
  ref: string
  branch?: string
  files: ManifestFile[]
  shortSha: string

  constructor(site: string, ref: string, branch?: string) {
    this.files = [];
    this.site = site;
    this.ref = ref;
    this.shortSha = ref.slice(0, 7);
    this.branch = branch;
  }

  async createFromDirectory(path: string) {
    let paths = walk(path);
    paths.forEach((filePath) => {
      this.addFile(filePath, path);
    });
  }

  createHash(path: string) {
    let contents = fs.readFileSync(path);
    let hash = crypto.createHash('sha1');
    hash.setEncoding('hex');
    hash.write(contents);
    hash.end();
    return hash.read();
  }

  async addFile(path: string, dir: string) {
    let hash = this.createHash(path);
    let cleanPath = path.replace(dir, '');
    let manifestFile: ManifestFile = {
      cleanPath: cleanPath,
      hash: hash,
      mimetype: mimeTypes.lookup(path) || 'application/octet-stream',
      path: path,
    };
    this.files.push(manifestFile);
  }

  toJSON() {
    let pathsToHashes: any = {};
    this.files.forEach((file) => {
      pathsToHashes[file.cleanPath] = file.hash;
    })
    return pathsToHashes;
  }

}