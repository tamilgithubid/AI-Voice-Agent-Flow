const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  keyGenerator: (req) => req.userId || req.ip,
});

const chatLimiter = rateLimit({
  windowMs: 60000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit exceeded. Please wait a moment.' },
  keyGenerator: (req) => req.userId || req.ip,
});

module.exports = { apiLimiter, chatLimiter };
