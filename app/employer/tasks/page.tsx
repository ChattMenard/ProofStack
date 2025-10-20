'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'

interface Task {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  deadline: string
  skills_required: string[]
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  proposals_count: number
}

export default function EmployerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    loadTasks()
  }, [filter])

  async function loadTasks() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        proposals:task_proposals(count)
      `)
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading tasks:', error)
    } else {
      const tasksWithCount = (data as any[])?.map((task: any) => ({
        ...task,
        proposals_count: task.proposals?.[0]?.count || 0
      })) || []
      setTasks(tasksWithCount)
    }
    setLoading(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-green-500/20 text-green-400'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400'
      case 'completed':
        return 'bg-purple-500/20 text-purple-400'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-forest-800 text-forest-400'
    }
  }

  function formatBudget(min: number, max: number) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }

  function formatDeadline(deadline: string) {
    const date = new Date(deadline)
    const now = new Date()
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days < 0) return 'Expired'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days <= 7) return `${days} days`
    if (days <= 30) return `${Math.ceil(days / 7)} weeks`
    return `${Math.ceil(days / 30)} months`
  }

  return (
    <div className="min-h-screen bg-forest-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-50 mb-2">My Tasks</h1>
            <p className="text-forest-300">Manage your posted tasks and track proposals</p>
          </div>
          <Link
            href="/employer/tasks/new"
            className="px-6 py-3 bg-sage-600 hover:bg-sage-500 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Task
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                filter === status
                  ? 'bg-sage-600 text-white'
                  : 'bg-forest-900 text-forest-300 hover:bg-forest-800'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sage-500 border-t-transparent"></div>
            <p className="mt-4 text-forest-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            title="No tasks yet"
            description="Post your first task to start finding talented professionals who can help bring your projects to life."
            actionLabel="Post Your First Task"
            actionHref="/employer/tasks/new"
            showPlaceholders={true}
            placeholderCount={3}
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/employer/tasks/${task.id}`}
                className="block bg-forest-900 border border-forest-800 rounded-lg p-6 hover:border-sage-500 hover:shadow-lg hover:shadow-sage-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-forest-50">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-forest-400 mb-4">{task.description}</p>
                  </div>
                </div>

                {/* Skills Required */}
                {task.skills_required && task.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {task.skills_required.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-forest-800 text-sage-400 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-forest-800">
                  <div>
                    <p className="text-xs text-forest-500 mb-1">Budget</p>
                    <p className="text-sm font-semibold text-sage-400">
                      {formatBudget(task.budget_min, task.budget_max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-forest-500 mb-1">Deadline</p>
                    <p className="text-sm font-semibold text-forest-200">
                      {formatDeadline(task.deadline)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-forest-500 mb-1">Proposals</p>
                    <p className="text-sm font-semibold text-forest-200">
                      {task.proposals_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-forest-500 mb-1">Posted</p>
                    <p className="text-sm font-semibold text-forest-200">
                      {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
