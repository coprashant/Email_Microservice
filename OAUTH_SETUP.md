# Gmail API OAuth2 Setup Guide

This microservice authenticates to Gmail as **your own Gmail account** using
OAuth2, then uses the Gmail API to send mail on your behalf. You need three
values: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN`.
This guide walks through obtaining all three, one time, using the Google
Cloud Console and the Google OAuth Playground.

> You only need to do this once. The refresh token does not expire under
> normal use (it can be revoked manually, or invalidated if you change your
> Google account password or leave the app in "Testing" status for 7 days —
> see Step 5 for how to avoid that).

---

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/).
2. Click the project dropdown (top-left) → **New Project**.
3. Name it something like `email-microservice` → **Create**.
4. Make sure the new project is selected in the top project dropdown.

---

## Step 2 — Enable the Gmail API

1. In the left sidebar, go to **APIs & Services → Library**.
2. Search for **Gmail API**.
3. Click it, then click **Enable**.

---

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **User Type: External** (works fine even if only you will use it)
   → **Create**.
3. Fill in the required fields:
   - App name: `Email Microservice`
   - User support email: your Gmail address
   - Developer contact email: your Gmail address
4. Click **Save and Continue** through the Scopes screen (no changes
   needed here — you'll authorize the scope directly in the Playground in
   Step 5).
5. On the **Test users** screen, click **Add Users** and add the Gmail
   address you intend to send from (i.e. `GMAIL_USER_EMAIL`).
6. Save and continue to finish.

> While the app is in "Testing" mode, refresh tokens can expire after 7
> days of the app being untouched. To avoid this long-term, go to the
> OAuth consent screen and click **Publish App**. Since you're the only
> user, you can safely publish without submitting for Google verification
> (verification is only required if you request sensitive/restricted
> scopes at large scale — a single self-used sending account is fine).

---

## Step 4 — Create OAuth2 Client Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Email Microservice Client`.
5. Under **Authorized redirect URIs**, click **Add URI** and enter exactly:
   ```
   https://developers.google.com/oauthplayground
   ```
6. Click **Create**.
7. Copy the **Client ID** and **Client Secret** shown in the dialog.
   These are your `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`.

---

## Step 5 — Generate a Refresh Token via OAuth Playground

1. Go to [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground/).
2. Click the **gear/settings icon** (top-right).
3. Check **Use your own OAuth credentials**.
4. Paste in your `Client ID` and `Client Secret` from Step 4.
5. Close the settings panel.
6. In the left panel ("Step 1 — Select & authorize APIs"), scroll down (or
   search) for **Gmail API v1**, and select this scope:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
   (This is the minimal scope needed — it only allows sending mail, not
   reading your inbox.)
7. Click **Authorize APIs**.
8. Sign in with the same Gmail account you added as a test user in Step 3,
   and approve the consent screen (you may see an "unverified app"
   warning — this is expected for a personal/internal app; click
   **Advanced → Go to Email Microservice (unsafe)** to proceed).
9. You'll be redirected back to the Playground with an authorization code
   already filled in ("Step 2 — Exchange authorization code for tokens").
   Click **Exchange authorization code for tokens**.
10. You'll now see a **Refresh token** and an **Access token** field. Copy
    the **Refresh token** value — this is your `GMAIL_REFRESH_TOKEN`.

> The access token shown here is short-lived and NOT needed — the
> microservice uses the refresh token to automatically mint new access
> tokens as needed via the `googleapis` library.

---

## Step 6 — Fill In Your `.env` File

You should now have all four Gmail-related values:

```env
GMAIL_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxxxxx
GMAIL_REFRESH_TOKEN=1//xxxxxxxx
GMAIL_USER_EMAIL=your-account@gmail.com
```

Also set a strong random `SERVICE_API_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy that output into `SERVICE_API_KEY` in your `.env` file.

---

## Troubleshooting

- **`invalid_grant` error when sending**: Your refresh token was revoked
  or expired. Regenerate it by repeating Step 5. Publishing the app
  (Step 3 note) prevents the 7-day testing-mode expiry.
- **`insufficient permission` / 403 error**: Double-check you authorized
  the `gmail.send` scope in Step 5, and that the account you authorized
  as matches `GMAIL_USER_EMAIL`.
- **"This app isn't verified" screen**: Expected for personal-use OAuth
  apps in Testing/unverified state. Click **Advanced → Go to (app
  name) (unsafe)** — this is safe since it's your own app and your own
  Google account.
- **Emails landing in Spam**: This is a Gmail-account-level deliverability
  concern, not specific to this service. Consider setting up SPF/DKIM if
  you're sending from a Google Workspace custom domain, and avoid
  spam-trigger content/volume.
