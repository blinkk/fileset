#!/usr/bin/env node

import {createCommand} from 'commander';
import {ServeCommand} from './commands/serve';
import {UploadCommand} from './commands/upload';

const program = createCommand();

program
  .command('upload [dir]')
  .description('Uploads a directory to cloud storage')
  .option('-s, --site <site>', 'site', '')
  .option('-r, --ref <ref>', 'ref', '')
  .option('-f, --force', 'force', false)
  .option('-t, --ttl <ttl>', 'ttl', undefined)
  .action((path, options) => {
    const cmd = new UploadCommand(options);
    cmd.run(path);
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
