# Fileset

![Master](https://github.com/blinkkcode/fileset/workflows/Run%20tests/badge.svg)

Fileset is a light, high-performance TypeScript static web server intended for
high-traffic sites. Features include preview branches backed by Google Account
authentication, redirects, localization-aware serving, atomic deployments, and
timed deployments.

Instructions for deployment onto Google App Engine (backed by Cloud Datastore
and Cloud Storage) are provided.

## Concept

Many websites can be built and deployed as fully static packages (i.e. just
HTML, CSS, and JavaScript – with no dynamic backend). In these instances,
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

There are two main tasks required in order to use Fileset. First, you'll need to
deploy the application server and configure the Identity-Aware Proxy. This only
needs to be done once, when the project is originally set up. Secondly, you'll
need to upload files to be served. Files must be uploaded each time you want to
serve new files to users, or update redirects, etc.

### Server setup

NOTE: Fileset uses the default App Engine Google Cloud Storage bucket
(`gs://appid.appspot.com`) to upload files.

1. Within your project, create a directory to house the server files, e.g.
   `./backend/server`. Avoid mixing the server configuration with any tools to
   build your website. The `package.json`, etc. should be kept separate in order
   to keep the deployment slim.

2. Create a `package.json` like the below. App Engine will use `npm start` to
   run the server.

```json
{
  "scripts": {
    "start": "fileset serve"
  },
  "dependencies": {
    "@blinkk/fileset": "^0.1.0"
  }
}
```

3. Create an `app.yaml` for Google App Engine deployment.

```yaml
service: fileset
runtime: nodejs10
env_variables:
  FILESET_SITE: default
  FILESET_LIVE_DOMAIN: example.com
  FILESET_STAGING_DOMAIN: '{ref}.staging.example.com'
```

4. Create a `Makefile` to help run setup commands.

```make
project := <AppId>  # Replace with your App ID.

setup:
	gcloud app create --project=$(project)
	gcloud services enable datastore.googleapis.com --project=$(project)

deploy:
	gcloud app deploy --project=$(project) app.yaml
```

5. Deploy the app.

```bash
make setup
make deploy
```

### Deployment setup

NOTE: Before you can deploy, you'll need to authenticate. Refer to the
[authentication documentation](#uploader-authentication) if you have not used
Google Cloud Platform services before and need information on authentication.

1. Create a `fileset.yaml` configuration file.

```yaml
# Your Google Cloud project's ID (required).
google_cloud_project: <AppId>

# Your site ID (optional). If blank, `default` will be used.
site: <SiteId>

# Specify a launch schedule. The schedule maps timestamps to branches or commit
# shas. If blank, `main` is used for the default deployment.
schedule:
  default: main

redirects:
- from: /foo
  to: /bar
- from: /intl/:locale/
  to: /$locale/
- from: /intl/:locale/*wildcard
  to: /$locale/$wildcard
```

2. Generate your files.

Use a static site generator or just manually create a directory containing files
to upload. In the below example, the files in the directory `build` are
uploaded.

4. Upload your files.

```bash
fileset upload ./build
```

NOTE: The uploader will look for `fileset.yaml` within the `./build` directory
first. If it's not found, it will look up in the parent folder for a
`fileset.yaml` file. If the config file doesn't exist in the `./build` or parent
folder, the uploader will abort.

5. That's it! Files have been uploaded to Google Cloud Storage and the uploaded
   directory is now being served by the application server.

## Uploader authentication

You'll need to be authenticated to deploy files and upload the serving manifests.

### Local testing / user account authentication

If you are testing locally, your user account can be used to authenticate to
Cloud Datastore and Cloud Storage. Simply run the below command to create
credentials used for authentication:

```bash
gcloud auth application-default login
```

### Continuous deployment / service account authentication

If you are using a service account for deployment, you'll need to ensure it has
the right permissions.

#### 1. Identify the service account to use.

Authentication to upload your files is done using a service account. You'll
generally want to use one of two service accounts:

__Cloud Build service account__: When the command is invoked from Google Cloud
Build, your project's Cloud Build service account
(`<ProjectNumber>@cloudbuild.gserviceaccount.com`) is used.

To determine your project's project number:

```bash
gcloud projects describe <AppId>
```

__Application default service account__: When the command is invoked locally
(i.e. for testing or for manual uploads), you'll likely want to use your App
Engine app's default service account (`<AppId>@appspot.gserviceaccount.com`).
You can download a service account key by running:

```bash
gcloud iam service-accounts keys create \
  key.json \
  --iam-account <AppId>@appspot.gserviceaccount.com
```

NOTE: This will download a `key.json` to your current directory. Avoid
committing this to your Git repository. You'll want to add `key.json` to
`.gitignore`.

#### 2. Ensure service account has permissions.

The following permissions are needed:

- Cloud Datastore (manifests are stored here): Cloud Datastore Owner
  (`datastore.owner`)
- Cloud Storage (files are uploaded here): Storage Object Admin
  (`storage.objectAdmin`)

If using the App Engine default service account, you will not need to modify the
permissions, as the service account has the "Project Editor" permission by
default.

If using the Cloud Build service account (or any other service account), you'll
need to add the above two permissions to the account. That can be done via the
IAM page (`https://console.cloud.google.com/access/iam?project=<AppId>`) or via
the `gcloud` CLI:

```
for role in datastore.owner storage.objectAdmin g; do \
  gcloud projects add-iam-policy-binding \
      <AppId>
      --member=serviceAccount:<ProjectNumber>@cloudbuild.gserviceaccount.com \
      --role=roles/$role \
; done
```
## Environments

Fileset uses Git branches to determine whether files should be in production
(and public) or in staging (and restricted via the Identity-Aware Proxy). The
Git branch is determined by inspecting the local Git environment when the
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
Staging URL: https://default-f3a9abb-dot-fileset-dot-appid.appspot.com
```

```bash
# staging branch
# ✓ not public; restricted by Identity-Aware Proxy
# ✓ staging URL only (restricted)

(staging) $ fileset upload build
...
Staging URL: https://default-4fb48ce-dot-fileset-dot-appid.appspot.com
```

## Testing

You can verify Fileset server is working as you expect by looking for the following headers:

| Header | Description |
|-|-|
| `x-fileset-site` | The site being served. Usually this will be `default` but for multi-site installations, this will be useful for determining which site is serving. |
| `x-fileset-ref` | The Git commit sha that corresponds to the serving manifest that is handling your request. |
| `x-fileset-blob` | The blob directory key corresponding to the file being served. This is the SHA-1 hash of the file's content. |
| `x-fileset-ttl` | For scheduled deployments, the value of this header will correspond to the timestamp for the timed deployment being served. |

## Tips

### Usage within Makefile

The absolute path to the `fileset` executable must be specified to invoke the CLI.

```
./node_modules/.bin/fileset upload build
```

### Usage with Grow.dev

First, build the site to the `build` directory. Then, upload the directory to Fileset.

```
grow build --deployment=prod
fileset upload build
```