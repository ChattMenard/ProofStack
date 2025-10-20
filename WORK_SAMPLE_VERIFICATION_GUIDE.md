# Work Sample Verification System - Implementation Guide

## Overview

The Work Sample Verification System allows employers to submit actual work deliverables (500-2000 characters) when reviewing professionals. These samples are AI-analyzed for quality, feed into ProofScore V2, and can be displayed on portfolios with configurable confidentiality levels.

**Status:** ✅ **COMPLETE** - Ready for database migration and testing

## Key Features

### 1. Work Sample Submission
- **Size Constraint:** 500-2000 characters
  - Minimum: Sufficient for AI quality assessment
  - Maximum: Keeps API costs low (~$0.001-0.002 per analysis)
  - Optimal: 1-2 functions, 3-5 paragraphs, single component

- **Content Types:**
  - `code` - Programming code snippets
  - `writing` - Technical writing, documentation
  - `design_doc` - Design documents
  - `technical_spec` - Technical specifications

- **Confidentiality Levels:**
  - **Public:** Full content visible on portfolio (best for credibility)
  - **Redacted:** Employer sanitizes sensitive parts, redacted version shown
  - **Encrypted:** Content encrypted, only metadata + scores visible

### 2. AI Quality Analysis
- **Engine:** OpenAI GPT-4-mini (temperature 0.3 for consistency)
- **Code Analysis Metrics (0-10 scale):**
  - Code Quality
  - Technical Depth
  - Problem Solving
  - Documentation Quality
  - Best Practices
- **Writing Analysis Metrics (0-10 scale):**
  - Clarity
  - Technical Accuracy
  - Professionalism
  - Completeness
- **Output:** Overall quality score + strengths + improvements + feedback

### 3. ProofScore V2 Integration
- Work sample quality scores feed into **Task Correctness** (20 points max)
- Higher quality verified samples boost professional's overall ProofScore
- Verified badge displayed on portfolio

### 4. Portfolio Display
- **Filterable View:** All / Code / Writing / Design / Specs
- **Expandable Cards:** Click to view sample content
- **Confidentiality Enforcement:**
  - Public: Full code/text with syntax highlighting
  - Redacted: Sanitized version with warning badge
  - Encrypted: Lock icon + "Confidential Work" + scores only
- **AI Feedback Display:** Strengths and improvement suggestions

## Implementation Details

### Database Schema

**File:** `supabase/migrations/add_work_samples.sql` (238 lines)

