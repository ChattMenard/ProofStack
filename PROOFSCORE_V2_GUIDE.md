# ProofScore V2: 30/30/40 AI-Powered Rating System

## Overview

ProofScore V2 uses AI text analysis and a weighted scoring system to create a more predictive and fair 0-100 professional rating.

## Scoring Breakdown

### **Component 1: Communication Quality (30 points)**
Evaluates how professionals present themselves and communicate.

- **Profile Quality (10 pts)** - AI-analyzed
  - Grammar and spelling in bio/headline
  - Professional tone
  - Clarity and structure
  - Auto-analyzed on profile save

- **Initial Message Quality (10 pts)** - AI-analyzed
  - First message to employer
  - Grammar, spelling, professionalism
  - Response composition quality
  - Analyzed on first employer contact

- **Response Speed (10 pts)** - Auto-tracked
  - < 1 hour: 10 points
  - < 4 hours: 9 points
  - < 12 hours: 7 points
  - < 24 hours: 5 points
  - < 48 hours: 3 points
  - 48+ hours: 1 point

### **Component 2: Historical Performance (30 points)**
Tracks consistency and reliability over time.

- **Historical Rating (15 pts)** - Average of all reviews
  - Calculated from all past employer ratings
  - Linear scale: 5-star = 15 pts, 1-star = 3 pts

- **On-Time Delivery Rate (10 pts)** - Percentage-based
  - 100% on-time: 10 points
  - 80% on-time: 8 points
  - etc.

- **Completion Rate (5 pts)** - Projects finished vs accepted
  - 100% completion: 5 points
  - 80% completion: 4 points
  - Penalizes abandoned projects

### **Component 3: Work Quality (40 points)**
Most heavily weighted - measures actual deliverable quality.

- **Task Correctness (20 pts)** - Employer assessment
  - Primary quality metric
  - How accurate/correct was the work?
  - Linear scale from employer rating (1-5)

- **Employer Satisfaction (10 pts)** - Overall review rating
  - General satisfaction with deliverable
  - Linear scale from quality_rating (1-5)

- **Revisions Score (5 pts)** - Fewer revisions = higher score
  - 0 revisions: 5 points
  - 1 revision: 4 points
  - 2 revisions: 3 points
  - 3 revisions: 2 points
  - 4+ revisions: 1 point

- **Hire Again Bonus (5 pts)** - Would employer re-hire?
  - Binary yes/no from employer
  - Shows strong confidence in professional

## AI Text Analysis

Uses OpenAI GPT-4-mini to analyze text quality on 3 dimensions:

1. **Grammar & Spelling (40% weight)** - Technical correctness
2. **Professionalism (30% weight)** - Tone and presentation
3. **Clarity & Structure (30% weight)** - How well-organized

Returns score 0-10 with detailed feedback.

## New Professionals

Professionals without project history get scored based on:
- Profile quality only (0-30 points max)
- Score increases as they complete projects
- Encourages high-quality profiles from day 1

## Database Schema

### New Columns

**profiles table:**
```sql
profile_quality_score decimal(4,2)  -- 0-10, AI-analyzed
profile_quality_analysis jsonb      -- Detailed AI feedback
profile_quality_analyzed_at timestamptz
```

**professional_ratings table:**
```sql
initial_message_quality_score decimal(4,2)  -- 0-10, AI-analyzed
initial_message_quality_analysis jsonb      -- Detailed AI feedback
completion_rate decimal(5,2)                -- % of projects completed
```

**employer_reviews table:**
```sql
task_correctness_rating decimal(3,2)  -- 1-5, employer assesses correctness
revisions_count integer                -- Number of revision rounds
would_hire_again boolean               -- Binary recommendation
```

## API Endpoints

### `POST /api/analyze-text-quality`
General-purpose AI text analysis endpoint.

**Request:**
```json
{
  "text": "Text to analyze",
  "context": "professional profile"
}
```

