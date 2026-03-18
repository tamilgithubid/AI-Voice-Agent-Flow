const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { sendToN8n } = require('../services/n8nClient');
const { processWithGroq, smartCompose, chatWithGroq } = require('../services/groqClient');
const { validateEmail, validatePhone } = require('../utils/validators');
const { sendEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');

const router = express.Router();

const messageSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
  sessionId: Joi.string().optional(),
});

const confirmSchema = Joi.object({
  sessionId: Joi.string().required(),
  confirmed: Joi.boolean().required(),
  type: Joi.string().valid('email', 'whatsapp').default('email'),
  emailData: Joi.object({
    to: Joi.string().required(),
    subject: Joi.string().allow('').max(500).optional(),
    body: Joi.string().min(1).max(10000).required(),
  }).required(),
});

// POST /api/agent/message - Process voice text with AI
router.post('/message', async (req, res) => {
  try {
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, sessionId } = value;
    logger.info(`Processing message: "${text.substring(0, 50)}..."`, { sessionId });

    let result;

    // Try n8n first, fall back to direct Groq API
    try {
      result = await sendToN8n('/voice-agent', {
        text,
        sessionId: sessionId || `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
      logger.info('Processed via n8n');
    } catch (n8nErr) {
      logger.warn(`n8n unavailable (${n8nErr.message}), using direct Groq API`);
      result = await processWithGroq(text);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error(`Message processing failed: ${err.message}`);
    res.status(502).json({ error: 'Failed to process message. Please try again.' });
  }
});

// POST /api/agent/confirm - Confirm and send email or WhatsApp
router.post('/confirm', async (req, res) => {
  try {
    const { error, value } = confirmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, confirmed, type, emailData } = value;

    if (!confirmed) {
      const label = type === 'whatsapp' ? 'WhatsApp message' : 'Email';
      return res.json({ success: true, data: { message: `${label} cancelled.`, sent: false } });
    }

    // Validate recipient based on type
    if (type === 'whatsapp') {
      if (!validatePhone(emailData.to)) {
        return res.status(400).json({ error: 'Invalid phone number.' });
      }
    } else {
      if (!validateEmail(emailData.to)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }
    }

    logger.info(`Sending confirmed ${type} to ${emailData.to}`, { sessionId });

    if (type === 'whatsapp') {
      // Send WhatsApp via Twilio
      const result = await sendWhatsApp({
        to: emailData.to,
        message: emailData.body,
      });
      res.json({ success: true, data: result });
    } else {
      // Try n8n first, fall back to direct Gmail SMTP
      try {
        const n8nResponse = await sendToN8n('/voice-agent-send', {
          sessionId,
          confirmed: true,
          emailData,
          timestamp: new Date().toISOString(),
        });
        res.json({ success: true, data: n8nResponse });
      } catch (n8nErr) {
        logger.warn(`n8n unavailable (${n8nErr.message}). Sending via Gmail SMTP directly.`);
        const result = await sendEmail(emailData);
        res.json({ success: true, data: result });
      }
    }
  } catch (err) {
    logger.error(`Confirm failed: ${err.message}`);
    res.status(502).json({ error: err.message || 'Failed to process confirmation. Please try again.' });
  }
});

// POST /api/agent/chat - AI conversation with intent detection
const chatSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
  history: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required(),
    })
  ).max(20).default([]),
  sessionId: Joi.string().optional(),
});

router.post('/chat', async (req, res) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, history, sessionId } = value;
    logger.info(`Chat message: "${text.substring(0, 50)}..."`, { sessionId });

    const result = await chatWithGroq({ userText: text, history });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error(`Chat failed: ${err.message}`);
    res.status(502).json({ error: 'Failed to process chat. Please try again.' });
  }
});

// POST /api/agent/smart-compose - AI-enhance a message
router.post('/smart-compose', async (req, res) => {
  try {
    const { body, subject, type } = req.body;
    if (!body) {
      return res.status(400).json({ error: 'Message body is required' });
    }
    const result = await smartCompose({ body, subject: subject || '', type: type || 'email' });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Smart compose failed: ${err.message}`);
    res.status(502).json({ error: 'Failed to enhance message.' });
  }
});

module.exports = router;
