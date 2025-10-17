import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../../lib/supabaseServer'
import { requireAuth } from '../../../lib/requireAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  try {
    // Get user's profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    const userId = profile.id

    // Delete all user data in the correct order (respecting foreign key constraints)
    // 1. Delete uploads (will cascade to samples if configured, but let's be explicit)
    const { error: uploadsError } = await supabaseServer
      .from('uploads')
      .delete()
      .eq('uploader_id', userId)

    if (uploadsError) {
      console.error('Error deleting uploads:', uploadsError)
      return res.status(500).json({ error: 'Failed to delete upload records' })
    }

    // 2. Delete samples (this will cascade delete analyses, proofs)
    const { error: samplesError } = await supabaseServer
      .from('samples')
      .delete()
      .eq('owner_id', userId)

    if (samplesError) {
      console.error('Error deleting samples:', samplesError)
      return res.status(500).json({ error: 'Failed to delete samples' })
    }

    // 3. Delete profile
    const { error: deleteProfileError } = await supabaseServer
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError)
      return res.status(500).json({ error: 'Failed to delete user profile' })
    }

    // Note: We don't delete from Supabase Auth - that's handled separately
    // The user would need to delete their account through Supabase Auth

    res.status(200).json({
      message: 'All user data has been permanently deleted',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Data deletion error:', error)
    res.status(500).json({ error: 'Internal server error during data deletion' })
  }
}