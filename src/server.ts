import express = require('express');
import httpProxy = require('http-proxy');
import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';

const URL = 'https://storage.googleapis.com';
const datastore = new Datastore();
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

const server = httpProxy.createProxyServer();

const downloadManifest = async (shortsha: string) => {
  const key = datastore.key(['Fileset2Manifest', shortsha]);
  const entity = await datastore.get(key);
  const paths = entity[0].paths;
  return paths;
};

export function createApp(siteId: string, shortsha: string, branch: string) {
  const app = express();
  app.all('/*', async (req: express.Request, res: express.Response) => {
    let blobPath = decodeURIComponent(req.path);
    if (blobPath.endsWith('/')) {
      blobPath += 'index.html';
    }

    console.log(branch); // TODO: Use BranchMapping to get Manifest.
    const manifest = await downloadManifest(shortsha);

    const blobKey = manifest[blobPath];
    const updatedUrl = blobKey
      ? `/wing-prod.appspot.com/fileset/sites/${siteId}/blobs/${blobKey}`
      : '/404';

    req.url = updatedUrl;

    const client = await auth.getClient();
    const headers = await client.getRequestHeaders();
    // Adds Authorization: Bearer ... header to outgoing GCS request.
    req.headers = headers;
    server.web(req, res, {
      target: URL,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
    });
  });
  return app;
}