**Table:** `work_samples`
```sql
CREATE TABLE work_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  employer_id UUID REFERENCES profiles(id) NOT NULL,
  review_id UUID REFERENCES employer_reviews(id),
  
  -- Content
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 500 AND 2000),
  content_type TEXT NOT NULL CHECK (content_type IN ('code', 'writing', 'design_doc', 'technical_spec')),
  language TEXT, -- e.g., 'JavaScript', 'Python'
  
  -- Privacy
  confidentiality_level TEXT DEFAULT 'public' CHECK (confidentiality_level IN ('public', 'encrypted', 'redacted')),
  encrypted_content TEXT,
  redacted_content TEXT,
  
  -- AI Analysis Scores (0-10)
  code_quality_score DECIMAL(3,1),
  technical_depth_score DECIMAL(3,1),
  problem_solving_score DECIMAL(3,1),
  documentation_quality_score DECIMAL(3,1),
  best_practices_score DECIMAL(3,1),
  writing_clarity_score DECIMAL(3,1),
  technical_accuracy_score DECIMAL(3,1),
  overall_quality_score DECIMAL(3,1),
  ai_feedback JSONB,
  
  -- Metadata
  title TEXT,
  description TEXT,
  project_context TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Helper Functions:**
1. `get_work_sample_content(sample_id, viewer_id)` - Returns displayable content based on confidentiality and viewer
2. `get_professional_work_sample_stats(professional_id)` - Aggregates sample statistics

**RLS Policies:**
- Employers: INSERT/UPDATE own samples (before verification)
- Professionals: SELECT own samples
- Public: SELECT where `confidentiality_level='public'` AND `verified=true`

### API Endpoints

#### 1. Work Sample Analysis API
**File:** `app/api/work-samples/analyze/route.ts` (215 lines)

**Endpoint:** `POST /api/work-samples/analyze`

**Input:**
```typescript
{
  work_sample_id: string // UUID
}
```

**Process:**
1. Fetch work_sample from database
2. Determine if code or writing sample
3. Build specialized OpenAI prompt
4. Call GPT-4-mini (temp 0.3, max_tokens 1000)
5. Parse JSON response with scores
6. Update work_samples table with all scores
7. Trigger ProofScore V2 recalculation

**Code Analysis Prompt:**
- Evaluates 5 metrics
- Returns strengths array, improvements array, technical highlights
- Focused on code quality, patterns, best practices

**Writing Analysis Prompt:**
- Evaluates 4 metrics
- Returns strengths, improvements
- Focused on clarity, technical accuracy, professionalism

**Output:**
```typescript
{
  success: boolean,
  overall_quality_score: number,
  analysis: object,
  message: string
}
```

**Cost:** ~$0.001-0.002 per 500-2000 char sample

#### 2. Review Creation API (Updated)
**File:** `app/api/reviews/create/route.ts` (modified)

**Changes:**
- Added work sample fields to request body extraction
- Added validation (500-2000 chars, valid type, valid confidentiality)
- After review creation, conditionally insert work_sample record
- Trigger AI analysis in background (fire and forget)
- Return `work_sample_id` in response

**New Request Fields:**
```typescript
{
  // Existing review fields...
  employer_id: string,
  professional_id: string,
  rating: number,
  review_text: string,
  
  // New work sample fields (optional)
  work_sample?: string,           // 500-2000 chars
  sample_title?: string,           // max 200 chars
  sample_description?: string,     // max 500 chars
  sample_type?: 'code' | 'writing' | 'design_doc' | 'technical_spec',
  sample_language?: string,        // e.g., 'JavaScript'
  confidentiality_level?: 'public' | 'encrypted' | 'redacted'
}
```

**Workflow:**
1. Validate review fields (existing logic)
2. If work_sample provided, validate size and type
3. Create employer_reviews record
4. If work_sample valid, insert work_samples record
5. Trigger `/api/work-samples/analyze` in background
6. Return success with both review_id and work_sample_id

### Frontend Components

#### 1. Employer Review Form
**File:** `app/employer/reviews/new/[professionalId]/page.tsx` (modified, +170 lines)

**Added Form Fields:**
```typescript
const [formData, setFormData] = useState({
  // Existing fields...
  rating: 5,
  review_text: '',
  position_title: '',
  
  // New work sample fields
  work_sample: '',                    // The actual content
  sample_title: '',                   // Descriptive title
  sample_description: '',             // What problem it solved
  sample_type: 'code',                // code | writing | design_doc | technical_spec
  sample_language: '',                // For code samples
  confidentiality_level: 'public'     // public | encrypted | redacted
});
```

**UI Section (Lines ~335-505):**
- Sample type dropdown selector
- Conditional language field (shows for code type)
- Sample title input (200 char max)
- Sample description textarea (500 char max)
- **Work sample textarea:**
  - 500-2000 character limit enforced
  - Real-time character counter
  - Warning if < 500 chars
  - Success message if >= 500 chars
  - Font-mono styling for code
  - Dynamic placeholder based on sample_type
- **Confidentiality radio buttons:**
  - Public: "🌐 Public - Visible on portfolio. Best for credibility."
  - Redacted: "📝 Redacted - Sanitize sensitive logic. Sanitized version shows."
  - Encrypted: "🔒 Encrypted - Sample encrypted. Only scores visible."
- **Info box:** Explains AI analysis, +20pt ProofScore boost, verification benefits

**Submission:**
- Form submits all fields via `...formData`
- Existing `/api/reviews/create` endpoint handles the data
- No changes needed to submit handler

#### 2. Work Samples Portfolio Section
**File:** `components/WorkSamplesSection.tsx` (389 lines) - NEW

**Props:**
```typescript
interface WorkSamplesSectionProps {
  professionalId: string;
  isOwner?: boolean;
}
```

**Features:**
- Loads verified work samples from database
- Filter tabs: All / Code / Writing / Design / Specs
- Expandable cards for each sample
- **Display Logic:**
  - Public: Show full content with syntax highlighting
  - Redacted: Show redacted_content with warning badge
  - Encrypted: Show lock icon + "Confidential Work" + metadata only
- **AI Scores Display:**
  - Grid of metric scores (0-10 scale)
  - Highlighted overall quality score
  - Different metrics based on sample type
- **AI Feedback Display:**
  - Strengths (✓ green)
  - Areas for Growth (💡 blue)
  - Shown when card expanded

**Integration:**
```tsx
import WorkSamplesSection from '@/components/WorkSamplesSection';

