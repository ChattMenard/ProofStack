"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Repo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string
  language: string
}

export default function GitHubSync() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchRepos = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      // Call API to fetch repos (we'll create this API)
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch repos')
      const data = await res.json()
      setRepos(data)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const importRepo = async (repo: Repo) => {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      const res = await fetch('/api/github/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ repo_url: repo.html_url })
      })
      if (!res.ok) throw new Error('Failed to import repo')
      setMessage(`Imported ${repo.full_name}`)
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch GitHub Repos'}
        </button>
      </div>
      {message && <p className="text-sm text-gray-700">{message}</p>}
      <div className="space-y-2">
        {repos.map((repo) => (
          <div key={repo.id} className="border p-4 rounded flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{repo.full_name}</h3>
              <p className="text-sm text-gray-600">{repo.description}</p>
              <p className="text-xs text-gray-500">Language: {repo.language}</p>
            </div>
            <button
              onClick={() => importRepo(repo)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Import
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}