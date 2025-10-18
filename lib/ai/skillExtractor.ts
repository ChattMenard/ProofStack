import { analyzeWithOllama } from '../ollamaClient'
import { analyzeWithAnthropic } from './anthropicClient'
import { analyzeWithHuggingFace } from './huggingFaceClient'

export type ExtractedSkill = {
  skill: string
  level: number // 0-100
  evidence: string[]
  confidence: number // 0-1
}

/**
 * Safely extract the first valid JSON array or object from text.
 * This prevents JSON injection attacks by validating structure before parsing.
 */
function extractFirstValidJSON(text: string): string | null {
  // Remove common prefixes/suffixes that might wrap the JSON
  const cleaned = text.trim()
    .replace(/^```json\s*/i, '') // Remove markdown code blocks
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // Try to find JSON structures using a more careful approach
  const jsonPatterns = [
    // Array pattern: [...] but not too greedy
    /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/,
    // Object pattern: {...} but not too greedy  
    /\{[^}{]*(?:\{[^}{]*\}[^}{]*)*\}/
  ]

  for (const pattern of jsonPatterns) {
    const matches = cleaned.match(pattern)
    if (matches) {
      for (const match of matches) {
        try {
          // Validate it's actually parseable JSON
          JSON.parse(match)
          return match
        } catch {
          // Not valid JSON, continue searching
          continue
        }
      }
    }
  }

  return null
}

/**
 * Extract skills from a text sample using Ollama.
 * The function asks Ollama to return a JSON array. It attempts to be defensive
 * about parsing the model output and will try to extract a JSON substring
 * if the response contains extra text.
 */
export async function extractSkillsFromText(text: string, model = 'mistral') : Promise<ExtractedSkill[]> {
  if (!text || !text.trim()) return []

  const prompt = `You are a helpful assistant that extracts programmatic and professional skills from a work sample. Return a JSON array where each item has: \n- skill (string)\n- level (number, 0-100)\n- evidence (array of strings with snippets or reasons)\n- confidence (number 0-1)\nReturn ONLY valid JSON. Example: [{"skill":"React","level":80,"evidence":["uses hooks","JSX components"],"confidence":0.92}]\n\nSample:\n${text}`

  let raw: string = ''

  // Try Ollama first
  try {
    const resp = await analyzeWithOllama(prompt, model)
    raw = (
      (resp as any)?.output && (Array.isArray((resp as any).output) ? (resp as any).output.map((o:any)=>o.content).join('') : (resp as any).output)
    ) || (Array.isArray((resp as any)?.choices) ? (resp as any).choices.map((c:any)=>c.text || c.message?.content).join('') : (resp as any).choices?.[0]?.message?.content) || JSON.stringify(resp)
  } catch (e: any) {
    console.log('Ollama failed, trying Anthropic', e.message)
    // Try Anthropic
    try {
      raw = await analyzeWithAnthropic(prompt)
    } catch (e2: any) {
      console.log('Anthropic also failed, trying Hugging Face', e2.message)
      // Try Hugging Face
      try {
        raw = await analyzeWithHuggingFace(prompt)
      } catch (e3: any) {
        console.log('Hugging Face also failed', e3.message)
        return []
      }
    }
  }

  // parse JSON; try direct JSON.parse first, then extract JSON substring if needed
  let parsed: any = []
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    const textRaw = String(raw)
    // Safer JSON extraction: find the first complete JSON array or object
    const extracted = extractFirstValidJSON(textRaw)
    if (!extracted) throw new Error('Unable to parse model output as JSON')
    parsed = JSON.parse(extracted)
  }

  if (!Array.isArray(parsed)) return []

  return parsed.map((item: any) => ({
    skill: String(item.skill ?? item.name ?? '').trim(),
    level: Math.min(100, Math.max(0, Number(item.level ?? item.proficiency ?? 0))) || 0,
    evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : item.evidence ? [String(item.evidence)] : [],
    confidence: Math.max(0, Math.min(1, Number(item.confidence ?? 0))) || 0
  }))
}

export default extractSkillsFromText
