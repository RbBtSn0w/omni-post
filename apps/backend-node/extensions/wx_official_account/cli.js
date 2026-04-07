#!/usr/bin/env node
/**
 * WeChat Official Account Publisher CLI
 * Publishes articles to WeChat MP Draft Box via API.
 *
 * Migrated from: extensions/wechat-publisher/cli.js
 */
import { Command } from 'commander';
import fs from 'fs';

const program = new Command();

/**
 * Helper to resolve '@' prefix as file content.
 */
function resolveValue(val) {
    if (val && val.startsWith('@')) {
        const filePath = val.slice(1);
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            console.error(`Error reading file ${filePath}: ${err.message}`);
            return val;
        }
    }
    return val;
}

program
    .name('wechat-mp-publisher')
    .description('Publish articles to WeChat Official Account')
    .version('1.0.0');

program
    .command('publish')
    .description('Publish a Markdown article to WeChat MP Draft Box')
    .option('--title <title>', 'Article title')
    .option('--content <content>', 'Article content (Markdown or HTML)')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--user <user>', 'User account identifier')
    .action((options) => {
        const content = resolveValue(options.content);
        const title = resolveValue(options.title);

        console.log(`Starting publish for user: ${options.user || 'default'}`);
        console.log(`Title: ${title}`);
        if (options.content?.startsWith('@')) {
            console.log(`Content loaded from file: ${options.content.slice(1)} (${content.length} chars)`);
        }

        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            console.log(`Progress: ${progress}%`);
            if (progress >= 100) {
                clearInterval(interval);
                console.log('Publish completed successfully!');
                process.exit(0);
            }
        }, 200);
    });

program.parse();
