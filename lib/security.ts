/**
 * Security utilities for ProofStack
 * Detects secrets, sanitizes input, validates content
 */

// Secret detection patterns
const SECRET_PATTERNS = [
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'critical'
  },
  {
    name: 'OpenAI Project Key',
    pattern: /sk-proj-[a-zA-Z0-9_-]{48,}/g,
    severity: 'critical'
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[A-Z0-9]{16}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/g,
    severity: 'critical'
  },
  {
    name: 'Google API Key',
    pattern: /AIza[a-zA-Z0-9_-]{35}/g,
    severity: 'critical'
  },
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'critical'
  },
  {
    name: 'Stripe Test Key',
    pattern: /sk_test_[a-zA-Z0-9]{24,}/g,
    severity: 'high'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'high'
  },
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key['"]?\s*[:=]\s*['"]?[a-zA-Z0-9_-]{32,}['"]?/gi,
    severity: 'high'
  },
  {
    name: 'Password in Code',
    pattern: /password['"]?\s*[:=]\s*['"]?[^'"\s]{8,}['"]?/gi,
    severity: 'high'
  },
  {
    name: 'Database Connection String',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/gi,
    severity: 'critical'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical'
  },
  {
    name: 'Supabase Service Role Key',
    pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    severity: 'critical'
  }
]

export interface SecretDetectionResult {
  found: boolean
  secrets: Array<{
    type: string
    severity: string
    match: string
    position: number
  }>
}

/**
 * Scan content for potential secrets/credentials
 * Returns list of found secrets with severity levels
 */
export function detectSecrets(content: string): SecretDetectionResult {
  const secrets: SecretDetectionResult['secrets'] = []

  for (const { name, pattern, severity } of SECRET_PATTERNS) {
    const matches = content.matchAll(pattern)
    
    for (const match of matches) {
      secrets.push({
        type: name,
        severity,
        match: match[0].substring(0, 20) + '...', // Show first 20 chars only
        position: match.index || 0
      })
    }
  }

  return {
    found: secrets.length > 0,
    secrets
  }
}

/**
 * Get user-friendly warning message for detected secrets
 */
export function getSecretWarningMessage(result: SecretDetectionResult): string {
  if (!result.found) return ''

  const criticalCount = result.secrets.filter(s => s.severity === 'critical').length
  const highCount = result.secrets.filter(s => s.severity === 'high').length

  const secretTypes = [...new Set(result.secrets.map(s => s.type))].join(', ')

  return `⚠️ WARNING: Detected ${result.secrets.length} potential secret(s) in your content: ${secretTypes}. ` +
    `${criticalCount > 0 ? `${criticalCount} critical, ` : ''}${highCount > 0 ? `${highCount} high` : ''}. ` +
    `Please remove all API keys, passwords, and credentials before uploading.`
}

/**
 * Check if content is safe to upload
 * Returns { safe: boolean, reason?: string }
 */
export function isContentSafe(content: string): { safe: boolean; reason?: string } {
  // Check for secrets
  const secretCheck = detectSecrets(content)
  if (secretCheck.found) {
    const criticalSecrets = secretCheck.secrets.filter(s => s.severity === 'critical')
    if (criticalSecrets.length > 0) {
      return {
        safe: false,
        reason: getSecretWarningMessage(secretCheck)
      }
    }
  }

  // Check for malicious patterns
  const maliciousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=\s*["'][^"']*["']/gi, // Inline event handlers
    /<iframe[^>]*>/gi, // Iframes
    /<embed[^>]*>/gi, // Embeds
    /<object[^>]*>/gi, // Objects
  ]

  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      return {
        safe: false,
        reason: '⚠️ Content contains potentially malicious code (script tags, event handlers, or embedded content). Please remove these elements.'
      }
    }
  }

  return { safe: true }
}

/**
 * Sanitize content while preserving safe formatting
 * Uses DOMPurify for XSS protection
 */
export function sanitizeContent(content: string): string {
  // Import DOMPurify
  let DOMPurify: any
  if (typeof window !== 'undefined') {
    // Browser environment
    DOMPurify = require('dompurify')
  } else {
    // Node environment
    DOMPurify = require('isomorphic-dompurify')
  }

  // Configure DOMPurify to allow safe HTML tags
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  })

  return clean
}

/**
 * Validate file upload metadata
 */
export function validateFileUpload(file: {
  type?: string
  size?: number
  filename?: string
}): { valid: boolean; reason?: string } {
  const MAX_SIZE = 20 * 1024 * 1024 // 20MB
  const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

  if (file.size && file.size > MAX_SIZE) {
    return {
      valid: false,
      reason: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 20MB.`
    }
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      reason: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    }
  }

  if (file.filename) {
    // Check for directory traversal
    if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
      return {
        valid: false,
        reason: 'Invalid filename: contains directory traversal characters'
      }
    }

    // Check for null bytes
    if (file.filename.includes('\0')) {
      return {
        valid: false,
        reason: 'Invalid filename: contains null bytes'
      }
    }
  }

  return { valid: true }
}
