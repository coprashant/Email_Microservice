'use strict';

const { google } = require('googleapis');

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER_EMAIL,
  DEFAULT_SENDER_NAME,
} = process.env;

// Redirect uri matches oauth playground flow documented in setup guide
// It is used to build oauth client and not used for runtime redirects
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

let oAuth2Client = null;

/**
 * Build and cache oauth2 client for gmail api requests
 * Throw clear error when required environment values are missing
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
 * Encode mail header value to support utf 8 content safely
 */
function encodeHeaderValue(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

/**
 * Build raw mime message and encode using base64url for gmail api
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
    // Multipart alternative includes both html and plain text versions
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
 * Send email through gmail api as configured service account user
 * Param object includes to subject body html and sendername fields
 * Returns promise containing id and threadid values
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
