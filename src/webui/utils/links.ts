export function createStagingLink(
  siteId: string,
  branch: string,
  ref: string,
  path?: string
) {
  const url = new URL(window.location.href);
  // Fileset previews work by using either the branch or the short sha. If the
  // branch includes non-URL safe characters, revert to using the short sha
  // temporarily until we have a canonical way to normalize branch names for
  // URLs.
  let prefix;
  if (encodeURIComponent(branch) !== branch) {
    prefix = ref.slice(0, 7);
  } else {
    prefix = branch;
  }
  if (siteId === 'default') {
    return `${url.protocol}//${prefix}-dot-${url.host}${path || '/'}`;
  }
  return `${url.protocol}//${siteId}-${prefix}-dot-${url.host}${path || '/'}`;
}
