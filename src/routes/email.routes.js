'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { validateSendEmailPayload } = require('../utils/validators');
const { sendEmail } = require('../services/gmail.service');

const router = express.Router();

// Rate limiting per client ip to reduce abuse risk
// Tune limits based on workload and provider quotas
const sendEmailLimiter = rateLimit({
  windowMs: 60 * 1000, // one minute window
  max: 30, // max requests per ip in each window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

/**
 * Post endpoint to send transactional email through gmail api
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

    // Return provider error detail when available without internal traces
    const gmailErrorMessage = err?.errors?.[0]?.message || err?.response?.data?.error?.message;

    return res.status(502).json({
      success: false,
      error: 'Failed to send email via Gmail API.',
      details: gmailErrorMessage || undefined,
    });
  }
});

module.exports = router;
