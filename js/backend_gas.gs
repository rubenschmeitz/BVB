/**
 * Google Apps Script Backend for Contact Form
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the default code with this script.
 * 4. Update the CONFIG section below.
 * 5. Click "Deploy" > "New Deployment".
 * 6. Select "Web App".
 * 7. Execute as: "Me".
 * 8. Who has access: "Anyone".
 * 9. Copy the Web App URL and paste it into your contact.html.
 */

const CONFIG = {
  notificationEmail: 'info@bonsai-brabant.nl', // Recipient for notifications
  sheetName: 'Contact Submissions',           // Name of the sheet to store data
  requiredFields: ['name', 'email', 'subject', 'message'],
  turnstileSecretKey: 'YOUR_TURNSTILE_SECRET_KEY' // Put your Cloudflare Turnstile Secret Key here
};

/**
 * Handle POST requests from the contact form
 */
function doPost(e) {
  try {
    // 1. Basic CORS handling (Apps Script doesn't support preflight, so we use a simple POST)
    const params = e.parameter;
    
    // 2. Honeypot check (Anti-spam)
    // If the 'website' field is filled, it's likely a bot.
    if (params.website && params.website.length > 0) {
      return createJsonResponse('success', 'Thank you for your submission (spam filtered).');
    }

    // 2b. Turnstile Verification (Anti-spam)
    const turnstileResponse = params['cf-turnstile-response'];
    if (CONFIG.turnstileSecretKey && CONFIG.turnstileSecretKey !== 'YOUR_TURNSTILE_SECRET_KEY') {
      if (!turnstileResponse || !verifyTurnstile(turnstileResponse, CONFIG.turnstileSecretKey)) {
        return createJsonResponse('error', 'Beveiligingscontrole mislukt. Probeer het opnieuw.');
      }
    }

    // 3. Server-side Validation
    const errors = [];
    CONFIG.requiredFields.forEach(field => {
      if (!params[field] || params[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    if (params.email && !validateEmail(params.email)) {
      errors.push('Invalid email address');
    }

    if (errors.length > 0) {
      return createJsonResponse('error', 'Validation failed', errors);
    }

    // 4. Store in Google Sheet
    const sheet = getOrCreateSheet();
    const timestamp = new Date();
    
    // Sanitize to prevent CSV Injection
    const sanitize = (val) => {
        if (!val) return '';
        const str = String(val);
        return /^[=\+\-@]/.test(str) ? "'" + str : str;
    };

    sheet.appendRow([
      timestamp,
      sanitize(params.name),
      sanitize(params.email),
      sanitize(params.subject),
      sanitize(params.message)
    ]);

    // 5. Send Email Notification
    sendEmailNotification(params);

    // 6. Return Success Response
    return createJsonResponse('success', 'Bericht succesvol verzonden! We nemen zo snel mogelijk contact met je op.');

  } catch (error) {
    return createJsonResponse('error', 'Server error: ' + error.toString());
  }
}

/**
 * Get the target sheet or create it if it doesn't exist
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message']);
    // Style the header row
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Send email notification to the association
 */
function sendEmailNotification(data) {
  const subject = `Nieuw Contactformulier: ${data.subject}`;
  const body = `
    Je hebt een nieuw bericht ontvangen via het contactformulier op bonsai-brabant.nl.

    Naam: ${data.name}
    E-mail: ${data.email}
    Onderwerp: ${data.subject}

    Bericht:
    ${data.message}

    ---
    Dit is een automatisch bericht verzonden door de Google Apps Script backend.
  `;

  MailApp.sendEmail({
    to: CONFIG.notificationEmail,
    subject: subject,
    body: body,
    replyTo: data.email
  });
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Create a JSON response for the frontend
 */
function createJsonResponse(status, message, errors = []) {
  const response = {
    status: status,
    message: message
  };
  
  if (errors.length > 0) {
    response.errors = errors;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Verify Cloudflare Turnstile token with Cloudflare's API
 */
function verifyTurnstile(token, secretKey) {
  try {
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: {
        secret: secretKey,
        response: token
      }
    });
    
    const result = JSON.parse(response.getContentText());
    return result.success === true;
  } catch (err) {
    // Fail-open: if Cloudflare is down or fetch fails, do not block genuine contact attempts
    console.error('Turnstile verification error: ' + err.toString());
    return true; 
  }
}
