const client = require('prom-client');

// Create a registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const chatRequestsTotal = new client.Counter({
  name: 'chat_requests_total',
  help: 'Total number of chat requests',
  labelNames: ['status', 'user_id'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

const aiResponseTime = new client.Histogram({
  name: 'ai_response_time_seconds',
  help: 'Time taken for AI to generate response',
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

const toolCallsTotal = new client.Counter({
  name: 'tool_calls_total',
  help: 'Total number of tool calls made',
  labelNames: ['tool_name', 'status'],
  registers: [register],
});

module.exports = {
  register,
  httpRequestDuration,
  chatRequestsTotal,
  activeConnections,
  aiResponseTime,
  toolCallsTotal,
};
