import { Router, Request, Response } from 'express';
import { extensionService } from '../services/extension-service.js';
import { capabilityService } from '../services/capability-service.js';

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
    res.json({ 
      code: 200, 
      msg: 'success', 
      data: { ...envStatus, platforms, capabilities: capabilityService.getAllCapabilities() } 
    });
  } catch (error) {
    res.status(500).json({ 
      code: 500, 
      msg: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    });
  }
});

/**
 * GET /capabilities
 * Returns capability descriptors for both built-in and OpenCLI dynamic execution.
 */
router.get(['/capabilities', '/api/capabilities'], async (_req: Request, res: Response) => {
  try {
    const capabilities = capabilityService.getAllCapabilities();
    res.json({
      code: 200,
      msg: 'success',
      data: capabilities
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: error instanceof Error ? error.message : 'Unknown error',
      data: null
    });
  }
});

/**
 * POST /opencli/sync
 * Manually trigger discovery scan of $PATH and extensions/ directory.
 */
router.post(['/opencli/sync', '/api/opencli/sync'], async (_req: Request, res: Response) => {
  try {
    const count = await extensionService.syncExtensions();
    res.json({ 
      code: 200, 
      msg: 'Sync completed', 
      data: { count } 
    });
  } catch (error) {
    res.status(500).json({ 
      code: 500, 
      msg: error instanceof Error ? error.message : 'Sync failed', 
      data: null 
    });
  }
});

export { router };
