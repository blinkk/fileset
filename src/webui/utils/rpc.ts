interface RpcResponse {
  success: boolean;
  data: unknown;
  error?: string;
}

export async function rpc(
  endpoint: string,
  data: unknown,
  options?: {
    onProgress?: (progress: number) => void;
  }
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const url = '/fileset/api/' + endpoint;
    const payload = JSON.stringify(data);

    if (options?.onProgress) {
      xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
        if (e.lengthComputable) {
          const progress = Math.floor((e.loaded / e.total) * 100);
          options.onProgress(progress);
        }
      });
    }
    xhr.addEventListener('error', () => {
      reject(new Error(`failed to call ${endpoint}`));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status !== 200) {
        console.error(xhr.responseText);
        const err = xhr.responseText || xhr.statusText;
        reject(new Error(`failed to call ${endpoint}: ${err}`));
        return;
      }
      const json = JSON.parse(xhr.responseText) as RpcResponse;
      if (!json.success) {
        console.error(json);
        const err = json.error || xhr.responseText;
        reject(new Error(`failed to call ${endpoint}: ${err}`));
        return;
      }
      resolve(json.data);
    });
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(payload);
  });
}
