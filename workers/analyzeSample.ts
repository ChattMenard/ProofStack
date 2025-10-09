#!/usr/bin/env node
import supabaseServer from '../lib/supabaseServer'
import { analyzeWithOllama } from '../lib/ollamaClient'

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS || '5000', 10)
const MAX_BATCH = parseInt(process.env.WORKER_BATCH || '5', 10)
const MAX_RETRIES = parseInt(process.env.WORKER_MAX_RETRIES || '3', 10)

async function processAnalysis(a: any) {
  console.log('Processing analysis', a.id)
  const id = a.id

  // mark running
  await supabaseServer.from('analyses').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id)

  // Read current metrics
  const { data: fresh } = await supabaseServer.from('analyses').select('metrics').eq('id', id).single()
  let metrics = fresh?.metrics ?? {}
  let retries = Number(metrics?.retry_count ?? 0)

  try {
    let skills = null
    const { data: sampleRow } = await supabaseServer.from('samples').select('content').eq('id', a.sample_id).single()
    const content = sampleRow?.content ?? ''

    if (process.env.OLLAMA_URL) {
      try {
        const prompt = `Extract top skills as a JSON object with confidence between 0-1 and evidence.\n\nContent:\n${content}`
        const oresp: any = await analyzeWithOllama(prompt)
        // Try to extract JSON from response. Ollama output shapes vary; try common fields.
        const textOut = (oresp.output && typeof oresp.output === 'string') ? oresp.output : JSON.stringify(oresp)
        // naive JSON extraction
        const m = textOut.match(/\{[\s\S]*\}/)
        if (m) {
          try { skills = JSON.parse(m[0]) } catch (e) { skills = { parsed: textOut } }
        } else {
          skills = { parsed: textOut }
        }
      } catch (e) {
        console.error('Ollama error, falling back to mock', e)
        skills = { fallback: { confidence: 0.5, evidence: [{ type: 'sample', id: a.sample_id }] } }
      }
    } else {
      // Mocked analysis
      skills = { javascript: { confidence: 0.8, evidence: [{ type: 'sample', id: a.sample_id }] } }
    }

    await supabaseServer.from('analyses').update({ status: 'done', summary: 'Analysis complete', skills, finished_at: new Date().toISOString(), metrics: { ...metrics, retry_count: retries } }).eq('id', id)
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
      const { data: queued } = await supabaseServer
        .from('analyses')
        .select('*')
        .in('status', ['queued'])
        .limit(MAX_BATCH)

      if (queued && queued.length > 0) {
        for (const a of queued) {
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
