#!/usr/bin/env node

import {createCommand} from 'commander';
import {ServeCommand} from './commands/serve';
import {UploadCommand} from './commands/upload';

const program = createCommand();

program
  .command('upload [dir]')
  .description('Uploads a directory to cloud storage')
  .option('-b, --bucket <bucket>', 'bucket', '')
  .option('-s, --site <site>', 'site', '')
  .option('-r, --ref <ref>', 'ref', '')
  .option('-br, --branch <branch>', 'branch', '')
  .action((path, options) => {
    const cmd = new UploadCommand(options);
    cmd.run(path);
  });

program
  .command('serve [dir]')
  .description('Runs the server')
  .action((path, options) => {
    const cmd = new ServeCommand(options);
    cmd.run();
  });

program.parse(process.argv);
