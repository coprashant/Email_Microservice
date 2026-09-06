'use strict';

function apiKeyAuth(req, res, next) {
  const providedKey = req.header('x-api-key');
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    console.error('[apiKeyAuth] SERVICE_API_KEY is not set in the environment.');
    return res.status(500).json({
      success: false,
      error: 'Server misconfiguration: SERVICE_API_KEY is not set.',
    });
  }

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing x-api-key header.',
    });
  }

  if (!timingSafeEqual(providedKey, expectedKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key.',
    });
  }

  return next();
}

function timingSafeEqual(a, b) {
  const crypto = require('crypto');
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { apiKeyAuth };