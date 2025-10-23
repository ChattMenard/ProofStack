"use client"
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

interface WorkSample {
  id: string;
  title: string | null;
  description: string | null;
  content_type: 'code' | 'writing' | 'design_doc' | 'technical_spec';
  language: string | null;
  confidentiality_level: 'public' | 'encrypted' | 'redacted';
  content: string;
  redacted_content: string | null;
  overall_quality_score: number | null;
  code_quality_score: number | null;
  technical_depth_score: number | null;
  problem_solving_score: number | null;
  writing_clarity_score: number | null;
  technical_accuracy_score: number | null;
  ai_feedback: any;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  employer_id: string;
}

interface WorkSamplesSectionProps {
  professionalId: string;
  isOwner?: boolean;
}

export default function WorkSamplesSection({ professionalId, isOwner = false }: WorkSamplesSectionProps) {
  const [samples, setSamples] = useState<WorkSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkSamples();
  }, [professionalId]);

  const loadWorkSamples = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use RPC function to get displayable content based on viewer
      const { data, error } = await supabase
        .from('work_samples')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading work samples:', error);
        return;
      }

      setSamples(data || []);
    } catch (error) {
      console.error('Failed to load work samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = selectedType === 'all' 
    ? samples 
    : samples.filter(s => s.content_type === selectedType);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'writing': return '📝';
      case 'design_doc': return '🎨';
      case 'technical_spec': return '📋';
      default: return '📄';
    }
  };

  const getConfidentialityBadge = (level: string) => {
    switch (level) {
      case 'public': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">🌐 Public</span>;
      case 'redacted': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">📝 Redacted</span>;
      case 'encrypted': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">🔒 Confidential</span>;
      default: return null;
    }
  };

  const renderScores = (sample: WorkSample) => {
    const scores = [];
    
    if (sample.code_quality_score !== null) {
      scores.push({ label: 'Code Quality', value: sample.code_quality_score });
      scores.push({ label: 'Technical Depth', value: sample.technical_depth_score });
      scores.push({ label: 'Problem Solving', value: sample.problem_solving_score });
    }
    
    if (sample.writing_clarity_score !== null) {
      scores.push({ label: 'Clarity', value: sample.writing_clarity_score });
      scores.push({ label: 'Technical Accuracy', value: sample.technical_accuracy_score });
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {scores.map((score, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-600">{score.label}</div>
            <div className="text-lg font-semibold text-blue-600">{score.value?.toFixed(1)}/10</div>
          </div>
        ))}
        {sample.overall_quality_score !== null && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
            <div className="text-xs text-blue-700 font-medium">Overall Quality</div>
            <div className="text-xl font-bold text-blue-600">{sample.overall_quality_score.toFixed(1)}/10</div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = (sample: WorkSample) => {
    if (sample.confidentiality_level === 'encrypted') {
      return (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <div className="text-gray-700 font-medium">Confidential Work Sample</div>
          <div className="text-sm text-gray-600 mt-2">
            This sample is encrypted to protect sensitive information.
            <br />
            Quality scores are based on AI analysis of the original content.
          </div>
          {sample.language && (
            <div className="mt-3 text-sm text-gray-500">
              Language: <span className="font-mono font-medium">{sample.language}</span>
            </div>
          )}
        </div>
      );
    }

    const displayContent = sample.confidentiality_level === 'redacted' && sample.redacted_content
      ? sample.redacted_content
      : sample.content;

    return (
      <div className="space-y-2">
        {sample.confidentiality_level === 'redacted' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
            ℹ️ Sensitive information has been sanitized by the employer
          </div>
        )}
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
          {displayContent}
        </pre>
        {sample.language && (
          <div className="text-xs text-gray-500">
            Language: <span className="font-mono font-medium">{sample.language}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Verified Work Samples</h2>
        <div className="text-gray-500">Loading work samples...</div>
      </div>
    );
  }

  if (samples.length === 0) {
    return null; // Don't show section if no samples
  }

  const typeCounts = {
    all: samples.length,
    code: samples.filter(s => s.content_type === 'code').length,
    writing: samples.filter(s => s.content_type === 'writing').length,
    design_doc: samples.filter(s => s.content_type === 'design_doc').length,
    technical_spec: samples.filter(s => s.content_type === 'technical_spec').length,
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Verified Work Samples</h2>
        <div className="text-sm text-gray-600">
          {samples.length} verified sample{samples.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({typeCounts.all})
        </button>
        {typeCounts.code > 0 && (
          <button
            onClick={() => setSelectedType('code')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'code'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💻 Code ({typeCounts.code})
          </button>
        )}
        {typeCounts.writing > 0 && (
          <button
            onClick={() => setSelectedType('writing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'writing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Writing ({typeCounts.writing})
          </button>
        )}
        {typeCounts.design_doc > 0 && (
          <button
            onClick={() => setSelectedType('design_doc')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'design_doc'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎨 Design ({typeCounts.design_doc})
          </button>
        )}
        {typeCounts.technical_spec > 0 && (
          <button
            onClick={() => setSelectedType('technical_spec')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'technical_spec'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Specs ({typeCounts.technical_spec})
          </button>
        )}
      </div>

      {/* Work samples grid */}
      <div className="space-y-6">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getTypeIcon(sample.content_type)}</span>
                    <Link 
                      href={`/work-samples/${sample.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {sample.title || `${sample.content_type.replace('_', ' ')} Sample`}
                    </Link>
                    {getConfidentialityBadge(sample.confidentiality_level)}
                  </div>
                  {sample.description && (
                    <p className="text-sm text-gray-600">{sample.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>✓ Employer Verified</span>
                    <span>📅 {new Date(sample.verified_at || sample.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="px-6 py-4 bg-white">
              {renderScores(sample)}
            </div>

            {/* Content (expandable) */}
            <div className="px-6 pb-4">
              <button
                onClick={() => setExpandedSampleId(expandedSampleId === sample.id ? null : sample.id)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {expandedSampleId === sample.id ? '▼' : '▶'} 
                {expandedSampleId === sample.id ? 'Hide' : 'View'} Sample Content
              </button>
              
              {expandedSampleId === sample.id && (
                <div className="mt-4">
                  {renderContent(sample)}
                </div>
              )}
            </div>

            {/* AI Feedback (if available) */}
            {sample.ai_feedback && expandedSampleId === sample.id && (
              <div className="px-6 pb-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Analysis</h4>
                {sample.ai_feedback.strengths && sample.ai_feedback.strengths.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-green-700 mb-1">✓ Strengths:</div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {sample.ai_feedback.strengths.map((strength: string, idx: number) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {sample.ai_feedback.improvements && sample.ai_feedback.improvements.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-blue-700 mb-1">💡 Areas for Growth:</div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {sample.ai_feedback.improvements.map((improvement: string, idx: number) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No {selectedType === 'all' ? '' : selectedType.replace('_', ' ')} samples to display
        </div>
      )}
    </div>
  );
}
