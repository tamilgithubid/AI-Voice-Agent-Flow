function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  // Accepts: +91XXXXXXXXXX, +1XXXXXXXXXX, 10-15 digits with optional +
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}

module.exports = { validateEmail, validatePhone };
