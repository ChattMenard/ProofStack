/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST, GET } from '../../app/api/analyze/route'
import { supabaseServer } from '../../lib/supabaseServer'
import { analyzeSampleWithAI } from '../../lib/analyzers/skillExtractor'

// Mock external dependencies
jest.mock('../../lib/supabaseServer')
jest.mock('../../lib/analyzers/skillExtractor')

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>
const mockAnalyzeSampleWithAI = analyzeSampleWithAI as jest.MockedFunction<typeof analyzeSampleWithAI>

// Helper to create mock NextRequest
function createMockRequest(
  method: string,
  body?: any,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/analyze')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const req = {
    method,
    url: url.toString(),
    headers: {
      get: () => null,
    },
    json: async () => body,
  } as unknown as NextRequest

  return req
}

describe('POST /app/api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject requests without analysis_id', async () => {
    const req = createMockRequest('POST', {})

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('analysis_id required')
  })

  it('should return 404 for non-existent analysis', async () => {
    const req = createMockRequest('POST', { analysis_id: 'non-existent' })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Analysis not found')
  })

  it('should skip analysis if already processing', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing',
      samples: { id: 'sample-123', type: 'writing', content: 'test' },
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('already in progress')
    expect(data.status).toBe('processing')
  })

  it('should skip analysis if already done', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'done',
      samples: { id: 'sample-123', type: 'writing', content: 'test' },
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('already in progress or completed')
    expect(data.status).toBe('done')
  })

  it('should return error if sample not found', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'queued',
      samples: null,
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Sample not found')
  })

  it('should successfully analyze a sample', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockSample = {
      id: 'sample-123',
      type: 'writing',
      content: 'test content',
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'queued',
      retry_count: 0,
      samples: mockSample,
    }

    const mockAIResult = {
      summary: 'Analysis summary',
      skills: {
        'JavaScript': { level: 80, evidence: ['test'], confidence: 0.9 },
      },
      model: 'gpt-4o-mini',
      tokens_used: 100,
      ai_detection_score: 0.1,
      ai_detection_reasoning: 'Low AI probability',
    }

    let selectCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'analyses') {
        selectCallCount++
        if (selectCallCount === 1) {
          // First call - get analysis with sample
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          } as any
        }
      }
      if (table === 'proofs') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        } as any
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any
    })

    mockAnalyzeSampleWithAI.mockResolvedValue(mockAIResult)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.analysis_id).toBe('analysis-123')
    expect(data.status).toBe('done')
    expect(mockAnalyzeSampleWithAI).toHaveBeenCalledWith(mockSample)
  })

  it('should handle AI analysis errors with retry logic', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockSample = {
      id: 'sample-123',
      type: 'writing',
      content: 'test content',
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'queued',
      retry_count: 0,
      samples: mockSample,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'analyses') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        } as any
      }
      return {} as any
    })

    mockAnalyzeSampleWithAI.mockRejectedValue(new Error('AI service error'))

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Analysis failed')
    expect(data.retry_count).toBe(1)
  })

  it('should mark analysis as error after max retries', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    const mockSample = {
      id: 'sample-123',
      type: 'writing',
      content: 'test content',
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'queued',
      retry_count: 2, // Already retried twice
      samples: mockSample,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'analyses') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        } as any
      }
      return {} as any
    })

    mockAnalyzeSampleWithAI.mockRejectedValue(new Error('AI service error'))

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Analysis failed')
    expect(data.retry_count).toBe(3)
  })

  it('should handle database errors during analysis update', async () => {
    const req = createMockRequest('POST', { analysis_id: 'analysis-123' })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Analysis not found')
  })
})

describe('GET /app/api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject requests without analysis_id', async () => {
    const req = createMockRequest('GET', null, {})

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('analysis_id required')
  })

  it('should return 404 for non-existent analysis', async () => {
    const req = createMockRequest('GET', null, { id: 'non-existent' })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Analysis not found')
  })

  it('should return analysis status and results', async () => {
    const req = createMockRequest('GET', null, { id: 'analysis-123' })

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'done',
      summary: 'Analysis complete',
      result: {
        skills: {
          'JavaScript': { level: 80, evidence: ['test'], confidence: 0.9 },
        },
      },
      skills: {
        'JavaScript': { level: 80, evidence: ['test'], confidence: 0.9 },
      },
      metrics: {
        duration_ms: 1000,
        model: 'gpt-4o-mini',
        tokens_used: 100,
      },
      created_at: '2023-10-20T10:00:00Z',
      completed_at: '2023-10-20T10:00:01Z',
      samples: {
        id: 'sample-123',
        type: 'writing',
        title: 'Test Sample',
        filename: 'test.txt',
      },
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        }),
      }),
    } as any)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.analysis_id).toBe('analysis-123')
    expect(data.status).toBe('done')
    expect(data.summary).toBe('Analysis complete')
    expect(data.skills).toBeDefined()
    expect(data.result).toBeDefined()
    expect(data.metrics).toBeDefined()
    expect(data.sample).toBeDefined()
  })

  it('should return processing status for queued analysis', async () => {
    const req = createMockRequest('GET', null, { id: 'analysis-123' })

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing',
      summary: null,
      result: null,
      skills: null,
      metrics: null,
      created_at: '2023-10-20T10:00:00Z',
      completed_at: null,
      samples: {
        id: 'sample-123',
        type: 'writing',
        title: 'Test Sample',
        filename: 'test.txt',
      },
    }

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        }),
      }),
    } as any)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.analysis_id).toBe('analysis-123')
    expect(data.status).toBe('processing')
    expect(data.summary).toBeNull()
    expect(data.result).toBeNull()
    expect(data.completed_at).toBeNull()
  })

  it('should handle database errors gracefully', async () => {
    const req = createMockRequest('GET', null, { id: 'analysis-123' })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    } as any)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Analysis not found')
  })
})
