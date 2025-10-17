# Legal & Compliance Documentation

This document outlines ProofStack's legal and compliance features for production deployment.

## Documents

### Terms of Service (`/terms`)
Comprehensive Terms of Service covering:
- Service description and features
- User accounts and registration
- Content ownership and intellectual property rights
- **AI Analysis Consent** - Explicit consent for AI processing of uploaded content
- Prohibited uses and acceptable use policy
- DMCA and copyright policy
- **Data retention and deletion policies**
- User rights and responsibilities
- Disclaimers and limitations of liability
- Termination procedures
- Governing law and dispute resolution

### Privacy Policy (`/privacy`)
Detailed Privacy Policy compliant with GDPR and CCPA covering:
- Information collection (provided, automatic, third-party)
- **AI analysis and processing disclosure** - Clear explanation of how AI processes user content
- Data usage for service provision, analytics, and security
- Data sharing with third-party service providers
- **Data retention timelines** (active accounts, deletion process)
- Security measures and safeguards
- User privacy rights (access, correction, deletion, portability)
- Cookies and tracking technologies
- International data transfers
- Children's privacy protection
- California Privacy Rights (CCPA)
- GDPR rights for European users

## Key Compliance Features

### 1. AI Analysis Transparency ✅
Both documents explicitly inform users that:
- Uploaded content will be analyzed by AI systems (LLMs, transcription services)
- Content may be sent to third-party AI providers (OpenAI, Anthropic, Hugging Face)
- Users must provide explicit consent for AI processing
- AI analysis is for service provision only, not for training models

**Location in Code:**
- Terms: Section 4.2 "AI Analysis Consent"
- Privacy: Section 3.2 "AI Analysis and Processing"
- Upload Form: Warning and consent checkbox (`components/UploadForm.tsx`)

### 2. Data Retention and Deletion ✅
Clear policies on how long data is retained:
- Active accounts: Data retained while account is active
- Deleted accounts:
  - Account deactivated immediately
  - Files removed from storage within 30 days
  - Personal data deleted within 90 days
  - Backups purged within 180 days
  - Anonymized analytics may be retained

**Location in Code:**
- Terms: Section 7 "Data Retention and Deletion"
- Privacy: Section 5 "Data Retention"
- Implementation: `/api/user/delete.ts` and `components/DataDeletion.tsx`

### 3. Employer Consent Warnings ✅
Proactive checks for employer-owned content:
- Keyword detection for employment-related terms
- Warning displayed before upload
- Required consent checkbox
- Clear guidance on intellectual property rights

**Location in Code:**
- Terms: Section 4.3 "Employer-Owned Content"
- Upload Form: `components/UploadForm.tsx` (lines 120-197)

### 4. DMCA Takedown Process ✅
Compliant DMCA takedown procedure:
- Dedicated DMCA contact email (dmca@proofstack.com)
- Clear instructions for filing takedown notices
- Contact form for submitting requests
- Proper logging of DMCA requests

**Location in Code:**
- Terms: Section 6 "DMCA and Copyright Policy"
- Contact Page: `/app/contact/page.tsx`
- API Endpoint: `/pages/api/contact.ts`

### 5. User Rights (GDPR/CCPA) ✅
Full compliance with data protection regulations:
- Right to access personal data
- Right to correction of inaccurate data
- Right to deletion ("right to be forgotten")
- Right to data portability
- Right to opt-out of data sale (we don't sell data)
- Right to lodge complaints with supervisory authorities

**Location in Code:**
- Privacy: Sections 7, 11, 12
- Dashboard: User-accessible data deletion feature

## Service Provider Transparency

Both documents clearly list all third-party services that process user data:
- **Supabase** - Database and authentication
- **Cloudinary** - File storage and media processing
- **OpenAI** - AI analysis and transcription
- **Anthropic/Hugging Face** - Alternative AI providers
- **Vercel** - Hosting and deployment
- **PostHog** - Product analytics
- **Sentry** - Error monitoring
- **GitHub** - OAuth and repository integration

## Legal Pages Access

Legal documents are accessible throughout the application:
- **Footer links** on all pages (`app/layout.tsx`)
- **Contact form** links to Privacy Policy
- **Upload form** links to Terms of Service
- **Direct URLs:**
  - Terms of Service: `/terms`
  - Privacy Policy: `/privacy`
  - Contact/DMCA: `/contact`

## Compliance Checklist

- [x] Terms of Service drafted and published
- [x] Privacy Policy drafted and published
- [x] AI analysis consent explicitly disclosed
- [x] Data retention policies documented
- [x] Data deletion functionality implemented
- [x] DMCA takedown process established
- [x] Employer consent warnings implemented
- [x] User rights clearly stated (GDPR/CCPA)
- [x] Third-party service providers disclosed
- [x] Legal pages linked throughout app
- [x] Contact information provided

## Deployment Notes

### Before Public Launch:
1. ✅ Review legal documents with legal counsel (recommended)
2. ✅ Ensure all service provider agreements are in place
3. ✅ Configure actual email addresses (dmca@, privacy@, legal@, support@)
4. ✅ Test data deletion flow end-to-end
5. ✅ Verify DMCA contact form submissions
6. ✅ Update jurisdiction in Terms (Section 12 "Governing Law")

### Post-Launch:
1. Monitor DMCA requests and respond within required timeframes
2. Regularly review and update policies (annual review recommended)
3. Notify users of material policy changes via email
4. Maintain records of user consent and data deletion requests
5. Ensure compliance with evolving data protection regulations

## Contact Information

For legal and compliance questions:
- **Legal:** legal@proofstack.com
- **Privacy:** privacy@proofstack.com
- **DMCA:** dmca@proofstack.com
- **Support:** support@proofstack.com

## Last Updated
October 17, 2025

---

**Note:** These documents provide a solid legal foundation for ProofStack. However, they are not a substitute for professional legal advice. Consider having them reviewed by a licensed attorney familiar with technology, intellectual property, and data privacy law before public launch.
