'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { validateSendEmailPayload } = require('../utils/validators');
const { sendEmail } = require('../services/gmail.service');

const router = express.Router();

// Basic per-IP rate limiting to protect the Gmail account from abuse.
// Adjust to taste; Gmail's own sending limits are the ultimate ceiling
// (roughly 500 emails/day for a standard Gmail account).
const sendEmailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

/**
 * POST /api/v1/send-email
 * Protected by x-api-key. Sends a transactional email via Gmail API.
 */
router.post('/send-email', apiKeyAuth, sendEmailLimiter, async (req, res) => {
  const { valid, errors } = validateSendEmailPayload(req.body);

  if (!valid) {
    return res.status(400).json({ success: false, errors });
  }

  const { to, subject, body, html, senderName } = req.body;

  try {
    const result = await sendEmail({ to, subject, body, html, senderName });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully.',
      data: {
        messageId: result.id,
        threadId: result.threadId,
      },
    });
  } catch (err) {
    console.error('[POST /api/v1/send-email] Failed to send email:', err?.message || err);

    // Surface Gmail API error details when available without leaking
    // internal stack traces to callers.
    const gmailErrorMessage = err?.errors?.[0]?.message || err?.response?.data?.error?.message;

    return res.status(502).json({
      success: false,
      error: 'Failed to send email via Gmail API.',
      details: gmailErrorMessage || undefined,
    });
  }
});

module.exports = router;
