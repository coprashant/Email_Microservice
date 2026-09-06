# Email Microservice

A production ready Nodejs Express microservice for transactional email delivery using the Gmail API and OAuth2 authentication.

## Overview

This service is intended for backend to backend communication and provides a stable API for sending plain text and HTML emails across single or multiple sending accounts. It includes request validation, shared secret authentication, secure headers, CORS controls, and rate limiting.

## Key Capabilities

- Send transactional email through Gmail API
- Multi-account support with dynamic profile selection
- Support plain text body and HTML body
- Health endpoint for monitoring and uptime checks
- API key protection with constant time comparison
- Docker support for container based deployment
- Clean integration model for multiple client applications

## Technology Stack

- Nodejs
- Express
- Google APIs client
- Helmet
- CORS
- Express rate limit

## Project Structure

```text
OTP By Email
server.js
src
  middleware
    apiKeyAuth.js
  routes
    email.routes.js
  services
    gmail.service.js
  utils
    validators.js
client-examples
  EmailServiceClient.java
Dockerfile
OAUTH_SETUP.md
README.md
```

## Prerequisites

- Nodejs version 18 or later
- Gmail account(s) for sending emails
- Gmail OAuth2 credentials

For credential setup steps, refer to [OAUTH_SETUP.md](OAUTH_SETUP.md).

## Local Setup

```bash
git clone <repository-url>
cd OTP_By_Email
npm install
cp .env.example .env
npm start
```

Default local URL

```text
http://localhost:3000
```

## Environment Variables

Use [.env.example](.env.example) as the reference template.

### Multi-Account Configuration (Recommended)

To support multiple Gmail accounts or sender profiles in a single microservice instance, define `GMAIL_ACCOUNTS` as a JSON string:

```env
GMAIL_ACCOUNTS='{
  "otp_service": {
    "clientId": "CLIENT_ID_1",
    "clientSecret": "SECRET_1",
    "refreshToken": "REFRESH_TOKEN_1",
    "userEmail": "auth@yourdomain.com",
    "senderName": "Auth Team"
  },
  "billing_service": {
    "clientId": "CLIENT_ID_2",
    "clientSecret": "SECRET_2",
    "refreshToken": "REFRESH_TOKEN_2",
    "userEmail": "billing@yourdomain.com",
    "senderName": "Billing Dept"
  }
}'
```

### Legacy Single-Account Configuration (Fallback)

Required variables for single account setup:

- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- GMAIL_REFRESH_TOKEN
- GMAIL_USER_EMAIL

### Other Variables

- SERVICE_API_KEY (Required)
- DEFAULT_SENDER_NAME (Optional default sender display name)
- ALLOWED_ORIGINS (Optional CORS origins configuration)

## API Endpoints

### GET /health

Returns service status.

Example response

```json
{
  "status": "UP"
}
```

### POST /api/v1/send-email

Required request header

```text
x-api-key: SERVICE_API_KEY
```

Request body fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| account | string | no | Target account key defined in `GMAIL_ACCOUNTS` (defaults to "default" or first account) |
| to | string | yes | Recipient email or comma separated list |
| subject | string | yes | Subject line |
| body | string | no | Plain text content |
| html | string | no | HTML content |
| senderName | string | no | Display name for sender |

At least one of body or html is required.

Example Request Body (Multi-Account)

```json
{
  "account": "billing_service",
  "to": "customer@example.com",
  "subject": "Invoice Receipt",
  "html": "<h1>Thank you for your payment!</h1>"
}
```

## Running with Docker

```bash
docker build -t email-microservice .
docker run -p 3000:3000 --env-file .env email-microservice
```

## Security and Operations

- Keep SERVICE_API_KEY in server side systems only
- Never commit .env files to source control
- Rotate service secrets on a defined schedule
- Monitor health endpoint and API error rates
- Respect Gmail provider sending limits for your account

## Client Integration Example

Spring Boot example client is available at [client-examples/EmailServiceClient.java](client-examples/EmailServiceClient.java).

## Developer

Prasant Bhattarai
prasant-bhattarai.com.np

## License

MIT
