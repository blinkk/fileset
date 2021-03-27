import * as defaults from '../../defaults';

export function createStagingLink(
  baseUrl: string,
  siteId: string,
  branch: string,
  ref: string,
  path?: string
) {
  const url = new URL(baseUrl);
  // Fileset previews work by using either the branch or the short sha. If the
  // branch includes non-URL safe characters, revert to using the short sha
  // temporarily until we have a canonical way to normalize branch names for
  // URLs.
  defaults.COMMON_BRANCH_PREFIXES.forEach(commonPrefix => {
    if (branch.startsWith(commonPrefix)) {
      branch = branch.replace(commonPrefix, '');
    }
  });
  branch = branch.replace('/', '--');
  let prefix;
  // Resulting branch is empty (meaning we want the ref link), or isn't URL
  // safe, we need to use the ref.
  if (!branch || encodeURIComponent(branch) !== branch) {
    prefix = ref.slice(0, 7);
  } else {
    prefix = branch;
  }
  const sep = url.hostname.includes('appspot.com') ? '-dot-' : '.';
  if (siteId === 'default') {
    return `${url.protocol}//${prefix}${sep}${url.host}${path || '/'}`;
  }
  return `${url.protocol}//${siteId}-${prefix}${sep}${url.host}${path || '/'}`;
}
