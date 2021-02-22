export function createStagingLink(
  siteId: string,
  branchOrRef: string,
  path?: string
) {
  const url = new URL(window.location.href);
  if (siteId === 'default') {
    return `${url.protocol}//${branchOrRef}-dot-${url.host}${path || '/'}`;
  }
  return `${url.protocol}//${siteId}-${branchOrRef}-dot-${url.host}${
    path || '/'
  }`;
}
