import express = require('express');
import httpProxy = require('http-proxy');
import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';

const URL = 'https://storage.googleapis.com';
const server = httpProxy.createProxyServer();
const datastore = new Datastore();
const siteId = 'waymo';

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

const downloadManifest = async () => {
  const key = datastore.key(['Fileset2Manifest', 'c5e3035']);
  const entity = await datastore.get(key);
  const paths = entity[0].paths;
  return paths;
};

export async function handler(req: express.Request, res: express.Response) {
  let blobPath = decodeURIComponent(req.path);
  if (blobPath.endsWith('/')) {
    blobPath += 'index.html';
  }

  const manifest = await downloadManifest();

  const blobKey = manifest[blobPath];
  const updatedUrl = blobKey
    ? `/wing-prod.appspot.com/fileset/sites/${siteId}/blobs/${blobKey}`
    : '/404';
  if (!process.env.GAE_APPLICATION) {
    console.log(`Mapped ${req.path} -> ${blobPath} -> ${URL}${updatedUrl}`);
  }
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
}

export const app = express();
app.all('/*', handler);