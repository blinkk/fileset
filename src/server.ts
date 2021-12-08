import * as defaults from './defaults';
import * as express from 'express';
import * as fsPath from 'path';
import * as httpProxy from 'http-proxy';
import * as locale from './locale';
import * as manifest from './manifest';
import * as trie from './trie';
import * as webui from './webui';

import {Datastore} from '@google-cloud/datastore';
import {GoogleAuth} from 'google-auth-library';
import {ManifestType} from './upload';
import {entity} from '@google-cloud/datastore/build/src/entity';

const PROXY_BASE_URL = 'https://storage.googleapis.com';
const BUCKET = `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
const datastore = new Datastore();
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
});

interface ParseHostnameOptions {
  hostname: string;
  defaultSite?: string;
  defaultBranches?: string[];
  baseUrl?: string;
}

interface ManifestLookupOptions {
  siteId: string;
  branchOrRef: string;
}

const FingerprintedExtensions = new Set(['.css', '.js', '.svg']);

export const getManifest = async (siteId: string, branchOrRef: string) => {
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

export const lookupManifest = async (options: ManifestLookupOptions[]) => {
  const keys: entity.Key[] = [];
  options.forEach(option => {
    if (option.branchOrRef.length === 7) {
      keys.push(
        datastore.key([
          'Fileset2Manifest',
          `${option.siteId}:ref:${option.branchOrRef}`,
        ])
      );
    }
    keys.push(
      datastore.key([
        'Fileset2Manifest',
        `${option.siteId}:branch:${option.branchOrRef}`,
      ])
    );
  });
  const resp = await datastore.get(keys);
  if (!resp || !resp[0]) {
    return;
  }
  const entities = resp[0];
  return entities.find(Boolean);
};

export const listManifests = async (siteId: string, manifestType?: string) => {
  const query = datastore.createQuery('Fileset2Manifest');
  query.filter('site', siteId);
  query.filter(
    'manifestType',
    manifestType ? manifestType : ManifestType.Branch
  );
  const result = await query.run();
  if (result) {
    return result[0];
  }
  return null;
};

export function branchToHostnameToken(branch: string) {
  let hostname = branch;
  for (const prefix of defaults.COMMON_BRANCH_PREFIXES) {
    hostname = hostname.replace(prefix, '');
  }
  hostname = hostname.replace(/\//g, '--');
  return hostname;
}

export function parseHostname(
  options: ParseHostnameOptions
): ManifestLookupOptions[] {
  // Supported hostname patterns:
  //   https://ref-dot-appid.appspot.com/
  //   https://site-ref-dot-appid.appspot.com/
  //   https://site-ref-dot-fileset-dot-appid.appspot.com/
  //   https://site-ref-with-dashes-dot-fileset-dot-appid.appspot.com/
  //   https://ref-with-dashes-dot-fileset-dot-appid.appsot.com/
  //   https://ref-with-dashes-dot-appid.appspot.com/
  //   https://site-ref.example.com
  //   https://site-ref.foo.example.com
  //   https://foo.localhost:8080
  // Supported prefix patterns:
  //   ref
  //   site-ref
  //   site-ref-with-dashes
  //   ref-with-dashes
  const defaultSiteOption = options.defaultSite || 'default';
  const defaultBranchesOption =
    options.defaultBranches || defaults.LIVE_BRANCHES;
  const results = [];
  const prefix = options.hostname.split('-dot-')[0].split('.')[0];
  const cleanHostname = options.hostname.split(':')[0];
  const cleanBaseUrl = options.baseUrl
    ? options.baseUrl.replace(/^(https?):\/\//, '').split(':')[0]
    : '';
  const isProdHostname = cleanHostname === cleanBaseUrl;
  // Staging, run through supported prefixes.
  if (
    (options.baseUrl &&
      cleanHostname.includes(cleanBaseUrl) &&
      !isProdHostname) ||
    options.hostname.includes('.localhost') ||
    (options.hostname.includes('-dot-') && !isProdHostname)
  ) {
    // site-ref
    // site-ref-with-dashes
    if (prefix.includes('-') && !prefix.includes('--')) {
      const cleanSiteId = prefix.split('-')[0];
      const cleanBranchOrRef = prefix.slice(prefix.indexOf('-') + 1);
      if (cleanSiteId !== defaultSiteOption) {
        results.push({
          siteId: cleanSiteId,
          branchOrRef: cleanBranchOrRef,
        });
        if (!cleanBranchOrRef.includes('--')) {
          defaults.COMMON_BRANCH_PREFIXES.forEach(commonPrefix => {
            results.push({
              siteId: cleanSiteId,
              branchOrRef: `${commonPrefix}${cleanBranchOrRef}`,
            });
          });
        } else {
          results.push({
            siteId: cleanSiteId,
            branchOrRef: cleanBranchOrRef.replace('--', '/'),
          });
        }
      }
    }
    // ref
    results.push({
      siteId: defaultSiteOption,
      branchOrRef: prefix,
    });
    if (!prefix.includes('--')) {
      defaults.COMMON_BRANCH_PREFIXES.forEach(commonPrefix => {
        results.push({
          siteId: defaultSiteOption,
          branchOrRef: `${commonPrefix}${prefix}`,
        });
      });
    } else {
      results.push({
        siteId: defaultSiteOption,
        branchOrRef: prefix.replace('--', '/'),
      });
    }
  }
  // Likely prod, try defaults.
  defaultBranchesOption.forEach(defaultBranch => {
    results.push({
      siteId: defaultSiteOption,
      branchOrRef: defaultBranch,
    });
  });
  return results;
}

function findLocalizedUrlPath(
  req: express.Request,
  reqManifest: manifest.SerializedManifest,
  urlPath: string
) {
  let foundUrlPath: string | undefined;
  locale.getFallbackLocales(req).forEach(locale => {
    if (foundUrlPath) {
      return;
    }
    let localizedUrlPath =
      reqManifest.localizationPathFormat ||
      manifest.DEFAULT_LOCALIZATION_PATH_FORMAT;
    localizedUrlPath = localizedUrlPath
      .replace(':locale', locale)
      .replace(':path', urlPath.slice(1));
    if (reqManifest.paths[localizedUrlPath]) {
      foundUrlPath = localizedUrlPath;
    } else if (reqManifest.paths[localizedUrlPath.toLowerCase()]) {
      foundUrlPath = localizedUrlPath.toLowerCase();
    }
  });
  return foundUrlPath;
}

export function createApp(siteId: string) {
  console.log(`Starting server for site: ${siteId}`);
  const webUiEnabled = webui.isEnabled();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  // If the webui isn't enabled, serve live filesets only.
  if (webUiEnabled) {
    webui.configure(app);
  }
  app.all('/*', async (req: express.Request, res: express.Response) => {
    const manifestsToLookup = parseHostname({
      hostname: req.hostname,
      defaultSite: process.env.FILESET_SITE,
      baseUrl: process.env.FILESET_BASE_URL,
      defaultBranches: process.env.FILESET_DEFAULT_BRANCH
        ? process.env.FILESET_DEFAULT_BRANCH.split(',')
        : undefined,
    });

    if (req.query.debug) {
      console.log(
        `Attempting to find manifest matching -> ${JSON.stringify(
          manifestsToLookup
        )}`
      );
    }

    try {
      const manifest = await lookupManifest(manifestsToLookup);
      if (!manifest || !manifest.paths) {
        res
          .status(404)
          .sendFile(
            fsPath.join(__dirname, './static/', 'fileset-does-not-exist.html')
          );
        return;
      }

      // Access control check for staging environments.
      // TODO: Make the `isLive` check work with scheduled branches.
      const stagingOnly = Boolean(process.env.FILESET_STAGING_ONLY);
      const isLive =
        defaults.LIVE_BRANCHES.includes(manifest.branch) && !stagingOnly;
      if (!isLive) {
        // If the webui isn't enabled, only live filesets are served. All other
        // paths are disabled.
        if (!webUiEnabled) {
          webui.renderAccessDenied(app, req, res);
          return;
        }
        if (!req.isAuthenticated || !req.isAuthenticated()) {
          // Include the full URL in the return URL in order to traverse
          // subdomains during the OAuth callback.
          const host = req.hostname.endsWith('localhost')
            ? `${req.hostname}:${process.env.PORT || 8080}`
            : req.hostname;
          const returnUrl = `${req.protocol}://${host}${
            req.originalUrl || req.url
          }`;
          return res.redirect(
            `${webui.Urls.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`
          );
        }
        // TODO: Currently, universal auth is specified when the server is
        // deployed. Instead, allow sites to specify auth settings in
        // their local `fileset.yaml` configuration.
        // @ts-ignore
        if (!webui.isUserAllowed(req.user.emails[0].value)) {
          webui.renderAccessDenied(app, req, res);
          return;
        }
      }

      // Handle redirects.
      if (manifest.redirects) {
        const routeTrie = new trie.RouteTrie();
        manifest.redirects.forEach((redirect: manifest.Redirect) => {
          const code = redirect.permanent ? 301 : 302;
          const route = new trie.RedirectRoute(code, redirect.to);
          routeTrie.add(redirect.from, route);
        });
        const [route, params] = routeTrie.get(req.path);
        if (route instanceof trie.RedirectRoute) {
          // Preserve query parameters when redirecting.
          const result = route.getRedirect(params);
          const code = result[0];
          let destination = result[1];
          destination = req.originalUrl.includes('?')
            ? `${destination}?${req.originalUrl.split('?')[1]}`
            : destination;
          res.redirect(code, destination);
          return;
        }
      }

      let urlPath = decodeURIComponent(req.path);
      if (urlPath.endsWith('/')) {
        urlPath += 'index.html';
      }

      // Used for cache-control settings.
      const ext = fsPath.extname(req.path.split('?')[0]);
      const isFingerprinted =
        FingerprintedExtensions.has(ext) && req.url.includes('fingerprint=');

      // Handle static content.
      const manifestPaths = manifest.paths;
      let blobKey =
        manifest.paths[urlPath] || manifest.paths[urlPath.toLowerCase()];
      let localizedUrlPath = findLocalizedUrlPath(req, manifest, urlPath);
      const blobPrefix = `/${BUCKET}/fileset/sites/${manifest.site}/blobs`;
      let is404Page = req.path === defaults.DEFAULT_404_PAGE;

      // If a localized URL path was found, and if `?ncr` is not present, redirect.
      if (localizedUrlPath && req.query.ncr === undefined) {
        if (localizedUrlPath.endsWith('/index.html')) {
          localizedUrlPath = localizedUrlPath.slice(0, -10);
        }
        res.redirect(302, localizedUrlPath);
        return;
      }

      // If a blob wasn't found, and if trailing slash redirects are off, try
      // serving an `index.html` file, and 404 (instead of redirect) if the file
      // doesn't exist.
      if (!blobKey && manifest.redirectTrailingSlashes === false) {
        blobKey = manifest.paths[`${urlPath}/index.html`];
      }

      if (!blobKey) {
        // Trailing slash redirect.
        if (
          manifest.redirectTrailingSlashes !== false &&
          (manifestPaths[`${urlPath}/index.html`] ||
            manifestPaths[`${urlPath.toLowerCase()}/index.html`])
        ) {
          const destination = `${urlPath}/`;
          res.redirect(301, destination);
          return;
        }
        console.log(`Blob not found in ${blobPrefix} -> ${req.path}`);
        if (manifest.paths[defaults.DEFAULT_404_PAGE]) {
          is404Page = true;
          blobKey = manifest.paths[defaults.DEFAULT_404_PAGE];
        } else {
          res.status(404);
          res.sendFile(fsPath.join(__dirname, './static/', '404.html'));
          return;
        }
      }

      const updatedUrl = `${blobPrefix}/${blobKey}`;

      // Add Authorization: Bearer ... header to outgoing GCS request.
      const client = await auth.getClient();
      const headers = await client.getRequestHeaders();
      req.headers = headers;
      req.url = updatedUrl;
      const server = httpProxy.createProxyServer();
      server.web(req, res, {
        target: PROXY_BASE_URL,
        changeOrigin: true,
        preserveHeaderKeyCase: true,
      });
      server.on('error', (error, req, res) => {
        // Reduce logspam.
        if (`${error}`.includes('socket hang up')) {
          return;
        }
        console.log(`Error serving ${req.url}: ${error}`);
      });
      server.on('proxyRes', (proxyRes, message, res) => {
        // Avoid modifying response if headers already sent.
        if (res.headersSent) {
          return;
        }
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
        if (isFingerprinted) {
          proxyRes.headers['cache-control'] = 'public, max-age=31536000';
        } else if (isLive && !is404Page) {
          // This cannot be "private, max-age=0" as this kills perf.
          // This also can't be a very small value, as it kills perf. 0036 seems to work correctly.
          // The padded "0036" keeps the Content-Length identical with `3600`.
          proxyRes.headers['cache-control'] = 'public, max-age=0036';
        } else {
          // Authenticated responses cannot be cached publicly.
          proxyRes.headers['cache-control'] = 'private, max-age=0';
        }

        // Handle custom headers.
        if (manifest.headers) {
          const routeTrie = new trie.RouteTrie();
          Object.entries(manifest.headers).forEach(([path, customHeaders]) => {
            const route = new trie.CustomHeaderRoute(
              customHeaders as Record<string, string>
            );
            routeTrie.add(path, route);
          });
          const [route] = routeTrie.get(req.path);
          if (route instanceof trie.CustomHeaderRoute) {
            const customHeaders = route.getHeaders();
            Object.assign(proxyRes.headers, customHeaders);
          }
        }

        proxyRes.headers['x-fileset-blob'] = blobKey;
        proxyRes.headers['x-fileset-ref'] = manifest.ref;
        proxyRes.headers['x-fileset-site'] = manifest.site;
        if (manifest.ttl) {
          proxyRes.headers['x-fileset-ttl'] = manifest.ttl;
        }
        if (!isLive) {
          proxyRes.headers['x-fileset-branch'] = manifest.branch;
        }
        const statusCode = is404Page ? 404 : proxyRes.statusCode || 200;
        res.writeHead(statusCode, proxyRes.headers);
      });
    } catch (err) {
      res.status(500);
      res.contentType('text/plain');
      res.send(`Something went wrong. ${err}`);
      return;
    }
  });
  return app;
}
