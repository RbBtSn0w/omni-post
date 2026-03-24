#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerBrowserCommands } from './commands/browser.js';
import { registerPublishCommands } from './commands/publish.js';
import { registerExploreCommands } from './commands/explore.js';

const program = new Command();

program
  .name('omni')
  .description('OmniPost CLI Tool for automated content publishing')
  .version('1.0.0');

// Register subcommands
registerBrowserCommands(program);
registerPublishCommands(program);
registerExploreCommands(program);

// General status command
program
  .command('status')
  .description('Check OmniPost backend status')
  .action(() => {
    console.log(chalk.green('OmniPost CLI is ready.'));
    console.log('Connect to backend at: ' + chalk.blue(process.env.OMNI_API_URL || 'http://localhost:5409'));
  });

program.parse(process.argv);