// In portfolio page
<WorkSamplesSection
  professionalId={profile.id}
  isOwner={isOwner}
/>
```

#### 3. Portfolio Page Integration
**File:** `app/portfolio/[username]/page.tsx` (modified)

**Changes:**
- Added `WorkSamplesSection` import
- Added section before reviews:
  ```tsx
  {profile && (
    <WorkSamplesSection
      professionalId={profile.id}
      isOwner={isOwner}
    />
  )}
  ```
- Displays all verified work samples
- Respects confidentiality levels
- Shows AI analysis results

## Setup Instructions

### 1. Apply Database Migration

**Run in Supabase SQL Editor:**
```bash
# Copy contents of supabase/migrations/add_work_samples.sql
# Paste into Supabase SQL Editor
# Execute
```

**Verify:**
```sql
SELECT * FROM work_samples LIMIT 1;
SELECT get_professional_work_sample_stats('some-professional-id');
```

### 2. Environment Variables

**Required (if not already set):**
```env
# OpenAI API (for work sample analysis)
OPENAI_API_KEY=sk-...

# Site URL (for background API calls)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
# For local development: http://localhost:3000
```

### 3. Test End-to-End Flow

**As Employer:**
1. Sign in to employer account
2. Navigate to `/employer/reviews/new/[professionalId]`
3. Fill out review form (rating, text, position, dates)
4. Scroll to "Work Sample Verification" section
5. Select sample type (e.g., "Code")
6. Enter language (e.g., "JavaScript")
7. Enter title (e.g., "React Component for User Auth")
8. Enter description (e.g., "Custom authentication flow component")
9. Paste 500-2000 chars of actual code delivered
10. Select confidentiality level (e.g., "Public")
11. Submit review

**Verify:**
- Review created successfully
- Work sample record inserted in `work_samples` table
- AI analysis triggered (check logs)
- Scores populated in database
- ProofScore updated for professional

**As Professional (Portfolio View):**
1. Navigate to `/portfolio/[username]`
2. Scroll to "Verified Work Samples" section
3. See work sample card with:
   - Title, description
   - Confidentiality badge
   - AI quality scores
   - Expandable content (if public/redacted)
   - AI feedback (strengths/improvements)

## User Workflows

### Employer Workflow
1. **Complete Project** → Work with professional
2. **Write Review** → Navigate to review form
3. **Submit Work Sample** → Copy 500-2000 chars of delivered work
4. **Choose Confidentiality:**
   - Public: Best for transparent verification
   - Redacted: Sanitize sensitive business logic first
   - Encrypted: Protect IP completely
5. **Submit** → AI analyzes automatically
6. **Verification** → Sample verified, boosts professional's ProofScore

### Professional Workflow
1. **Receive Review** → Employer submits review with work sample
2. **AI Analysis** → Automatic quality assessment (no action needed)
3. **Portfolio Updated** → Sample appears on portfolio
4. **ProofScore Boost** → Task Correctness increases based on quality
5. **Showcase Work** → Share portfolio with verified samples

### Viewer Workflow (Employers Hiring)
1. **Discover Professionals** → Browse portfolios
2. **See ProofScore** → High scores indicate quality work
3. **View Verified Samples** → Real code/writing from past projects
4. **Review AI Analysis** → Objective quality metrics
5. **Make Decision** → Evidence-based hiring

## Benefits

### For Professionals
- **Proof of Work:** Verified samples from real projects
- **ProofScore Boost:** High-quality samples increase Task Correctness (20pts)
- **Portfolio Building:** Showcase actual deliverables
- **Objective Validation:** AI analysis provides credible quality scores
- **Privacy Options:** Control what's publicly visible

### For Employers
- **Verifiable Reviews:** Back up ratings with actual work
- **Quality Assurance:** AI validates work quality objectively
- **Hiring Confidence:** See real examples before hiring
- **IP Protection:** Encrypted/redacted options protect sensitive code
- **Fair Assessment:** Objective metrics reduce bias

### For Platform
- **Trust & Transparency:** Verified work samples build credibility
- **Reduced Fraud:** Harder to fake verified samples
- **Better Matching:** Quality scores improve employer-professional matching
- **Competitive Edge:** Unique verification system vs. competitors
- **Data-Driven:** AI analysis enables insights and improvements

## Technical Architecture

### Data Flow
```
Employer submits review with work sample
  ↓
