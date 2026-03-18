const logger = require('../utils/logger');

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL?.replace('/voice-agent', '') || 'http://localhost:5678/webhook';

async function sendToN8n(webhookPath, payload) {
  const url = `${N8N_BASE_URL}${webhookPath}`;
  logger.info(`Sending request to n8n: ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendToN8n };
