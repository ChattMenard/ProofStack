import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logApiCost, calculateWhisperCost } from './costTracking'

const execAsync = promisify(exec)

interface TranscriptionOptions {
  userId?: string
  sampleId?: string
  analysisId?: string
}

/**
 * Transcribe audio/video file to text using OpenAI Whisper API or local whisper
 */
export async function transcribeAudio(
  filePath: string,
  model = 'whisper-1',
  options?: TranscriptionOptions
): Promise<string> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`)
    }

    // For now, use a simple approach - if we have OpenAI API key, use Whisper API
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (openaiApiKey) {
      return await transcribeWithOpenAI(filePath, model, options)
    }

    // Fallback: try local whisper if available
    return await transcribeWithLocalWhisper(filePath, options)
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

/**
 * Get audio duration in seconds using ffprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    )
    return parseFloat(stdout.trim())
  } catch {
    // If ffprobe fails, estimate 1 minute per MB (rough approximation)
    const stats = fs.statSync(filePath)
    const sizeMB = stats.size / (1024 * 1024)
    return sizeMB * 60 // 1 minute per MB
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(
  filePath: string,
  model: string,
  options?: TranscriptionOptions
): Promise<string> {
  const FormData = require('form-data')
  const fetch = require('node-fetch')

  const startTime = Date.now()
  const fileStats = fs.statSync(filePath)
  const fileSize = fileStats.size

  try {
    const form = new FormData()
    form.append('file', fs.createReadStream(filePath))
    form.append('model', model)
    form.append('response_format', 'text')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    })

    const duration = Date.now() - startTime

    if (!response.ok) {
      const error = await response.text()
      
      // Log error
      await logApiCost({
        userId: options?.userId,
        sampleId: options?.sampleId,
        analysisId: options?.analysisId,
        provider: 'openai',
        modelName: model,
        operation: 'transcription',
        costUsd: 0,
        durationMs: duration,
        requestSizeBytes: fileSize,
        status: 'error',
        errorMessage: `${response.status}: ${error.slice(0, 200)}`
      })

      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const transcript = await response.text()
    
    // Calculate cost based on audio duration
    const audioDuration = await getAudioDuration(filePath)
    const cost = calculateWhisperCost(audioDuration)

    // Log cost
    await logApiCost({
      userId: options?.userId,
      sampleId: options?.sampleId,
      analysisId: options?.analysisId,
      provider: 'openai',
      modelName: model,
      operation: 'transcription',
      costUsd: cost,
      durationMs: duration,
      requestSizeBytes: fileSize,
      responseSizeBytes: Buffer.byteLength(transcript),
      status: 'success',
      metadata: {
        audioDurationSeconds: audioDuration,
        audioSizeBytes: fileSize
      }
    })

    return transcript
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // Log error
    await logApiCost({
      userId: options?.userId,
      sampleId: options?.sampleId,
      analysisId: options?.analysisId,
      provider: 'openai',
      modelName: model,
      operation: 'transcription',
      costUsd: 0,
      durationMs: duration,
      requestSizeBytes: fileSize,
      status: 'error',
      errorMessage: error.message
    })

    throw error
  }
}

/**
 * Transcribe using local whisper (if available)
 * This is a placeholder - would need whisper.cpp or similar installed
 */
async function transcribeWithLocalWhisper(
  filePath: string,
  options?: TranscriptionOptions
): Promise<string> {
  // Check if whisper is available
  try {
    await execAsync('whisper --help')
  } catch {
    throw new Error('Local whisper not available. Please install whisper or set OPENAI_API_KEY')
  }

  // Convert to WAV if needed
  const ext = path.extname(filePath).toLowerCase()
  let wavPath = filePath

  if (ext !== '.wav') {
    wavPath = filePath.replace(ext, '.wav')
    await execAsync(`ffmpeg -i "${filePath}" -acodec pcm_s16le -ar 16000 "${wavPath}"`)
  }

  // Run whisper transcription
  const { stdout } = await execAsync(`whisper "${wavPath}" --model tiny --output_format txt --output_dir /tmp`)

  // Clean up temp file if created
  if (wavPath !== filePath) {
    try {
      fs.unlinkSync(wavPath)
    } catch {}
  }

  // Extract text from output
  const outputPath = wavPath.replace('.wav', '.txt')
  if (fs.existsSync(outputPath)) {
    const text = fs.readFileSync(outputPath, 'utf8')
    fs.unlinkSync(outputPath) // cleanup
    return text.trim()
  }

  throw new Error('Failed to extract transcription text')
}

/**
 * Extract audio from video file if needed
 */
export async function extractAudioFromVideo(videoPath: string, audioPath: string): Promise<void> {
  await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 128k "${audioPath}"`)
}