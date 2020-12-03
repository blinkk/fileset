#!/usr/bin/env node

import {createCommand} from 'commander';
import {UploadCommand} from './commands/upload';

const program = createCommand();

program
  .command('upload [path]')
  .description('Uploads a directory to cloud storage')
  .option('-s, --site <site>', 'site', '')
  .action((path, options) => {
    const cmd = new UploadCommand(options);
    cmd.run(path);
  });

program.parse(process.argv);