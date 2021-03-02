# Fileset

[![NPM Version][npm-image]][npm-url]
[![GitHub Actions][github-image]][github-url]
[![Dependency Status][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![codecov][codecov-image]][codecov-url]
[![TypeScript Style Guide][gts-image]][gts-url]

Fileset is a light, high-performance TypeScript static web server intended for
high-traffic static sites. Features include:

- Atomic deployments
- (To be implemented) Scheduled deployments
- Redirects
- Localization-aware redirects
- Isolated per-branch staging environments backed by Google Account authentication
- Ultra-fast TTFB and payload transfer speeds
- A simple web UI for inspecting uploaded files

The server runs on Google App Engine and proxies requests to Google Cloud Storage.
## Concept

Many websites can be built and deployed as fully static content (i.e. just HTML,
CSS, and JavaScript – with no dynamic backend). Despite being static content,
websites may still have other requirements such as localization, redirects, or
atomic deployments that end up adding slight dynamic functionality to an
otherwise fully static project.

Fileset aims to bridge the gap by offering a thin middle layer on top of Google
Cloud Storage: static files are uploaded to Google Cloud Storage via the CLI,
with the Fileset server handling request traffic. The server determines whether
to issue a response sprinkled with one of the above dynamic features, and
otherwise proxies traffic directly to Google Cloud Storage – leveraging Google's
global network for performance.

## Usage

There are two main tasks required in order to use Fileset:

1. First, you'll need to deploy the server. This only needs to be done once,
   when the project is originally set up.
2. Second, you'll need to upload files to be served. Files must be uploaded each
   time you want to serve new files, update redirects, etc.

### Server setup

Refer to the example in `./example/server` or follow the steps below.

1. Within your project, create a directory to house the server configuration, e.g.
   `./backend/server`.

2. Create a `package.json` like the below. App Engine will use `npm start` to
   run the server.

```json
{
  "scripts": {
    "start": "fileset serve"
  },
  "dependencies": {
    "@blinkk/fileset": "^0.1.45"
  }
}
```

3. Create an `app.yaml` for Google App Engine deployment.

```yaml
service: fileset
runtime: nodejs10
handlers:
- url: /.*
  script: auto
  secure: always
```

4. Setup and deploy the app using the provided [Makefile](./example/server/Makefile).

```bash
make project=<AppId> setup
make project=<AppId> deploy
```

### Deployment setup

1. Create a `fileset.yaml` configuration file. The minimum example is below. See
   the [example fileset.yaml](./example/fileset.yaml) for full configuration
   options.

```yaml
google_cloud_project: <AppId>
```

2. Generate your files.

Use a static site generator or just manually create a directory containing files
to upload. In step (3) below, the files in the directory `./build` are
uploaded.

3. Upload your files.

The uploader will look for `fileset.yaml` within the `./build` directory
first. If it's not found, it will look up in the parent folder for a
`fileset.yaml` file. If the config file doesn't exist in the `./build` or parent
folder, the uploader will abort.

```bash
fileset upload ./build
```

4. That's it! Files have been uploaded to Google Cloud Storage and the uploaded
   directory is now being served by the application server.

## Uploader authentication

You'll need to be authenticated to upload files and deploy the serving manifests.

### Local testing (authenticate using user account)

If you are testing locally, your user account can be used to authenticate to
Cloud Datastore and Cloud Storage. Simply run the below command to create
credentials used for authentication:

```bash
gcloud auth application-default login
```

### Continuous deployment (authenticate using service account)

If you are using a service account for deployment, you'll need to ensure it has
the right permissions. When using Fileset with Google Cloud Build, simply run
`make setup` from the `example/server` directory to configure your project's
Cloud Build Service account with the right permissions.


The following permissions are needed:

- Cloud Datastore (manifests are stored here): Cloud Datastore Owner
  (`datastore.owner`)
- Cloud Storage (files are uploaded here): Storage Object Admin
  (`storage.objectAdmin`)

If using the Cloud Build service account (or any other service account), you'll
need to add the above two permissions to the account. That can be done via the
IAM page (`https://console.cloud.google.com/access/iam?project=<AppId>`) or via
the `gcloud` CLI.

The provided [Makefile](./example/server/Makefile) also does it for you:

```bash
make project=<AppId> setup
```

## Environments

Fileset uses Git branches to determine whether files should be in production
(and public) or in staging (and restricted via Google Account authentication).
The Git branch is determined by inspecting the local Git environment when the
`upload` command is invoked.

The best way to understand how this works is by following the examples below:

```bash
# main branch
# ✓ public
# ✓ production URL
# ✓ also available from staging URL (restricted)

(main) $ fileset upload build
...
 Public URL: https://appid.appspot.com
Staging URL: https://f3a9abb-dot-fileset-dot-appid.appspot.com
```

```bash
# staging branch
# ✓ not public
# ✓ staging URL only (restricted)

(staging) $ fileset upload build
...
Staging URL: https://4fb48ce-dot-fileset-dot-appid.appspot.com
```

## Testing

### Response headers

You can verify Fileset server is working as you expect by looking for the following headers:

| Header | Description |
|-|-|
| `x‑fileset‑site` | The site being served. Usually this will be `default` but for multi-site installations, this will be useful for determining which site is serving. |
| `x‑fileset‑ref` | The Git commit sha that corresponds to the serving manifest that is handling your request. |
| `x‑fileset‑blob` | The blob directory key corresponding to the file being served. This is the SHA-1 hash of the file's content. |
| `x‑fileset‑ttl` | For scheduled deployments, the value of this header will correspond to the timestamp for the timed deployment being served. |

### Query parameters

You can simulate geolocation behavior using query parameters:

| Parameter | Name | Description |
|-|-|-|
| `hl` | Language | Overrides the incoming `accept-language` header. |
| `gl` | Geolocation | Overrides the incoming `x-appengine-country` header. |
| `ncr` | No country redirect | Disables localization-aware redirects. |

## Tips

### Usage within Makefile

The absolute path to the `fileset` executable must be specified to invoke the CLI.

```
./node_modules/.bin/fileset upload build
```

### Usage with Grow.dev

First, build the site to the `./build` directory. Then, upload the directory to Fileset.

```
grow build --deployment=prod
fileset upload build
```

[github-image]: https://github.com/blinkkcode/fileset/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkkcode/fileset/actions
[codecov-image]: https://codecov.io/gh/blinkkcode/fileset/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/blinkkcode/fileset
[david-image]: https://david-dm.org/blinkkcode/fileset.svg
[david-url]: https://david-dm.org/blinkkcode/fileset
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
[npm-image]: https://img.shields.io/npm/v/@blinkk/fileset.svg
[npm-url]: https://npmjs.org/package/@blinkk/fileset
[snyk-image]: https://snyk.io/test/github/blinkkcode/fileset/badge.svg
[snyk-url]: https://snyk.io/test/github/blinkkcode/fileset
