'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Simple date formatter
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface Thread {
  id: string
  title: string
  content: string
  user_id: string
  is_locked: boolean
  view_count: number
  reply_count: number
  upvote_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string
    avatar_url?: string
    user_type: string
  }
  forum_user_stats: {
    forum_reputation: number
    reputation_tier: string
  }
}

interface Reply {
  id: string
  user_id: string
  content: string
  is_accepted_answer: boolean
  upvote_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string
    avatar_url?: string
    user_type: string
  }
  forum_user_stats: {
    forum_reputation: number
    reputation_tier: string
  }
}

export default function ThreadDetail() {
  const params = useParams()
  const threadId = params?.id as string | undefined

  if (!threadId) return null

  const [user, setUser] = useState<any | null>(null)

  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    fetchThreadData()
  }, [threadId])

  async function fetchUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  async function fetchThreadData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/forum/threads/${threadId}`)

      if (!response.ok) {
        setError('Thread not found')
        return
      }

      const data = await response.json()
      setThread(data.thread)
      setReplies(data.replies)
      setError(null)
    } catch (err) {
      console.error('Error fetching thread:', err)
      setError('Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in to reply')
      return
    }

    if (!replyContent.trim()) {
      setError('Reply cannot be empty')
      return
    }

    try {
      setSubmitting(true)
      const token = await supabase.auth.getSession()

      const response = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.data.session?.access_token || ''}`
        },
        body: JSON.stringify({
          content: replyContent
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to post reply')
        return
      }

      const newReply = await response.json()
      setReplies([...replies, newReply])
      setReplyContent('')
      setError(null)
    } catch (err) {
      console.error('Error submitting reply:', err)
      setError('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpvote(replyId: string) {
    if (!user) {
      setError('You must be logged in to upvote')
      return
    }

    try {
      const token = await supabase.auth.getSession()
      const response = await fetch(`/api/forum/replies/${replyId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.data.session?.access_token || ''}`
        }
      })

      if (response.ok) {
        // Refresh replies
        await fetchThreadData()
      }
    } catch (err) {
      console.error('Error upvoting:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !thread) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-red-600">Error: {error}</div>
        <Link href="/forum" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Forum
        </Link>
      </div>
    )
  }

  if (!thread) {
    return null
  }

  const tierColors: Record<string, string> = {
    'newcomer': 'bg-gray-100 text-gray-800',
    'active': 'bg-blue-100 text-blue-800',
    'expert': 'bg-purple-100 text-purple-800',
    'leader': 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Navigation */}
      <Link href="/forum" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to Forum
      </Link>

      {/* Thread */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{thread.title}</h1>

        {/* Thread Meta */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {thread.profiles.avatar_url && (
              <img
                src={thread.profiles.avatar_url}
                alt={thread.profiles.username}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{thread.profiles.username}</p>
              <p className="text-xs text-gray-500">{formatDate(thread.created_at)}</p>
            </div>
          </div>

          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${tierColors[thread.forum_user_stats.reputation_tier] || tierColors['newcomer']}`}>
            {thread.forum_user_stats.reputation_tier.charAt(0).toUpperCase() + thread.forum_user_stats.reputation_tier.slice(1)}
          </span>
        </div>

        {/* Thread Content */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{thread.content}</p>
        </div>

        {/* Thread Stats */}
        <div className="flex gap-6 text-sm text-gray-600">
          <div>{thread.view_count} Views</div>
          <div>{thread.reply_count} Replies</div>
          <div>{thread.upvote_count} Upvotes</div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{replies.length} Replies</h2>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`bg-white border-l-4 border-gray-200 rounded-lg p-6 ${
              reply.is_accepted_answer ? 'border-l-green-500 bg-green-50' : ''
            }`}
          >
            {/* Reply Meta */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {reply.profiles.avatar_url && (
                  <img
                    src={reply.profiles.avatar_url}
                    alt={reply.profiles.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{reply.profiles.username}</p>
                  <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {reply.is_accepted_answer && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    ✓ Accepted Answer
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierColors[reply.forum_user_stats.reputation_tier] || tierColors['newcomer']}`}>
                  {reply.forum_user_stats.reputation_tier.charAt(0).toUpperCase() + reply.forum_user_stats.reputation_tier.slice(1)}
                </span>
              </div>
            </div>

            {/* Reply Content */}
            <div className="prose max-w-none mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
            </div>

            {/* Reply Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleUpvote(reply.id)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                👍 {reply.upvote_count}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {thread.is_locked ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">This discussion is locked. No new replies can be added.</p>
        </div>
      ) : user ? (
        <form onSubmit={handleReplySubmit} className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Reply</h3>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Share your thoughts, experiences, or answer..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">Sign in to reply to this discussion</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
}
// Remove the duplicate import at the end of the file
// The import is already at the top
