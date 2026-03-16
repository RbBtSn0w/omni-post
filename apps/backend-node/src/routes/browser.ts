import express from 'express';
import { browserService } from '../services/browser_service.js';

const router = express.Router();

/**
 * Get all browser profiles.
 */
router.get('/profiles', (req, res) => {
  try {
    const profiles = browserService.getAllProfiles();
    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a profile by ID.
 */
router.get('/profiles/:id', (req, res) => {
  try {
    const profile = browserService.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a new browser profile.
 */
router.post('/profiles', (req, res) => {
  try {
    const id = browserService.createProfile(req.body);
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update an existing profile.
 */
router.put('/profiles/:id', (req, res) => {
  try {
    const success = browserService.updateProfile(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Profile not found or no changes made' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a profile.
 */
router.delete('/profiles/:id', (req, res) => {
  try {
    const success = browserService.deleteProfile(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
