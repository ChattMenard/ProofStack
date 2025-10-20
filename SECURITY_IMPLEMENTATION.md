# Security Hardening Implementation Guide

**Status:** 🔴 CRITICAL - Immediate Action Required  
**Date:** October 20, 2024  
**Priority:** P0 - Deploy immediately

---

## Quick Start: Immediate Actions

### Step 1: Apply Database Migrations (5 minutes)

```bash
# In Supabase SQL Editor, run in this order:

# 1. Add audit logging
# File: supabase/migrations/add_security_audit_logging.sql
# Creates security_audit_log table and functions

# 2. Harden work samples
# File: supabase/migrations/harden_work_samples_security.sql
# Fixes SECURITY DEFINER vulnerabilities, adds validation
```

**CRITICAL:** Run these migrations in production immediately.

### Step 2: Update Environment Variables (2 minutes)

Ensure these are set in Vercel/production:

```bash
# Required for rate limiting (already configured)
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token

# Required for OpenAI
OPENAI_API_KEY=your_key

# Required for audit logging
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 3: Deploy Security Updates (10 minutes)

```bash
# Commit all security files
git add lib/security/
git add supabase/migrations/add_security_audit_logging.sql
git add supabase/migrations/harden_work_samples_security.sql
git add SECURITY_AUDIT.md
git commit -m "CRITICAL: Implement security hardening (audit logs, rate limiting, secret detection)"
git push origin main

# Deploy to production immediately
vercel --prod
```

---

## Files Created

### 1. Audit Logging System
**File:** `supabase/migrations/add_security_audit_logging.sql`

**What it does:**
- Creates immutable audit log table
- Logs all work sample access
- Detects suspicious activity patterns
- Required for compliance (GDPR Article 33)

**Key functions:**
- `log_work_sample_access()` - Log every access
- `detect_suspicious_activity()` - Find scrapers
- `get_audit_trail()` - Forensic investigations

**Usage:**
```sql
-- Log an access
SELECT log_work_sample_access(
  'user-uuid',
  'work_sample_view',
  'sample-uuid',
  true,
  '{"ip": "1.2.3.4"}'::jsonb
);

-- Check for suspicious users
SELECT * FROM security_audit_log 
WHERE suspicious = true 
AND timestamp > now() - interval '24 hours';
```

### 2. Security Hardening Migration
**File:** `supabase/migrations/harden_work_samples_security.sql`

**What it fixes:**
- ✅ SECURITY DEFINER vulnerability (validates auth.uid())
- ✅ RLS policy loopholes
- ✅ Content validation (basic secret detection)
- ✅ Automatic scraping detection
- ✅ Admin review functions

**Key improvements:**
- `get_work_sample_content()` - Now validates viewer_id
- `check_work_sample_access_rate()` - Detects mass scraping
- `validate_work_sample_content()` - Blocks obvious secrets
- `get_flagged_work_samples()` - Admin review tool

### 3. Secret Detection Library
**File:** `lib/security/secretDetection.ts`

**What it detects:**
- API keys (OpenAI, Stripe, AWS, GitHub, Google, etc.)
- Passwords and database credentials
- Connection strings (PostgreSQL, MongoDB, MySQL)
- Private keys (RSA, SSH, PGP)
- JWT tokens
- PII (emails, phone numbers, SSNs, credit cards)

**Usage:**
```typescript
import { validateWorkSampleSecurity } from '@/lib/security/secretDetection';

const result = await validateWorkSampleSecurity(content);

if (!result.safe) {
  // Block submission
  return { error: result.errors.join(', ') };
}
```

**Example output:**
```json
{
  "safe": false,
  "errors": [
    "🚨 CRITICAL: Detected 1 high-risk secret(s). Types: OpenAI API Key. Please remove all API keys before submitting."
  ],
  "warnings": [
    "⚠️ WARNING: Detected potential PII (Email, Phone (US)). Consider redacting."
  ]
}
```

### 4. Rate Limiting System
**File:** `lib/security/rateLimiting.ts`

**What it prevents:**
- Scraping attacks
- DDoS attacks
- Brute force login attempts
- API abuse

**Rate limits configured:**
```typescript
WORK_SAMPLE_VIEW: 50 requests / hour
WORK_SAMPLE_CREATE: 10 requests / hour
AI_ANALYSIS: 20 requests / hour
AUTH_LOGIN: 5 attempts / 15 minutes
API_GENERAL: 100 requests / minute
```

**Usage in API route:**
```typescript
import { withRateLimit } from '@/lib/security/rateLimiting';

