/**
 * Server entry point for omni-post backend (Node.js).
 * Mirrors: apps/backend/run.py functionality
 */

import { createApp } from './app.js';
import { logBrowserInfo, SERVER_HOST, SERVER_PORT } from './core/config.js';
import { logger } from './core/logger.js';

const app = createApp();

app.listen(SERVER_PORT, SERVER_HOST, () => {
    logger.info(`\n${'='.repeat(50)}`);
    logger.info(`🚀 OmniPost Backend (Node.js) running at http://${SERVER_HOST}:${SERVER_PORT}`);
    logger.info(`${'='.repeat(50)}\n`);
    logBrowserInfo();
});
