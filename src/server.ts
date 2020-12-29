import * as fsPath from 'path';

import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';

import express = require('express');
import httpProxy = require('http-proxy');

const URL = 'https://storage.googleapis.com';
const BUCKET = `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
const datastore = new Datastore();
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
});

const server = httpProxy.createProxyServer();

const getManifest = async (siteId: string, branchOrRef: string) => {
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

  // TODO: Add getPlaybook which can be used for prod serving and TTLs.
  // getManifest is only used for staging.
  // // TODO: Allow this to be overwritten.
  // const now = new Date();
  // let latestManifest = null;
  // for (const ttlString in result.schedule) {
  //   const ttlDate = new Date(ttlString);
  //   const isLaterThanManifestDate = now >= ttlDate;
  //   const isLaterThanAllManifests =
  //     !latestManifest || ttlDate >= latestManifest.ttl;
  //   if (isLaterThanManifestDate && isLaterThanAllManifests) {
  //     latestManifest = result.schedule[ttlString];
  //     latestManifest.ttl = ttlDate;
  //   }
  // }
  // if (latestManifest) {
  //   return latestManifest;
  // }
};

export function parseHostname(hostname: string, defaultSiteId?: string, defaultLiveDomain?: string) {
  let siteId = defaultSiteId || 'default';
  let branchOrRef = '';
  if (hostname == defaultLiveDomain) {
    // Hostname is the "live" or "prod" domain. Use the master branch.
    branchOrRef = 'master';
  } else if (hostname.includes('-dot-')) {
    // Use "-dot-" as a sentinel for App Engine wildcard domains.
    const prefix = hostname.split('-dot-')[0];
    const parts = prefix.split('-'); // Either <Site>-<Ref> or <Site>.
    siteId = parts[0];
    branchOrRef = parts.length > 1 ? parts[1].slice(0, 7) : 'master';
  }
  // TODO: Implement defaultStagingDomain (custom staging domain) support.
  return {
    siteId: siteId,
    branchOrRef: branchOrRef,
  };
}

export function createApp(siteId: string, branchOrRef: string) {
  console.log(`Starting server for site: ${siteId} @ ${branchOrRef}`);

  const app = express();
  app.disable('x-powered-by');
  app.all('/*', async (req: express.Request, res: express.Response) => {
    const envFromHostname = parseHostname(req.hostname, process.env.FILESET_SITE, process.env.FILESET_LIVE_DOMAIN);
    const requestSiteId = envFromHostname.siteId || siteId;
    const requestBranchOrRef = envFromHostname.branchOrRef || branchOrRef;

    if (req.params.debug) {
      console.log(
        `Site: ${requestSiteId}, Ref: ${requestBranchOrRef}, Bucket: ${process.env.GOOGLE_CLOUD_PROJECT}`
      );
    }

    let blobPath = decodeURIComponent(req.path);
    if (blobPath.endsWith('/')) {
      blobPath += 'index.html';
    }

    const manifest = await getManifest(requestSiteId, requestBranchOrRef);
    if (!manifest || !manifest.paths) {
      console.log(`Site: ${requestSiteId}, Ref: ${requestBranchOrRef}`);
      res
        .status(404)
        .sendFile(
          fsPath.join(__dirname, './static/', 'fileset-does-not-exist.html')
        );
      return;
    }

    const manifestPaths = manifest.paths;
    const blobKey = manifestPaths[blobPath];
    const updatedUrl = `/${BUCKET}/fileset/sites/${requestSiteId}/blobs/${blobKey}`;

    // TODO: Add custom 404 support based on site config.
    if (!blobKey) {
      console.log(`Blob not found ${req.path} -> ${URL}${updatedUrl}`);
      res.sendFile(fsPath.join(__dirname, './static/', '404.html'));
      return;
    }

    // Add Authorization: Bearer ... header to outgoing GCS request.
    const client = await auth.getClient();
    const headers = await client.getRequestHeaders();
    req.headers = headers;
    req.url = updatedUrl;
    server.web(req, res, {
      target: URL,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
    });
    server.on('error', (error, req, res) => {
      console.log(`An error occurred while serving ${req.url} (${error})`);
    });
    server.on('proxyRes', (proxyRes, req, res) => {
      delete proxyRes.headers['x-cloud-trace-context'];
      delete proxyRes.headers['x-goog-generation'];
      delete proxyRes.headers['x-goog-hash'];
      delete proxyRes.headers['x-goog-meta-path'];
      delete proxyRes.headers['x-goog-meta-patn'];
      delete proxyRes.headers['x-goog-metageneration'];
      delete proxyRes.headers['x-goog-storage-class'];
      delete proxyRes.headers['x-goog-stored-content-encoding'];
      delete proxyRes.headers['x-goog-stored-content-length'];
      delete proxyRes.headers['x-guploader-response-body-transformations'];
      delete proxyRes.headers['x-guploader-uploadid'];
      // This cannot be "private, max-age=0" as this kills perf.
      // This also can't be a very small value, as it kills perf. 0036 seems to work correctly.
      // The padded "0036" keeps the Content-Length identical with `3600`.
      proxyRes.headers['cache-control'] = 'public, max-age=0036';
      proxyRes.headers['x-fileset-blob'] = blobKey;
      proxyRes.headers['x-fileset-ref'] = manifest.ref;
      proxyRes.headers['x-fileset-site'] = requestSiteId;
      if (manifest.ttl) {
        proxyRes.headers['x-fileset-ttl'] = manifest.ttl;
      }
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    });
  });
  return app;
}