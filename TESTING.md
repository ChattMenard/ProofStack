# Testing & Security Documentation

This document outlines ProofStack's comprehensive testing and security scanning setup.

## Testing Strategy

### 1. Unit Tests
Located in `__tests__/` directory, covering:
- Core business logic (skill extraction, analysis)
- API endpoints (upload, analyze, GitHub integration)
- Utility functions and helpers

**Run unit tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm test -- --coverage
```

### 2. Fuzz Tests
Comprehensive security and edge case testing for uploads:
- File size validation (0 bytes, 50MB+, negative sizes)
- MIME type handling (unexpected, malicious, missing types)
- URL validation (XSS, SSRF, SQL injection attempts)
- Authentication fuzzing (malformed JWTs, expired tokens)
- DoS protection (rapid requests, large payloads)

**Run fuzz tests:**
```bash
npm test -- upload.fuzz.test.ts
```

**Location:** `__tests__/api/upload.fuzz.test.ts`

### 3. E2E Tests (Playwright)
Browser-based testing across Chrome, Firefox, and WebKit:
- User authentication flows
- Upload and analysis workflows
- Portfolio viewing
- GitHub integration

**Run E2E tests:**
```bash
npx playwright test
```

**View report:**
```bash
npx playwright show-report
```

### 4. AI Client Mocking
To avoid external network calls in CI and ensure consistent test results:
- Mock responses for Ollama, Anthropic, Hugging Face, OpenAI
- Predefined skill extraction results
- Transcription mocks for audio/video processing

**Location:** `__tests__/mocks/aiClients.ts`

**Usage:**
```typescript
import { mockSkillExtractionResult, mockOllamaClient } from '__tests__/mocks/aiClients'

// In your test
mockOllama.generate.mockResolvedValue({
  response: JSON.stringify(mockSkillExtractionResult)
})
```

## Security Scanning

### 1. Dependabot
Automated dependency updates and security vulnerability detection.

**Configuration:** `.github/dependabot.yml`

**Features:**
- Weekly npm dependency scans
- Weekly Python pip scans
- Monthly GitHub Actions updates
- Automatic PR creation for updates
- Grouped updates by dependency type

**View alerts:**
GitHub → Security → Dependabot alerts

### 2. GitHub Actions Security Workflow
Automated security scanning on every push and PR.

**Configuration:** `.github/workflows/security-scan.yml`

**Includes:**
- **NPM Audit:** Scans for known vulnerabilities in npm packages
- **CodeQL Analysis:** Advanced code scanning for security issues
- **Trivy Scanner:** Container and filesystem vulnerability scanning
- **Dependency Review:** PR-based dependency security analysis
- **Snyk Scan:** (Optional) Additional vulnerability scanning

**Runs:**
- On push to main/develop
- On pull requests
- Weekly scheduled scans (Mondays at 9 AM UTC)
- Manual trigger via workflow_dispatch

### 3. CI Test Pipeline
Continuous integration testing workflow.

**Configuration:** `.github/workflows/ci.yml`

**Includes:**
- Unit tests with coverage reporting
- Fuzz tests for security validation
- Playwright E2E tests
- Build verification
- Multi-version Node.js testing (18.x, 20.x)

**Coverage reporting:**
- Uploaded to Codecov
- Minimum thresholds: 50% for branches, functions, lines, statements

## Security Policy

**Location:** `SECURITY.md`

### Reporting Vulnerabilities
- **Email:** security@proofstack.com
- **GitHub:** Private security advisory
- **Response:** Within 48 hours

### Security Measures
✅ HTTPS/TLS encryption  
✅ Secure authentication (JWT + OAuth)  
✅ Input validation and sanitization  
✅ SQL injection protection  
✅ XSS protection  
✅ CSRF protection  
✅ Rate limiting (planned)  
✅ Encrypted data at rest  
✅ Automated security scans  

## Running Security Scans Locally

### NPM Audit
```bash
npm audit
npm audit --audit-level=high
npm audit fix
```

### Dependency Check
```bash
npm outdated
npm update
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## CI/CD Integration

### GitHub Actions Status Badges
Add to your README:

```markdown
![CI Tests](https://github.com/ChattMenard/ProofStack/workflows/CI%20Tests/badge.svg)
![Security Scan](https://github.com/ChattMenard/ProofStack/workflows/Security%20Scanning/badge.svg)
```

### Branch Protection
Recommended settings:
- Require status checks to pass before merging
- Require branches to be up to date
- Require CI Tests to pass
- Require Security Scan to pass
- Require code review approvals

## Coverage Reports

### Viewing Coverage Locally
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage Thresholds
Configured in `jest.config.js`:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Testing Best Practices

### 1. Mock External Services
Always mock external API calls to:
- Avoid flaky tests from network issues
- Ensure consistent test results
- Speed up test execution
- Avoid rate limiting

### 2. Test Edge Cases
Include tests for:
- Empty inputs
- Invalid data types
- Boundary values
- Malicious inputs
- Unicode and special characters

### 3. Security-First Testing
Every API endpoint should have fuzz tests covering:
- Authentication bypass attempts
- SQL injection
- XSS attacks
- SSRF attacks
- DoS attempts
- File upload vulnerabilities

### 4. Regular Updates
- Run security scans weekly
- Update dependencies regularly
- Review Dependabot PRs promptly
- Monitor GitHub Security alerts

## Troubleshooting

### Tests Failing in CI but Passing Locally
1. Check environment variables are set in CI
2. Ensure Node.js versions match
3. Clear npm cache: `npm ci` instead of `npm install`
4. Check for race conditions or timing issues

### Security Scan False Positives
1. Review the vulnerability details
2. Check if it applies to your usage
3. Document exceptions in SECURITY.md
4. Use `npm audit --ignore` for known non-issues

### Coverage Not Meeting Threshold
1. Identify uncovered code: `npm test -- --coverage`
2. Add tests for critical paths
3. Consider excluding non-critical files
4. Update thresholds in `jest.config.js` if appropriate

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

## Maintenance Schedule

- **Daily:** Monitor CI test results
- **Weekly:** Review Dependabot PRs
- **Bi-weekly:** Security dependency audit
- **Monthly:** Review and update test coverage
- **Quarterly:** Full security audit and penetration testing

---

**Last Updated:** October 17, 2025
