import * as server from './server';

import {SerializedManifest} from './manifest';

import express = require('express');

interface GetManifestRequest {
  site: string;
  refOrBranch: string;
}

interface GetManifestResponse {
  manifest: SerializedManifest | null;
}

interface ListManifestRequest {
  site: string;
  manifestType: string;
}

interface ListManifestResponse {
  manifests: Array<SerializedManifest> | null;
}

interface UserMeRequest {}

interface UserMeResponse {
  me: any;
}

export class ApiHandler {
  async handle(expressRequest: express.Request, method: string, request: any) {
    if (method === 'manifest.get') {
      return this.manifestGet(expressRequest, request);
    }
    if (method === 'manifest.list') {
      return this.manifestList(expressRequest, request);
    }
    if (method === 'user.me') {
      return this.userMe(expressRequest, request);
    }
    throw new Error(`unknown method: ${method}`);
  }

  async manifestList(
    expressRequest: express.Request,
    request: ListManifestRequest
  ): Promise<ListManifestResponse> {
    const manifests = await server.listManifests(
      request.site,
      request.manifestType
    );
    if (!manifests) {
      return {
        manifests: null,
      };
    }
    return {
      manifests: manifests.map(result => {
        return this.serializeManifest(result);
      }),
    };
  }

  async manifestGet(
    expressRequest: express.Request,
    request: GetManifestRequest
  ): Promise<GetManifestResponse> {
    const manifest = await server.getManifest(
      request.site,
      request.refOrBranch
    );
    if (!manifest) {
      return {
        manifest: null,
      };
    }
    return {
      manifest: this.serializeManifest(manifest),
    };
  }

  async userMe(
    expressRequest: express.Request,
    request: UserMeRequest
  ): Promise<UserMeResponse> {
    return {
      me: expressRequest.user,
    };
  }

  serializeManifest(manifest: any) {
    return {
      branch: manifest.branch,
      headers: manifest.headers,
      localizationPathFormat: manifest.localizationPathFormat,
      manifestType: manifest.manifestType,
      modified: manifest.modified,
      paths: manifest.paths,
      redirects: manifest.redirects,
      redirectTrailingSlashes: manifest.redirectTrailingSlashes,
      ref: manifest.ref,
      shortSha: manifest.shortSha,
      site: manifest.site,
      commit: manifest.commit,
    };
  }
}
