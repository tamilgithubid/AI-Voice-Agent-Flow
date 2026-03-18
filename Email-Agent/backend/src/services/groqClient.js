const logger = require('../utils/logger');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are Tamil AI Voice Agent — a smart voice assistant that helps users send emails AND WhatsApp messages.

DETECTION RULES:
- If user says "WhatsApp", "message", "text", or provides a phone number → WhatsApp action
- If user says "email", "mail", or provides an email address → Email action
- If ambiguous (no clear channel), ask for clarification via chat
- Phone numbers should be normalized to international format with country code (e.g., +91XXXXXXXXXX for India)

You must:
- Detect intent: send_email | draft_email | send_whatsapp | draft_whatsapp | chat
- For email: extract to (email), subject, body — improve body to be professional
- For WhatsApp: extract to (phone with country code), message — keep message natural/conversational
- If user doesn't provide contact info, use a reasonable placeholder and note in response

Return STRICT JSON only (no markdown, no extra text):
{
  "action": "send_email" | "draft_email" | "send_whatsapp" | "draft_whatsapp" | "chat",
  "actionType": "email" | "whatsapp" | "chat",
  "to": "email@example.com or +91XXXXXXXXXX",
  "subject": "Email subject (empty string for WhatsApp)",
  "body": "Email body or WhatsApp message",
  "response": "Brief spoken response to the user"
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

    const action = parsed.action || 'chat';
    const actionType = parsed.actionType || (action.includes('whatsapp') ? 'whatsapp' : action.includes('email') ? 'email' : 'chat');

    return {
      action,
      actionType,
      to: parsed.to || '',
      subject: parsed.subject || '',
      body: parsed.body || '',
      response: parsed.response || 'I processed your request.',
      requiresConfirmation: action !== 'chat',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// --- Smart Compose: Enhance message with AI ---
const COMPOSE_PROMPT = `You are a professional writing assistant. You will receive a raw message and a type (email or whatsapp).

Your job:
- For EMAIL: Make it professional, clear, and well-structured. Add proper greeting and sign-off. Fix grammar and spelling.
- For WHATSAPP: Keep it casual, friendly, and concise. Fix grammar but keep the conversational tone. Use natural language, no formal sign-offs.

Return STRICT JSON only:
{
  "enhanced": "The improved message text",
  "subject": "Improved subject line (email only, empty for whatsapp)",
  "changes": "Brief 1-line summary of what you improved"
}`;

async function smartCompose({ body, subject, type }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const userMsg = type === 'email'
    ? `Type: email\nSubject: ${subject}\nBody: ${body}`
    : `Type: whatsapp\nMessage: ${body}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
          { role: 'system', content: COMPOSE_PROMPT },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { enhanced: body, subject, changes: 'none' };
    }

    return {
      enhanced: parsed.enhanced || body,
      subject: parsed.subject || subject || '',
      changes: parsed.changes || 'No changes made',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// --- AI Chat: Conversational assistant with intent detection ---
const CHAT_SYSTEM_PROMPT = `You are Tamil AI Voice Agent — a smart, friendly AI assistant powered by Groq LLM.

You can do TWO things:
1. **Chat**: Answer questions, explain concepts, have conversations — like a knowledgeable AI assistant.
2. **Send messages**: Help users send emails and WhatsApp messages.

INTENT DETECTION — analyze the user's message and classify it:
- "chat" → user is asking a question, having a conversation, or wants information
- "send_email" → user wants to send an email (mentions "email", "mail", email address, or clearly wants to compose an email)
- "send_whatsapp" → user wants to send a WhatsApp message (mentions "WhatsApp", "message", "text", phone number)

RESPONSE RULES:
- Keep responses concise (2-3 sentences max) — this is a VOICE assistant, responses are spoken aloud
- Be natural and conversational, not robotic
- If the user asks for more detail, you can give a longer response
- Never use markdown, bullet points, or formatting — plain spoken text only
- If intent is send_email or send_whatsapp, respond with a brief acknowledgment like "Sure, let's compose that email!" or "Got it, let's send a WhatsApp message!"

Return STRICT JSON only (no markdown, no extra text):
{
  "intent": "chat" | "send_email" | "send_whatsapp",
  "response": "Your spoken response to the user"
}`;

async function chatWithGroq({ userText, history = [] }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }

  logger.info('Calling Groq Chat API');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  // Build messages array with conversation history
  const messages = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-20), // Keep last 20 messages for context
    { role: 'user', content: userText },
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        // If LLM didn't return JSON, treat it as a plain chat response
        return {
          intent: 'chat',
          response: content.trim(),
        };
      }
    }

    return {
      intent: parsed.intent || 'chat',
      response: parsed.response || content.trim(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { processWithGroq, smartCompose, chatWithGroq };
