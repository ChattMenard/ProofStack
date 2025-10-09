"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_TEXT_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

export default function UploadForm() {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('writing')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
  const { data: userData } = await supabase.auth.getUser()
  const user_id = userData.user?.id
  if (!user_id) return setMessage('Sign in first')

    try {
  if (!ALLOWED_TYPES.includes(type)) return setMessage('Invalid type selected')

  const encoder = new TextEncoder()
  const bytes = encoder.encode(text).length
  if (bytes > MAX_TEXT_BYTES) return setMessage('Sample too large. Max 5 MB.')

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getAccessToken()}` },
        body: JSON.stringify({ user_id, type, filename: 'demo.txt', storage_url: null, source_url: null, size_bytes: bytes, hash: null, content: text })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Upload failed')
      setMessage('Uploaded. Analysis queued.')
      setText('')
    } catch (err: any) {
      setMessage(err.message || 'Upload error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
      <label className="block text-sm">Paste text sample</label>
      <div className="flex gap-2 items-center mb-2">
        <label className="text-sm">Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border p-1">
          {ALLOWED_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <textarea required value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border p-2 h-32" />
      <div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Upload sample</button>
      </div>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}

async function getAccessToken() {
  try {
    const { data } = await (await import('../lib/supabaseClient')).supabase.auth.getSession()
    // the above returns { data: { session } }
    // handle both shapes
    const session = (data as any)?.session ?? (data as any)
    return session?.access_token ?? ''
  } catch (e) {
    return ''
  }
}
