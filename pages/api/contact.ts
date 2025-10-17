import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, subject, message, privacyConsent } = req.body

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (!privacyConsent) {
    return res.status(400).json({ error: 'Privacy consent is required' })
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  try {
    // In a real implementation, you would:
    // 1. Send email to support team
    // 2. Store in database for tracking
    // 3. Handle DMCA requests specially
    // 4. Send confirmation email to user

    // For now, we'll just log and respond
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
      timestamp: new Date().toISOString()
    })

    // Special handling for DMCA requests
    if (subject === 'DMCA Takedown Request') {
      // Log DMCA request for legal compliance
      console.log('DMCA REQUEST RECEIVED:', {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
      })

      // In production, this would trigger a legal review process
    }

    res.status(200).json({
      message: 'Message received successfully. We will respond within 24-48 hours.',
      referenceId: `REF-${Date.now()}`
    })

  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}