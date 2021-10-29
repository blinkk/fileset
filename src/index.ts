#!/usr/bin/env node

import {ServeCommand} from './commands/serve';
import {UploadCommand} from './commands/upload';
import {createCommand} from 'commander';

const program = createCommand();

// Ensure unhandled promises cause the command to fail.
process.on('unhandledRejection', err => {
  throw err;
});

program
  .command('upload [dir]')
  .description('Uploads a directory to cloud storage')
  .option('-p, --google-cloud-project <project>', 'project', '')
  .option('-s, --site <site>', 'site', '')
  .option('-r, --ref <ref>', 'ref', '')
  .option('-b, --branch <branch>', 'branch', '')
  .option('-f, --force', 'force', false)
  .option('-t, --ttl <ttl>', 'ttl', undefined)
  .option('-o, --output-file <path>', 'output file', '')
  .action(async (path, options) => {
    const cmd = new UploadCommand(options);
    await cmd.run(path);
  });

program
  .command('serve')
  .description('Runs the server')
  .option('-s, --site <site>', 'site', '')
  .option('-r, --ref <ref>', 'ref', '')
  .action(options => {
    const cmd = new ServeCommand(options);
    cmd.run();
  });

program.parse(process.argv);
