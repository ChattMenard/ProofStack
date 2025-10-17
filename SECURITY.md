# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

We take the security of ProofStack seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

Please **do not** report security vulnerabilities through public GitHub issues.

### 2. Report Via Private Channel

Instead, please report security vulnerabilities via:

- **Email:** security@proofstack.com
- **GitHub Security Advisory:** [Create a private security advisory](https://github.com/ChattMenard/ProofStack/security/advisories/new)

### 3. What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of affected source files
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Any suggested fix or mitigation

### 4. Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Resolution:** Depends on severity and complexity

### 5. Disclosure Policy

- We will confirm the receipt of your vulnerability report
- We will investigate and validate the vulnerability
- We will work on a fix and release timeline
- We will notify you when the fix is released
- We will publicly acknowledge your responsible disclosure (with your permission)

## Security Measures

ProofStack implements the following security measures:

### Application Security

- ✅ HTTPS/TLS encryption for all data in transit
- ✅ Secure authentication with JWT and OAuth
- ✅ Password hashing (handled by Supabase)
- ✅ Input validation and sanitization
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (React automatic escaping)
- ✅ CSRF protection for state-changing operations
- ✅ Rate limiting on API endpoints (planned)

### Data Security

- ✅ Encryption at rest (database and file storage)
- ✅ User data deletion on request
- ✅ Minimal data retention
- ✅ Access controls and authentication
- ✅ Secure environment variable management

### Dependency Security

- ✅ Automated Dependabot updates
- ✅ Weekly security scans via GitHub Actions
- ✅ CodeQL analysis for code vulnerabilities
- ✅ NPM audit in CI pipeline
- ✅ Trivy container scanning

### Monitoring & Response

- ✅ Error monitoring with Sentry
- ✅ Automated alerts for critical issues
- ✅ Regular security audits
- ✅ Incident response procedures

## Known Security Considerations

### AI Processing

- User-uploaded content is sent to third-party AI services (OpenAI, Anthropic, etc.)
- Users must consent to AI analysis before upload
- We use zero-retention APIs where available
- Content is not used to train AI models

### Public Portfolios

- User portfolios and uploaded samples are public by default
- Users should not upload sensitive or confidential information
- Employer consent warnings are shown for work-related content

### Third-Party Services

We rely on the following third-party services:

- **Supabase** - Database and authentication
- **Cloudinary** - File storage
- **Vercel** - Hosting and deployment
- **OpenAI** - AI analysis
- **Sentry** - Error monitoring
- **PostHog** - Analytics

Security of these services is managed by their respective providers.

## Security Best Practices for Users

1. **Use strong passwords** for your account
2. **Enable two-factor authentication** if available
3. **Don't upload confidential information** to your public portfolio
4. **Verify employer permissions** before uploading work-related content
5. **Review your portfolio regularly** for unauthorized changes
6. **Report suspicious activity** immediately

## Security Updates

We publish security updates through:

- GitHub Security Advisories
- Release notes
- Email notifications to affected users (for critical issues)

## Compliance

ProofStack complies with:

- ✅ GDPR (General Data Protection Regulation)
- ✅ CCPA (California Consumer Privacy Act)
- ✅ DMCA (Digital Millennium Copyright Act)

## Contact

For security-related inquiries:

- **Security Email:** security@proofstack.com
- **Privacy Email:** privacy@proofstack.com
- **General Support:** support@proofstack.com

---

**Last Updated:** October 17, 2025
