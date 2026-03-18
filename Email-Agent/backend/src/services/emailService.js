const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail({ to, subject, body }) {
  const transport = getTransporter();
  const from = process.env.GMAIL_USER;

  logger.info(`Sending email from ${from} to ${to} | Subject: ${subject}`);

  const info = await transport.sendMail({
    from: `"Voice Email Agent" <${from}>`,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  });

  logger.info(`Email delivered: messageId=${info.messageId}`);

  return {
    message: `Email sent successfully to ${to}`,
    messageId: info.messageId,
    sent: true,
  };
}

module.exports = { sendEmail };
