import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { api } from '../api/client.js';
import { toErrorMessage } from '../utils/error.js';

export function registerPublishCommands(program: Command) {
  const publish = program.command('publish').description('Publish content to platforms');

  publish
    .command('article')
    .description('Publish a Markdown article')
    .argument('<file>', 'Path to Markdown file')
    .option('--platform <platform>', 'Target platform (ZHIHU/JUEJIN)', 'ZHIHU')
    .option('--account <id>', 'Account ID')
    .option('--profile <id>', 'Browser Profile ID')
    .option('--title <title>', 'Article title')
    .action(async (file, options) => {
      try {
        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`);
        }
        const content = fs.readFileSync(file, 'utf-8');
        const title = options.title || file.split('/').pop()?.replace('.md', '') || 'Untitled';

        // 1. Create Article
        const article = await api.createArticle({
          title,
          content,
          tags: []
        });

        // 2. Trigger Publish
        const res = await api.publishArticle({
          article_id: article.id,
          account_id: options.account,
          platform: options.platform,
          browser_profile_id: options.profile
        });

        console.log(chalk.green(`Publish task created: ${res.task_id}`));
      } catch (error: unknown) {
        console.error(chalk.red('Failed to publish article:'), toErrorMessage(error));
      }
    });

  publish
    .command('tasks')
    .description('List current publishing tasks')
    .action(async () => {
      try {
        const tasks = await api.getTasks();
        console.table(tasks.map((t) => ({
          ID: t.id,
          Title: t.title,
          Status: t.status,
          Progress: `${t.progress}%`,
          Created: t.created_at
        })));
      } catch (error: unknown) {
        console.error(chalk.red('Failed to fetch tasks:'), toErrorMessage(error));
      }
    });
}
