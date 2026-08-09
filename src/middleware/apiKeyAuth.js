'use strict';

/**
 * Api key authentication middleware
 * Client applications must send a valid x api key header
 * The header value must match service api key in environment
 * This design is intended for trusted server to server usage
 */
function apiKeyAuth(req, res, next) {
  const providedKey = req.header('x-api-key');
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    // Deny all requests when server secret configuration is missing
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

/**
 * Constant time string comparison for better security
 */
function timingSafeEqual(a, b) {
  const crypto = require('crypto');
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    // Run equal length comparison path to keep timing similar
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { apiKeyAuth };
