/**
 * Fuzz tests for upload handling
 * Tests edge cases, large files, unexpected MIME types, and malicious inputs
 */

import { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../pages/api/upload'
import { createMocks } from 'node-mocks-http'

// Mock Supabase
jest.mock('../../lib/supabaseServer', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-sample-id', user_id: 'test-user' },
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('Upload API - Fuzz Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('File Size Tests', () => {
    it('should reject files over 50MB', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN}`
        },
        body: {
          url: 'https://example.com/large-file.zip',
          type: 'code',
          size: 60 * 1024 * 1024 // 60MB
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toMatchObject({
        error: expect.stringContaining('File too large')
      })
    })

    it('should accept files at exactly 50MB limit', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/exact-limit.zip',
          type: 'code',
          size: 50 * 1024 * 1024 // Exactly 50MB
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })

    it('should reject zero-byte files', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/empty.txt',
          type: 'code',
          size: 0
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toMatchObject({
        error: expect.stringContaining('empty')
      })
    })

    it('should handle negative file sizes', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: -100
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('MIME Type Tests', () => {
    const unexpectedMimeTypes = [
      'application/x-msdownload', // .exe
      'application/x-sh', // shell script
      'application/x-php', // PHP
      'application/x-httpd-php',
      'text/html', // HTML with potentially malicious scripts
      'application/x-executable',
      'application/vnd.microsoft.portable-executable',
      'application/x-dosexec',
      'application/x-mach-binary',
      'text/x-python', // Should be text/plain or application/x-python
      'image/svg+xml', // SVG can contain scripts
      'application/x-shockwave-flash', // Flash
      'application/x-java-archive', // JAR files
    ]

    unexpectedMimeTypes.forEach(mimeType => {
      it(`should handle unexpected MIME type: ${mimeType}`, async () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
          },
          body: {
            url: 'https://example.com/file',
            type: 'code',
            mimeType,
            size: 1000
          }
        })

        await handler(req, res)

        // Should either accept or gracefully reject
        const statusCode = res._getStatusCode()
        expect([200, 400, 415]).toContain(statusCode)
      })
    })

    it('should handle missing MIME type', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file.unknown',
          type: 'code',
          size: 1000
          // mimeType intentionally omitted
        }
      })

      await handler(req, res)

      const statusCode = res._getStatusCode()
      expect([200, 400, 415]).toContain(statusCode)
    })

    it('should handle invalid MIME type format', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file',
          type: 'code',
          mimeType: 'not-a-valid-mime-type',
          size: 1000
        }
      })

      await handler(req, res)

      const statusCode = res._getStatusCode()
      expect([200, 400, 415]).toContain(statusCode)
    })
  })

  describe('URL Validation Tests', () => {
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'file:///etc/passwd',
      'ftp://malicious-server.com/file',
      '../../../etc/passwd',
      'https://example.com/../../etc/passwd',
      'http://localhost:22/admin', // SSRF attempt
      'http://169.254.169.254/latest/meta-data/', // AWS metadata SSRF
      'http://[::1]/admin', // IPv6 localhost
      'https://evil.com@good.com/file', // URL confusion
      'https://good.com:evil.com/file',
    ]

    maliciousUrls.forEach(url => {
      it(`should reject potentially malicious URL: ${url}`, async () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
          },
          body: {
            url,
            type: 'code',
            size: 1000
          }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBeGreaterThanOrEqual(400)
      })
    })

    it('should reject URLs with null bytes', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file\0.txt',
          type: 'code',
          size: 1000
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400)
    })

    it('should handle extremely long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000)
      
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: longUrl,
          type: 'code',
          size: 1000
        }
      })

      await handler(req, res)

      const statusCode = res._getStatusCode()
      expect([200, 400, 414]).toContain(statusCode)
    })
  })

  describe('Request Body Fuzzing', () => {
    it('should handle missing required fields', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          // Missing url, type, size
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle null values', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: null,
          type: null,
          size: null
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle invalid type field', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'invalid-type-not-in-enum',
          size: 1000
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle SQL injection attempts in description', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE samples; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
      ]

      for (const injection of sqlInjectionAttempts) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
          },
          body: {
            url: 'https://example.com/file.txt',
            type: 'code',
            size: 1000,
            description: injection
          }
        })

        await handler(req, res)

        // Should not crash or execute SQL
        const statusCode = res._getStatusCode()
        expect([200, 400]).toContain(statusCode)
      }
    })

    it('should handle XSS attempts in description', async () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
      ]

      for (const xss of xssAttempts) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
          },
          body: {
            url: 'https://example.com/file.txt',
            type: 'code',
            size: 1000,
            description: xss
          }
        })

        await handler(req, res)

        // Should sanitize or reject
        const statusCode = res._getStatusCode()
        expect([200, 400]).toContain(statusCode)
      }
    })

    it('should handle extremely long description', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: 1000,
          description: 'a'.repeat(100000) // 100k characters
        }
      })

      await handler(req, res)

      const statusCode = res._getStatusCode()
      expect([200, 400, 413]).toContain(statusCode)
    })

    it('should handle unicode and special characters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: 1000,
          description: '你好世界 🚀 Здравствуй мир ñ é ü'
        }
      })

      await handler(req, res)

      // Should handle unicode gracefully
      const statusCode = res._getStatusCode()
      expect([200, 400]).toContain(statusCode)
    })
  })

  describe('Authentication Fuzzing', () => {
    it('should reject malformed JWT', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer not-a-valid-jwt-token'
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: 1000
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid'
      
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${expiredToken}`
        },
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: 1000
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          url: 'https://example.com/file.txt',
          type: 'code',
          size: 1000
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Rate Limiting & DoS Tests', () => {
    it('should handle multiple rapid requests', async () => {
      const requests = Array.from({ length: 100 }, async () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'test-token'}`
          },
          body: {
            url: 'https://example.com/file.txt',
            type: 'code',
            size: 1000
          }
        })

        await handler(req, res)
        return res._getStatusCode()
      })

      const results = await Promise.all(requests)
      
      // Should handle gracefully without crashing
      expect(results.every(code => code >= 200 && code < 600)).toBe(true)
    })
  })
})
