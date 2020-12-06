import _colors = require('colors');
import {asyncify, mapLimit} from 'async';
import {Datastore} from '@google-cloud/datastore';
import {entity} from '@google-cloud/datastore/build/src/entity';
import {Manifest, ManifestFile} from './manifest';
import {Storage} from '@google-cloud/storage';
import * as cliProgress from 'cli-progress';

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

function createProgressBar() {
  return new cliProgress.SingleBar(
    {
      format:
        'Uploading ({value}/{total}): ' +
        _colors.green('{bar}') +
        ' Total: {duration_formatted} ({speed}MB/s, ETA: {eta_formatted})',
    },
    cliProgress.Presets.shades_classic
  );
}

export async function uploadManifest(
  bucket: string,
  manifest: Manifest,
  force?: boolean,
  ttl?: Date
) {
  bucket = bucket || DEFAULT_BUCKET;
  console.log(`Using storage: ${bucket}/${getBlobPath(manifest.site, '')}`);
  const storageBucket = new Storage().bucket(bucket);
  const bar = createProgressBar();

  // Check for files that have already been uploaded. Files already uploaded do
  // not need to be uploaded again, as the GCS path is keyed by the file's
  // contents.
  const filesToUpload = force
    ? manifest.files
    : await findUploadedFiles(manifest, storageBucket);
  const numTotalFiles = filesToUpload.length;
  console.log(
    `Found new ${filesToUpload.length} files out of ${manifest.files.length} total...`
  );

  if (numTotalFiles <= 0) {
    finalize(manifest, ttl);
  } else {
    let bytesTransferred = 0;
    let numProcessedFiles = 0;
    const startTime = Math.floor(Date.now() / 1000);
    bar.start(numTotalFiles, numProcessedFiles, {
      speed: 0,
    });
    // @ts-ignore
    bar.on('stop', () => {
      finalize(manifest, ttl);
    });

    mapLimit(
      filesToUpload,
      NUM_CONCURRENT_UPLOADS,
      asyncify(async (manifestFile: ManifestFile) => {
        // NOTE: After testing, it seems we need a public Cache-Control with a
        // minimum max age of ~3600 seconds (1 hour) for the "high performance"
        // mode to kick in. Our best guess is that when this Cache-Control
        // setting is used, responses are cached internally within GCP yielding
        // much higher performance. That said, we don't want end users to
        // receive potentially stale content, so the proxy response rewrites
        // this header to 36 seconds (from 3600).
        // The following docs indicate that Cache-Control doesn't apply for
        // private blobs, however we've observed differences in performance per
        // the above.
        // https://cloud.google.com/storage/docs/gsutil/addlhelp/WorkingWithObjectMetadata#cache-control
        const metadata = {
          cacheControl: 'public, max-age=3600',
          contentType: manifestFile.mimetype,
          metadata: {
            path: manifestFile.cleanPath,
          },
        };
        // TODO: Veryify this correctly handles errors and retry attempts.
        const remotePath = getBlobPath(manifest.site, manifestFile.hash);
        const resp = await storageBucket.upload(manifestFile.path, {
          // NOTE: `gzip: true` must *not* be set here. Doing so interferes
          // with the proxied GCS response. Despite not setting `gzip: true`,
          // the response remains gzipped from the proxy server.
          destination: remotePath,
          metadata: metadata,
        });
        bytesTransferred += parseInt(resp[1].size);
        const elapsed = Math.floor(Date.now() / 1000) - startTime;
        const speed = (bytesTransferred / elapsed / (1024 * 1024)).toFixed(2);
        bar.update((numProcessedFiles += 1), {
          speed: speed,
        });
        if (numProcessedFiles === numTotalFiles) {
          bar.stop();
        }
      })
    );
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

  // Create shortSha mapping, so a shortSha can be used to lookup filesets.
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

  // Create branch mapping, so a branch name can be used to lookup filesets.
  // TODO: Use clean branch name to avoid non-URL-safe branch names.
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
  // TODO: Allow customizing the staging URL using `fileset.yaml` configuration.
  console.log(
    `Staged: https://${manifest.site}-${manifest.shortSha}-dot-fileset2-dot-${process.env.GCLOUD_PROJECT}.appspot.com`
  );
}
