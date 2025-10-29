'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Simple date formatter
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

interface Thread {
  id: string
  title: string
  content: string
  user_id: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  upvote_count: number
  created_at: string
  updated_at: string
  profiles: {
    username: string
    avatar_url?: string
  }
}

interface PaginationData {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
}

export default function CategoryView() {
  const params = useParams()
  const slug = params?.slug as string | undefined

  if (!slug) return null

  const [category, setCategory] = useState<Category | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategoryData()
  }, [slug, currentPage])

  async function fetchCategoryData() {
    try {
      setLoading(true)
      const url = `/api/forum/categories/${slug}?page=${currentPage}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Category not found')
        } else {
          setError('Failed to fetch category')
        }
        return
      }

      const data = await response.json()
      setCategory(data.category)
      setThreads(data.threads)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error('Error fetching category:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-red-600">Error: {error}</div>
        <Link href="/forum" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Forum
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <Link href="/forum" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to Forum
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
        
        <Link
          href={`/forum/new?category=${slug}`}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mt-4"
        >
          New Discussion
        </Link>
      </div>

      {/* Threads List */}
      <div className="space-y-3 mb-8">
        {threads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/threads/${thread.id}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.is_pinned && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Pinned</span>}
                    {thread.is_locked && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Locked</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                    {thread.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    by <span className="font-medium">{thread.profiles.username}</span> • {formatDate(thread.created_at)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-right whitespace-nowrap">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{thread.reply_count}</div>
                    <div className="text-xs text-gray-500">Replies</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{thread.view_count}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-600">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
            disabled={currentPage === pagination.total_pages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