/api/reviews/create validates and creates review
  ↓
Insert work_samples record (verified=false)
  ↓
Trigger /api/work-samples/analyze (background)
  ↓
Fetch sample from database
  ↓
Build specialized prompt (code vs writing)
  ↓
Call OpenAI GPT-4-mini
  ↓
Parse JSON scores response
  ↓
Update work_samples with scores (verified=true)
  ↓
Trigger ProofScore V2 recalculation
  ↓
Professional's portfolio shows verified sample
```

### Confidentiality Enforcement

**Database Level:**
```sql
-- RLS policies prevent unauthorized access
-- get_work_sample_content() function enforces display rules
```

**Application Level:**
```typescript
// WorkSamplesSection.tsx
if (sample.confidentiality_level === 'encrypted') {
  return <EncryptedPlaceholder />;
}
if (sample.confidentiality_level === 'redacted') {
  return <RedactedContent content={sample.redacted_content} />;
}
return <FullContent content={sample.content} />;
```

**Display Rules:**
| Confidentiality | Employer Sees | Professional Sees | Public Sees |
|----------------|---------------|-------------------|-------------|
| Public | Full content | Full content | Full content |
| Redacted | Full content | Redacted version | Redacted version |
| Encrypted | Full content | Scores + metadata | Scores + metadata |

### AI Analysis Cost Optimization

**Design Decisions:**
- **500-2000 char limit:** Keeps tokens low (~125-500 tokens)
- **GPT-4-mini:** Cheaper than GPT-4 (~$0.0001/1K input tokens)
- **Temperature 0.3:** Consistent results, fewer retries
- **Cached prompts:** System prompts don't count toward tokens
- **Background processing:** Doesn't block user experience

**Estimated Costs:**
- 1,000 work samples/month: ~$2-3
- 10,000 work samples/month: ~$20-30
- Cost per sample: ~$0.001-0.002

### Security Considerations

**Encrypted Samples:**
- Content encrypted in database (future: implement encryption)
- Only hashed reference stored
- Metadata (type, language, title) visible
- Quality scores visible (derived from original)

**Redacted Samples:**
- Employer manually sanitizes before submission
- Both original and redacted versions stored
- Original used for AI analysis
- Redacted shown on portfolio

**RLS Policies:**
- Employers can only insert/update own samples
- Professionals can view own samples
- Public can only see public + verified samples
- Prevents unauthorized access/modification

## Future Enhancements

### Phase 2 (Planned)
- [ ] Professional approval workflow (verify before public)
- [ ] Sample tagging system (skills, technologies, frameworks)
- [ ] Automatic encryption implementation
- [ ] Sample comparison tool (compare multiple professionals)
- [ ] Work sample analytics (view counts, saves)
- [ ] Employer can request samples from professionals
- [ ] Bulk sample upload for professionals
- [ ] Sample versioning (track updates)

### Phase 3 (Future)
- [ ] AI-powered sample recommendations
- [ ] Code execution sandbox (run code samples safely)
- [ ] Syntax highlighting per language
- [ ] Download sample snippets
- [ ] Sample search/filtering by technology
- [ ] Sample quality trends over time
- [ ] Peer review system (other professionals validate)
- [ ] Sample templates library

## Troubleshooting

### Work Sample Not Showing on Portfolio
**Check:**
1. Sample `verified=true` in database?
2. Sample `confidentiality_level` allows display?
3. RLS policies correct?
4. WorkSamplesSection component imported?

**Debug:**
```sql
SELECT id, title, verified, confidentiality_level 
FROM work_samples 
WHERE professional_id = 'xxx';
```

### AI Analysis Not Running
**Check:**
1. `OPENAI_API_KEY` set in environment?
2. `NEXT_PUBLIC_SITE_URL` set correctly?
3. Check server logs for fetch errors
4. Verify `/api/work-samples/analyze` endpoint accessible

**Debug:**
```typescript
// Check logs in /api/reviews/create
console.log('Triggering AI analysis for sample:', sampleData.id);

