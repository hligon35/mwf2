/**
 * Copy this entire file into your Google Apps Script project.
 * Then: Deploy > Manage deployments > New deployment > Web app
 * - Execute as: Me
 * - Who has access: Anyone
 * If the Exec URL changes, update your site form action in index.html.
 * First time using MailApp, run authorize() and accept permissions.
 */

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

    // Basic required fields check (server-side)
    if (!name || !email || !message) {
      return HtmlService.createHtmlOutput('ERROR');
    }

    var to = 'info@melawholefoodsva.com';
    var subject = 'New website inquiry: ' + (topic || 'No topic');

    var bodyHtml = [
      '<b>Name:</b> ' + escapeHtml(name),
      '<br><b>Email:</b> ' + escapeHtml(email),
      phone ? '<br><b>Phone:</b> ' + escapeHtml(phone) : '',
      '<br><b>Topic:</b> ' + escapeHtml(topic || '—'),
      '<br><br><b>Message:</b><br>',
      escapeHtml(message).replace(/\n/g, '<br>')
    ].join('');

    MailApp.sendEmail({
      to: to,
      subject: subject,
      replyTo: email || to,
      name: 'Mela Whole Foods Website',
      htmlBody: bodyHtml
    });

    // Optional: also log to a spreadsheet (uncomment and fill in your sheet ID/name)
    // var ss = SpreadsheetApp.openById('YOUR_SHEET_ID');
    // var sheet = ss.getSheetByName('Form Responses 1') || ss.getActiveSheet();
    // sheet.appendRow([new Date(), name, email, phone, topic, message]);

    return HtmlService.createHtmlOutput('OK');
  } catch (err) {
    // Logger.log(err);
    return HtmlService.createHtmlOutput('ERROR');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]);
  });
}

// One-time helper to trigger the permissions prompt for MailApp
function authorize() {
  MailApp.getRemainingDailyQuota();
}
