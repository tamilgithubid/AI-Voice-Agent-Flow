const express = require('express');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/token — Generate a demo JWT token
router.post('/token', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const token = generateToken(userId);
  res.json({ success: true, token, userId });
});

module.exports = router;
