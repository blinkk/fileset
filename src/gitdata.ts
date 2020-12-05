import git = require('isomorphic-git');
import fs = require('fs');

export async function getGitData(path: string) {
  const root = await git.findRoot({
    fs,
    filepath: path,
  });
  const commits = await git.log({
    fs,
    dir: root,
    depth: 1,
    ref: 'HEAD',
  });
  const branch = await git.currentBranch({
    fs,
    dir: root,
    fullname: false,
  });
  return {
    ref: commits && commits[0].oid,
    branch: branch,
  };
}
