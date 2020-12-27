# Fileset server

This directory contains the configuration files for deploying the Fileset
server. It only needs to be deployed once.

## Deployment

```bash
# Create an App Engine app if one doesn't exist yet.
gcloud app create --project=<AppId>

# Enable the Cloud Datastore API.
gcloud services enable datastore.googleapis.com --project=<AppId>

# Deploy the app.
gcloud app deploy --project=<AppId> app.yaml
```