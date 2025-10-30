import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/upload'
import supabaseServer from '../../lib/supabaseServer'
import cloudinary from '../../lib/cloudinaryClient'

// Mock external dependencies
jest.mock('../../lib/supabaseServer')
jest.mock('../../lib/requireAuth', () => ({
  requireAuth: jest.fn()
}))
jest.mock('../../lib/cloudinaryClient', () => ({
  uploader: {
    upload: jest.fn()
  }
}))

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>
const mockRequireAuth = require('../../lib/requireAuth').requireAuth as jest.MockedFunction<any>
const mockCloudinary = require('../../lib/cloudinaryClient')

describe('/api/upload', () => {
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
    // Mock requireAuth to simulate auth failure
    mockRequireAuth.mockImplementation(async (req, res) => {
      res.status(401).json({ error: 'Missing bearer token' })
      return null
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing',
        content: 'test content'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing bearer token'
    })
  })

  it('should reject invalid sample types', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'invalid-type',
        content: 'test content'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid sample type'
    })
  })

  it('should reject requests without content, fileData, or storage_url', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing content, fileData, or storage_url'
    })
  })

  it('should reject files that are too large', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    // Mock process.env
    const originalEnv = process.env
    process.env.MAX_UPLOAD_BYTES = '1024' // 1KB limit

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing',
        content: 'x'.repeat(2048), // 2KB content
        size_bytes: 2048
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(413)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Payload too large'
    })

    process.env = originalEnv
  })

  it('should successfully upload text content', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const mockSample = {
      id: 'sample-123',
      owner_id: 'user-123',
      type: 'writing',
      content: 'test content',
      hash: 'mock-hash'
    }

    const mockAnalysis = {
      id: 'analysis-123',
      sample_id: 'sample-123',
      status: 'queued'
    }

    // Mock the samples insert
    const mockSamplesFrom = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSample, error: null })
        })
      })
    }

    // Mock the analyses insert
    const mockAnalysesFrom = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null })
        })
      })
    }

    // Set up mock to return different objects for samples vs analyses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'samples') return mockSamplesFrom as any
      if (table === 'analyses') return mockAnalysesFrom as any
      return {} as any
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing',
        content: 'test content'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.sample).toEqual(mockSample)
    expect(response.analysis).toEqual(mockAnalysis)
  })

  it('should handle Cloudinary upload for fileData', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

  // Mock Cloudinary env vars securely
  process.env.CLOUDINARY_CLOUD_NAME = process.env.TEST_CLOUDINARY_CLOUD_NAME
  process.env.CLOUDINARY_API_KEY = process.env.TEST_CLOUDINARY_API_KEY
  process.env.CLOUDINARY_API_SECRET = process.env.TEST_CLOUDINARY_API_SECRET

    const mockCloudinaryResponse = {
      secure_url: 'https://cloudinary.com/test-image.jpg'
    }

    mockCloudinary.uploader.upload.mockResolvedValue(mockCloudinaryResponse)

    const mockSample = {
      id: 'sample-123',
      owner_id: 'user-123',
      type: 'writing',
      storage_url: 'https://cloudinary.com/test-image.jpg',
      hash: 'mock-hash'
    }

    const mockAnalysis = {
      id: 'analysis-123',
      sample_id: 'sample-123',
      status: 'queued'
    }

    // Mock the samples insert
    const mockSamplesFrom = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSample, error: null })
        })
      })
    }

    // Mock the analyses insert
    const mockAnalysesFrom = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null })
        })
      })
    }

    // Set up mock to return different objects for samples vs analyses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'samples') return mockSamplesFrom as any
      if (table === 'analyses') return mockAnalysesFrom as any
      return {} as any
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing',
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        filename: 'test.png',
        size_bytes: 100
      }
    })

    await handler(req, res)

    expect(mockCloudinary.uploader.upload).toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(200)

  })

  it('should handle database errors gracefully', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'writing',
        content: 'test content'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Database error'
    })
  })
})