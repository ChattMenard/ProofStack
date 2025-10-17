/**
 * Mock AI clients for testing
 * Avoids external network calls during test execution
 */

export const mockSkillExtractionResult = {
  skills: [
    {
      name: 'JavaScript',
      level: 'advanced',
      evidence: 'Uses ES6+ features, async/await, and modern frameworks'
    },
    {
      name: 'React',
      level: 'intermediate',
      evidence: 'Implements components with hooks and state management'
    },
    {
      name: 'TypeScript',
      level: 'intermediate',
      evidence: 'Type annotations and interfaces throughout codebase'
    }
  ],
  summary: 'Experienced full-stack developer with strong JavaScript fundamentals'
}

export const mockTranscriptionResult = {
  text: 'This is a mock transcription of the audio content. The speaker discusses various technical topics including software architecture, database design, and API development.',
  duration: 120,
  language: 'en'
}

// Mock Ollama client
export const mockOllamaClient = {
  generate: jest.fn().mockResolvedValue({
    response: JSON.stringify(mockSkillExtractionResult),
    done: true
  }),
  chat: jest.fn().mockResolvedValue({
    message: {
      content: JSON.stringify(mockSkillExtractionResult)
    },
    done: true
  })
}

// Mock Anthropic client
export const mockAnthropicClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockSkillExtractionResult)
        }
      ]
    })
  }
}

// Mock Hugging Face client
export const mockHuggingFaceClient = {
  textGeneration: jest.fn().mockResolvedValue({
    generated_text: JSON.stringify(mockSkillExtractionResult)
  })
}

// Mock OpenAI client
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockSkillExtractionResult)
            }
          }
        ]
      })
    }
  },
  audio: {
    transcriptions: {
      create: jest.fn().mockResolvedValue(mockTranscriptionResult)
    }
  }
}

// Helper to mock skill extraction for tests
export function mockSkillExtraction() {
  jest.mock('../lib/ai/skillExtractor', () => ({
    extractSkillsFromText: jest.fn().mockResolvedValue(mockSkillExtractionResult)
  }))
}

// Helper to mock transcription for tests
export function mockTranscription() {
  jest.mock('../lib/transcription', () => ({
    transcribeAudio: jest.fn().mockResolvedValue(mockTranscriptionResult)
  }))
}

// Reset all mocks
export function resetAllMocks() {
  mockOllamaClient.generate.mockClear()
  mockOllamaClient.chat.mockClear()
  mockAnthropicClient.messages.create.mockClear()
  mockHuggingFaceClient.textGeneration.mockClear()
  mockOpenAIClient.chat.completions.create.mockClear()
  mockOpenAIClient.audio.transcriptions.create.mockClear()
}
