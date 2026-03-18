const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis = null;
let redisAvailable = false;

// In-memory fallback when Redis is not running
const memoryStore = new Map();

function getRedisClient() {
  if (redis) return redis;

  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying after 3 attempts — use in-memory fallback
        logger.warn('Redis unavailable, using in-memory storage');
        redisAvailable = false;
        return null; // Stop retrying
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on('connect', () => {
    redisAvailable = true;
    logger.info('Redis connected');
  });

  redis.on('error', () => {
    // Suppress repeated error logs — handled by retryStrategy
  });

  return redis;
}

// Memory operations — uses Redis if available, in-memory Map otherwise
const MEMORY_PREFIX = 'chat:memory:';
const MAX_MESSAGES = 50;

async function getMemory(threadId) {
  if (redisAvailable) {
    try {
      const data = await redis.get(`${MEMORY_PREFIX}${threadId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      // Fall through to in-memory
    }
  }
  return memoryStore.get(threadId) || [];
}

async function saveMemory(threadId, messages) {
  const trimmed = messages.slice(-MAX_MESSAGES);

  if (redisAvailable) {
    try {
      await redis.set(`${MEMORY_PREFIX}${threadId}`, JSON.stringify(trimmed), 'EX', 86400 * 7);
      return;
    } catch {
      // Fall through to in-memory
    }
  }
  memoryStore.set(threadId, trimmed);
}

async function appendMessage(threadId, role, content) {
  const existing = await getMemory(threadId);
  existing.push({ role, content, timestamp: Date.now() });
  await saveMemory(threadId, existing);
}

async function clearMemory(threadId) {
  if (redisAvailable) {
    try {
      await redis.del(`${MEMORY_PREFIX}${threadId}`);
      return;
    } catch {
      // Fall through
    }
  }
  memoryStore.delete(threadId);
}

async function connectRedis() {
  const client = getRedisClient();
  try {
    await client.connect();
    redisAvailable = true;
    logger.info('Redis connection established');
  } catch {
    redisAvailable = false;
    logger.warn('Redis not available — using in-memory storage (chat history won\'t persist across restarts)');
  }
}

async function disconnectRedis() {
  if (redis) {
    try { await redis.quit(); } catch { /* ignore */ }
    redis = null;
  }
}

module.exports = {
  getRedisClient,
  getMemory,
  saveMemory,
  appendMessage,
  clearMemory,
  connectRedis,
  disconnectRedis,
};
