import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsPath from 'path';
import * as mimeTypes from 'mime-types';


export interface ManifestFile {
  hash: string;
  path: string;
  mimetype: string;
  cleanPath: string;
}

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

export class Manifest {
  files: ManifestFile[]

  constructor() {
    this.files = [];
  }

  async createFromDirectory(path: string) {
    let paths = walk(path);
    paths.forEach((filePath) => {
      this.addFile(filePath, path);
    });
  }

  async addFile(path: string, dir: string) {
    let contents = fs.readFileSync(path);
    let hash = crypto.createHash('sha1');
    hash.setEncoding('hex');
    hash.write(contents);
    hash.end();
    let cleanPath = path.replace(dir, '');
    let manifestFile: ManifestFile = {
      cleanPath: cleanPath,
      hash: hash.read(),
      mimetype: mimeTypes.lookup(path) || 'application/octet-stream',
      path: path,
    };
    this.files.push(manifestFile);
  }

  async toJson() {
  }

}