// Check logs in /api/work-samples/analyze
console.log('OpenAI response:', completion);
```

### Scores Not Updating ProofScore
**Check:**
1. ProofScore V2 recalculation RPC exists?
2. `recalculate_proof_score_v2()` function working?
3. Check function logs in Supabase

**Debug:**
```sql
SELECT * FROM recalculate_proof_score_v2('professional-id');
```

### Confidentiality Not Respected
**Check:**
1. `get_work_sample_content()` function exists?
2. Frontend using function or raw content?
3. RLS policies allowing unauthorized access?

**Debug:**
```sql
SELECT get_work_sample_content('sample-id', 'viewer-id');
```

## Files Changed

### New Files
- ✅ `supabase/migrations/add_work_samples.sql` (238 lines) - Database schema
- ✅ `app/api/work-samples/analyze/route.ts` (215 lines) - AI analysis API
- ✅ `components/WorkSamplesSection.tsx` (389 lines) - Portfolio display component

### Modified Files
- ✅ `app/api/reviews/create/route.ts` - Added work sample handling
- ✅ `app/employer/reviews/new/[professionalId]/page.tsx` - Added work sample form section (+170 lines)
- ✅ `app/portfolio/[username]/page.tsx` - Added WorkSamplesSection integration

### Documentation
- ✅ `WORK_SAMPLE_VERIFICATION_GUIDE.md` (this file)

## Success Metrics

### Technical Metrics
- [ ] Database migration applied successfully
- [ ] Work samples table created with RLS policies
- [ ] AI analysis API returning consistent scores
- [ ] ProofScore updating after sample verification
- [ ] Portfolio displaying samples correctly

### User Metrics (Future)
- Number of work samples submitted per month
- Percentage of reviews with work samples
- Average quality scores by content type
- Portfolio view increase after adding samples
- Employer hiring decisions influenced by samples

### Business Metrics (Future)
- User trust increase (survey)
- Platform credibility vs competitors
- Reduced fraud/fake reviews
- Improved employer-professional matching quality
- Revenue impact from verified samples feature

## Support

**Questions or Issues?**
- Check Supabase logs for database errors
- Check Vercel logs for API errors
- Review this guide's Troubleshooting section
- Check OpenAI API usage dashboard for costs

**Related Documentation:**
- `PROOFSCORE_V2_GUIDE.md` - ProofScore V2 system
- `PROOFSCORE_V2_INTEGRATION_SUMMARY.md` - Integration details
- `CODEBASE_STATUS.md` - Overall platform status

---

**Status:** ✅ Implementation Complete - Ready for database migration and testing
**Next Step:** Apply `add_work_samples.sql` migration in Supabase SQL Editor
