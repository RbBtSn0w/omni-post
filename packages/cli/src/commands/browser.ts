import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../api/client.js';

export function registerBrowserCommands(program: Command) {
  const browser = program.command('browser').description('Manage browser profiles');

  browser
    .command('list')
    .description('List all browser profiles')
    .action(async () => {
      try {
        const profiles = await api.getProfiles();
        console.table(profiles.map((p: any) => ({
          ID: p.id,
          Name: p.name,
          Type: p.browser_type,
          Path: p.user_data_dir
        })));
      } catch (error: any) {
        console.error(chalk.red('Failed to fetch profiles:'), error.message);
      }
    });

  browser
    .command('link')
    .description('Link a local browser profile')
    .argument('<name>', 'Profile display name')
    .argument('<path>', 'Path to User Data Directory')
    .option('--profile <name>', 'Specific profile name', 'Default')
    .option('--type <type>', 'Browser type (chrome/edge/brave)', 'chrome')
    .action(async (name, path, options) => {
      try {
        const res = await api.linkProfile({
          name,
          user_data_dir: path,
          profile_name: options.profile,
          browser_type: options.type
        });
        console.log(chalk.green(`Successfully linked profile: ${res.id}`));
      } catch (error: any) {
        console.error(chalk.red('Failed to link profile:'), error.message);
      }
    });
}
