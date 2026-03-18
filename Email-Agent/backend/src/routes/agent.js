const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { sendToN8n } = require('../services/n8nClient');
const { processWithGroq } = require('../services/groqClient');
const { validateEmail } = require('../utils/validators');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

const messageSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
  sessionId: Joi.string().optional(),
});

const confirmSchema = Joi.object({
  sessionId: Joi.string().required(),
  confirmed: Joi.boolean().required(),
  emailData: Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().min(1).max(500).required(),
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

// POST /api/agent/confirm - Confirm and send email
router.post('/confirm', async (req, res) => {
  try {
    const { error, value } = confirmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, confirmed, emailData } = value;

    if (!confirmed) {
      return res.json({ success: true, data: { message: 'Email cancelled.', sent: false } });
    }

    if (!validateEmail(emailData.to)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    logger.info(`Sending confirmed email to ${emailData.to}`, { sessionId });

    // Try n8n (which has Gmail node), fall back to success acknowledgment
    try {
      const n8nResponse = await sendToN8n('/voice-agent-send', {
        sessionId,
        confirmed: true,
        emailData,
        timestamp: new Date().toISOString(),
      });
      res.json({ success: true, data: n8nResponse });
    } catch (n8nErr) {
      logger.warn(`n8n unavailable for sending (${n8nErr.message}). Sending via Gmail SMTP directly.`);

      // Send email directly via Nodemailer/Gmail SMTP
      const result = await sendEmail(emailData);
      res.json({ success: true, data: result });
    }
  } catch (err) {
    logger.error(`Email confirm failed: ${err.message}`);
    res.status(502).json({ error: 'Failed to process confirmation. Please try again.' });
  }
});

module.exports = router;
