const express = require('express');
const { get_resume, save_resume } = require('../services/tools');
const { validate, resumeSaveSchema } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/resume/:userId — Get a user's resume
router.get('/:userId', apiLimiter, async (req, res) => {
  try {
    const result = await get_resume({ userId: req.params.userId });
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    logger.error('Resume fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// POST /api/resume/save — Save/update resume
router.post('/save', apiLimiter, validate(resumeSaveSchema), async (req, res) => {
  try {
    const result = await save_resume({
      userId: req.userId,
      resumeData: req.validatedBody,
    });
    res.json(result);
  } catch (err) {
    logger.error('Resume save error:', err);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

module.exports = router;
