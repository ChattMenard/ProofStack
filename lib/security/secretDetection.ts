/**
 * Secret Detection System
 * Scans work samples for accidentally exposed credentials, API keys, tokens
 * CRITICAL: Must run BEFORE storage and BEFORE sending to OpenAI API
 */

export interface SecretDetectionResult {
  hasSecrets: boolean;
  secrets: DetectedSecret[];
  sanitizedContent?: string;
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectedSecret {
  type: string;
  line: number;
  position: { start: number; end: number };
  matched: string; // Redacted version
  confidence: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Common secret patterns (regex)
const SECRET_PATTERNS = [
  // API Keys
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?token)["\s:=]+([a-zA-Z0-9_\-]{20,})/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'GitHub OAuth',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
    severity: 'high' as const,
    confidence: 'high' as const,
  },
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'Twilio API Key',
    pattern: /SK[a-z0-9]{32}/g,
    severity: 'high' as const,
    confidence: 'medium' as const,
  },
  
  // Passwords
  {
    name: 'Password in Code',
    pattern: /(?:password|passwd|pwd)["\s:=]+["']([^"']{8,})["']/gi,
    severity: 'critical' as const,
    confidence: 'medium' as const,
  },
  {
    name: 'Database Password',
    pattern: /(?:db_password|database_password|db_pass)["\s:=]+["']([^"']{6,})["']/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  
  // Connection Strings
  {
    name: 'PostgreSQL Connection String',
    pattern: /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb(?:\+srv)?:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'MySQL Connection String',
    pattern: /mysql:\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  
  // Private Keys
  {
    name: 'RSA Private Key',
    pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  {
    name: 'PGP Private Key',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
  
  // JWT Tokens
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'high' as const,
    confidence: 'medium' as const,
  },
  
  // Generic Secrets
  {
    name: 'Generic Secret/Token',
    pattern: /(?:secret|token|key)["\s:=]+["']([a-zA-Z0-9_\-]{32,})["']/gi,
    severity: 'medium' as const,
    confidence: 'medium' as const,
  },
  
  // Environment Variables (common patterns)
  {
    name: 'Supabase Secret Key',
    pattern: /SUPABASE_SERVICE_ROLE_KEY["\s:=]+["']([a-zA-Z0-9_\-\.]{40,})["']/gi,
    severity: 'critical' as const,
    confidence: 'high' as const,
  },
];

/**
 * Scan content for secrets
 */
export function detectSecrets(content: string): SecretDetectionResult {
  const secrets: DetectedSecret[] = [];
  const lines = content.split('\n');
  
  for (const patternDef of SECRET_PATTERNS) {
    const matches = content.matchAll(patternDef.pattern);
    
    for (const match of matches) {
      if (!match[0]) continue;
      
      // Find line number
      const position = match.index || 0;
      const beforeMatch = content.substring(0, position);
      const lineNumber = beforeMatch.split('\n').length;
      
      // Redact the matched secret
      const matched = match[0];
      const redacted = matched.substring(0, Math.min(4, matched.length)) + 
        '*'.repeat(Math.max(0, matched.length - 4));
      
      secrets.push({
        type: patternDef.name,
        line: lineNumber,
        position: {
          start: position,
          end: position + matched.length,
        },
        matched: redacted,
        confidence: patternDef.confidence,
        severity: patternDef.severity,
      });
    }
  }
  
  // Calculate overall risk
  let risk: SecretDetectionResult['risk'] = 'none';
  if (secrets.length > 0) {
    const hasCritical = secrets.some(s => s.severity === 'critical');
    const hasHigh = secrets.some(s => s.severity === 'high');
    const hasMedium = secrets.some(s => s.severity === 'medium');
    
    if (hasCritical) risk = 'critical';
    else if (hasHigh) risk = 'high';
    else if (hasMedium) risk = 'medium';
    else risk = 'low';
  }
  
  return {
    hasSecrets: secrets.length > 0,
    secrets,
    risk,
  };
}

/**
 * Sanitize content by replacing detected secrets with placeholders
 */
export function sanitizeSecrets(content: string, result: SecretDetectionResult): string {
  if (!result.hasSecrets) return content;
  
  let sanitized = content;
  
  // Sort secrets by position (descending) to maintain positions during replacement
  const sortedSecrets = [...result.secrets].sort((a, b) => b.position.start - a.position.start);
  
  for (const secret of sortedSecrets) {
    const before = sanitized.substring(0, secret.position.start);
    const after = sanitized.substring(secret.position.end);
    const placeholder = `[${secret.type.toUpperCase()}_REDACTED]`;
    
    sanitized = before + placeholder + after;
  }
  
  return sanitized;
}

/**
 * Detect PII (Personally Identifiable Information)
 */
export function detectPII(content: string): { hasPII: boolean; types: string[] } {
  const piiPatterns = [
    { name: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { name: 'Phone (US)', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
    { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
    { name: 'IPv4 Address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  ];
  
  const detectedTypes: string[] = [];
  
  for (const { name, pattern } of piiPatterns) {
    if (pattern.test(content)) {
      detectedTypes.push(name);
    }
  }
  
  return {
    hasPII: detectedTypes.length > 0,
    types: detectedTypes,
  };
}

/**
 * Main validation function - call before storing work samples
 */
export async function validateWorkSampleSecurity(
  content: string
): Promise<{
  safe: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for secrets
  const secretResult = detectSecrets(content);
  
  if (secretResult.hasSecrets) {
    const criticalSecrets = secretResult.secrets.filter(s => s.severity === 'critical');
    const highSecrets = secretResult.secrets.filter(s => s.severity === 'high');
    
    if (criticalSecrets.length > 0) {
      errors.push(
        `🚨 CRITICAL: Detected ${criticalSecrets.length} high-risk secret(s). ` +
        `Types: ${criticalSecrets.map(s => s.type).join(', ')}. ` +
        `Please remove all API keys, passwords, and tokens before submitting.`
      );
    }
    
    if (highSecrets.length > 0) {
      warnings.push(
        `⚠️ WARNING: Detected ${highSecrets.length} potential secret(s). ` +
        `Types: ${highSecrets.map(s => s.type).join(', ')}. ` +
        `Please review your submission.`
      );
    }
  }
  
  // Check for PII
  const piiResult = detectPII(content);
  
  if (piiResult.hasPII) {
    warnings.push(
      `⚠️ WARNING: Detected potential PII (${piiResult.types.join(', ')}). ` +
      `Consider redacting personal information.`
    );
  }
  
  // Generate sanitized version if needed
  let sanitizedContent: string | undefined;
  if (secretResult.hasSecrets) {
    sanitizedContent = sanitizeSecrets(content, secretResult);
  }
  
  return {
    safe: errors.length === 0,
    errors,
    warnings,
    sanitizedContent,
  };
}

/**
 * Log security validation results
 */
export async function logSecurityValidation(
  userId: string,
  professionalId: string,
  validationResult: Awaited<ReturnType<typeof validateWorkSampleSecurity>>
): Promise<void> {
  // This will be called from the API to log to security_audit_log
  if (!validationResult.safe) {
    console.error('[SECURITY] Work sample validation failed', {
      userId,
      professionalId,
      errors: validationResult.errors,
      timestamp: new Date().toISOString(),
    });
    
    // Could also send to monitoring service (e.g., Sentry, DataDog)
  }
}

// Export for testing
export { SECRET_PATTERNS };
