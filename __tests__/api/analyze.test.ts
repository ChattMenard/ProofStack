import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/analyze'
import supabaseServer from '../../lib/supabaseServer'
import extractSkillsFromText from '../../lib/ai/skillExtractor'
import analyzeRepo from '../../lib/analyzers/githubAnalyzer'

// Mock external dependencies
jest.mock('../../lib/supabaseServer')
jest.mock('../../lib/requireAuth', () => ({
  requireAuth: jest.fn()
}))
jest.mock('../../lib/ai/skillExtractor')
jest.mock('../../lib/analyzers/githubAnalyzer')

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>
const mockRequireAuth = require('../../lib/requireAuth').requireAuth as jest.MockedFunction<any>
const mockExtractSkills = extractSkillsFromText as jest.MockedFunction<typeof extractSkillsFromText>
const mockAnalyzeRepo = analyzeRepo as jest.MockedFunction<typeof analyzeRepo>

describe('/api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should reject requests without authentication', async () => {
    mockRequireAuth.mockImplementation(async (req, res) => {
      res.status(401).json({ error: 'Missing bearer token' })
      return null
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'sample-123' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing bearer token'
    })
  })

  it('should reject requests without sample_id', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'sample_id required'
    })
  })

  it('should return 404 for non-existent sample', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    } as any)

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'non-existent' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Sample not found'
    })
  })

  it('should analyze writing sample and extract skills', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const mockSample = {
      id: 'sample-123',
      type: 'writing',
      content: 'test content'
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing'
    }

    const mockSkills = [
      { skill: 'JavaScript', level: 80, evidence: ['code examples'], confidence: 0.9 }
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'samples') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSample, error: null })
            })
          })
        } as any
      }
      if (table === 'analyses') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        } as any
      }
      return {} as any
    })

    mockExtractSkills.mockResolvedValue(mockSkills)

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'sample-123' }
    })

    await handler(req, res)

    expect(mockExtractSkills).toHaveBeenCalledWith('test content')
    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.analysis.result).toEqual({ skills: mockSkills })
  })

  it('should analyze code sample', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const mockSample = {
      id: 'sample-123',
      type: 'code',
      content: 'function test() {}'
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing'
    }

    const mockSkills = [
      { skill: 'JavaScript', level: 90, evidence: ['function syntax'], confidence: 0.95 }
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'samples') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSample, error: null })
            })
          })
        } as any
      }
      if (table === 'analyses') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        } as any
      }
      return {} as any
    })

    mockExtractSkills.mockResolvedValue(mockSkills)

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'sample-123' }
    })

    await handler(req, res)

    expect(mockExtractSkills).toHaveBeenCalledWith('function test() {}')
    expect(res._getStatusCode()).toBe(200)
  })

  it('should analyze GitHub repo sample', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const mockSample = {
      id: 'sample-123',
      type: 'repo',
      source_url: 'https://github.com/owner/repo'
    }

    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing'
    }

    const mockRepoData = {
      repo: 'repo',
      owner: 'owner',
      languages: { 'JavaScript': 1000, 'TypeScript': 500 },
      recent_commits: [
        { sha: 'abc123', message: 'Initial commit', date: '2023-01-01', author: 'testuser' }
      ],
      fetched_at: '2023-10-16T10:00:00Z'
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'samples') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSample, error: null })
            })
          })
        } as any
      }
      if (table === 'analyses') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        } as any
      }
      return {} as any
    })

    mockAnalyzeRepo.mockResolvedValue(mockRepoData)

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'sample-123' }
    })

    await handler(req, res)

    expect(mockAnalyzeRepo).toHaveBeenCalledWith('owner', 'repo', undefined)
    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.analysis.result).toEqual({ github: mockRepoData })
  })

  it('should handle database errors gracefully', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any)

    const { req, res } = createMocks({
      method: 'POST',
      body: { sample_id: 'sample-123' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Database error'
    })
  })
})