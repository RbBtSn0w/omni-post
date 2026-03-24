import { Router, type Request, type Response } from 'express';
import { explorerService } from '../services/explorer_service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * Explore a URL.
 */
router.get('/explore', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      sendError(res, 400, 'URL is required');
      return;
    }
    const result = await explorerService.explore(url);
    sendSuccess(res, result);
  } catch (error: any) {
    const status = (error.message.includes('Invalid protocol') || 
                    error.message.includes('restricted for security')) ? 400 : 500;
    sendError(res, status, error.message);
  }
});

export default router;
