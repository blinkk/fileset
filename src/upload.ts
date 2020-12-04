import * as cliProgress from 'cli-progress';
import {asyncify, mapLimit} from 'async';
import {Manifest, ManifestFile} from './manifest';
import _colors = require('colors');

import {Storage} from '@google-cloud/storage';
import {Datastore} from '@google-cloud/datastore';

const datastore = new Datastore();

const DEFAULT_BUCKET = `${process.env.GCLOUD_PROJECT}.appspot.com`;

const NUM_CONCURRENT_UPLOADS = 64;

function getBlobPath(siteId: string, hash: string) {
  return `fileset/sites/${siteId}/blobs/${hash}`;
}

export interface Metadata {
  cacheControl: string;
  contentType: string;
  metadata: {};
}

const findUploadedFiles = async (manifest: Manifest, storageBucket: any) => {
  const filesToUpload: Array<ManifestFile> = [];
  await mapLimit(
    manifest.files,
    NUM_CONCURRENT_UPLOADS,
    asyncify(async (manifestFile: ManifestFile) => {
      const remotePath = getBlobPath(manifest.site, manifestFile.hash);
      await storageBucket
        .file(remotePath)
        .exists()
        .then((resp: any) => {
          const exists = resp[0];
          if (!exists) {
            filesToUpload.push(manifestFile);
          }
        });
    })
  );

  return filesToUpload;
}

export async function uploadManifest(bucket: string, manifest: Manifest) {
  bucket = bucket || DEFAULT_BUCKET; // If bucket is blank.
  console.log(`Using storage: ${bucket}/${getBlobPath(manifest.site, '')}`);

  const storage = new Storage();
  const bar = new cliProgress.SingleBar(
    {
      format:
        'Uploading ({value}/{total}): ' +
        _colors.green('{bar}') +
        ' Total: {duration_formatted} ({speed}MB/s, ETA: {eta_formatted})',
    },
    cliProgress.Presets.shades_classic
  );

  const storageBucket = storage.bucket(bucket);

  // Check whether files exist prior to uploading. Existing files can be skipped.
  const filesToUpload = await findUploadedFiles(manifest, storageBucket);

  const numFiles = filesToUpload.length;
  console.log(
    `Found new ${filesToUpload.length} files out of ${manifest.files.length} total...`
  );

  if (numFiles > 0) {
    let totalTransferred = 0;
    let numProcessed = 0;
    const startTime = Math.floor(Date.now() / 1000);
    bar.start(numFiles, numProcessed, {
      speed: 0,
    });

    // Only upload new files.
    mapLimit(
      filesToUpload,
      NUM_CONCURRENT_UPLOADS,
      (manifestFile, callback) => {
        const remotePath = getBlobPath(manifest.site, manifestFile.hash);

        // console.log(`Uploading ${manifestFile.cleanPath} -> ${bucket}/${remotePath}`);
        // NOTE: This was causing stale responses, even when rewritten by the client-server: 'public, max-age=31536000',
        const metadata: Metadata = {
          cacheControl: 'public, max-age=1',
          contentType: manifestFile.mimetype,
          metadata: {
            path: manifestFile.cleanPath,
          },
        };

        // TODO: Handle upload errors and retries.
        storageBucket
          .upload(manifestFile.path, {
            destination: remotePath,
            gzip: true,
            metadata: metadata,
          })
          .then((resp: any) => {
            totalTransferred += parseInt(resp[1].size);
            const elapsed = Math.floor(Date.now() / 1000) - startTime;
            bar.update((numProcessed += 1), {
              speed: (totalTransferred / elapsed / (1024 * 1024)).toFixed(2),
            });
            if (numProcessed == numFiles) {
              bar.stop();
            }
            callback();
          });
      }
    );

    // @ts-ignore
    bar.on('stop', () => {
      finalize(manifest);
    });
  } else {
    finalize(manifest);
  }
}

async function finalize(manifest: Manifest) {
  const key = datastore.key(['Fileset2Manifest', manifest.shortSha]);
  const pathsToHashes = manifest.toJSON();
  const entity = {
    key: key,
    excludeFromIndexes: ['paths'],
    data: {
      created: new Date(),
      ref: manifest.ref,
      paths: pathsToHashes,
    },
  };
  await datastore.save(entity);
  console.log(`Finalized upload for site: ${manifest.site} -> ${manifest.branch} @ ${manifest.shortSha}`);

  if (manifest.branch) {

  }
}
