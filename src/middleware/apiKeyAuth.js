'use strict';

/**
 * apiKeyAuth
 * -----------
 * Simple shared-secret authentication middleware.
 * Client applications must send a valid `x-api-key` header
 * matching SERVICE_API_KEY (set in the environment) to invoke
 * protected endpoints.
 *
 * This is intentionally simple (a single static secret) since
 * the microservice is meant to be called only by trusted,
 * server-side applications you control — never expose this
 * key to a browser/mobile client directly.
 */
function apiKeyAuth(req, res, next) {
  const providedKey = req.header('x-api-key');
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    // Fail closed: if the service itself isn't configured correctly,
    // refuse all requests rather than silently allowing them through.
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
 * Constant-time string comparison to avoid leaking information
 * via response-time side channels.
 */
function timingSafeEqual(a, b) {
  const crypto = require('crypto');
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal-length buffers to keep timing
    // roughly consistent, then return false.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { apiKeyAuth };
