/**
 * Server entry point for omni-post backend (Node.js).
 * Mirrors: apps/backend/run.py functionality
 */

import { initTelemetry } from './core/telemetry.js';

// Initialize telemetry before loading application modules.
initTelemetry();

const [{ createApp }, { logBrowserInfo, SERVER_HOST, SERVER_PORT }, { logger }, { StartupService }] = await Promise.all([
    import('./app.js'),
    import('./core/config.js'),
    import('./core/logger.js'),
    import('./services/startup-service.js'),
]);

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
