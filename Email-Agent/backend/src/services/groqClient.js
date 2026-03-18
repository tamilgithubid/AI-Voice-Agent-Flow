const logger = require('../utils/logger');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an AI assistant that helps users send emails. You must detect intent and extract email details.

You must:
- Detect intent: send_email | draft_email | chat
- Extract: recipient (email address), subject, body
- Improve content to be professional
- If the user doesn't provide a specific email address, use a reasonable placeholder and note it in the response

Return STRICT JSON only (no markdown, no extra text):
{
  "action": "send_email" | "draft_email" | "chat",
  "to": "email@example.com",
  "subject": "Email subject",
  "body": "Professional email body",
  "response": "Brief response to the user"
}`;

async function processWithGroq(userText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }

  logger.info('Calling Groq API directly');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userText },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from Groq response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse Groq response as JSON');
      }
    }

    return {
      action: parsed.action || 'chat',
      to: parsed.to || '',
      subject: parsed.subject || '',
      body: parsed.body || '',
      response: parsed.response || 'I processed your request.',
      requiresConfirmation: parsed.action === 'send_email' || parsed.action === 'draft_email',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { processWithGroq };
