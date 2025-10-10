"use client"
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']
const ALLOWED_FILE_TYPES = [
  'text/plain', 'application/pdf', 'application/zip', 'application/json',
  'image/png', 'image/jpeg', 'image/gif',
  'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm',
]

export default function UploadForm() {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File|null>(null)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('writing')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const user_id = userData.user?.id
    if (!user_id) return setMessage('Sign in first')

    try {
      if (!ALLOWED_TYPES.includes(type)) return setMessage('Invalid type selected')

      let uploadPayload: any = { user_id, type }
      let filename = 'demo.txt'
      let size_bytes = 0
      let content = ''
      let fileData: string | ArrayBuffer | null = null

      if (file) {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) return setMessage('File type not allowed')
        if (file.size > MAX_FILE_BYTES) return setMessage('File too large. Max 20 MB.')
        filename = file.name
        size_bytes = file.size
        const reader = new FileReader()
        reader.onload = async (ev) => {
          fileData = ev.target?.result || null
          uploadPayload = { ...uploadPayload, filename, size_bytes, content: '', fileData }
          await doUpload(uploadPayload)
        }
        reader.readAsDataURL(file)
        return
      } else {
        const encoder = new TextEncoder()
        size_bytes = encoder.encode(text).length
        if (size_bytes > MAX_FILE_BYTES) return setMessage('Sample too large. Max 20 MB.')
        content = text
        uploadPayload = { ...uploadPayload, filename, size_bytes, content }
        await doUpload(uploadPayload)
      }
    } catch (err: any) {
      setMessage(err.message || 'Upload error')
    }
  }

  async function doUpload(payload: any) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getAccessToken()}` },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Upload failed')
    setMessage('Uploaded. Analysis queued.')
    setText('')
    setFile(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setFile(f)
    setText('')
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
      setText('')
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
      <label className="block text-sm">Upload a sample (text or file)</label>
      <div className="flex gap-2 items-center mb-2">
        <label className="text-sm">Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border p-1">
          {ALLOWED_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div
        className="border-2 border-dashed rounded p-4 mb-2 text-center cursor-pointer bg-gray-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <span>Selected file: {file.name}</span>
        ) : (
          <span>Drag & drop a file here, or click to select</span>
        )}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept={ALLOWED_FILE_TYPES.join(',')}
        />
      </div>
      <label className="block text-sm">Or paste text sample</label>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setFile(null); }}
        className="w-full rounded border p-2 h-32"
        disabled={!!file}
        placeholder={file ? 'File selected, cannot paste text.' : 'Paste your sample here...'}
      />
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
