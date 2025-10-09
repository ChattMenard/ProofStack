"use client"
import UploadForm from '../../components/UploadForm'

export default function UploadPage() {
  return (
    <div>
      <h2 className="text-xl font-medium">Upload a demo sample</h2>
      <p className="text-sm text-gray-600">Paste a short text sample and click Upload to queue analysis (demo).</p>
      <div className="mt-4">
        <UploadForm />
      </div>
    </div>
  )
}
