'use client'

import { useState } from 'react'

export default function DataDeletion() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')

  const handleDeleteRequest = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    setMessage('')

    try {
      const token = localStorage.getItem('sb-access-token')
      if (!token) {
        setMessage('Authentication required. Please log in again.')
        setIsDeleting(false)
        setShowConfirm(false)
        return
      }

      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Your data has been permanently deleted. You will be logged out shortly.')
        // Clear local storage and redirect after a delay
        setTimeout(() => {
          localStorage.clear()
          window.location.href = '/'
        }, 3000)
      } else {
        setMessage(data.error || 'Failed to delete data. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Data Retention Policy</h3>
        <p className="text-sm text-blue-700">
          Your data is retained until you request deletion. All samples, analyses, and associated files
          will be permanently removed from our systems. This action cannot be undone.
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-900 mb-2">Delete My Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete all your data from ProofStack, including uploaded samples,
          analysis results, and profile information.
        </p>

        {!showConfirm ? (
          <button
            onClick={handleDeleteRequest}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Request Data Deletion
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                All your samples, analyses, proofs, and profile data will be permanently deleted.
                You will lose access to your account and all associated content.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteRequest}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All My Data'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('error') || message.includes('Error') || message.includes('Failed')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}