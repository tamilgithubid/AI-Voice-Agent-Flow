const twilio = require('twilio');
const logger = require('../utils/logger');

let client = null;

function getClient() {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env');
  }

  client = twilio(accountSid, authToken);
  return client;
}

function formatWhatsAppNumber(phone) {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Indian number if 10 digits
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

async function sendWhatsApp({ to, message }) {
  const twilioClient = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toFormatted = `whatsapp:${formatWhatsAppNumber(to)}`;

  logger.info(`Sending WhatsApp from ${from} to ${toFormatted}`);

  try {
    const result = await twilioClient.messages.create({
      from,
      to: toFormatted,
      body: message,
    });

    logger.info(`WhatsApp delivered: sid=${result.sid}, status=${result.status}`);

    return {
      message: `WhatsApp message sent to ${to}`,
      messageSid: result.sid,
      sent: true,
    };
  } catch (err) {
    // Provide clear error messages for common Twilio issues
    if (err.message?.includes('Channel')) {
      throw new Error(`WhatsApp sender number not configured. Go to Twilio Console → Messaging → Try WhatsApp to get your sandbox number, then update TWILIO_WHATSAPP_FROM in .env`);
    }
    if (err.code === 63007) {
      throw new Error(`Recipient ${to} hasn't joined the Twilio sandbox. They must send the join code to your Twilio WhatsApp number first.`);
    }
    throw err;
  }
}

module.exports = { sendWhatsApp, formatWhatsAppNumber };
