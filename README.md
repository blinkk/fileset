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

### Deployment setup

1. Create a `fileset.yaml` configuration file.

```yaml
site: siteId  # Specify a site ID. If blank, `default` will be used.
schedule:
  default: master  # Specify a branch for the prod deployment.
```

2. Generate your files. Use a static site generator or just manually create a
   directory containing files to upload. In the below example, the files in the
   directory `build` are uploaded.

3. Upload your files.

```bash
fileset upload -s siteId build
```

4. That's it! Files have been uploaded to Google Cloud Storage and the uploaded
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