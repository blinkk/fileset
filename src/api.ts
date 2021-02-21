import * as server from './server';

import {SerializedManifest} from './manifest';

interface GetManifestRequest {
  site: string;
  refOrBranch: string;
}

interface GetManifestResponse {
  manifest: SerializedManifest;
}

export class ApiHandler {
  async handle(method: string, request: any) {
    if (method === 'manifest.get') {
      return this.manifestGet(request);
    }
    throw new Error(`unknown method: ${method}`);
  }

  async manifestGet(request: GetManifestRequest): Promise<GetManifestResponse> {
    const manifest = await server.getManifest(
      request.site,
      request.refOrBranch
    );
    return {
      manifest: {
        site: manifest.site,
        ref: manifest.ref,
        branch: manifest.branch,
        paths: manifest.paths,
        modified: manifest.modified,
        redirects: manifest.redirects,
        shortSha: manifest.shortSha,
      },
    };
  }
}
