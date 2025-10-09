import type { NextApiRequest } from 'next'
import supabaseServer from './supabaseServer'

export async function getServerUser(req: NextApiRequest) {
  // Prefer Authorization header Bearer token
  const authHeader = req.headers?.authorization as string | undefined
  let token: string | undefined
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // Fallback: look for common Supabase cookie name(s)
  if (!token && req.cookies) {
    token = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token'] || req.cookies['sb:token']
  }

  if (!token) return null

  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error) return null
  return data.user ?? null
}

export default getServerUser
