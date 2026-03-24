import { Router, type Request, type Response } from 'express';
import { articleService } from '../services/article_service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * Get all articles.
 */
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const articles = articleService.getAllArticles();
    sendSuccess(res, articles);
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Get an article by ID.
 */
router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const article = articleService.getArticle(String(req.params.id));
    if (!article) {
      sendError(res, 404, 'Article not found');
      return;
    }
    sendSuccess(res, article);
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Create a new article.
 */
router.post('/articles', async (req: Request, res: Response) => {
  try {
    const id = articleService.createArticle(req.body);
    sendSuccess(res, { id }, 'Create success');
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

/**
 * Publish an article (trigger task).
 */
router.post('/publish/article', async (req: Request, res: Response) => {
  try {
    const { article_id, account_id, platform, browser_profile_id, schedule_time } = req.body;
    if (!article_id || typeof article_id !== 'string') {
      sendError(res, 400, 'article_id (string) is required');
      return;
    }
    if (!platform || typeof platform !== 'string') {
      sendError(res, 400, 'platform (string) is required');
      return;
    }
    // account_id can be optional if using a profile, or vice versa, but we should validate them if they exist
    if (account_id && typeof account_id !== 'string') {
      sendError(res, 400, 'account_id must be a string');
      return;
    }
    if (browser_profile_id && typeof browser_profile_id !== 'string') {
      sendError(res, 400, 'browser_profile_id must be a string');
      return;
    }
    if (!account_id && !browser_profile_id) {
       sendError(res, 400, 'Either account_id or browser_profile_id is required');
       return;
    }
    const taskId = await articleService.publishArticle(
      article_id,
      account_id,
      platform,
      browser_profile_id,
      schedule_time
    );
    sendSuccess(res, { task_id: taskId }, 'Publish task submitted');
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
});

export default router;
