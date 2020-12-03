#!/usr/bin/env node

import {createCommand} from 'commander';
import {UploadCommand} from './commands/upload';

const program = createCommand();

function numberOption(value: string) {
  return parseInt(value);
}

program
  .command('upload [path]')
  .description('Uploads a directory to cloud storage')
  .option('-p, --port <port>', 'port', numberOption, 8080)
  .option('-m, --mode <mode>', 'mode', 'dev')
  .action((path, options) => {
    const cmd = new UploadCommand(options);
    cmd.run(path);
  });

program.parse(process.argv);