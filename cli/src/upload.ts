import {Manifest} from './manifest';
const {Storage} = require('@google-cloud/storage');

const bucket = 'wing-prod.appspot.com';
const siteId = 'fiber';

function getFilePath (siteId: string, hash: string) {
  return `fileset/sites/${siteId}/blobs/${hash}`;
}

export interface Metadata {
  cacheControl: string;
  contentType: string;
  metadata: {};
}

export async function uploadManifest(manifest: Manifest) {
  const storage = new Storage();
  const numFiles = manifest.files.length;
  for (let i = 0; i <= manifest.files.length; i++) {
    let manifestFile = manifest.files[i];
    if (i > 10) {
      return;
    }
    let remotePath = getFilePath(siteId, manifestFile.hash);
    console.log(`Uploading ${i}/${numFiles}: ${manifestFile.cleanPath} -> ${bucket}/${remotePath}`);
    let metadata: Metadata = {
      cacheControl: 'public, max-age=31536000',
      contentType: manifestFile.mimetype,
      metadata: {
        path: manifestFile.cleanPath
      },
    };
    try {
      await storage.bucket(bucket).upload(manifestFile.path, {
        destination: remotePath,
        gzip: true,
        metadata: metadata,
      });
    } catch (err) {
      console.log(err);
    }
  };
}