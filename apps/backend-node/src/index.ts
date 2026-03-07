/**
 * Server entry point for omni-post backend (Node.js).
 * Mirrors: apps/backend/run.py functionality
 */

import { createApp } from './app.js';
import { logBrowserInfo, SERVER_HOST, SERVER_PORT } from './core/config.js';

const app = createApp();

app.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 OmniPost Backend (Node.js) running at http://${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`${'='.repeat(50)}\n`);
    logBrowserInfo();
});