**Response:**
```json
{
  "score": 8.5,
  "details": {
    "grammar_score": 9,
    "professionalism_score": 8,
    "clarity_score": 8.5,
    "feedback": "...",
    "issues": ["..."]
  }
}
```

### `POST /api/professional/analyze-profile`
Analyzes profile quality and updates ProofScore.

**Request:**
```json
{
  "bio": "Professional bio text",
  "headline": "Professional headline",
  "skills": ["JavaScript", "Python"]
}
```

**Response:**
```json
{
  "quality_score": 8.5,
  "analysis": {...},
  "message": "Profile quality analyzed and ProofScore updated"
}
```

### `POST /api/professional/analyze-message`
Analyzes first employer contact message quality.

**Request:**
```json
{
  "message_id": "uuid",
  "professional_id": "uuid",
  "message_text": "Hello, I'd be happy to help..."
}
```

**Response:**
```json
{
  "quality_score": 9.2,
  "analysis": {...},
  "message": "Message quality analyzed and ProofScore updated"
}
```

## Database Functions

### `calculate_proof_score_v2(professional_id uuid)`
Calculates ProofScore using 30/30/40 split.

Returns:
```json
{
  "proof_score": 87.5,
  "breakdown": {
    "communication_quality": { "total": 26, "profile_quality": 8.5, ... },
    "historical_performance": { "total": 25, ... },
    "work_quality": { "total": 36.5, ... }
  }
}
```

### `update_professional_proof_score_v2(professional_id uuid)`
Updates professional_ratings table with new score.
Auto-called by triggers when:
- Profile quality score changes
- Review metrics change
- New reviews added

## Triggers

### `trigger_auto_update_proof_score_v2`
- Table: `professional_ratings`
- Event: INSERT or UPDATE
- Action: Recalculate ProofScore

### `trigger_profile_quality_score_update`
- Table: `profiles`
- Event: UPDATE of profile_quality_score
- Action: Recalculate ProofScore

## Migration Path

1. Apply `add_proof_score_v2.sql` migration
2. Existing ProofScore data preserved (uses old calculation if new fields empty)
3. New calculations kick in as:
   - Professionals save profiles (triggers profile analysis)
   - Professionals send first messages (triggers message analysis)
   - Employers complete new review format

## Usage Examples

### Analyze Profile on Save
```typescript
// In profile save handler
await fetch('/api/professional/analyze-profile', {
  method: 'POST',
  body: JSON.stringify({
    bio: profileData.bio,
    headline: profileData.headline,
    skills: profileData.skills
  })
})
```

### Analyze First Message
```typescript
// In message send handler
if (isFirstMessageToEmployer) {
  await fetch('/api/professional/analyze-message', {
    method: 'POST',
    body: JSON.stringify({
      message_id: newMessage.id,
      professional_id: sender.id,
      message_text: messageContent
    })
  })
}
```

### Display ProofScore with Breakdown
```typescript
const { data } = await supabase
  .rpc('calculate_proof_score_v2', { p_professional_id: userId })

// Show score: data.proof_score
// Show breakdown: data.breakdown.communication_quality.total, etc.
```

## Benefits Over V1

✅ **More Predictive** - 40% weight on actual work quality vs 20% in V1  
✅ **Early Signal** - Profile quality scored before first project  
✅ **Fair to New Users** - Can earn points from good profile/communication  
✅ **Catches Red Flags** - Poor grammar/spelling detected automatically  
✅ **Incentivizes Quality** - Professionals know writing matters  
✅ **Data-Driven** - AI provides consistent, objective text analysis  

## Cost Considerations

- OpenAI API: ~$0.001 per analysis (GPT-4-mini)
- Profile analysis: Once per save (~$0.001)
- Message analysis: Once per first contact (~$0.001)
- Estimated: $1 per 1000 analyses

Very affordable for the value provided! 🚀
