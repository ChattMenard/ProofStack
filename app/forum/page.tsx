'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  thread_count: number
  display_order: number
}

export default function ForumHome() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)
      const response = await fetch('/api/forum/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Forum</h1>
        <p className="text-gray-600">Ask questions, share knowledge, and connect with other professionals</p>
        
        <div className="mt-6 flex gap-4">
          <Link
            href="/forum/new"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start a Discussion
          </Link>
          
          <Link
            href="/forum/search"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Search Forum
          </Link>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No categories found</p>
          </div>
        ) : (
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/forum/categories/${category.slug}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{category.description}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-blue-600">{category.thread_count}</div>
                  <div className="text-sm text-gray-500">Discussion{category.thread_count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Forum Guidelines</h3>
        <ul className="text-gray-700 space-y-1 text-sm">
          <li>✓ Be respectful and professional in all discussions</li>
          <li>✓ Search before posting to avoid duplicates</li>
          <li>✓ Provide clear context and relevant code examples</li>
          <li>✓ Mark helpful replies and accepted answers</li>
        </ul>
      </div>
    </div>
  )
}
