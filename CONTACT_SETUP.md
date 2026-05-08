# Contact Form Setup Guide

Follow these steps to connect your contact form to Google Sheets and enable email notifications.

## 1. Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Give it a name (e.g., "BVB Website Contact").

## 2. Set Up Apps Script
1. Inside your new Google Sheet, go to the top menu: **Extensions** > **Apps Script**.
2. A new tab will open with a code editor.
3. Delete any existing code and paste the content of the `js/backend_gas.gs` file found in your repository.
4. (Optional) In the code, check the `CONFIG` object at the top to ensure the email is correct: `info@bonsai-brabant.nl`.
5. Click the disk icon (Save) and name the project (e.g., "BVB Contact Backend").

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
1. Open `contact.html` in your code editor.
2. Find this line (around line 122):
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. Replace `'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'` with the URL you just copied.
4. Save the file and upload it to GitHub Pages.

## 5. Test
1. Go to your live website's contact page.
2. Fill out the form and click **Bericht Versturen**.
3. Check your Google Sheet; a new row should appear automatically.
4. Check the inbox of `info@bonsai-brabant.nl` for the notification.

---

### Security & Anti-Spam
- **Honeypot**: The form includes a hidden "Website" field. Bots usually fill this out, while humans don't see it. The script silently ignores submissions where this field is filled.
- **Validation**: Both the browser and the script check if the required fields are present and if the email format is correct.
- **Privacy**: No API keys or secrets are stored in the frontend code.

### Troubleshooting
- **No row in Sheet**: Ensure you deployed as "Anyone" and authorized the script.
- **No Email**: Check your spam folder. Google Apps Script emails sometimes land there initially.
- **CORS Errors**: The frontend uses `mode: 'no-cors'`. This is intentional to ensure the submission works across domains without complex server configuration.
