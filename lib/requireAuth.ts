import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from './supabaseServer'
import { getServerUser } from './getServerUser'

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  // For API routes: strict bearer token required
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return null
  }
  const token = authHeader.split(' ')[1]

  const { data: userData, error } = await supabaseServer.auth.getUser(token)
  if (error || !userData.user) {
    res.status(401).json({ error: 'Invalid token' })
    return null
  }

  return userData.user
}

// Utility for server-side handlers that prefer cookie/session based lookup
export async function requireAuthFromReq(req: NextApiRequest) {
  const user = await getServerUser(req)
  return user
}

export default requireAuth
