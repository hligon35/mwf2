/*** CONFIG: All your editable settings in one place ***/
const CONFIG = {
  toEmail: 'info@melawholefoodsva.com',       // Primary recipient
  ccEmail: 'hligon@getsparqd.com',            // Optional CC (comma-separated allowed)
  bccEmail: '',                                // Optional BCC for debugging
  fromAlias: '',                               // Leave blank to use default sender
  emailSubject: 'Message From MelaWholeFoodsVA.com', // Base subject
  sheetId: '1cRr4F2KAXCW0UM5FTdiotzzkriR2a8Zw2XCAX9TyCaY', // Optional: leave '' to disable logging
  sheetName: 'Sheet1',                        // Sheet tab name
  includeAllFieldsInEmail: true               // If true, include all submitted fields automatically
};

/***** Main handler for form submissions *****/
function doPost(e) {
  try {
    if (!e) return HtmlService.createHtmlOutput('OK');

    var p = e.parameter || {};

    // Honeypot anti-spam (matches hidden input name="website" on the site)
    if ((p.website || '').trim()) return HtmlService.createHtmlOutput('OK');

    // Read Title-Case fields sent by the site
    var name = (p.Name || '').trim();
    var email = (p.Email || '').trim();
    var phone = (p.Phone || '').trim();
    var topic = (p.Topic || '').trim();
    var message = (p.Message || '').trim();

    // Basic required fields check (align with site which requires Name, Email, Topic)
    if (!name || !email || !topic) {
      return HtmlService.createHtmlOutput('ERROR');
    }

    var to = CONFIG.toEmail;
    var cc = (CONFIG.ccEmail || '').trim();
  var subject = CONFIG.emailSubject + ' — ' + (topic || 'No topic') + ' — ' + new Date().toISOString();

    // Build HTML email body
    var bodyHtml;
    if (CONFIG.includeAllFieldsInEmail) {
      var rows = [];
      var skipKeys = { website: true };
      Object.keys(p).forEach(function(k){
        if (skipKeys[k]) return;
        var label = toTitleCase(k);
        rows.push('<tr><td style="padding:4px 8px;"><b>' + escapeHtml(label) + ':</b></td><td style="padding:4px 8px;">' + escapeHtml(p[k]) + '</td></tr>');
      });
      bodyHtml = [
        '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333">',
        '<div><b>New inquiry received from the website.</b></div>',
        '<table cellspacing="0" cellpadding="0" border="0" style="margin-top:8px">',
        rows.join(''),
        '</table>',
        '</div>'
      ].join('');
    } else {
      bodyHtml = [
        '<b>Name:</b> ' + escapeHtml(name),
        '<br><b>Email:</b> ' + escapeHtml(email),
        phone ? '<br><b>Phone:</b> ' + escapeHtml(phone) : '',
        '<br><b>Topic:</b> ' + escapeHtml(topic || '—'),
        message ? '<br><br><b>Message:</b><br>' + escapeHtml(message).replace(/\n/g, '<br>') : ''
      ].join('');
    }

    var bodyText = [
      'New inquiry received from the website.',
      'Name: ' + name,
      'Email: ' + email,
      (phone ? 'Phone: ' + phone : null),
      'Topic: ' + (topic || '—'),
      (message ? ('\nMessage:\n' + message) : null)
    ].filter(Boolean).join('\n');

    var emailOpts = {
      to: to,
      subject: subject,
      replyTo: email || to,
      name: 'Mela Whole Foods Website',
      htmlBody: bodyHtml,
      body: bodyText
    };
    if (cc) emailOpts.cc = cc;
    if ((CONFIG.bccEmail || '').trim()) emailOpts.bcc = CONFIG.bccEmail.trim();

  // Quick quota log (optional, visible in Executions logs)
  try { Logger.log('Remaining MailApp quota: %s', MailApp.getRemainingDailyQuota()); } catch (qErr) {}

  // Prefer GmailApp with alias if provided and available; fallback to MailApp
    var used = 'MailApp';
    if ((CONFIG.fromAlias || '').trim()) {
      try {
        var gmailOpts = Object.assign({}, emailOpts, { from: CONFIG.fromAlias.trim() });
        GmailApp.sendEmail(gmailOpts.to, gmailOpts.subject, gmailOpts.body, gmailOpts);
        used = 'GmailApp (alias)';
      } catch (aliasErr) {
        MailApp.sendEmail(emailOpts);
        used = 'MailApp (alias failover)';
      }
    } else {
      MailApp.sendEmail(emailOpts);
    }

    Logger.log('Email sent via %s to %s (cc: %s, bcc: %s) subject: %s', used, to, cc || '-', (CONFIG.bccEmail||'-'), subject);

    // Optional: log to a spreadsheet if configured
    if ((CONFIG.sheetId || '').trim()) {
      try {
        var ss = SpreadsheetApp.openById(CONFIG.sheetId);
        var sheet = ss.getSheetByName(CONFIG.sheetName) || ss.getSheets()[0];
        sheet.appendRow([
          new Date(), name, email, phone, topic, message
        ]);
      } catch (logErr) {
        // swallow logging errors to avoid breaking email flow
      }
    }

    return HtmlService.createHtmlOutput('OK');
  } catch (err) {
    // Logger.log(err);
    return HtmlService.createHtmlOutput('ERROR');
  }
}

// Simple GET responder so visiting the Web App shows a benign page
function doGet() {
  return HtmlService.createHtmlOutput('OK');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]);
  });
}

function toTitleCase(s) {
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, function(m){ return m.toUpperCase(); });
}

// One-time helper to trigger the permissions prompt for MailApp
function authorize() {
  MailApp.getRemainingDailyQuota();
}

// Quick manual test: run this in the editor to verify email delivery outside of form flow
function testEmail() {
  var to = CONFIG.toEmail;
  var cc = (CONFIG.ccEmail || '').trim();
  var subject = CONFIG.emailSubject + ' — Test';
  var bodyText = 'Test message from Apps Script.';
  var htmlBody = '<b>Test message</b> from Apps Script.';
  var opts = { to: to, subject: subject, name: 'Mela Whole Foods Website', body: bodyText, htmlBody: htmlBody };
  if (cc) opts.cc = cc;
  MailApp.sendEmail(opts);
  Logger.log('Test email sent to %s (cc: %s)', to, cc || '-');
}
