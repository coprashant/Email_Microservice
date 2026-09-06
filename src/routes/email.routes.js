'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { validateSendEmailPayload } = require('../utils/validators');
const { sendEmail } = require('../services/gmail.service');

const router = express.Router();

const sendEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

router.post('/send-email', apiKeyAuth, sendEmailLimiter, async (req, res) => {
  const { valid, errors } = validateSendEmailPayload(req.body);

  if (!valid) {
    return res.status(400).json({ success: false, errors });
  }

  const { account, to, subject, body, html, senderName } = req.body;

  try {
    const result = await sendEmail({ account, to, subject, body, html, senderName });

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

    const gmailErrorMessage = err?.errors?.[0]?.message || err?.response?.data?.error?.message;

    return res.status(502).json({
      success: false,
      error: 'Failed to send email via Gmail API.',
      details: gmailErrorMessage || undefined,
    });
  }
});

module.exports = router;