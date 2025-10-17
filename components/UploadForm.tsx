"use client"
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']
const ALLOWED_FILE_TYPES = [
  'text/plain', 'application/pdf', 'application/zip', 'application/json',
  'image/png', 'image/jpeg', 'image/gif',
  'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm',
]

// Keywords that might indicate employer-owned content
const EMPLOYER_KEYWORDS = [
  'confidential', 'proprietary', 'internal', 'company', 'corporate',
  'client', 'customer', 'project', 'assignment', 'work', 'job',
  'employer', 'contract', 'nda', 'non-disclosure'
]

export default function UploadForm() {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File|null>(null)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('writing')
  const [employerConsent, setEmployerConsent] = useState(false)
  const [showEmployerWarning, setShowEmployerWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if content might be employer-owned
  useEffect(() => {
    const content = text || (file ? file.name : '')
    const lowerContent = content.toLowerCase()
    const hasEmployerKeywords = EMPLOYER_KEYWORDS.some(keyword =>
      lowerContent.includes(keyword)
    )
    setShowEmployerWarning(hasEmployerKeywords)
    if (!hasEmployerKeywords) {
      setEmployerConsent(false) // Reset if warning is hidden
    }
  }, [text, file])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    // Check employer consent if warning is shown
    if (showEmployerWarning && !employerConsent) {
      setMessage('Please confirm that this content is not employer-owned or you have permission to share it.')
      return
    }

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

      {showEmployerWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Potential Employer-Owned Content Detected
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                Your content appears to contain terms that may indicate it's owned by your employer
                or created as part of your job. Please ensure you have permission to share this content
                and that it doesn't violate any agreements.
              </p>
              <div className="flex items-center">
                <input
                  id="employer-consent"
                  type="checkbox"
                  checked={employerConsent}
                  onChange={(e) => setEmployerConsent(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="employer-consent" className="ml-2 text-sm text-yellow-800">
                  I confirm this content is not employer-owned or I have explicit permission to share it
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

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
