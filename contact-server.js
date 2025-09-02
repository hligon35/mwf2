const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

// Configuration - UPDATE THESE VALUES
const config = {
    toEmail: 'info@melawholefoodsva.com',
    fromEmail: 'noreply@melawholefoodsva.com',
    smtpHost: 'smtp.yourmailserver.com',
    smtpPort: 587,
    smtpUser: 'your-smtp-username',
    smtpPass: 'your-smtp-password',
    allowedOrigin: 'https://melawholefoodsva.com' // Your website domain
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: config.allowedOrigin,
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// Rate limiting - 5 submissions per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many requests, please try again later' }
});

app.use('/contact', limiter);

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.smtpUser,
        pass: config.smtpPass
    }
});

// Validation function
function validateInput(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Valid email is required');
    }
    
    if (!data.topic || data.topic.trim().length === 0) {
        errors.push('Topic is required');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters');
    }
    
    return errors;
}

// Contact form endpoint
app.post('/contact', async (req, res) => {
    try {
        // Honeypot spam protection
        if (req.body.website) {
            return res.status(400).json({ error: 'Spam detected' });
        }
        
        // Validate input
        const errors = validateInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        
        const { name, email, topic, message } = req.body;
        
        // Create email content
        const mailOptions = {
            from: config.fromEmail,
            to: config.toEmail,
            replyTo: email,
            subject: 'New Contact Form Submission - Mela Whole Foods',
            text: `
New contact form submission from Mela Whole Foods website:

Name: ${name}
Email: ${email}
Topic: ${topic}

Message:
${message}

---
Submitted: ${new Date().toISOString()}
IP Address: ${req.ip}
User Agent: ${req.get('User-Agent')}
            `
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: 'Message sent successfully' });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Contact Form Handler' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Contact form server running on port ${PORT}`);
});

module.exports = app;
