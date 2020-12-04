import express = require('express');
import httpProxy = require('http-proxy');
import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';

const URL = 'https://storage.googleapis.com';
const datastore = new Datastore();
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
});

const server = httpProxy.createProxyServer();
interface ManifestCache {
  [requestSha: string]: string;
}

const manifestCache: ManifestCache = {};

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
  // TODO: Make this more robust;
  const parts = hostname.split('-dot-');
  return {
    siteId: parts[0],
    branchOrRef: parts[1].slice(0, 7),
  };
};

export function createApp(siteId: string, shortsha: string, branch: string) {
  // const startupManifest = await downloadManifest(shortsha);
  console.log(`Starting server for site: ${siteId} @ ${branch}`);

  const app = express();
  app.all('/*', async (req: express.Request, res: express.Response) => {
    const envFromHostname = parseHostname(req.hostname);
    const requestSiteId = envFromHostname.siteId || siteId;
    const requestSha = envFromHostname.branchOrRef || shortsha;
    const requestBranch = envFromHostname.branchOrRef || branch;
    console.log(
      `Handling request -> ${requestSiteId} @ ${requestBranch} (${requestBranch})`
    );

    let blobPath = decodeURIComponent(req.path);
    if (blobPath.endsWith('/')) {
      blobPath += 'index.html';
    }
    shortsha = shortsha.slice(0, 7);
    // const manifest =
    //   manifestCache[requestSha] || (await downloadManifest(requestSha));
    // manifestCache[requestSha] = manifest;

    const manifest = await downloadManifest(requestSha);

    if (!manifest) {
      res.sendStatus(404);
      return;
    }
    const blobKey = manifest[blobPath];
    const updatedUrl = blobKey
      ? `/wing-prod.appspot.com/fileset/sites/${requestSiteId}/blobs/${blobKey}`
      : '/404';

    if (!process.env.GAE_APPLICATION) {
      console.log(`Mapped ${req.path} -> ${blobPath} -> ${URL}${updatedUrl}`);
    }
    req.url = updatedUrl;
    // Add Authorization: Bearer ... header to outgoing GCS request.
    const client = await auth.getClient();
    const headers = await client.getRequestHeaders();
    req.headers = headers;
    server.web(req, res, {
      target: URL,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
    });
  });
  return app;
}
