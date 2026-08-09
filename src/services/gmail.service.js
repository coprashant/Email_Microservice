'use strict';

const { google } = require('googleapis');

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER_EMAIL,
  DEFAULT_SENDER_NAME,
} = process.env;

// Using the "out of band" redirect URI matches the OAuth Playground
// flow described in OAUTH_SETUP.md. It is only used to construct the
// OAuth2 client; it is never actually redirected to at runtime since
// we already have a long-lived refresh token.
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

let oAuth2Client = null;

/**
 * Lazily builds (and caches) the OAuth2 client used to authorize
 * Gmail API requests. Throws a clear error if required env vars
 * are missing so misconfiguration fails fast and loudly.
 */
function getOAuth2Client() {
  if (oAuth2Client) return oAuth2Client;

  const missing = [];
  if (!GMAIL_CLIENT_ID) missing.push('GMAIL_CLIENT_ID');
  if (!GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET');
  if (!GMAIL_REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN');
  if (!GMAIL_USER_EMAIL) missing.push('GMAIL_USER_EMAIL');

  if (missing.length > 0) {
    throw new Error(
      `Gmail service is missing required environment variable(s): ${missing.join(', ')}`
    );
  }

  oAuth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  return oAuth2Client;
}

/**
 * Encodes a header value (e.g. the Subject or the display name in
 * From/To) so it safely supports UTF-8 characters per RFC 2047.
 */
function encodeHeaderValue(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

/**
 * Builds a raw RFC 2822 MIME message and base64url-encodes it,
 * which is the format the Gmail API's messages.send expects.
 */
function buildRawMessage({ to, subject, body, html, senderName }) {
  const fromDisplayName = senderName || DEFAULT_SENDER_NAME || 'No-Reply';
  const fromHeader = `${encodeHeaderValue(fromDisplayName)} <${GMAIL_USER_EMAIL}>`;
  const subjectHeader = encodeHeaderValue(subject);

  const messageParts = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subjectHeader}`,
    'MIME-Version: 1.0',
  ];

  let mimeBody;

  if (html && body) {
    // multipart/alternative: email clients will render html if they
    // can, and fall back to the plain-text version otherwise.
    const boundary = `boundary_${Date.now().toString(16)}`;
    messageParts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    mimeBody = [
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      body,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      `--${boundary}--`,
    ].join('\r\n');
  } else if (html) {
    messageParts.push('Content-Type: text/html; charset="UTF-8"');
    mimeBody = `\r\n${html}`;
  } else {
    messageParts.push('Content-Type: text/plain; charset="UTF-8"');
    mimeBody = `\r\n${body}`;
  }

  const rawMessage = `${messageParts.join('\r\n')}\r\n${mimeBody}`;

  return Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email through the Gmail API on behalf of GMAIL_USER_EMAIL.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient address (or comma-separated list)
 * @param {string} params.subject
 * @param {string} [params.body] - Plain text body
 * @param {string} [params.html] - HTML body
 * @param {string} [params.senderName] - Display name to use as sender
 * @returns {Promise<{ id: string, threadId: string }>}
 */
async function sendEmail({ to, subject, body, html, senderName }) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const raw = buildRawMessage({ to, subject, body, html, senderName });

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return {
    id: response.data.id,
    threadId: response.data.threadId,
  };
}

module.exports = { sendEmail, getOAuth2Client };
