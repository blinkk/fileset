import * as cliProgress from 'cli-progress';
import { mapLimit } from 'async';
import { Manifest } from './manifest';

const {Storage} = require('@google-cloud/storage');

const bucket = 'wing-prod.appspot.com';
const siteId = 'fiber';
const NUM_CONCURRENT_UPLOADS = 24;

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

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  const numFiles = manifest.files.length;
  let numProcessed = 0;
  bar.start(numFiles, numProcessed);

  mapLimit(manifest.files, NUM_CONCURRENT_UPLOADS, (item, callback) => {
    let manifestFile = item;
    let remotePath = getFilePath(siteId, manifestFile.hash);
    // console.log(`Uploading ${manifestFile.cleanPath} -> ${bucket}/${remotePath}`);
    let metadata: Metadata = {
      cacheControl: 'public, max-age=31536000',
      contentType: manifestFile.mimetype,
      metadata: {
        path: manifestFile.cleanPath
      },
    };

    // TODO: Handle upload errors and retries.
    storage.bucket(bucket).upload(manifestFile.path, {
      destination: remotePath,
      gzip: true,
      metadata: metadata,
    }).then(() => {
      bar.update(numProcessed += 1);
      if (numProcessed == numFiles) {
        bar.stop();
      }
      callback();
    });
  })
}