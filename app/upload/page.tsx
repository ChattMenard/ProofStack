"use client"
import UploadForm from '../../components/UploadForm'

export default function UploadPage() {
  return (
    <div>
      <h2 className="text-xl font-medium text-forest-50">Upload Your Sample</h2>
      <p className="text-sm text-forest-300">Upload your code, project files, or paste content to analyze your skills with AI.</p>
      <div className="mt-4">
        <UploadForm />
      </div>
    </div>
  )
}
