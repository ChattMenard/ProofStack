import { extractSkillsFromText } from '../lib/ai/skillExtractor'

// Mock the external API calls
jest.mock('../lib/ollamaClient', () => ({
  analyzeWithOllama: jest.fn(),
}))

jest.mock('../lib/ai/anthropicClient', () => ({
  analyzeWithAnthropic: jest.fn(),
}))

jest.mock('../lib/ai/huggingFaceClient', () => ({
  analyzeWithHuggingFace: jest.fn(),
}))

const mockOllama = require('../lib/ollamaClient').analyzeWithOllama
const mockAnthropic = require('../lib/ai/anthropicClient').analyzeWithAnthropic
const mockHuggingFace = require('../lib/ai/huggingFaceClient').analyzeWithHuggingFace

describe('skillExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array for empty text', async () => {
    const result = await extractSkillsFromText('')
    expect(result).toEqual([])
  })

  it('should extract skills from valid JSON response', async () => {
    const mockResponse = JSON.stringify([
      {
        skill: 'JavaScript',
        level: 85,
        evidence: ['uses async/await', 'ES6 features'],
        confidence: 0.9
      },
      {
        skill: 'React',
        level: 75,
        evidence: ['JSX syntax', 'hooks usage'],
        confidence: 0.8
      }
    ])

    mockOllama.mockResolvedValue({ output: mockResponse })

    const result = await extractSkillsFromText('Some JavaScript code with React')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      skill: 'JavaScript',
      level: 85,
      evidence: ['uses async/await', 'ES6 features'],
      confidence: 0.9
    })
    expect(result[1]).toEqual({
      skill: 'React',
      level: 75,
      evidence: ['JSX syntax', 'hooks usage'],
      confidence: 0.8
    })
  })

  it('should handle malformed JSON and extract valid JSON substring', async () => {
    const mockResponse = 'Here is some text [{"skill":"Python","level":90,"evidence":["list comprehensions"],"confidence":0.95}] and more text'

    mockOllama.mockResolvedValue({ output: mockResponse })

    const result = await extractSkillsFromText('Python code')

    expect(result).toHaveLength(1)
    expect(result[0].skill).toBe('Python')
    expect(result[0].level).toBe(90)
  })

  it('should fallback to Anthropic when Ollama fails', async () => {
    mockOllama.mockRejectedValue(new Error('Ollama failed'))
    mockAnthropic.mockResolvedValue(JSON.stringify([
      {
        skill: 'TypeScript',
        level: 80,
        evidence: ['type annotations'],
        confidence: 0.85
      }
    ]))

    const result = await extractSkillsFromText('TypeScript code')

    expect(mockAnthropic).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0].skill).toBe('TypeScript')
  })

  it('should fallback to HuggingFace when both Ollama and Anthropic fail', async () => {
    mockOllama.mockRejectedValue(new Error('Ollama failed'))
    mockAnthropic.mockRejectedValue(new Error('Anthropic failed'))
    mockHuggingFace.mockResolvedValue(JSON.stringify([
      {
        skill: 'Java',
        level: 70,
        evidence: ['OOP concepts'],
        confidence: 0.75
      }
    ]))

    const result = await extractSkillsFromText('Java code')

    expect(mockHuggingFace).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0].skill).toBe('Java')
  })

  it('should return empty array when all services fail', async () => {
    mockOllama.mockRejectedValue(new Error('Ollama failed'))
    mockAnthropic.mockRejectedValue(new Error('Anthropic failed'))
    mockHuggingFace.mockRejectedValue(new Error('HuggingFace failed'))

    const result = await extractSkillsFromText('Some code')

    expect(result).toEqual([])
  })

  it('should normalize skill names and clamp levels', async () => {
    const mockResponse = JSON.stringify([
      {
        skill: '  JAVASCRIPT  ',
        level: 150, // Over max
        evidence: ['code'],
        confidence: 1.5 // Over max
      },
      {
        skill: '',
        level: -10, // Under min
        evidence: [],
        confidence: -0.5 // Under min
      }
    ])

    mockOllama.mockResolvedValue({ output: mockResponse })

    const result = await extractSkillsFromText('JavaScript code')

    expect(result).toHaveLength(2)
    expect(result[0].skill).toBe('JAVASCRIPT')
    expect(result[0].level).toBe(100) // Clamped to max
    expect(result[0].confidence).toBe(1) // Clamped to max
    expect(result[1].skill).toBe('')
    expect(result[1].level).toBe(0) // Clamped to min
    expect(result[1].confidence).toBe(0) // Clamped to min
  })
})