'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Category {
  id: string
  name: string
  slug: string
}

function CreateThreadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<any | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(searchParams?.get('category') || '')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [router])

  async function checkUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/signin')
        return
      }
      setUser(authUser)
      await fetchCategories()
    } catch (err) {
      router.push('/auth/signin')
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch('/api/forum/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data)

      // Set first category as default if not specified
      if (!searchParams?.get('category') && data.length > 0) {
        setCategoryId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    if (content.length < 20) {
      setError('Content must be at least 20 characters')
      return
    }

    if (!categoryId) {
      setError('Please select a category')
      return
    }

    try {
      setSubmitting(true)

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        setError('Authentication failed. Please sign in again.')
        return
      }

      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: categoryId,
          title,
          content
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create thread')
        return
      }

      const newThread = await response.json()

      // Redirect to new thread
      router.push(`/forum/threads/${newThread.id}`)
    } catch (err) {
      console.error('Error creating thread:', err)
      setError('Failed to create thread. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a Discussion</h1>
        <p className="text-gray-600">Ask a question or share knowledge with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            maxLength={255}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/255</p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
            Description *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide context, details, and any relevant code or examples..."
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{content.length} characters (min 20)</p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for a great post:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Be specific and descriptive in your title</li>
            <li>✓ Include relevant code snippets or examples</li>
            <li>✓ Explain what you've already tried</li>
            <li>✓ Ask a clear question or state your topic</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Discussion'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CreateThread() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
      <CreateThreadContent />
    </Suspense>
  )
}
