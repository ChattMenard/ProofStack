import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/github/repos'
import supabaseServer from '../../../lib/supabaseServer'
import { requireAuth } from '../../../lib/requireAuth'

// Mock external dependencies
jest.mock('../../../lib/supabaseServer')
jest.mock('../../../lib/requireAuth')
jest.mock('node-fetch', () => jest.fn())

const mockSupabase = supabaseServer as jest.Mocked<typeof supabaseServer>
const mockRequireAuth = requireAuth as jest.MockedFunction<any>
const mockFetch = require('node-fetch') as jest.MockedFunction<any>

describe('/api/github/repos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockSupabase as any).auth = {
      admin: {
        getUserById: jest.fn()
      }
    }
  })

  it('should reject non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
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
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing bearer token'
    })
  })

  it('should return error if GitHub token not found', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          user_metadata: {},
          app_metadata: {}
        }
      },
      error: null
    } as any)

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'GitHub not connected. Please sign in with GitHub first.'
    })
  })

  it('should fetch and return user repos', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    const mockUserData = {
      user: {
        user_metadata: { provider_token: 'github-token-123' },
        app_metadata: {}
      }
    }

    const mockRepos = [
      { id: 1, name: 'repo1', full_name: 'user/repo1' },
      { id: 2, name: 'repo2', full_name: 'user/repo2' }
    ]

    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: mockUserData,
      error: null
    } as any)

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockRepos)
    }
    mockFetch.mockResolvedValue(mockResponse)

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { Authorization: 'token github-token-123' }
    })
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(mockRepos)
  })

  it('should handle GitHub API errors', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          user_metadata: { provider_token: 'github-token-123' },
          app_metadata: {}
        }
      },
      error: null
    } as any)

    const mockResponse = {
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized')
    }
    mockFetch.mockResolvedValue(mockResponse)

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch repos'
    })
  })

  it('should handle database errors', async () => {
    const mockUser = { id: 'user-123' }
    mockRequireAuth.mockResolvedValue(mockUser)

    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    } as any)

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Database error'
    })
  })
})