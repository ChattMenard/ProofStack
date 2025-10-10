"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Skill {
  name: string
  proficiency: number
  verified: boolean
  evidence_count: number
}

export default function PortfolioView({ username }: { username: string }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPortfolio() {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', username) // assuming username is id for now

      if (error) console.error(error)
      else setSkills(data || [])
      setLoading(false)
    }
    fetchPortfolio()
  }, [username])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Portfolio for {username}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, i) => (
          <div key={i} className="border p-4 rounded">
            <h2 className="font-semibold">{skill.name}</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${skill.proficiency}%` }}></div>
            </div>
            <p>Proficiency: {skill.proficiency}%</p>
            <p>Verified: {skill.verified ? 'Yes' : 'No'}</p>
            <p>Evidence: {skill.evidence_count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}