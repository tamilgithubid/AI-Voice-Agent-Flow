const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// Generate a token (for testing/demo purposes)
function generateToken(userId) {
  return jwt.sign({ userId, iat: Math.floor(Date.now() / 1000) }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// Auth middleware — validates JWT from Authorization header
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // In development, allow requests without auth (use a default user)
  if (config.nodeEnv === 'development' && !authHeader) {
    req.userId = req.headers['x-user-id'] || 'user-1';
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    logger.warn('Auth failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware, generateToken };
