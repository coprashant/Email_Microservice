# Email Microservice

A standalone, reusable Node.js/Express microservice that sends transactional
emails through the **Gmail API** (OAuth2), protected by a shared `x-api-key`
secret. Designed to be called by any number of your own applications
(web, mobile backends, other microservices).

## Features

- `POST /api/v1/send-email` — send plain text and/or HTML emails
- `GET /health` — lightweight health check for uptime monitors
- Custom `x-api-key` header authentication (constant-time comparison)
- `helmet` + `cors` + per-IP rate limiting on the send endpoint
- Uses the official `googleapis` client — no SMTP credentials needed
- Docker-ready, deploys cleanly to Render's Free Tier

---

## Project Structure

```
email-microservice/
├── server.js                      # Express app entrypoint
├── package.json
├── .env.example
├── .gitignore
├── Dockerfile
├── OAUTH_SETUP.md                 # How to get Gmail OAuth2 credentials
├── README.md
├── src/
│   ├── middleware/
│   │   └── apiKeyAuth.js          # x-api-key validation middleware
│   ├── routes/
│   │   └── email.routes.js        # POST /api/v1/send-email
│   ├── services/
│   │   └── gmail.service.js       # Gmail API OAuth2 client + send logic
│   └── utils/
│       └── validators.js          # Request payload validation
└── client-examples/
    └── EmailServiceClient.java    # Spring Boot RestTemplate example
```

---

## 1. Prerequisites

- Node.js 18+
- A Gmail account you're willing to send from
- Gmail API OAuth2 credentials — see **[OAUTH_SETUP.md](./OAUTH_SETUP.md)**
  for a full step-by-step walkthrough (Google Cloud Console + OAuth
  Playground)

---

## 2. Local Setup

```bash
git clone <your-repo-url>
cd email-microservice
npm install
cp .env.example .env
# edit .env and fill in GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
# GMAIL_REFRESH_TOKEN, GMAIL_USER_EMAIL, SERVICE_API_KEY
npm start
```

The server starts on `http://localhost:3000` by default.

Verify it's alive:

```bash
curl http://localhost:3000/health
# => { "status": "UP" }
```

---

## 3. API Reference

### `GET /health`

No auth required. Returns:

```json
{ "status": "UP" }
```

### `POST /api/v1/send-email`

Requires header: `x-api-key: <SERVICE_API_KEY>`

**Request body:**

| Field        | Type   | Required | Notes                                          |
|--------------|--------|----------|-------------------------------------------------|
| `to`         | string | ✅       | Single address or comma-separated list          |
| `subject`    | string | ✅       |                                                   |
| `body`       | string | ⚪        | Plain text body. At least one of body/html required |
| `html`       | string | ⚪        | HTML body. At least one of body/html required    |
| `senderName` | string | ⚪        | Display name; falls back to `DEFAULT_SENDER_NAME`|

**Example request:**

```bash
curl -X POST https://your-service.onrender.com/api/v1/send-email \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_service_api_key" \
  -d '{
    "to": "customer@example.com",
    "subject": "Welcome to DasKitta!",
    "body": "Hi there, welcome aboard.",
    "html": "<h1>Hi there</h1><p>Welcome aboard.</p>",
    "senderName": "DasKitta Support"
  }'
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Email sent successfully.",
  "data": { "messageId": "18c...", "threadId": "18c..." }
}
```

**Error responses:**

| Status | Meaning                                    |
|--------|---------------------------------------------|
| 400    | Validation error (missing/invalid fields)   |
| 401    | Missing `x-api-key` header                  |
| 403    | Invalid `x-api-key`                         |
| 429    | Rate limit exceeded                         |
| 502    | Gmail API call failed                       |
| 500    | Server misconfiguration                     |

---

## 4. Deploying to Render (Free Tier)

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Web Service**, connect your repo.
3. Environment: **Docker** (Render will detect the `Dockerfile`
   automatically), or choose **Node** and set:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add the environment variables from `.env.example` under **Environment**
   in the Render dashboard (do NOT commit `.env`).
5. Deploy. Render will assign a public HTTPS URL like
   `https://email-microservice.onrender.com`.
6. Optional: point an external uptime pinger (e.g. UptimeRobot,
   cron-job.org) at `GET /health` every 5–10 minutes to prevent the
   Free Tier service from spinning down due to inactivity.

### Local Docker

```bash
docker build -t email-microservice .
docker run -p 3000:3000 --env-file .env email-microservice
```

---

## 5. Security Notes

- `SERVICE_API_KEY` is a shared secret — only put it in **server-side**
  environments (other backends, CI jobs). Never embed it in a mobile app
  or public frontend JS bundle.
- Rotate `SERVICE_API_KEY` periodically; since it's a single static value,
  rotating it requires updating all client apps at the same time. For
  many independent client apps with different trust levels, consider
  extending `apiKeyAuth.js` to support multiple named keys.
- The Gmail scope requested in `OAUTH_SETUP.md` (`gmail.send`) is
  send-only — this service cannot read your inbox even if the refresh
  token were compromised, limiting blast radius. Still, treat
  `GMAIL_REFRESH_TOKEN` as a high-value secret.
- Gmail enforces its own daily sending caps (~500/day for a standard
  Gmail account, higher for Google Workspace). Plan volume accordingly
  or consider Workspace/SendGrid-class infra for high-volume sending.

---

## 6. Calling From Client Apps

See [`client-examples/EmailServiceClient.java`](./client-examples/EmailServiceClient.java)
for a Spring Boot (`RestTemplate`) example. The same request shape works
from any language — it's a plain JSON POST with an `x-api-key` header.

---

## License

MIT — use freely across your own applications.
