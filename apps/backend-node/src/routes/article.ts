import express from 'express';
import { articleService } from '../services/article_service.js';

const router = express.Router();

/**
 * Get all articles.
 */
router.get('/articles', async (req, res) => {
  try {
    const articles = articleService.getAllArticles();
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get an article by ID.
 */
router.get('/articles/:id', async (req, res) => {
  try {
    const article = articleService.getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a new article.
 */
router.post('/articles', async (req, res) => {
  try {
    const id = articleService.createArticle(req.body);
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Publish an article (trigger task).
 */
router.post('/publish/article', async (req, res) => {
  try {
    const { article_id, account_id, platform, browser_profile_id, schedule_time } = req.body;
    const taskId = await articleService.publishArticle(
      article_id,
      account_id,
      platform,
      browser_profile_id,
      schedule_time
    );
    res.status(202).json({ task_id: taskId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