export async function GET(req: Request) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(
    req,
    'workSampleView',
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    }
  );
  
  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }
  
  // Continue with logic...
}
```

### 5. Secure Work Sample Analysis API
**File:** `app/api/work-samples/analyze/route-secure.ts`

**Security features:**
- ✅ Rate limiting
- ✅ Secret detection before OpenAI
- ✅ Audit logging
- ✅ Input validation
- ✅ Permission checks
- ✅ Prevents duplicate analysis (cost savings)

**To use:** Replace current `route.ts` with `route-secure.ts`

```bash
cd app/api/work-samples/analyze/
mv route.ts route-old.ts
mv route-secure.ts route.ts
```

---

## Integration Steps

### Phase 1: Critical (Deploy Today)

#### 1. Apply Database Migrations
```sql
-- In Supabase SQL Editor:
-- Run add_security_audit_logging.sql
-- Run harden_work_samples_security.sql
```

#### 2. Add Secret Detection to Review Form
**File to modify:** `app/employer/reviews/new/[professionalId]/page.tsx`

```typescript
// Add at top
import { validateWorkSampleSecurity } from '@/lib/security/secretDetection';

// Before submitting work sample
const securityCheck = await validateWorkSampleSecurity(formData.work_sample);

if (!securityCheck.safe) {
  setError(securityCheck.errors[0]);
  return;
}

if (securityCheck.warnings.length > 0) {
  // Show warnings but allow submission
  setWarning(securityCheck.warnings.join(' '));
}
```

#### 3. Add Rate Limiting to Existing APIs

**Files to update:**
- `app/api/work-samples/analyze/route.ts`
- `app/api/employer/search/route.ts`
- `app/api/profiles/[username]/route.ts`

**Pattern:**
```typescript
import { withRateLimit } from '@/lib/security/rateLimiting';

export async function POST(req: Request) {
  const limit = await withRateLimit(req, 'apiGeneral', getUserIdFunc);
  if (limit) return limit;
  
  // Rest of code...
}
```

#### 4. Add Audit Logging to Work Sample Views

**File to modify:** `components/WorkSamplesSection.tsx`

```typescript
// When displaying a work sample
useEffect(() => {
  if (selectedSample) {
    // Log view
    fetch('/api/audit/log', {
      method: 'POST',
      body: JSON.stringify({
        action: 'work_sample_view',
        resource_id: selectedSample.id,
        metadata: {
          confidentiality_level: selectedSample.confidentiality_level,
        }
      })
    });
  }
}, [selectedSample]);
```

### Phase 2: High Priority (This Week)

#### 5. Add Content Security Policy (CSP)
**File:** `next.config.js`

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.openai.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

#### 6. Create Audit Log Dashboard
**File:** `app/admin/security/page.tsx`

Create admin page to view:
- Suspicious activity
- Failed access attempts
- Top accessed samples
- Rate limit violations

#### 7. Set Up Monitoring Alerts

Use your preferred monitoring service (Sentry, DataDog, etc.):

```typescript
// Alert on suspicious activity
if (suspiciousCount > 10) {
  Sentry.captureMessage('High suspicious activity detected', {
    level: 'warning',
    extra: { userId, count: suspiciousCount }
  });
}
```

### Phase 3: Medium Priority (Next Sprint)

#### 8. Implement Actual Encryption

Replace hash-based encryption in `harden_work_samples_security.sql`:

```sql
-- Use pgcrypto for real encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_work_sample_content(
  p_sample_id uuid,
  p_content text,
  p_encryption_key text
)
RETURNS boolean AS $$
BEGIN
  UPDATE work_samples
  SET 
    encrypted_content = pgp_sym_encrypt(p_content, p_encryption_key),
    content = '[ENCRYPTED]'
  WHERE id = p_sample_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 9. Add Security.txt
