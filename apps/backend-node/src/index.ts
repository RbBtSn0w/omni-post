/**
 * Server entry point for omni-post backend (Node.js).
 * Mirrors: apps/backend/run.py functionality
 */

// Telemetry MUST be initialized before any other imports that use tracing
import { initTelemetry } from './core/telemetry.js';
initTelemetry();

import { createApp } from './app.js';
import { logBrowserInfo, SERVER_HOST, SERVER_PORT } from './core/config.js';
import { logger } from './core/logger.js';
import { StartupService } from './services/startup-service.js';

const app = createApp();

/**
 * 启动前自检和清理
 */
await StartupService.runPostBootHousekeeping();

app.listen(SERVER_PORT, SERVER_HOST, () => {
    logger.info(`\n${'='.repeat(50)}`);
    logger.info(`🚀 OmniPost Backend (Node.js) running at http://${SERVER_HOST}:${SERVER_PORT}`);
    logger.info(`${'='.repeat(50)}\n`);
    logBrowserInfo();
});
