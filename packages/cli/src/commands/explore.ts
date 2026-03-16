import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../api/client.js';

export function registerExploreCommands(program: Command) {
  program
    .command('explore')
    .description('Explore a website to identify automation points')
    .argument('<url>', 'Platform URL to explore')
    .option('--output <file>', 'Save adapter draft to file')
    .action(async (url, options) => {
      try {
        console.log(chalk.blue(`Exploring ${url}... this may take a few seconds.`));
        const result = await api.explore(url);
        
        console.log(chalk.green('\nAnalysis Result:'));
        console.log(`Found ${result.analysis.inputs.length} inputs and ${result.analysis.buttons.length} buttons.`);
        
        console.log(chalk.yellow('\nAdapter Draft:'));
        console.log(JSON.stringify(result.adapterDraft, null, 2));
        
        if (options.output) {
          const fs = await import('fs');
          fs.writeFileSync(options.output, JSON.stringify(result.adapterDraft, null, 2));
          console.log(chalk.green(`\nDraft saved to ${options.output}`));
        }
      } catch (error: any) {
        console.error(chalk.red('Exploration failed:'), error.message);
      }
    });
}