**File:** `public/.well-known/security.txt`

```
Contact: security@proofstack.dev
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://proofstack.dev/.well-known/security.txt
Policy: https://proofstack.dev/security-policy
```

#### 10. Add Dependency Scanning

**File:** `.github/workflows/security.yml`

```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm audit --audit-level=high
```

---

## Testing the Security Features

### Test 1: Secret Detection
```bash
# Try submitting a work sample with an API key
Content: "const key = 'sk-proj-abc123...'"
Expected: Rejected with error message
```

### Test 2: Rate Limiting
```bash
# Make 60 requests in 1 minute
for i in {1..60}; do
  curl https://your-app.com/api/work-samples/view
done
Expected: 429 after 50 requests
```

### Test 3: Audit Logging
```sql
-- View recent activity
SELECT * FROM security_audit_log 
WHERE timestamp > now() - interval '1 hour'
ORDER BY timestamp DESC;
```

### Test 4: Suspicious Activity Detection
```bash
# View 150 samples rapidly
Expected: Flagged in security_audit_log with suspicious = true
```

---

## Monitoring & Maintenance

### Daily Checks
```sql
-- Check for suspicious activity
SELECT COUNT(*) FROM security_audit_log 
WHERE suspicious = true 
AND timestamp > now() - interval '24 hours';

-- Check rate limit violations
SELECT user_id, COUNT(*) 
FROM security_audit_log 
WHERE success = false 
AND action LIKE '%rate_limit%'
GROUP BY user_id 
ORDER BY COUNT(*) DESC;
```

### Weekly Tasks
- Review flagged work samples
- Check for new secret patterns to add
- Review rate limit thresholds
- Archive old audit logs (2+ years)

### Monthly Tasks
- Update dependency vulnerabilities
- Review access patterns
- Update security documentation
- Test incident response procedures

---

## Incident Response Plan

### If Breach Detected:

1. **Immediate** (Minutes):
   - Block affected user accounts
   - Rotate all API keys
   - Review audit logs for scope

2. **Short Term** (Hours):
   - Notify affected users (GDPR requirement)
   - Document the incident
   - Implement additional controls

3. **Long Term** (Days):
   - Root cause analysis
   - Update security measures
   - Third-party security audit

### Contact Information:
- **Security Lead:** [Your email]
- **On-Call:** [Phone number]
- **Incident Email:** security@proofstack.dev

---

## Compliance Checklist

### GDPR (if serving EU users)
- [x] Right to erasure (CASCADE deletes)
- [x] Breach notification capability (audit logs)
- [ ] Data minimization (PII detection implemented, needs review)
- [ ] Encryption at rest (needs actual encryption, not hash)
- [x] Audit trail (comprehensive logging)

### SOC 2 (if pursuing enterprise)
- [x] Audit trails
- [x] Access logging
- [ ] Encryption (needs implementation)
- [ ] Incident response plan (documented above)
- [x] Rate limiting

---

## Cost Impact

### Upstash Redis (Rate Limiting)
- Current: ~$10/month
- With rate limiting: ~$20-30/month
- Worth it: Prevents scraping and abuse

### Supabase Storage (Audit Logs)
- ~1MB per 10,000 log entries
- 1 million logs = ~100MB
- Negligible cost increase

### OpenAI (AI Analysis)
- No change - prevents duplicate analysis
- Actually saves money by blocking secrets

---

## Next Steps

1. ✅ Review this document
2. [ ] Apply database migrations
3. [ ] Deploy security code
4. [ ] Test all features
5. [ ] Monitor for issues
6. [ ] Schedule follow-up review

**Remember:** Security is ongoing, not one-time.

---

## Questions?

- **Technical:** Check SECURITY_AUDIT.md for detailed vulnerability analysis
- **Implementation:** Review code comments in lib/security/
- **Database:** Review migration files in supabase/migrations/
- **Compliance:** Consult legal team for specific requirements

**Status:** 🟡 Ready for implementation
