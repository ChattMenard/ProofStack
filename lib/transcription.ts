import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Transcribe audio/video file to text using OpenAI Whisper API or local whisper
 */
export async function transcribeAudio(filePath: string, model = 'whisper-1'): Promise<string> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`)
    }

    // For now, use a simple approach - if we have OpenAI API key, use Whisper API
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (openaiApiKey) {
      return await transcribeWithOpenAI(filePath, model)
    }

    // Fallback: try local whisper if available
    return await transcribeWithLocalWhisper(filePath)
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(filePath: string, model: string): Promise<string> {
  const FormData = require('form-data')
  const fetch = require('node-fetch')

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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  return await response.text()
}

/**
 * Transcribe using local whisper (if available)
 * This is a placeholder - would need whisper.cpp or similar installed
 */
async function transcribeWithLocalWhisper(filePath: string): Promise<string> {
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