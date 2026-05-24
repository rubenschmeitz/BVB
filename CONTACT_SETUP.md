# Contact Form Setup Guide

Follow these steps to connect the contact form to Google Sheets, enable email notifications, and protect submissions with Cloudflare Turnstile.

> Security note: the Turnstile site key is public and belongs in `contact.html`. The Turnstile secret key is private and must only be stored in Google Apps Script Properties.

## 1. Create a Cloudflare Turnstile Widget
1. Log in to Cloudflare.
2. Go to **Turnstile** > **Add widget**.
3. Name it, for example `BVB Contact Form`.
4. Add the production hostname, for example `bonsai-brabant.nl`.
5. Add any extra hostname you actually use, for example `www.bonsai-brabant.nl`.
6. Choose the managed widget mode unless you have a reason to use invisible mode.
7. Save the widget.
8. Copy the **Site key** and **Secret key**.

## 2. Add the Site Key to the Website
1. Open `contact.html`.
2. Find:
   ```html
   data-sitekey="PASTE_TURNSTILE_SITE_KEY_HERE"
   ```
3. Replace `PASTE_TURNSTILE_SITE_KEY_HERE` with the Turnstile **Site key**.
4. Do not put the secret key in `contact.html`, `js/contact.js`, or any other committed file.

## 3. Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Give it a name (e.g., "BVB Website Contact").

## 4. Set Up Apps Script
1. Inside your new Google Sheet, go to the top menu: **Extensions** > **Apps Script**.
2. A new tab will open with a code editor.
3. Delete any existing code and paste the content of the `js/backend_gas.gs` file found in your repository.
4. In the code, check the `CONFIG` object at the top to ensure the email is correct: `info@bonsai-brabant.nl`.
5. Click the disk icon (Save) and name the project (e.g., "BVB Contact Backend").

## 5. Add the Secret Key to Apps Script
1. In Apps Script, open **Project Settings**.
2. Under **Script Properties**, click **Add script property**.
3. Add:
   - Property: `TURNSTILE_SECRET_KEY`
   - Value: your Cloudflare Turnstile **Secret key**
4. Save the property.

## 6. Deploy as Web App
1. Click the blue **Deploy** button > **New deployment**.
2. Select type: **Web app** (click the gear icon if not selected).
3. Fill in the details:
   - **Description**: BVB Contact Form
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**.
5. You may be asked to **Authorize access**. Click "Authorize access", choose your account, and if you see a "Google hasn't verified this app" warning, click **Advanced** > **Go to BVB Contact Backend (unsafe)**. This is normal for private scripts.
6. Click **Allow**.
7. **IMPORTANT**: Copy the **Web App URL** provided in the "Deployment details" window. It should look like `https://script.google.com/macros/s/.../exec`.

## 7. Link to Website
1. Open `contact.html`.
2. Confirm that the form `action` points to the copied Apps Script Web App URL.
3. If you redeploy Apps Script and Google gives you a new URL, replace the old URL in the form `action`.

## 8. Test
1. Publish the site or run it locally.
2. Open `contact.html`.
3. Confirm that the Turnstile widget appears.
4. Submit a test message.
5. Check that a new row appears in the Google Sheet.
6. Check that the notification email arrives at `info@bonsai-brabant.nl`.
7. If the form says the site key is missing, replace the placeholder in `contact.html`.
8. If Apps Script returns a security error, confirm that `TURNSTILE_SECRET_KEY` exists in Script Properties and matches the widget secret.

---

### Recommended Production Setup
For a future version, the cleanest setup is:
1. Host the site on Cloudflare Pages.
2. Add a small Pages Function for `/api/contact`.
3. Protect the form with Cloudflare Turnstile.
4. Store secrets as Cloudflare environment variables.
5. Send mail through a transactional provider such as Resend, Postmark, or MailChannels.

This avoids exposing a Google Apps Script URL as an open mail endpoint and gives you better spam controls, logs, and rate limiting.

### Security & Anti-Spam
- **Honeypot**: The form includes a hidden "Website" field. Bots usually fill this out, while humans don't see it. The script silently ignores submissions where this field is filled.
- **Turnstile**: The frontend sends a `cf-turnstile-response` token and Apps Script verifies it with Cloudflare before storing or emailing the submission.
- **Validation**: Both the browser and the script check if the required fields are present and if the email format is correct.
- **Privacy**: No API keys or secrets are stored in the frontend code.
- **Rate limiting**: Apps Script also applies basic email-based rate limiting.
- **Limitation**: Because Apps Script is called cross-origin with `no-cors`, the frontend cannot reliably read the JSON response. The backend still rejects bad submissions server-side, but for ideal UX and logging, consider moving this to Cloudflare Pages Functions later.

### Troubleshooting
- **No row in Sheet**: Ensure you deployed as "Anyone" and authorized the script.
- **No Email**: Check your spam folder. Google Apps Script emails sometimes land there initially.
- **Turnstile does not show**: Check the site key, hostname settings in Cloudflare, and the Content Security Policy in `contact.html`.
- **CORS Errors**: The frontend intentionally uses a simple `no-cors` POST for Apps Script. If you need readable responses, use a same-origin backend such as Cloudflare Pages Functions.
