import express from 'express';
import { explorerService } from '../services/explorer_service.js';

const router = express.Router();

/**
 * Explore a URL.
 */
router.get('/explore', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const result = await explorerService.explore(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
