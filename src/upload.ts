import _colors = require('colors');

import * as cliProgress from 'cli-progress';

import {Manifest, ManifestFile} from './manifest';
import {asyncify, mapLimit} from 'async';

import {Datastore} from '@google-cloud/datastore';
import {Storage} from '@google-cloud/storage';
import {entity} from '@google-cloud/datastore/build/src/entity';

const NUM_CONCURRENT_UPLOADS = 64;

export const ManifestType = {
  Ref: 'ref',
  Branch: 'branch',
};

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

export async function uploadSchedule(
  googleCloudProject: string,
  site: string,
  schedule?: Record<string, string>
) {
  // TODO: Validate schedule by ensuring a manifest exists for all entries.
  // Replicate the manifest table onto the schedule so only one RPC is needed per request.
  const data = {
    schedule: schedule,
  };
  const datastore = new Datastore({
    projectId: googleCloudProject,
  });
  const key = datastore.key(['Fileset2Schedule', `${site}`]);
  const ent = {
    key: key,
    data: data,
  };
  await datastore.save(ent);
}

export async function uploadManifest(
  googleCloudProject: string,
  bucket: string,
  manifest: Manifest,
  force?: boolean
) {
  console.log(
    `Uploading fileset for site: ${manifest.site} -> ${manifest.branch} @ ${manifest.shortSha}`
  );
  console.log(`Using storage: ${bucket}/${getBlobPath(manifest.site, '')}`);
  const storageBucket = new Storage({
    projectId: googleCloudProject,
  }).bucket(bucket);
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
    await finalize(googleCloudProject, manifest);
  } else {
    let bytesTransferred = 0;
    let numProcessedFiles = 0;
    const startTime = Math.floor(Date.now() / 1000);
    bar.start(numTotalFiles, numProcessedFiles, {
      speed: 0,
    });

    await mapLimit(
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

    await finalize(googleCloudProject, manifest);
  }
}

async function saveManifestEntity(
  datastore: Datastore,
  key: entity.Key,
  data: any
) {
  const ent = {
    key: key,
    excludeFromIndexes: [
      'headers',
      'localizationPathFormat',
      'paths',
      'redirects',
    ],
    data: data,
  };
  await datastore.save(ent);
}

async function finalize(googleCloudProject: string, manifest: Manifest) {
  const datastore = new Datastore({
    projectId: googleCloudProject,
    // keyFilename: '/path/to/keyfile.json',
  });
  const manifestPaths = manifest.pathsToJSON();

  // Create shortSha mapping, so a shortSha can be used to lookup filesets.
  const key = datastore.key([
    'Fileset2Manifest',
    `${manifest.site}:ref:${manifest.shortSha}`,
  ]);
  const modified = new Date();
  await saveManifestEntity(datastore, key, {
    branch: manifest.branch,
    modified: modified,
    paths: manifestPaths,
    redirects: manifest.redirects,
    localizationPathFormat: manifest.localizationPathFormat,
    ref: manifest.ref,
    site: manifest.site,
    manifestType: ManifestType.Ref,
    headers: manifest.headers,
  });

  // Create branch mapping, so a branch name can be used to lookup filesets.
  // TODO: Use clean branch name to avoid non-URL-safe branch names.
  if (manifest.branch) {
    const branchKey = datastore.key([
      'Fileset2Manifest',
      `${manifest.site}:branch:${manifest.branch}`,
    ]);
    await saveManifestEntity(datastore, branchKey, {
      branch: manifest.branch,
      modified: modified,
      paths: manifestPaths,
      redirects: manifest.redirects,
      localizationPathFormat: manifest.localizationPathFormat,
      ref: manifest.ref,
      site: manifest.site,
      manifestType: ManifestType.Branch,
      headers: manifest.headers,
    });
  }
  console.log(
    `Finalized upload for site: ${manifest.site} -> ${manifest.branch} @ ${manifest.shortSha}`
  );
  // TODO: Allow customizing the staging URL using `fileset.yaml` configuration.
  if (manifest.site === 'default') {
    console.log(
      `Staged: https://${manifest.shortSha}-dot-fileset-dot-${googleCloudProject}.appspot.com`
    );
  } else {
    console.log(
      `Staged: https://${manifest.site}-${manifest.shortSha}-dot-fileset-dot-${googleCloudProject}.appspot.com`
    );
  }
}

export const getManifest = async (
  datastore: Datastore,
  siteId: string,
  branchOrRef: string
) => {
  const keys = [
    datastore.key(['Fileset2Manifest', `${siteId}:branch:${branchOrRef}`]),
    datastore.key(['Fileset2Manifest', `${siteId}:ref:${branchOrRef}`]),
  ];
  const resp = await datastore.get(keys);
  if (!resp || !resp[0]) {
    return;
  }
  const entities = resp[0];
  const result = entities[0] || entities[1];
  if (!result) {
    return;
  }
  return result;
};

export const getServingManifest = async (
  datastore: Datastore,
  siteId: string
) => {
  const key = datastore.key(['Fileset2Schedule', `${siteId}`]);
  const schedule = await datastore.get(key);
  const ent = schedule[0];
  const now = new Date();
  let latestTimestamp: Date;
  let latestBranchOrRef;
  Object.entries(ent.schedule).forEach(([timestamp, branchOrRef]) => {
    const entryTime = new Date(timestamp);
    const eligible =
      latestTimestamp === undefined || entryTime > latestTimestamp;
    if (eligible && now >= entryTime) {
      latestTimestamp = entryTime;
      latestBranchOrRef = branchOrRef;
    }
  });
  return latestBranchOrRef ? ent.manifests[latestBranchOrRef] : undefined;
};

export const listManifests = async (datastore: Datastore, siteId: string) => {
  const query = datastore.createQuery('Fileset2Manifest');
  query.filter('site', siteId);
  query.filter('manifestType', ManifestType.Branch);
  const result = await query.run();
  if (result) {
    return result[0];
  }
  return null;
};
