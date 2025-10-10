"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import PortfolioImage from '../PortfolioImage'

interface Sample {
  id: string
  type: string
  title: string
  description: string
  filename: string
  storage_url: string
  created_at: string
  analyses: Analysis[]
}

interface Analysis {
  id: string
  status: string
  summary: string
  skills: any[]
  completed_at: string
  proofs: Proof[]
}

interface Proof {
  id: string
  proof_type: string
  proof_hash: string
  signer: string
  created_at: string
}

export default function PortfolioView({ username }: { username: string }) {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPortfolio() {
      // First get the profile by username (assuming username is email or github_username)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .or(`email.eq.${username},github_username.eq.${username}`)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      // Get samples with analyses and proofs
      const { data: samplesData, error } = await supabase
        .from('samples')
        .select(`
          id, type, title, description, filename, storage_url, created_at,
          analyses (
            id, status, summary, skills, completed_at,
            proofs (id, proof_type, proof_hash, signer, created_at)
          )
        `)
        .eq('owner_id', profile.id)
        .eq('visibility', 'public')

      if (error) console.error(error)
      else setSamples(samplesData || [])
      setLoading(false)
    }
    fetchPortfolio()
  }, [username])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Portfolio for {username}</h1>
      {samples.length === 0 ? (
        <p>No public samples yet.</p>
      ) : (
        <div className="space-y-6">
          {samples.map((sample) => (
            <div key={sample.id} className="border p-4 rounded">
              <h2 className="font-semibold">{sample.title || sample.filename}</h2>
              <p className="text-sm text-gray-600">Type: {sample.type}</p>
              {sample.description && <p>{sample.description}</p>}

              {sample.storage_url && (
                <div className="mt-4">
                  {sample.type === 'image' || sample.type === 'design' ? (
                    <PortfolioImage
                      src={sample.storage_url}
                      alt={sample.title || sample.filename || 'Portfolio sample'}
                      width={400}
                      height={300}
                    />
                  ) : (
                    <a href={sample.storage_url} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                      View Sample →
                    </a>
                  )}
                </div>
              )}
              
              {sample.analyses && sample.analyses.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium">Analysis</h3>
                  {sample.analyses.map((analysis) => (
                    <div key={analysis.id} className="mt-2 p-2 bg-gray-50 rounded">
                      <p>Status: {analysis.status}</p>
                      {analysis.summary && <p>{analysis.summary}</p>}
                      {analysis.skills && Array.isArray(analysis.skills) && (
                        <div>
                          <p className="font-medium">Skills:</p>
                          <ul className="list-disc list-inside">
                            {analysis.skills.map((skill: any, i: number) => (
                              <li key={i}>
                                {skill.skill || skill.name} (Level: {skill.level || skill.proficiency}%, Confidence: {Math.round((skill.confidence || 0) * 100)}%)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {analysis.proofs && analysis.proofs.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-medium">Proofs:</h4>
                          {analysis.proofs.map((proof) => (
                            <div key={proof.id} className="text-sm">
                              <p>Type: {proof.proof_type}</p>
                              <p>Hash: {proof.proof_hash}</p>
                              <p>Signed by: {proof.signer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}