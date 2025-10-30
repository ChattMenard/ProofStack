"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Repo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string
  language: string
}

interface Challenge {
  id: string
  repo_url: string
  challenge: string
  status: 'pending' | 'verified' | 'failed'
  created_at: string
}

export default function GitHubSync() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [proofLoading, setProofLoading] = useState(false)
  const [provider, setProvider] = useState<'github'|'gitlab'|'azure'|'gitbucket'>('github')
  const [identifier, setIdentifier] = useState('')

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

  const createChallenge = async (repo: Repo) => {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      const res = await fetch('/api/github/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ repo_url: repo.html_url })
      })
      if (!res.ok) throw new Error('Failed to create challenge')
      const challenge = await res.json()
      setChallenges(prev => [...prev, challenge])
      setMessage(`Challenge created for ${repo.full_name}. Add this file to your repo: proofstack-challenge-${challenge.challenge}.txt`)
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  const verifyChallenge = async (challenge: Challenge) => {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      const res = await fetch('/api/github/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ challenge_id: challenge.id })
      })
      if (!res.ok) throw new Error('Failed to verify challenge')
      const result = await res.json()
      setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, status: result.verified ? 'verified' : 'failed' } : c))
      setMessage(result.verified ? 'Challenge verified!' : 'Challenge verification failed')
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  const verifyAccount = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      const auth_uid = session.session.user?.id
      const body: any = { provider, auth_uid }
      // provider-specific identifier usage
      if (provider === 'gitlab') body.projectPath = identifier || undefined
      else if (provider === 'azure') {
        // expect identifier like org/project/repo or prompt user to provide structured input
        const parts = (identifier || '').split('/')
        body.organization = parts[0]
        body.project = parts[1]
        body.repo = parts[2]
      } else {
        body.username = identifier
      }

      const res = await fetch('/api/verify/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Verification failed')
      const result = await res.json()
      setMessage(result.verified ? 'Account verified' : 'Account not verified')
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const compileProof = async () => {
    setProofLoading(true)
    setMessage('')
    setProofPreview(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Not authenticated')

      const res = await fetch('/api/professional/compile-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`
        }
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to compile proof')
      }

      const result = await res.json()
      setMessage(result.success ? 'Compiled proof created' : 'Compile finished with issues')
      if (result.content_preview) setProofPreview(result.content_preview)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setProofLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-sm">Provider</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="github">GitHub</option>
          <option value="gitlab">GitLab</option>
          <option value="azure">Azure DevOps</option>
          <option value="gitbucket">GitBucket</option>
        </select>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={provider === 'azure' ? 'org/project/repo' : provider === 'gitlab' ? 'group/project (projectPath)' : 'username'} className="border rounded px-2 py-1 ml-2" />
        <button onClick={verifyAccount} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Verify Account</button>
        <button
          onClick={() => { window.location.href = `/api/auth/${provider}/start` }}
          className="ml-2 bg-sky-600 text-white px-3 py-1 rounded text-sm"
        >
          Connect Provider
        </button>
      </div>
      <div>
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 mr-2"
        >
          {loading ? 'Loading...' : 'Fetch GitHub Repos'}
        </button>
        <button
          onClick={compileProof}
          disabled={proofLoading || loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {proofLoading ? 'Compiling...' : 'Compile Proof'}
        </button>
      </div>
      {message && <p className="text-sm text-gray-700">{message}</p>}
      {proofPreview && (
        <div className="mt-4 p-3 border rounded bg-white">
          <h4 className="font-semibold mb-2">Proof Preview</h4>
          <pre className="whitespace-pre-wrap text-xs text-gray-800">{proofPreview}</pre>
        </div>
      )}
      <div className="space-y-2">
        {repos.map((repo) => (
          <div key={repo.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{repo.full_name}</h3>
                <p className="text-sm text-gray-600">{repo.description}</p>
                <p className="text-xs text-gray-500">Language: {repo.language}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => importRepo(repo)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Import
                </button>
                <button
                  onClick={() => createChallenge(repo)}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
                >
                  Verify Ownership
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {challenges.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Ownership Challenges</h3>
          <div className="space-y-2">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="border p-3 rounded bg-gray-50">
                <p className="text-sm">
                  <strong>Repo:</strong> {challenge.repo_url}<br/>
                  <strong>Status:</strong> <span className={`font-medium ${
                    challenge.status === 'verified' ? 'text-green-600' :
                    challenge.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>{challenge.status}</span><br/>
                  <strong>File to create:</strong> <code>proofstack-challenge-{challenge.challenge}.txt</code>
                </p>
                {challenge.status === 'pending' && (
                  <button
                    onClick={() => verifyChallenge(challenge)}
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Verify Challenge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}