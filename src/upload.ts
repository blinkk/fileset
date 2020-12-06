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

interface ScheduleItem {
  ttl: Date;
  ref: string;
  paths: Record<string, string>;
}

function createScheduleItem(
  manifest: Manifest,
  manifestPaths: Record<string, string>,
  ttl: Date
) {
  return {
    ttl: ttl,
    ref: manifest.ref,
    paths: manifestPaths,
  } as ScheduleItem;
}

async function finalize(manifest: Manifest, ttl?: Date) {
  const manifestPaths = manifest.toJSON();
  const now = new Date();

  // Create shortSha mapping.
  const key = datastore.key([
    'Fileset2Manifest',
    `${manifest.site}:ref:${manifest.shortSha}`,
  ]);
  const scheduleItem = createScheduleItem(manifest, manifestPaths, now);
  const schedule: Record<string, ScheduleItem> = {};
  schedule[now.toString()] = scheduleItem;
  const ent = {
    key: key,
    excludeFromIndexes: ['schedule'],
    data: {
      site: manifest.site,
      ref: manifest.ref,
      branch: manifest.branch,
      schedule: schedule,
    },
  };
  await datastore.save(ent);

  // Create branch mapping.
  if (manifest.branch) {
    const branchKey = datastore.key([
      'Fileset2Manifest',
      `${manifest.site}:branch:${manifest.branch}`,
    ]);
    const branchScheduleItem = createScheduleItem(
      manifest,
      manifestPaths,
      ttl || now
    );
    const branchSchedule: Record<string, ScheduleItem> = {};
    const branchScheduleKey = (ttl || now).toString();
    branchSchedule[branchScheduleKey] = branchScheduleItem;
    const resp = await datastore.get(branchKey);
    let existingData = resp && resp[0];
    if (!existingData) {
      existingData = {
        site: manifest.site,
        ref: manifest.ref,
        branch: manifest.branch,
        schedule: branchSchedule,
      };
    } else {
      // TODO: Clean up past scheduled items here.
      existingData.schedule[branchScheduleKey] = branchScheduleItem;
    }
    console.log(
      `TTLs for branch: ${manifest.branch} -> ${Object.keys(
        existingData.schedule
      )}`
    );
    const branchEnt = {
      key: branchKey,
      excludeFromIndexes: ['schedule'],
      data: existingData,
    };
    await datastore.save(branchEnt);
  }

  console.log(
    `Finalized upload for site: ${manifest.site} -> ${manifest.branch} @ ${manifest.shortSha}`
  );
  console.log(
    `Staged: https://${manifest.site}-${manifest.shortSha}-dot-fileset2-dot-${process.env.GCLOUD_PROJECT}.appspot.com`
  );
}
