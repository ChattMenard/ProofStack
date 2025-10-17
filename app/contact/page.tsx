'use client'

import { useState } from 'react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">General Inquiries</h2>
            <p className="text-gray-600 mb-4">
              Have questions about ProofStack or need help with your account?
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> support@proofstack.com</p>
              <p><strong>Response time:</strong> 24-48 hours</p>
            </div>
          </div>

          {/* DMCA Takedown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">DMCA Takedown Request</h2>
            <p className="text-gray-600 mb-4">
              If you believe your copyrighted work has been infringed on our platform,
              please submit a DMCA takedown request.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> dmca@proofstack.com</p>
              <p><strong>Required information:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Your contact information</li>
                <li>Description of copyrighted work</li>
                <li>Location of infringing material</li>
                <li>Statement of good faith belief</li>
                <li>Statement of accuracy under penalty of perjury</li>
                <li>Your physical or electronic signature</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
          <ContactForm />
        </div>

        {/* Data Protection Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-medium text-blue-900 mb-2">Data Protection & Privacy</h3>
          <p className="text-sm text-blue-700 mb-3">
            We take your privacy seriously. All communications are encrypted and handled
            in accordance with our Privacy Policy.
          </p>
          <p className="text-sm text-blue-700">
            For data deletion requests, please visit your dashboard settings or contact
            our support team directly.
          </p>
        </div>
      </div>
    </div>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
    privacyConsent: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitMessage('Thank you! Your message has been sent successfully.')
        setFormData({
          name: '',
          email: '',
          subject: 'General Inquiry',
          message: '',
          privacyConsent: false
        })
      } else {
        setSubmitMessage(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject *
        </label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>General Inquiry</option>
          <option>Technical Support</option>
          <option>DMCA Takedown Request</option>
          <option>Data Deletion Request</option>
          <option>Privacy Concern</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Please provide details about your inquiry..."
        />
      </div>

      <div className="flex items-center">
        <input
          id="privacy-consent"
          name="privacyConsent"
          type="checkbox"
          required
          checked={formData.privacyConsent}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="privacy-consent" className="ml-2 text-sm text-gray-700">
          I agree to the processing of my personal data in accordance with the{' '}
          <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>

      {submitMessage && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          submitMessage.includes('error') || submitMessage.includes('Error') || submitMessage.includes('Failed')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {submitMessage}
        </div>
      )}
    </form>
  )
}