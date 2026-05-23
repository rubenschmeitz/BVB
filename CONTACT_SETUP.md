# Contact Form Setup Guide

Follow these steps to connect your contact form to Google Sheets and enable email notifications.

> Production note: the current public site is intentionally mailto-only through `contact.html` and `js/contact.js`. The Apps Script below is an optional backend template, not wired into the active frontend.

## 1. Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Give it a name (e.g., "BVB Website Contact").

## 2. Set Up Apps Script
1. Inside your new Google Sheet, go to the top menu: **Extensions** > **Apps Script**.
2. A new tab will open with a code editor.
3. Delete any existing code and paste the content of the `js/backend_gas.gs` file found in your repository.
4. (Optional) In the code, check the `CONFIG` object at the top to ensure the email is correct: `info@bonsai-brabant.nl`.
5. Add a script property named `TURNSTILE_SECRET_KEY` with your Cloudflare Turnstile secret key. Do not put this secret in frontend JavaScript or commit it to Git.
6. Click the disk icon (Save) and name the project (e.g., "BVB Contact Backend").

## 3. Deploy as Web App
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

## 4. Link to Website
The active website does not submit to this backend. To enable a real backend later, add a dedicated endpoint call in `js/contact.js`, add the matching Turnstile widget/token to `contact.html`, and keep the current mailto path as the fallback.

## 5. Test
1. Test the Apps Script endpoint separately with a valid Turnstile token.
2. Only wire it into the public contact page after that frontend token flow exists.
3. For the current public site, test that the contact form opens a pre-filled email to `info@bonsai-brabant.nl`.

---

### Recommended Production Setup
For the public website, the cleanest setup is:
1. Host the site on Cloudflare Pages.
2. Add a small Pages Function for `/api/contact`.
3. Protect the form with Cloudflare Turnstile.
4. Store secrets as Cloudflare environment variables.
5. Send mail through a transactional provider such as Resend, Postmark, or MailChannels.

This avoids exposing a Google Apps Script URL as an open mail endpoint and gives you better spam controls, logs, and rate limiting.

### Security & Anti-Spam
- **Honeypot**: The form includes a hidden "Website" field. Bots usually fill this out, while humans don't see it. The script silently ignores submissions where this field is filled.
- **Validation**: Both the browser and the script check if the required fields are present and if the email format is correct.
- **Privacy**: No API keys or secrets are stored in the frontend code.
- **Production recommendation**: Do not rely on the honeypot alone. Use Cloudflare Pages Functions with Cloudflare Turnstile, or another managed form service with server-side spam filtering. Store all secrets in hosting environment variables, never in frontend JavaScript or the public repository.
- **Rate limiting**: If you keep Google Apps Script, add server-side rate limiting, message length limits, and fail closed when Turnstile verification fails.

### Troubleshooting
- **No row in Sheet**: Ensure you deployed as "Anyone" and authorized the script.
- **No Email**: Check your spam folder. Google Apps Script emails sometimes land there initially.
- **CORS Errors**: The current frontend does not call Apps Script. If you add a backend call later, handle cross-domain submission in that implementation.
