import * as server from './server';

import {SerializedManifest} from './manifest';

interface GetManifestRequest {
  site: string;
  refOrBranch: string;
}

interface GetManifestResponse {
  manifest: SerializedManifest | null;
}

interface ListManifestRequest {
  site: string;
}

interface ListManifestResponse {
  manifests: Array<SerializedManifest> | null;
}

export class ApiHandler {
  async handle(method: string, request: any) {
    if (method === 'manifest.get') {
      return this.manifestGet(request);
    }
    if (method === 'manifest.list') {
      return this.manifestList(request);
    }
    throw new Error(`unknown method: ${method}`);
  }

  async manifestList(
    request: ListManifestRequest
  ): Promise<ListManifestResponse> {
    const manifests = await server.listManifests(request.site);
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

  async manifestGet(request: GetManifestRequest): Promise<GetManifestResponse> {
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

  serializeManifest(manifest: any) {
    return {
      site: manifest.site,
      ref: manifest.ref,
      branch: manifest.branch,
      paths: manifest.paths,
      manifestType: manifest.manifestType,
      modified: manifest.modified,
      redirects: manifest.redirects,
      shortSha: manifest.shortSha,
    };
  }
}
