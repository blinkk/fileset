import * as cliProgress from 'cli-progress';
import {asyncify, mapLimit} from 'async';
import {Manifest, ManifestFile} from './manifest';
import _colors = require('colors');

import {Storage} from '@google-cloud/storage';
import {Datastore} from '@google-cloud/datastore';
import {entity} from '@google-cloud/datastore/build/src/entity';

const datastore = new Datastore();

const DEFAULT_BUCKET = `${process.env.GCLOUD_PROJECT}.appspot.com`;

const NUM_CONCURRENT_UPLOADS = 64;

function getBlobPath(siteId: string, hash: string) {
  return `fileset/sites/${siteId}/blobs/${hash}`;
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
};

export async function uploadManifest(
  bucket: string,
  manifest: Manifest,
  force?: boolean,
  ttl?: Date
) {
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
  let filesToUpload = await findUploadedFiles(manifest, storageBucket);
  if (force) {
    filesToUpload = manifest.files;
  }

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
        // https://cloud.google.com/storage/docs/gsutil/addlhelp/WorkingWithObjectMetadata#cache-control
        // NOTE: In order for GCS to respond extremely fast, it requires a longer cache expiry time.
        // TODO: See if we can remove this from the proxy response without killing perf.
        const metadata = {
          cacheControl: 'public, max-age=3600',
          contentType: manifestFile.mimetype,
          metadata: {
            path: manifestFile.cleanPath,
          },
        };

        // TODO: Handle upload errors and retries.
        storageBucket
          .upload(manifestFile.path, {
            //gzip: true,  // gzip: true must *not* be set here, as it interferes with the proxied GCS response.
            destination: remotePath,
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
      finalize(manifest, ttl);
    });
  } else {
    finalize(manifest, ttl);
  }
}

async function saveManifestEntity(key: entity.Key, data: any) {
  const ent = {
    key: key,
    excludeFromIndexes: ['paths'],
    data: data,
  };
  await datastore.save(ent);
}

async function finalize(manifest: Manifest, ttl?: Date) {
  const manifestPaths = manifest.toJSON();
  const now = new Date();

  // Create shortSha mapping for staging.
  const key = datastore.key([
    'Fileset2Manifest',
    `${manifest.site}:ref:${manifest.shortSha}`,
  ]);
  await saveManifestEntity(key, {
    site: manifest.site,
    ref: manifest.ref,
    branch: manifest.branch,
    paths: manifestPaths,
  });

  // Create branch mapping for staging.
  if (manifest.branch) {
    const branchKey = datastore.key([
      'Fileset2Manifest',
      `${manifest.site}:branch:${manifest.branch}`,
    ]);
    await saveManifestEntity(branchKey, {
      site: manifest.site,
      ref: manifest.ref,
      branch: manifest.branch,
      paths: manifestPaths,
    });
  }

  // TODO: Update the site's playbook and use the playbook for timed launches.
  // The playbook should contain copies of all future launches. Each site should only
  // have one playbook.
  // const routerKey = datastore.key(['Fileset2Router', manifest.site]);
  // const router =  await datastore.get(routerKey);
  // const entity = router && router[0];

  console.log(
    `Finalized upload for site: ${manifest.site} -> ${manifest.branch} @ ${manifest.shortSha}`
  );
  console.log(
    `Staged: https://${manifest.site}-${manifest.shortSha}-dot-fileset2-dot-${process.env.GCLOUD_PROJECT}.appspot.com`
  );
}
