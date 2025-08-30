// Cloudflare Worker for handling contact form submissions
// Deploy this to Cloudflare Workers and use the worker URL as your form action

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://melawholefoodsva.com', // Replace with your domain
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse form data
    const formData = await request.formData()
    
    // Honeypot spam protection
    if (formData.get('website')) {
      return new Response(JSON.stringify({ error: 'Spam detected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract and validate form fields
    const name = formData.get('name')?.trim()
    const email = formData.get('email')?.trim()
    const topic = formData.get('topic')?.trim()
    const message = formData.get('message')?.trim()

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

    // Create email content
    const emailContent = `
New submission from MelaWholeFoodsVA.com:

Name: ${name}
Email: ${email}
Topic: ${topic}

Message:
${message}

---
Submitted: ${new Date().toISOString()}
IP Address: ${request.headers.get('CF-Connecting-IP')}
User Agent: ${request.headers.get('User-Agent')}
    `

    // Send email using Cloudflare Email Workers API or your preferred email service
    // For this example, we'll use a webhook to send the email
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'YOUR_EMAILJS_SERVICE_ID', // Replace with your EmailJS service ID
        template_id: 'YOUR_EMAILJS_TEMPLATE_ID', // Replace with your EmailJS template ID
        user_id: 'YOUR_EMAILJS_USER_ID', // Replace with your EmailJS user ID
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
      throw new Error('Failed to send email')
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
