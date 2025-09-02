/*** CONFIG: All your editable settings in one place ***/
const CONFIG = {
  toEmail: 'info@melawholefoodsva.com',       // Primary recipient
  ccEmail: 'hligon@getsparqd.com',            // Optional CC (comma-separated allowed)
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
    var subject = CONFIG.emailSubject + ' — ' + (topic || 'No topic');

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

    var emailOpts = {
      to: to,
      subject: subject,
      replyTo: email || to,
      name: 'Mela Whole Foods Website',
      htmlBody: bodyHtml
    };
    if (cc) emailOpts.cc = cc;
    MailApp.sendEmail(emailOpts);

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
