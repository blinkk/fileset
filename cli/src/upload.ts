import * as cliProgress from 'cli-progress';
import { mapLimit } from 'async';
import { Manifest } from './manifest';
const _colors = require('colors');

const {Storage} = require('@google-cloud/storage');

const DEFAULT_BUCKET = `${process.env.GCLOUD_PROJECT}.appspot.com`;

const NUM_CONCURRENT_UPLOADS = 24;

function getFilePath (siteId: string, hash: string) {
  return `fileset/sites/${siteId}/blobs/${hash}`;
}

export interface Metadata {
  cacheControl: string;
  contentType: string;
  metadata: {};
}

export async function uploadManifest(siteId: string, bucket: string, manifest: Manifest) {
  bucket = bucket || DEFAULT_BUCKET;  // If bucket is blank.
  console.log(`Uploading to -> ${bucket}/${getFilePath(siteId, '')}`);

  const storage = new Storage();
  const bar = new cliProgress.SingleBar({
    format: 'Uploading ({value}/{total}): ' + _colors.green('{bar}') + ' Total: {duration_formatted} ({speed}MB/s, ETA: {eta_formatted})',
  }, cliProgress.Presets.shades_classic);
  const numFiles = manifest.files.length;

  let totalTransferred = 0;
  let numProcessed = 0;
  let startTime = Math.floor(Date.now() / 1000);
  bar.start(numFiles, numProcessed, {
    speed: 0
  });

  // TODO: Stat remote files prior to upload; only upload new files
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
    }).then((resp: any) => {
      totalTransferred += parseInt(resp[1].size);
      let elapsed = Math.floor(Date.now() / 1000) - startTime;
      bar.update(numProcessed += 1, {
        speed: (totalTransferred / elapsed / (1024*1024)).toFixed(2),
      });
      if (numProcessed == numFiles) {
        bar.stop();
      }
      callback();
    });
  })
}