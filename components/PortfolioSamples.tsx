'use client'

import { useState } from 'react'
import UploadForm from './UploadForm'

interface Sample {
  id: string
  type: string
  title: string
  filename: string
  storage_url?: string
  created_at: string
  display_order?: number
  analyses?: Array<{
    id: string
    status: string
    summary?: string
    result?: any
    skills?: any
    metrics?: any
  }>
}

interface PortfolioSamplesProps {
  samples: Sample[]
  isOwner: boolean
  onReorder?: (samples: Sample[]) => void
  onRefresh?: () => void
}

export default function PortfolioSamples({ samples, isOwner, onReorder, onRefresh }: PortfolioSamplesProps) {
  const [expandedSample, setExpandedSample] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localSamples, setLocalSamples] = useState(samples)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSamples = [...localSamples]
    const draggedSample = newSamples[draggedIndex]
    newSamples.splice(draggedIndex, 1)
    newSamples.splice(index, 0, draggedSample)

    setLocalSamples(newSamples)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    if (onReorder) {
      onReorder(localSamples)
    }
  }

  const toggleExpand = (sampleId: string) => {
    setExpandedSample(expandedSample === sampleId ? null : sampleId)
  }

  const getAIScore = (sample: Sample) => {
    const analysis = sample.analyses?.find(a => a.status === 'done')
    return analysis?.metrics?.ai_detection_score || 0
  }

  const getAIReasoning = (sample: Sample) => {
    const analysis = sample.analyses?.find(a => a.status === 'done')
    return analysis?.metrics?.ai_detection_reasoning || 'No reasoning provided'
  }

  const getSkills = (sample: Sample) => {
    const analysis = sample.analyses?.find(a => a.status === 'done')
    return analysis?.skills || {}
  }

  return (
    <div className="space-y-6">
      {/* Upload Button for Owner */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-6 py-3 bg-sage-600 hover:bg-sage-500 text-forest-50 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Work Sample
          </button>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUpload && isOwner && (
        <div className="bg-forest-900 border border-forest-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-forest-50">Upload New Sample</h3>
            <button
              onClick={() => setShowUpload(false)}
              className="text-forest-400 hover:text-forest-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <UploadForm onSuccess={() => {
            setShowUpload(false)
            if (onRefresh) onRefresh()
          }} />
        </div>
      )}

      {/* Sample Cards */}
      <div className="space-y-4">
        {localSamples.map((sample, index) => {
          const isExpanded = expandedSample === sample.id
          const aiScore = getAIScore(sample)
          const aiReasoning = getAIReasoning(sample)
          const skills = getSkills(sample)
          const hasAnalysis = sample.analyses?.some(a => a.status === 'done')

          return (
            <div
              key={sample.id}
              draggable={isOwner}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-forest-900 border border-forest-800 rounded-xl overflow-hidden transition-all ${
                isOwner ? 'cursor-move hover:border-sage-600' : ''
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Card Header - Always Visible */}
              <div
                onClick={() => toggleExpand(sample.id)}
                className="p-6 cursor-pointer hover:bg-forest-800/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-forest-50">{sample.title}</h3>
                      <span className="px-2 py-1 text-xs bg-sage-900 text-sage-200 rounded">
                        {sample.type}
                      </span>
                      {hasAnalysis && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          aiScore < 30 ? 'bg-green-900/30 text-green-300' :
                          aiScore < 60 ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {aiScore.toFixed(0)}% AI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-forest-400">{sample.filename}</p>
                    <p className="text-xs text-forest-500 mt-1">
                      {new Date(sample.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-forest-400 hover:text-forest-200 transition-colors">
                    <svg
                      className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && hasAnalysis && (
                <div className="border-t border-forest-800 p-6 space-y-6 bg-forest-950/50">
                  {/* AI Detection Reasoning */}
                  <div>
                    <h4 className="text-sm font-semibold text-forest-200 mb-2">AI Detection Analysis</h4>
                    <p className="text-sm text-forest-300">{aiReasoning}</p>
                  </div>

                  {/* Skills */}
                  {Object.keys(skills).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-forest-200 mb-3">Detected Skills</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(skills).map(([skill, data]: [string, any]) => (
                          <div
                            key={skill}
                            className="bg-forest-900 border border-forest-800 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium text-forest-100">{skill}</span>
                              <span className="text-xs text-sage-400">
                                {Math.round((data.confidence || 0) * 100)}%
                              </span>
                            </div>
                            {data.evidence && (
                              <p className="text-xs text-forest-400 line-clamp-2">
                                {data.evidence}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analysis Summary */}
                  {sample.analyses?.[0]?.summary && (
                    <div>
                      <h4 className="text-sm font-semibold text-forest-200 mb-2">Summary</h4>
                      <p className="text-sm text-forest-300">{sample.analyses[0].summary}</p>
                    </div>
                  )}

                  {/* View File Link */}
                  {sample.storage_url && (
                    <div>
                      <a
                        href={sample.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sage-700 hover:bg-sage-600 text-forest-50 rounded-lg text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Original File
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* No Analysis Yet */}
              {isExpanded && !hasAnalysis && (
                <div className="border-t border-forest-800 p-6 bg-forest-950/50">
                  <p className="text-sm text-forest-400 text-center">
                    Analysis in progress...
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {localSamples.length === 0 && (
        <div className="text-center py-12">
          <p className="text-forest-400">No work samples yet</p>
          {isOwner && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 text-sage-400 hover:text-sage-300"
            >
              Upload your first sample →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
