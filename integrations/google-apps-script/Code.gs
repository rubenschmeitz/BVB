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
 * 9. Add script property TURNSTILE_SECRET_KEY with your Cloudflare Turnstile secret.
 * 10. Copy the Web App URL and use it as the contact form action.
 */

const CONFIG = {
  notificationEmail: 'info@bonsai-brabant.nl', // Recipient for notifications
  sheetName: 'Contact Submissions',           // Name of the sheet to store data
  requiredFields: ['name', 'email', 'subject', 'message'],
  turnstileSecretKey: PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY') || '',
  turnstileExpectedAction: 'contact',
  turnstileAllowedHostnames: ['bonsai-brabant.nl', 'www.bonsai-brabant.nl'],
  allowedParentOrigins: ['https://bonsai-brabant.nl', 'https://www.bonsai-brabant.nl'],
  maxFieldLengths: {
    name: 100,
    email: 254,
    subject: 160,
    message: 4000
  },
  rateLimitWindowSeconds: 3600,
  rateLimitMaxSubmissions: 3
};

/**
 * Handle POST requests from the contact form
 */
function doPost(e) {
  const params = (e && e.parameter) || {};

  try {
    // 1. Validate the response channel used by the hidden iframe.
    const responseContext = getResponseContext(params);
    if (responseContext.mode === 'iframe' && !responseContext.valid) {
      return createContactResponse(
        responseContext,
        'error',
        'De bevestiging van het formulier kon niet veilig worden verwerkt.'
      );
    }

    // 2. Honeypot check (anti-spam). This is an explicit backend response,
    // but the submission is deliberately not stored or mailed.
    // If the 'website' field is filled, it's likely a bot.
    if (params.website && params.website.length > 0) {
      return createContactResponse(responseContext, 'success', 'Bericht ontvangen.');
    }

    // 3. Turnstile verification. Fail closed when token or secret is missing.
    const turnstileResponse = params['cf-turnstile-response'];
    const turnstileResult = verifyTurnstile(turnstileResponse, CONFIG.turnstileSecretKey);
    if (!turnstileResult.success) {
      return createContactResponse(
        responseContext,
        'error',
        turnstileResult.message || 'Beveiligingscontrole mislukt. Probeer het opnieuw.'
      );
    }

    // 4. Server-side validation.
    const errors = [];
    CONFIG.requiredFields.forEach(field => {
      if (!params[field] || params[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    if (params.email && !validateEmail(params.email)) {
      errors.push('Invalid email address');
    }

    Object.keys(CONFIG.maxFieldLengths).forEach(field => {
      if (params[field] && String(params[field]).length > CONFIG.maxFieldLengths[field]) {
        errors.push(`${field} is too long`);
      }
    });

    if (errors.length > 0) {
      return createContactResponse(
        responseContext,
        'error',
        'Controleer de ingevulde velden en probeer het opnieuw.',
        errors
      );
    }

    if (!isAllowedSubmission(params.email)) {
      return createContactResponse(
        responseContext,
        'error',
        'Te veel berichten in korte tijd. Probeer het later opnieuw.'
      );
    }

    // 5. Store in Google Sheet.
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

    // 6. Send email notification.
    sendEmailNotification(params);

    // 7. Return an explicit success response to the originating iframe.
    return createContactResponse(
      responseContext,
      'success',
      'Bericht succesvol verzonden! We nemen zo snel mogelijk contact met je op.'
    );

  } catch (error) {
    console.error('Contact form error: ' + error.toString());
    return createContactResponse(
      getResponseContext(params),
      'error',
      'Er ging iets mis. Probeer het later opnieuw.'
    );
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
  const cleanSubject = String(data.subject || '').replace(/[\r\n]+/g, ' ').slice(0, CONFIG.maxFieldLengths.subject);
  const subject = `Nieuw Contactformulier: ${cleanSubject}`;
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
 * Basic email-based rate limit for the public endpoint.
 */
function isAllowedSubmission(email) {
  const cache = CacheService.getScriptCache();
  const normalizedEmail = String(email || 'unknown').trim().toLowerCase();
  const key = 'contact_' + Utilities.base64EncodeWebSafe(normalizedEmail).slice(0, 80);
  const currentCount = Number(cache.get(key) || '0');

  if (currentCount >= CONFIG.rateLimitMaxSubmissions) {
    return false;
  }

  cache.put(key, String(currentCount + 1), CONFIG.rateLimitWindowSeconds);
  return true;
}

/**
 * Resolve whether this is the new hidden-iframe client or the legacy client.
 * Legacy JSON stays available so this version can be deployed before cutover.
 */
function getResponseContext(params) {
  const submissionId = String(params.submissionId || '').trim();
  const parentOrigin = String(params.parentOrigin || '').trim();
  const hasIframeFields = submissionId !== '' || parentOrigin !== '';

  if (!hasIframeFields) {
    return {
      mode: 'legacy',
      valid: true,
      submissionId: '',
      parentOrigin: ''
    };
  }

  return {
    mode: 'iframe',
    valid: isValidSubmissionId(submissionId) && CONFIG.allowedParentOrigins.indexOf(parentOrigin) !== -1,
    submissionId: submissionId,
    parentOrigin: parentOrigin
  };
}

function isValidSubmissionId(submissionId) {
  return /^[a-zA-Z0-9-]{16,120}$/.test(submissionId);
}

/**
 * Return a minimal HtmlService document that confirms the backend result with
 * postMessage. The old JSON response remains available for a safe staged cutover.
 */
function createContactResponse(context, status, message, errors = []) {
  const response = {
    source: 'bvb-contact',
    submissionId: context.submissionId || '',
    status: status,
    message: message
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  if (context.mode === 'iframe') {
    if (!context.valid) {
      return HtmlService
        .createHtmlOutput('<!doctype html><meta charset="utf-8"><title>Ongeldige aanvraag</title>')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    const payload = JSON.stringify(response)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
    const targetOrigin = JSON.stringify(context.parentOrigin);
    const html = '<!doctype html><meta charset="utf-8"><title>Contactbevestiging</title>' +
      '<script>parent.postMessage(' + payload + ',' + targetOrigin + ');</script>';

    return HtmlService
      .createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
    if (!secretKey) {
      return {
        success: false,
        message: 'Contactformulier is nog niet volledig beveiligd.'
      };
    }

    if (!token) {
      return {
        success: false,
        message: 'Beveiligingscontrole ontbreekt. Probeer het opnieuw.'
      };
    }

    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      muteHttpExceptions: true,
      payload: {
        secret: secretKey,
        response: token
      }
    });

    const result = JSON.parse(response.getContentText());
    if (result.success !== true) {
      return {
        success: false,
        message: 'Beveiligingscontrole mislukt. Probeer het opnieuw.'
      };
    }

    if (CONFIG.turnstileExpectedAction && result.action !== CONFIG.turnstileExpectedAction) {
      return {
        success: false,
        message: 'Beveiligingscontrole hoort niet bij dit formulier.'
      };
    }

    if (
      CONFIG.turnstileAllowedHostnames.length > 0 &&
      CONFIG.turnstileAllowedHostnames.indexOf(result.hostname) === -1
    ) {
      return {
        success: false,
        message: 'Beveiligingscontrole hoort niet bij deze website.'
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Turnstile verification error: ' + err.toString());
    return {
      success: false,
      message: 'Beveiligingscontrole kon niet worden uitgevoerd.'
    };
  }
}
