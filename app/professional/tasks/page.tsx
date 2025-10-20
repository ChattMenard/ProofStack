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
  employer_id: string
  organization: {
    name: string
    logo_url?: string
  }
  proposals_count: number
}

export default function TaskMarketplacePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my_skills'>('all')
  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    loadTasks()
    loadMySkills()
  }, [filter])

  async function loadMySkills() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', user.id)
      .single()

    if (profile?.skills) {
      setSkills(profile.skills)
    }
  }

  async function loadTasks() {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select(`
        *,
        organization:organizations(name, logo_url),
        proposals:task_proposals(count)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error loading tasks:', error)
    } else {
      const tasksWithCount = (data as any[])?.map((task: any) => ({
        ...task,
        proposals_count: task.proposals?.[0]?.count || 0
      })) || []

      // Filter by my skills if selected
      if (filter === 'my_skills' && skills.length > 0) {
        const filtered = tasksWithCount.filter((task: any) => 
          task.skills_required?.some((skill: string) => 
            skills.some(mySkill => 
              mySkill.toLowerCase() === skill.toLowerCase()
            )
          )
        )
        setTasks(filtered)
      } else {
        setTasks(tasksWithCount)
      }
    }
    setLoading(false)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-50 mb-2">Task Marketplace</h1>
          <p className="text-forest-300">Browse and apply for projects from verified employers</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-sage-600 text-white'
                  : 'bg-forest-900 text-forest-300 hover:bg-forest-800'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilter('my_skills')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'my_skills'
                  ? 'bg-sage-600 text-white'
                  : 'bg-forest-900 text-forest-300 hover:bg-forest-800'
              }`}
            >
              Matching My Skills
            </button>
          </div>
          
          <div className="ml-auto text-forest-400">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} available
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sage-500 border-t-transparent"></div>
            <p className="mt-4 text-forest-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title={filter === 'my_skills' ? 'No matching tasks yet' : 'No tasks available yet'}
            description={
              filter === 'my_skills'
                ? 'No tasks match your skills right now. Try browsing all tasks or update your profile skills.'
                : 'Be the first professional ready when employers post their first tasks!'
            }
            actionLabel={filter === 'my_skills' ? 'View All Tasks' : undefined}
            onAction={filter === 'my_skills' ? () => setFilter('all') : undefined}
            showPlaceholders={true}
            placeholderCount={6}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/professional/tasks/${task.id}`}
                className="block bg-forest-900 border border-forest-800 rounded-lg p-6 hover:border-sage-500 hover:shadow-lg hover:shadow-sage-500/10 transition-all group"
              >
                {/* Employer Info */}
                <div className="flex items-center gap-3 mb-4">
                  {task.organization?.logo_url ? (
                    <img 
                      src={task.organization.logo_url} 
                      alt={task.organization.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-forest-800 flex items-center justify-center">
                      <span className="text-forest-400 font-semibold">
                        {task.organization?.name?.[0] || 'E'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-200 truncate">
                      {task.organization?.name || 'Employer'}
                    </p>
                    <p className="text-xs text-forest-500">
                      {formatDeadline(task.deadline)} left
                    </p>
                  </div>
                </div>

                {/* Task Title */}
                <h3 className="text-lg font-semibold text-forest-50 mb-2 group-hover:text-sage-400 transition-colors">
                  {task.title}
                </h3>

                {/* Task Description */}
                <p className="text-sm text-forest-400 mb-4 line-clamp-3">
                  {task.description}
                </p>

                {/* Skills Required */}
                {task.skills_required && task.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {task.skills_required.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-forest-800 text-sage-400 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {task.skills_required.length > 3 && (
                      <span className="px-2 py-1 bg-forest-800 text-forest-400 text-xs rounded-full">
                        +{task.skills_required.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-forest-800">
                  <div className="text-sage-400 font-semibold">
                    {formatBudget(task.budget_min, task.budget_max)}
                  </div>
                  <div className="text-xs text-forest-500">
                    {task.proposals_count} {task.proposals_count === 1 ? 'proposal' : 'proposals'}
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
