import { Router, type Request, type Response } from 'express';
import { browserService } from '../services/browser_service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * Get all browser profiles.
 */
router.get('/profiles', (req: Request, res: Response) => {
  try {
    const profiles = browserService.getAllProfiles();
    sendSuccess(res, profiles);
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Get a profile by ID.
 */
router.get('/profiles/:id', (req: Request, res: Response) => {
  try {
    const profile = browserService.getProfile(String(req.params.id));
    if (!profile) {
      sendError(res, 404, 'Profile not found');
      return;
    }
    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Create a new browser profile.
 */
router.post('/profiles', (req: Request, res: Response) => {
  try {
    const id = browserService.createProfile(req.body);
    sendSuccess(res, { id }, 'Create success');
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Update an existing profile.
 */
router.put('/profiles/:id', (req: Request, res: Response) => {
  try {
    const success = browserService.updateProfile(String(req.params.id), req.body);
    if (!success) {
      sendError(res, 404, 'Profile not found or no changes made');
      return;
    }
    sendSuccess(res, { success: true });
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Delete a profile.
 */
router.delete('/profiles/:id', (req: Request, res: Response) => {
  try {
    const success = browserService.deleteProfile(String(req.params.id));
    if (!success) {
      sendError(res, 404, 'Profile not found');
      return;
    }
    sendSuccess(res, { success: true });
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

export default router;
