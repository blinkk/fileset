# Fileset server

This directory contains the configuration files for deploying the Fileset
server. It only needs to be deployed once.

## Deployment

```bash
# Set up application and roles.
make project=<AppId> setup

# Deploy server.
make project=<AppId> deploy
```