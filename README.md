# Fileset

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

1. Install the Fileset CLI.

```bash
npm install --save-dev @blinkk/fileset
```

2. Create an `app.yaml` for Google App Engine deployment.

```yaml
service: fileset
runtime: nodejs10
entrypoint: fileset serve
```

3. Deploy the app.

```bash
gcloud app deploy app.yaml
```

### Authentication for deployment

Before you are able to deploy your files, you'll need to set up authentication
to deploy.

1. Identify the service account to use.

Authentication to upload your files is done using a service account. You'll
generally want to use one of two service accounts:

  a. When the command is invoked from Google Cloud Build, your project's Cloud
  Build service account (`<ProjectNumber>@cloudbuild.gserviceaccount.com`) is
  used.

To determine your project's project number:

```bash
gcloud projects describe <AppID>
```

  b. When the command is invoked locally (i.e. for testing or for manual uploads),
  you'll likely want to use your App Engine app's default service account
  (`<AppID>@appspot.gserviceaccount.com`). You can download a service account key
  by running:

```bash
gcloud iam service-accounts keys create \
  key.json \
  --iam-account <AppID>@appspot.gserviceaccount.com
```

NOTE: This will download a `key.json` to your current directory. Avoid
committing this to your Git repository. You'll want to add `key.json` to
`.gitignore`.

2. Ensure service account has permissions.

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

### Deployment setup

1. Create a `fileset.yaml` configuration file.

```yaml
site: siteId  # Specify a site ID. If blank, `default` will be used.
schedule:
  default: master  # Specify a branch for the prod deployment.
```

2. Generate your files.

Use a static site generator or just manually create a directory containing files
to upload. In the below example, the files in the directory `build` are
uploaded.

4. Upload your files.

```bash
fileset upload -s siteId build
```

5. That's it! Files have been uploaded to Google Cloud Storage and the uploaded
   directory is now being served by the application server.

TODO: Document Identity-Aware Proxy setup and CLI authentication.

## Environments

Fileset uses Git branches to determine whether files should be in production
(and public) or in staging (and restricted via the Identity-Aware Proxy). The
Git branch is determined by inspecting the local Git environment when the
`upload` command is invoked.

The best way to understand how this works is by following the examples below:

```bash
# master branch
# ✓ public
# ✓ production URL
# ✓ also available from staging URL (restricted)

(master) $ fileset upload build
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
