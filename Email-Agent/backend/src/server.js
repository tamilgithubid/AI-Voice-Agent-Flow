const path = require('path');
// Load .env from multiple possible locations (local dev vs production)
const envPath = path.resolve(__dirname, '../../.env');
const localEnvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });
require('dotenv').config({ path: localEnvPath });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const agentRoutes = require('./routes/agent');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS — allow Vercel deployments + local dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any .vercel.app subdomain
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // In production, tighten this if needed
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['X-Voice-Name'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Parsing & logging
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/agent', agentRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Only listen when running locally (not on Vercel serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`Tamil AI Voice Agent backend running on port ${PORT}`);
  });
}

module.exports = app;
