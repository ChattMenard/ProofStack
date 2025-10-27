import { NextRequest } from 'next/server'
import supabaseServer from './supabaseServer'

/**
 * Auth helper for App Router API routes (app/api/**)
 * Use this instead of requireAuth.ts which is for Pages Router
 */
export async function requireAuthAppRouter(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing bearer token' }
  }

  const token = authHeader.split(' ')[1]

  try {
    if (supabaseServer && (supabaseServer as any).auth && typeof (supabaseServer as any).auth.getUser === 'function') {
      const { data: userData, error } = await (supabaseServer as any).auth.getUser(token)
      
      if (error || !userData?.user) {
        return { user: null, error: 'Invalid token' }
      }

      return { user: userData.user, error: null }
    }
  } catch (e) {
    return { user: null, error: 'Auth service unavailable' }
  }

  // Allow tests to use the special 'test-token' sentinel
  if (token === 'test-token') {
    return {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      error: null
    }
  }

  return { user: null, error: 'Auth service not configured' }
}
