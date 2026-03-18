const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./utils/logger');
const { httpRequestDuration, activeConnections } = require('./utils/metrics');
const { authMiddleware } = require('./middleware/auth');
const { connectRedis } = require('./services/redis');
const { processMessageStream } = require('./services/agent');

// Routes
const chatRoutes = require('./routes/chat');
const resumeRoutes = require('./routes/resume');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Request duration tracking
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});

// --- Routes ---
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/resume', authMiddleware, resumeRoutes);

// --- WebSocket Server for real-time streaming ---
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  activeConnections.inc();
  logger.info(`WebSocket connected: ${connectionId}`);

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { message, userId, threadId } = parsed;

      if (!message) {
        ws.send(JSON.stringify({ type: 'error', message: 'Message is required' }));
        return;
      }

      const resolvedThreadId = threadId || `thread-${uuidv4()}`;
      const resolvedUserId = userId || 'user-1';

      // Send thread ID back immediately
      ws.send(JSON.stringify({ type: 'thread', threadId: resolvedThreadId }));

      await processMessageStream({
        message,
        userId: resolvedUserId,
        threadId: resolvedThreadId,
        onToken: (token) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'token', content: token }));
          }
        },
        onDone: (result) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'done', threadId: result.threadId }));
          }
        },
      });
    } catch (err) {
      logger.error('WebSocket message error:', err);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
      }
    }
  });

  ws.on('close', () => {
    activeConnections.dec();
    logger.info(`WebSocket disconnected: ${connectionId}`);
  });

  ws.on('error', (err) => {
    logger.error(`WebSocket error: ${connectionId}`, err);
  });
});

// --- Error handling ---
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Startup ---
async function start() {
  // Connect to Redis (non-blocking — works without it)
  await connectRedis();

  server.listen(config.port, () => {
    logger.info(`Agent Flow API running on port ${config.port}`);
    logger.info(`WebSocket server running on ws://localhost:${config.port}/ws`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = { app, server };
