'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the incoming send-email payload.
 * Returns { valid: boolean, errors: string[] }
 */
function validateSendEmailPayload(payload = {}) {
  const errors = [];
  const { to, subject, body, html, senderName } = payload;

  if (!to || typeof to !== 'string') {
    errors.push('"to" is required and must be a string.');
  } else {
    // Supports a single address or a comma-separated list
    const recipients = to.split(',').map((addr) => addr.trim());
    const invalid = recipients.filter((addr) => !EMAIL_REGEX.test(addr));
    if (invalid.length > 0) {
      errors.push(`"to" contains invalid email address(es): ${invalid.join(', ')}`);
    }
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push('"subject" is required and must be a non-empty string.');
  }

  if (!body && !html) {
    errors.push('At least one of "body" (plain text) or "html" must be provided.');
  }

  if (body !== undefined && typeof body !== 'string') {
    errors.push('"body" must be a string.');
  }

  if (html !== undefined && typeof html !== 'string') {
    errors.push('"html" must be a string.');
  }

  if (senderName !== undefined && typeof senderName !== 'string') {
    errors.push('"senderName" must be a string.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateSendEmailPayload, EMAIL_REGEX };
