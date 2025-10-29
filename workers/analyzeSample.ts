#!/usr/bin/env node
import supabaseServer from '../lib/supabaseServer'
import extractSkillsFromText, { type ExtractedSkill } from '../lib/ai/skillExtractor'
import analyzeRepo from '../lib/analyzers/githubAnalyzer'
import { detectSecrets } from '../lib/security'
import { sendSecurityAlertEmail } from '../lib/email/notifications'

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS || '5000', 10)
const MAX_BATCH = parseInt(process.env.WORKER_BATCH || '5', 10)
const MAX_RETRIES = parseInt(process.env.WORKER_MAX_RETRIES || '3', 10)

async function processAnalysis(a: any) {
  console.log('Processing analysis', a.id, 'for sample', a.sample_id)
  const id = a.id

  // mark running
  const { error: updateError } = await supabaseServer.from('analyses').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id)
  if (updateError) {
    console.error('Failed to mark analysis as running:', updateError)
    return
  }

    // Read current metrics
  const { data: fresh } = await supabaseServer.from('analyses').select('metrics').eq('id', id).single()
  let metrics = fresh?.metrics ?? {}
  let retries = Number(metrics?.retry_count ?? 0)

  try {
    let skills: ExtractedSkill[] | null = null
  const { data: sampleRow } = await supabaseServer.from('samples').select('content, owner_id, type, source_url, storage_url, metadata').eq('id', a.sample_id).single()
    const content = sampleRow?.content ?? ''
    const userId = sampleRow?.owner_id
    const type = sampleRow?.type
    const sourceUrl = sampleRow?.source_url
    const storageUrl = sampleRow?.storage_url

  if (type === 'repo' && sourceUrl) {
      // Analyze GitHub repo
      const m = sourceUrl.match(/github.com\/([^\/]+)\/([^\/]+)(?:\/|$)/i)
      if (m) {
        const owner = m[1]
        const repo = m[2].replace(/\.git$/, '')
        
        // Get user's GitHub token for private repo access
        let githubToken: string | undefined
        if (userId) {
          const { data: userData, error } = await supabaseServer.auth.admin.getUserById(userId)
          if (!error && userData?.user) {
            githubToken = userData.user.user_metadata?.provider_token || userData.user.app_metadata?.provider_token
          }
        }
        
        const repoData = await analyzeRepo(owner, repo, githubToken)
        // Extract skills from repo languages and commits
        const repoSummary = `Languages: ${Object.keys(repoData.languages).join(', ')}. Recent commits: ${repoData.recent_commits.map(c => c.message).join('; ')}`
        // Scan repo summary for secrets before sending to AI
        const repoSecretCheck = detectSecrets(repoSummary)
        if (repoSecretCheck.found) {
          // Mark analysis as failed to avoid exfiltration and log the issue
          await supabaseServer.from('analyses').update({ status: 'failed', summary: 'Analysis aborted: potential secrets detected in source content', result: { secrets: repoSecretCheck.secrets } }).eq('id', id)
          // Flag the sample metadata for admin review
          try {
            const currentMeta = sampleRow?.metadata || {}
            const newMeta = { ...currentMeta, security_flagged: true, security_flag_details: repoSecretCheck.secrets }
            await supabaseServer.from('samples').update({ metadata: newMeta }).eq('id', a.sample_id)
          } catch (e) {
            console.warn('Failed to flag sample metadata', e)
          }
          // Send admin notification if configured
          const adminEmails = (process.env.SECURITY_ALERT_EMAILS || process.env.RESEND_FROM_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
          if (adminEmails.length > 0) {
            await sendSecurityAlertEmail(adminEmails, { sampleId: a.sample_id, analysisId: id, secrets: repoSecretCheck.secrets, professionalId: sampleRow?.owner_id, ownerEmail: undefined })
          }
          console.warn('Aborting analysis due to secrets found in repo summary', id)
          return
        }

        skills = await extractSkillsFromText(repoSummary)
      } else {
        skills = []
      }
    } else if ((type === 'audio' || type === 'video') && storageUrl) {
      // Transcribe audio/video and analyze transcription
      try {
        const { transcribeAudio, extractAudioFromVideo } = await import('../lib/transcription')
        let audioPath = storageUrl

        // If it's a video, extract audio first
        if (type === 'video') {
          const audioFile = `/tmp/${a.sample_id}.mp3`
          await extractAudioFromVideo(storageUrl, audioFile)
          audioPath = audioFile
        }

        const transcription = await transcribeAudio(audioPath)
        console.log('Transcription completed:', transcription.substring(0, 100) + '...')
        // Scan transcription for secrets
        const transSecretCheck = detectSecrets(transcription)
        if (transSecretCheck.found) {
          await supabaseServer.from('analyses').update({ status: 'failed', summary: 'Analysis aborted: potential secrets detected in transcription', result: { secrets: transSecretCheck.secrets } }).eq('id', id)
          try {
            const currentMeta = sampleRow?.metadata || {}
            const newMeta = { ...currentMeta, security_flagged: true, security_flag_details: transSecretCheck.secrets }
            await supabaseServer.from('samples').update({ metadata: newMeta }).eq('id', a.sample_id)
          } catch (e) {
            console.warn('Failed to flag sample metadata', e)
          }
          const adminEmails2 = (process.env.SECURITY_ALERT_EMAILS || process.env.RESEND_FROM_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
          if (adminEmails2.length > 0) {
            await sendSecurityAlertEmail(adminEmails2, { sampleId: a.sample_id, analysisId: id, secrets: transSecretCheck.secrets, professionalId: sampleRow?.owner_id, ownerEmail: undefined })
          }
          console.warn('Aborting analysis due to secrets found in transcription', id)
          return
        }
        skills = await extractSkillsFromText(transcription)
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError)
        // Fallback: try to analyze filename or metadata
        skills = await extractSkillsFromText(`Audio/Video file: ${storageUrl}`)
      }
    } else {
      // Extract skills from text content
      // Scan content for secrets before using AI
      const contentSecretCheck = detectSecrets(content)
      if (contentSecretCheck.found) {
        await supabaseServer.from('analyses').update({ status: 'failed', summary: 'Analysis aborted: potential secrets detected in sample content', result: { secrets: contentSecretCheck.secrets } }).eq('id', id)
        try {
          const currentMeta = sampleRow?.metadata || {}
          const newMeta = { ...currentMeta, security_flagged: true, security_flag_details: contentSecretCheck.secrets }
          await supabaseServer.from('samples').update({ metadata: newMeta }).eq('id', a.sample_id)
        } catch (e) {
          console.warn('Failed to flag sample metadata', e)
        }
        const adminEmails3 = (process.env.SECURITY_ALERT_EMAILS || process.env.RESEND_FROM_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
        if (adminEmails3.length > 0) {
          await sendSecurityAlertEmail(adminEmails3, { sampleId: a.sample_id, analysisId: id, secrets: contentSecretCheck.secrets, professionalId: sampleRow?.owner_id, ownerEmail: undefined })
        }
        console.warn('Aborting analysis due to secrets found in sample content', id)
        return
      }

      skills = await extractSkillsFromText(content)
    }

    const result = { skills, summary: 'Analysis complete', processed_at: new Date().toISOString() }
    await supabaseServer.from('analyses').update({ 
      status: 'done', 
      summary: 'Analysis complete', 
      result,
      skills, 
      completed_at: new Date().toISOString(), 
      metrics: { ...metrics, retry_count: retries } 
    }).eq('id', id)

    // Create proof for the analysis
    const { data: sample } = await supabaseServer.from('samples').select('hash').eq('id', a.sample_id).single()
    if (sample?.hash) {
      const proofPayload = {
        analysis_id: id,
        sample_hash: sample.hash,
        skills_extracted: skills?.length || 0,
        timestamp: new Date().toISOString()
      }
      const proofHash = require('crypto').createHash('sha256').update(JSON.stringify(proofPayload)).digest('hex')
      
      await supabaseServer.from('proofs').insert({
        analysis_id: id,
        proof_type: 'server_signed',
        proof_hash: `sha256:${proofHash}`,
        signer: 'ProofStack Analysis Service',
        payload: proofPayload,
        signature: { type: 'demo', value: 'PROOFSTACK-SIGNATURE-' + proofHash.substring(0, 8) }
      })
    }

    console.log('Analysis completed', id)
  } catch (err) {
    console.error('Worker error', err)
    retries += 1
    const nextMetrics = { ...metrics, retry_count: retries }
    if (retries >= MAX_RETRIES) {
      await supabaseServer.from('analyses').update({ status: 'failed', metrics: nextMetrics }).eq('id', id)
      console.log('Analysis failed permanently', id)
    } else {
      // exponential backoff is handled by requeue timing; here we set status back to queued
      await supabaseServer.from('analyses').update({ status: 'queued', metrics: nextMetrics }).eq('id', id)
      console.log('Analysis requeued', id, 'retry', retries)
    }
  }
}

async function pollLoop() {
  console.log('Worker: starting poll loop, polling every', POLL_INTERVAL_MS, 'ms')
  while (true) {
    try {
      // Find queued analyses OR running analyses that are stuck (started > 5 min ago)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: queued } = await supabaseServer
        .from('analyses')
        .select('*')
        .eq('status', 'queued')
        .limit(MAX_BATCH)

      const { data: stuck } = await supabaseServer
        .from('analyses')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', fiveMinutesAgo)
        .limit(MAX_BATCH)

      const all = [...(queued || []), ...(stuck || [])]

      if (all && all.length > 0) {
        console.log(`Found ${all.length} analysis job(s) to process`)
        for (const a of all) {
          // defensive: process each without await blocking the entire loop
          // but to simplify, we'll await sequentially to avoid concurrency issues
          await processAnalysis(a)
        }
      }
    } catch (e) {
      console.error('Worker polling error', e)
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
}

pollLoop().catch((e) => {
  console.error('Worker crashed', e)
  process.exit(1)
})
