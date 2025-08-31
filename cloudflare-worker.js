// Cloudflare Worker for handling contact form submissions
// Deploy to Cloudflare Workers. You can keep your website posting to Google Apps Script for Sheets
// and set this Worker as a secondary endpoint to ensure email delivery.

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function buildCorsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = [
    'https://melawholefoodsva.com',
    'https://www.melawholefoodsva.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ]
  const allowOrigin = allowed.includes(origin) ? origin : 'https://melawholefoodsva.com'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

async function handleRequest(request) {
  const corsHeaders = buildCorsHeaders(request)

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse JSON body or multipart form-data
    let payload = {}
    const contentType = request.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else if (contentType.includes('form')) {
      const fd = await request.formData()
      for (const [k, v] of fd.entries()) {
        payload[k] = typeof v === 'string' ? v : ''
      }
    }

    // Honeypot spam protection (support both 'website' and 'Website')
    if ((payload.website || payload.Website || '').toString().trim() !== '') {
      return new Response(JSON.stringify({ error: 'Spam detected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Support both lowercase and capitalized field names from the site
    const getField = (obj, names) => {
      for (const n of names) {
        if (obj[n] != null) return String(obj[n]).trim()
      }
      return ''
    }

    const name = getField(payload, ['name', 'Name'])
    const email = getField(payload, ['email', 'Email'])
    const topic = getField(payload, ['topic', 'Topic'])
    const message = getField(payload, ['message', 'Message'])
    const phone = getField(payload, ['phone', 'Phone'])

    // Validation
    const errors = []
    if (!name || name.length < 2) errors.push('Name is required')
    if (!email || !isValidEmail(email)) errors.push('Valid email is required')
    if (!topic) errors.push('Topic is required')
    if (!message || message.length < 10) errors.push('Message must be at least 10 characters')

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const emailContent = `
New submission from MelaWholeFoodsVA.com:

Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Topic: ${topic}

Message:
${message}

---
Submitted: ${new Date().toISOString()}
IP Address: ${request.headers.get('CF-Connecting-IP')}
User Agent: ${request.headers.get('User-Agent')}
    `

    // Send email via EmailJS (replace with your credentials or switch to SendGrid/Mailgun/Resend)
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'YOUR_EMAILJS_SERVICE_ID',
        template_id: 'YOUR_EMAILJS_TEMPLATE_ID',
        user_id: 'YOUR_EMAILJS_USER_ID',
        template_params: {
          to_email: 'info@melawholefoodsva.com',
          from_name: name,
          from_email: email,
          subject: 'New Submission from MelaWholeFoodsVA.com',
          message: emailContent
        }
      })
    })

    if (!emailResponse.ok) {
      const text = await emailResponse.text().catch(() => '')
      throw new Error(`Failed to send email: ${emailResponse.status} ${text}`)
    }

    return new Response(JSON.stringify({ success: true, message: 'Message sent successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
