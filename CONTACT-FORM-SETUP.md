# Contact Form Setup Guide

This guide will help you set up the contact form to send emails directly to info@melawholefoodsva.com using your own server.

## Option 1: PHP Solution (Recommended for shared hosting)

### Requirements:
- PHP-enabled web server
- SMTP server access or server with sendmail configured

### Setup Steps:

1. **Upload Files:**
   - Upload `contact-handler.php` to your web server
   - Make sure the file is accessible at `/contact-handler.php`

2. **Configure Email Settings:**
   Edit `contact-handler.php` and update these variables:
   ```php
   $from_email = "noreply@yourdomain.com"; // Replace with your domain
   $smtp_host = "smtp.yourmailserver.com"; // Your SMTP server
   $smtp_username = "your-smtp-username"; // Your SMTP username
   $smtp_password = "your-smtp-password"; // Your SMTP password
   ```

3. **Update CORS Origin:**
   Replace `https://yourdomain.com` with your actual domain in the CORS header.

### For Advanced PHP (PHPMailer):

1. **Install PHPMailer via Composer:**
   ```bash
   composer require phpmailer/phpmailer
   ```

2. **Use contact-handler-phpmailer.php instead**
   - More reliable SMTP handling
   - Better error reporting
   - SSL/TLS support

## Option 2: Node.js Solution

### Requirements:
- Node.js server
- SMTP server access

### Setup Steps:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Settings:**
   Edit `contact-server.js` and update the config object:
   ```javascript
   const config = {
       toEmail: 'info@melawholefoodsva.com',
       fromEmail: 'noreply@yourdomain.com',
       smtpHost: 'smtp.yourmailserver.com',
       smtpPort: 587,
       smtpUser: 'your-smtp-username',
       smtpPass: 'your-smtp-password',
       allowedOrigin: 'https://yourdomain.com'
   };
   ```

3. **Start the Server:**
   ```bash
   npm start
   ```

4. **Update Form Action:**
   Change the form action to your Node.js server URL:
   ```html
   <form action="https://your-server.com/contact" method="POST">
   ```

## Option 3: Cloudflare Workers (Recommended for Cloudflare users)

### Setup Steps:

1. **Create a Cloudflare Worker:**
   - Go to Cloudflare Dashboard > Workers
   - Create a new worker
   - Copy the code from `cloudflare-worker.js`

2. **Configure EmailJS (or your preferred email service):**
   - Sign up at EmailJS.com
   - Create a service and template
   - Update the worker code with your EmailJS credentials

3. **Update Form Action:**
   Change the form action to your worker URL:
   ```html
   <form action="https://your-worker.your-subdomain.workers.dev" method="POST">
   ```

## SMTP Configuration Examples

### Gmail SMTP:
```
Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your-gmail@gmail.com
Password: your-app-password (not regular password)
```

### Outlook/Hotmail SMTP:
```
Host: smtp-mail.outlook.com
Port: 587
Security: STARTTLS
Username: your-email@outlook.com
Password: your-password
```

### Your Domain SMTP (most hosting providers):
```
Host: mail.yourdomain.com
Port: 587 or 465
Security: STARTTLS or SSL
Username: noreply@yourdomain.com
Password: your-email-password
```

## Security Considerations

1. **Environment Variables:**
   Store sensitive information like SMTP passwords in environment variables, not in code.

2. **Rate Limiting:**
   The solutions include basic rate limiting to prevent spam.

3. **Honeypot Protection:**
   All solutions include honeypot fields to catch spam bots.

4. **Input Validation:**
   All user inputs are validated and sanitized.

5. **CORS Protection:**
   Configure CORS to only allow requests from your domain.

## Testing

1. **Test the form on your website**
2. **Check that emails arrive at info@melawholefoodsva.com**
3. **Verify spam protection is working**
4. **Test error handling by submitting invalid data**

## Troubleshooting

### Common Issues:

1. **Emails not sending:**
   - Check SMTP credentials
   - Verify server can connect to SMTP server
   - Check spam folders

2. **CORS errors:**
   - Update the allowed origin in your handler
   - Make sure your domain matches exactly

3. **Form not submitting:**
   - Check browser console for JavaScript errors
   - Verify the form action URL is correct

### Debug Steps:

1. Check server logs for error messages
2. Test SMTP connection separately
3. Use browser developer tools to inspect network requests
4. Verify form field names match the handler expectations

## Maintenance

1. **Monitor email delivery rates**
2. **Keep dependencies updated**
3. **Review and update spam protection as needed**
4. **Backup configuration files**

## Support

If you need help with setup or encounter issues:
1. Check the server logs for specific error messages
2. Test with a simple email first
3. Verify all configuration values are correct
4. Consider using a transactional email service like SendGrid or Mailgun for better reliability
