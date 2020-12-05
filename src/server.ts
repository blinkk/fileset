import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';
import * as fsPath from 'path';
import express = require('express');
import httpProxy = require('http-proxy');

const URL = 'https://storage.googleapis.com';
const datastore = new Datastore();
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
});

const server = httpProxy.createProxyServer();
interface ManifestCache {
  [requestSha: string]: string;
}

const downloadManifest = async (shortsha: string) => {
  const key = datastore.key(['Fileset2Manifest', shortsha]);
  const entity = await datastore.get(key);
  if (!entity || !entity[0]) {
    return;
  }
  const paths = entity[0].paths;
  return paths;
};

const parseHostname = (hostname: string) => {
  // TODO: Make this more robust
  if (hostname.includes('-dot-')) {
    const parts = hostname.split('-dot-');
    return {
      siteId: parts[0],
      branchOrRef: parts[1].slice(0, 7),
    };
  } else {
    return {
      siteId: '',
      branchOrRef: '',
    };
  }
};

export function createApp(siteId: string, shortsha: string, branch: string) {
  // const startupManifest = await downloadManifest(shortsha);
  console.log(`Starting server for site: ${siteId} @ ${branch}`);

  const app = express();
  app.disable('x-powered-by');
  app.all('/*', async (req: express.Request, res: express.Response) => {
    const envFromHostname = parseHostname(req.hostname);
    const requestSiteId = envFromHostname.siteId || siteId;
    const requestSha = envFromHostname.branchOrRef || shortsha;
    const requestBranch = envFromHostname.branchOrRef || branch;

    let blobPath = decodeURIComponent(req.path);
    if (blobPath.endsWith('/')) {
      blobPath += 'index.html';
    }

    const manifest = await downloadManifest(requestSha);

    if (!manifest) {
      res.sendStatus(404);
      return;
    }
    const blobKey = manifest[blobPath];
    const updatedUrl = `/wing-prod.appspot.com/fileset/sites/${requestSiteId}/blobs/${blobKey}`;

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
      proxyRes.headers['cache-control'] = 'public, max-age=0036';  // The padded 0036 keeps the content length the same per upload.ts.
      proxyRes.headers['x-fileset-blob'] = blobPath;
      proxyRes.headers['x-fileset-ref'] = requestSha;
      proxyRes.headers['x-fileset-site'] = siteId;
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    });
  });
  return app;
}
