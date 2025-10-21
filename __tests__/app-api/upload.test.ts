/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST, GET } from '../../app/api/upload/route'
import { supabaseServer } from '../../lib/supabaseServer'
import { checkRateLimit } from '../../lib/rateLimit'
import { v2 as cloudinary } from 'cloudinary'

// Mock external dependencies
jest.mock('../../lib/supabaseServer')
jest.mock('../../lib/rateLimit')
jest.mock('cloudinary')

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>

// Helper to create mock NextRequest
function createMockRequest(
  method: string,
  body?: any,
  headers?: Record<string, string>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/upload')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const req = {
    method,
    url: url.toString(),
    headers: {
      get: (name: string) => headers?.[name.toLowerCase()] || null,
    },
    json: async () => body,
  } as unknown as NextRequest

  return req
}

describe('POST /app/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: rate limit allows request
    mockCheckRateLimit.mockReturnValue({ allowed: true })
  })

  it('should reject requests without authorization', async () => {
    const req = createMockRequest('POST', { type: 'writing', content: 'test' })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should reject requests with invalid token', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test' },
      { authorization: 'Bearer invalid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthError', message: 'Invalid token' },
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid token')
  })

  it('should reject requests when profile not found', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test' },
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

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
    expect(data.error).toBe('Profile not found')
  })

  it('should reject invalid sample type', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'invalid', content: 'test' },
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'profile-123', plan: 'free', is_founder: false },
            error: null,
          }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid sample type')
  })

  it('should reject files that are too large', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test', size_bytes: 25 * 1024 * 1024 }, // 25MB
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'profile-123', plan: 'free', is_founder: false },
            error: null,
          }),
        }),
      }),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('File too large (max 20MB)')
  })

  it('should reject requests when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false })

    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test' },
      { authorization: 'Bearer valid-token' }
    )

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many uploads. Please wait a moment.')
  })

  it('should successfully upload text content', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test content', filename: 'test.txt', size_bytes: 100 },
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    const mockSample = {
      id: 'sample-123',
      owner_id: 'profile-123',
      type: 'writing',
      content: 'test content',
      filename: 'test.txt',
    }

    const mockAnalysis = {
      id: 'analysis-123',
      sample_id: 'sample-123',
      status: 'queued',
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'profile-123', plan: 'free', is_founder: false },
                error: null,
              }),
            }),
          }),
        } as any
      }
      if (table === 'samples') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSample, error: null }),
            }),
          }),
        } as any
      }
      if (table === 'analyses') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    // Mock fetch for the analysis trigger
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.sample_id).toBe('sample-123')
    expect(data.analysis_id).toBe('analysis-123')
  })

  it('should handle Cloudinary upload for fileData', async () => {
    const req = createMockRequest(
      'POST',
      {
        type: 'design',
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        filename: 'test.png',
        size_bytes: 100,
      },
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    mockCloudinary.uploader = {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg',
        public_id: 'test-public-id',
      }),
    } as any

    const mockSample = {
      id: 'sample-123',
      owner_id: 'profile-123',
      type: 'design',
      storage_url: 'https://cloudinary.com/test-image.jpg',
      filename: 'test.png',
    }

    const mockAnalysis = {
      id: 'analysis-123',
      sample_id: 'sample-123',
      status: 'queued',
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'profile-123', plan: 'free', is_founder: false },
                error: null,
              }),
            }),
          }),
        } as any
      }
      if (table === 'samples') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSample, error: null }),
            }),
          }),
        } as any
      }
      if (table === 'analyses') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockCloudinary.uploader.upload).toHaveBeenCalled()
  })

  it('should handle database errors gracefully', async () => {
    const req = createMockRequest(
      'POST',
      { type: 'writing', content: 'test', size_bytes: 100 },
      { authorization: 'Bearer valid-token' }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'profile-123', plan: 'free', is_founder: false },
                error: null,
              }),
            }),
          }),
        } as any
      }
      if (table === 'samples') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create sample')
  })
})

describe('GET /app/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject requests without authorization', async () => {
    const req = createMockRequest('GET')

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should reject requests with invalid token', async () => {
    const req = createMockRequest('GET', null, { authorization: 'Bearer invalid-token' })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthError', message: 'Invalid token' },
    } as any)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid token')
  })

  it('should return user samples with analyses', async () => {
    const req = createMockRequest('GET', null, { authorization: 'Bearer valid-token' })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    const mockSamples = [
      {
        id: 'sample-1',
        type: 'writing',
        title: 'Test Sample 1',
        analyses: [
          {
            id: 'analysis-1',
            status: 'done',
            summary: 'Test summary',
          },
        ],
      },
      {
        id: 'sample-2',
        type: 'code',
        title: 'Test Sample 2',
        analyses: [],
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'profile-123' },
                error: null,
              }),
            }),
          }),
        } as any
      }
      if (table === 'samples') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockSamples, error: null }),
              }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.samples).toHaveLength(2)
    expect(data.samples[0].id).toBe('sample-1')
  })

  it('should handle database errors when fetching samples', async () => {
    const req = createMockRequest('GET', null, { authorization: 'Bearer valid-token' })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'profile-123' },
                error: null,
              }),
            }),
          }),
        } as any
      }
      if (table === 'samples') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch samples')
  })
})
