import git = require('isomorphic-git');
import fs = require('fs');

import * as manifest from './manifest';
interface GitData {
  ref: string;
  branch: string;
  commit: manifest.Commit;
}

export async function getGitData(path: string): Promise<GitData> {
  const root = await git.findRoot({
    fs,
    filepath: path,
  });
  const log = await git.log({
    fs,
    dir: root,
    depth: 1,
    ref: 'HEAD',
  });
  const branch =
    process.env.BRANCH_NAME ||
    process.env.CIRCLE_BRANCH ||
    (await git.currentBranch({
      fs,
      dir: root,
      fullname: false,
    })) ||
    '';
  if (!log || !log[0]) {
    throw new Error(`Failed to retrieve Git data from path: ${path}`);
  }
  const commit = log[0].commit;
  const cleanMessage = commit.message.slice(0, 128);
  return {
    ref: log[0].oid,
    branch: branch,
    commit: {
      message: cleanMessage,
      author: {
        timestamp: commit.committer.timestamp,
        name: commit.author.name,
        email: commit.author.email,
      },
    },
  };
}
