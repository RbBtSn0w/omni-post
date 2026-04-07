import { Router, Request, Response } from 'express';
import { extensionService } from '../services/extension-service.js';
import { capabilityService } from '../services/capability-service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../core/logger.js';

const router = Router();

/**
 * GET /opencli/status
 * Returns the global environment state and discovered platforms.
 */
router.get(['/opencli/status', '/api/opencli/status'], async (_req: Request, res: Response) => {
  try {
    const envStatus = await extensionService.checkEnvironment();
    let platforms = extensionService.getAllExtensions();
    if (envStatus.installed && platforms.length === 0) {
      await extensionService.syncExtensions();
      platforms = extensionService.getAllExtensions();
    }
    sendSuccess(res, { ...envStatus, platforms, capabilities: capabilityService.getAllCapabilities() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Extension Route] Error checking status: ${msg}`);
    sendError(res, 500, 'Internal server error while fetching OpenCLI status');
  }
});

/**
 * GET /capabilities
 * Returns capability descriptors for both built-in and OpenCLI dynamic execution.
 */
router.get(['/capabilities', '/api/capabilities'], async (_req: Request, res: Response) => {
  try {
    const capabilities = capabilityService.getAllCapabilities();
    sendSuccess(res, capabilities);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Extension Route] Error fetching capabilities: ${msg}`);
    sendError(res, 500, 'Internal server error while fetching capabilities');
  }
});

/**
 * POST /opencli/sync
 * Manually trigger discovery scan of $PATH and extensions/ directory.
 */
router.post(['/opencli/sync', '/api/opencli/sync'], async (_req: Request, res: Response) => {
  try {
    const count = await extensionService.syncExtensions();
    sendSuccess(res, { count }, 'Sync completed');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Sync failed';
    logger.error(`[Extension Route] Error syncing extensions: ${msg}`);
    sendError(res, 500, 'Internal server error while syncing extensions');
  }
});

export { router };
