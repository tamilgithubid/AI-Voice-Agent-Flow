const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { processMessage, processMessageStream } = require('../services/agent');
const { clearMemory, getMemory } = require('../services/redis');
const { validate, chatMessageSchema } = require('../middleware/validate');
const { chatLimiter } = require('../middleware/rateLimiter');
const { chatRequestsTotal } = require('../utils/metrics');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/chat — Send a message to the AI agent
router.post('/', chatLimiter, validate(chatMessageSchema), async (req, res) => {
  const { message, threadId: existingThreadId, stream } = req.validatedBody;
  const userId = req.userId;
  const threadId = existingThreadId || `thread-${uuidv4()}`;

  logger.info('Chat request', { userId, threadId, messageLength: message.length, stream });

  // SSE streaming mode
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Thread-Id', threadId);
    res.flushHeaders();

    try {
      await processMessageStream({
        message,
        userId,
        threadId,
        onToken: (token) => {
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        },
        onDone: (result) => {
          res.write(`data: ${JSON.stringify({ type: 'done', threadId: result.threadId })}\n\n`);
          chatRequestsTotal.inc({ status: 'success', user_id: userId });
          res.end();
        },
      });
    } catch (err) {
      logger.error('Stream chat error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred' })}\n\n`);
      chatRequestsTotal.inc({ status: 'error', user_id: userId });
      res.end();
    }
    return;
  }

  // Standard request/response mode
  try {
    const result = await processMessage({ message, userId, threadId });
    chatRequestsTotal.inc({ status: 'success', user_id: userId });
    res.json({
      success: true,
      data: {
        response: result.response,
        threadId: result.threadId,
        usage: result.usage,
      },
    });
  } catch (err) {
    logger.error('Chat error:', err);
    chatRequestsTotal.inc({ status: 'error', user_id: userId });
    res.status(500).json({ error: 'Failed to process message. Please try again.' });
  }
});

// GET /api/chat/history/:threadId — Get conversation history
router.get('/history/:threadId', async (req, res) => {
  try {
    const memory = await getMemory(req.params.threadId);
    res.json({ success: true, data: { threadId: req.params.threadId, messages: memory } });
  } catch (err) {
    logger.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE /api/chat/history/:threadId — Clear conversation
router.delete('/history/:threadId', async (req, res) => {
  try {
    await clearMemory(req.params.threadId);
    res.json({ success: true, message: 'Conversation cleared' });
  } catch (err) {
    logger.error('History clear error:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;
