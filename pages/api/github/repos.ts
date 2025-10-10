import type { NextApiRequest, NextApiResponse } from 'next'
import requireAuth from '../../../lib/requireAuth'
import fetch from 'node-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  try {
    // For demo, use env GITHUB_TOKEN. In production, get from user's OAuth session.
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) return res.status(400).json({ error: 'GitHub token not configured' })

    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { Authorization: `token ${githubToken}` }
    })

    if (!response.ok) throw new Error('Failed to fetch repos')

    const repos = await response.json()
    res.status(200).json(repos)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}