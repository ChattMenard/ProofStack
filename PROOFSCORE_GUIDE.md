# ProofScore™: 0-100 Professional Rating System

## Overview
**ProofScore™** is a comprehensive 0-100 rating that combines all objective and subjective review metrics into a single, trustworthy score that employers can use to quickly assess professional quality.

## Score Components (Total: 100 Points)

### 1. Response Time (20 points max) ⚡
**What it measures:** How quickly professional responds to messages

| Response Time | Points | Tier |
|--------------|--------|------|
| < 1 hour | 20 | Ultra-fast |
| 1-4 hours | 18 | Fast |
| 4-12 hours | 15 | Good |
| 12-24 hours | 10 | Average |
| 24-48 hours | 5 | Slow |
| > 48 hours | 2 | Very slow |

**Why it matters:** Fast response times indicate professionalism and availability.

### 2. On-Time Delivery (20 points max) ✅
**What it measures:** Percentage of projects delivered by agreed deadline

| Delivery Rate | Points | Tier |
|--------------|--------|------|
| 100% | 20 | Perfect |
| 95-99% | 18 | Excellent |
| 85-94% | 15 | Good |
| 70-84% | 10 | Average |
| 50-69% | 5 | Poor |
| < 50% | 2 | Bad |

**Why it matters:** Reliable delivery is critical for project success.

### 3. Communication Rating (20 points max) 💬
**What it measures:** Employer's 1-5 star rating of communication quality

**Formula:** `(rating / 5.0) * 20`

| Rating | Points | Tier |
|--------|--------|------|
| 5.0 | 20 | Perfect |
| 4.5 | 18 | Excellent |
| 4.0 | 16 | Good |
| 3.5 | 14 | Above Average |
| 3.0 | 12 | Average |
| < 3.0 | 4-11 | Below Average |

**Why it matters:** Clear communication prevents misunderstandings and delays.

### 4. Quality Rating (20 points max) ⭐
**What it measures:** Employer's 1-5 star rating of deliverable quality

**Formula:** Same as communication `(rating / 5.0) * 20`

**Why it matters:** High-quality work requires fewer revisions and builds trust.

### 5. Professionalism Rating (20 points max) 👔
**What it measures:** Employer's 1-5 star rating of professional conduct

**Formula:** Same as communication `(rating / 5.0) * 20`

**Why it matters:** Professionalism makes collaboration smooth and enjoyable.

---

## Tier System

| ProofScore | Tier | Badge Color | Meaning |
|-----------|------|-------------|---------|
| 90-100 | 🏆 Elite | Green | Top-tier professional, exceptional performance |
| 80-89 | 💎 Excellent | Blue | Outstanding professional, highly reliable |
| 70-79 | ⭐ Good | Purple | Solid professional, dependable |
| 60-69 | ✓ Average | Yellow | Acceptable performance, room for improvement |
| 50-59 | ⚠️ Fair | Orange | Needs improvement in key areas |
| 0-49 | ❌ Needs Improvement | Red | Significant performance issues |

---

## Calculation Example

### Professional: Jane Developer
**Metrics from reviews:**
- Average response time: 2.5 hours
- On-time delivery rate: 95%
- Communication rating: 4.8/5
- Quality rating: 4.5/5
- Professionalism rating: 4.7/5
- Total projects: 8

**Score Calculation:**
```
Response Time (2.5hrs = Fast):        18 points
On-Time Delivery (95%):               18 points
Communication (4.8/5.0 * 20):         19.2 points
Quality (4.5/5.0 * 20):               18 points
Professionalism (4.7/5.0 * 20):       18.8 points
────────────────────────────────────────────────
TOTAL PROOFSCORE:                     92.0 / 100
Tier: 🏆 ELITE
Percentile: Top 5%
```

---

## Database Schema

### New Columns on `professional_ratings`
```sql
proof_score              decimal(5,2)  -- The 0-100 score
proof_score_breakdown    jsonb         -- Detailed breakdown
last_score_calculated_at timestamptz   -- When calculated
```

### Breakdown JSON Structure
```json
{
  "response_score": 18,
  "response_hours": 2.5,
  "delivery_score": 18,
  "delivery_rate": 95,
  "communication_score": 19.2,
  "communication_rating": 4.8,
  "quality_score": 18,
  "quality_rating": 4.5,
  "professionalism_score": 18.8,
  "professionalism_rating": 4.7,
  "total_projects": 8
}
```

---

## Database Functions

### `calculate_proof_score(professional_id)`
Calculates the 0-100 score from review metrics.

**Returns:**
```json
{
  "proof_score": 92.0,
  "breakdown": {
    "response_score": 18,
    "delivery_score": 18,
    "communication_score": 19.2,
    "quality_score": 18,
    "professionalism_score": 18.8,
    "total_projects": 8
  }
}
```

### `update_professional_proof_score(professional_id)`
Updates the score in the database. Called automatically when reviews change.

### `get_professional_percentile(professional_id)`
Returns where professional ranks (0-100, higher is better).

**Example:** 95 = "Top 5% of professionals"

---

## Views

### `professional_leaderboard`
Ranked list of all professionals by ProofScore.

```sql
SELECT * FROM professional_leaderboard
ORDER BY rank ASC
LIMIT 10;
```

**Columns:**
- `professional_id`
- `username`
- `headline`
- `proof_score`
- `rank` (1 = highest)
- `tier` (Elite, Excellent, Good, etc.)
- All individual metrics

---

## React Component Usage

### Basic Display
```tsx
import ProofScore from '@/components/ProofScore'

<ProofScore 
  professionalId={professional.id}
  size="medium"
/>
```

### With Detailed Breakdown
```tsx
<ProofScore 
  professionalId={professional.id}
  size="large"
  showBreakdown={true}
/>
```

### Size Options
- **small**: Compact badge (for cards)
- **medium**: Standard display (for profiles)
- **large**: Full display with breakdown (for detail pages)

---

## API Endpoint

### `GET /api/professional/proof-score?professional_id=xxx`

**Response:**
```json
{
  "proof_score": 92.0,
  "breakdown": {
    "response_score": 18,
    "response_hours": 2.5,
    "delivery_score": 18,
    "delivery_rate": 95,
    "communication_score": 19.2,
    "communication_rating": 4.8,
    "quality_score": 18,
    "quality_rating": 4.5,
    "professionalism_score": 18.8,
    "professionalism_rating": 4.7,
    "total_projects": 8
  },
  "percentile": 95,
  "tier": "Elite",
  "total_projects": 8
}
```

---

## Auto-Update Mechanism

ProofScore **automatically updates** when:
1. New review is submitted
2. Review metrics are updated
3. Aggregate ratings recalculated

**Trigger flow:**
```
employer_reviews INSERT/UPDATE
  ↓
update_professional_aggregate_ratings()
  ↓
professional_ratings UPDATE
  ↓
trigger_auto_update_proof_score()
  ↓
calculate_proof_score()
  ↓
Update proof_score column
```

---

## Use Cases

### 1. Professional Profile Display
Show ProofScore prominently on profile header:
```tsx
<div className="profile-header">
  <h1>{professional.name}</h1>
  <ProofScore professionalId={professional.id} size="large" showBreakdown />
</div>
```

### 2. Search Results Sorting
Sort professionals by ProofScore:
```sql
SELECT * FROM professional_leaderboard
WHERE total_projects_completed >= 3
ORDER BY proof_score DESC;
```

### 3. Filters & Badges
Filter search by minimum score:
```tsx
<SearchFilters>
  <MinProofScore value={80} /> {/* Only show "Excellent" tier and above */}
</SearchFilters>
```

### 4. Leaderboards & Rankings
Show top professionals:
```tsx
<TopProfessionals>
  {leaderboard.slice(0, 10).map(pro => (
    <ProfessionalCard 
      key={pro.id}
      rank={pro.rank}
      proofScore={pro.proof_score}
    />
  ))}
</TopProfessionals>
```

---

## Benefits

### For Professionals
✅ **Objective performance tracking** - Know exactly where you stand
✅ **Clear improvement areas** - See breakdown to focus efforts
✅ **Competitive ranking** - Compare against peers
✅ **Trust signal** - High score = more hires

### For Employers
✅ **Quick assessment** - Single number tells the story
✅ **Risk reduction** - Hire with confidence
✅ **Easy comparison** - Sort by score to find best candidates
✅ **Transparent metrics** - Understand what the score means

### For Platform
✅ **Quality control** - Identify and promote top talent
✅ **Engagement** - Gamification drives better performance
✅ **Trust building** - Objective scoring = credibility
✅ **Data-driven** - Make product decisions based on metrics

---

## Integration Steps

### 1. Apply Migration
Run `add_proof_score_rating.sql` in Supabase SQL Editor.

### 2. Add to Professional Profiles
```tsx
import ProofScore from '@/components/ProofScore'

// In profile page
<ProofScore 
  professionalId={professional.id}
  size="large"
  showBreakdown={true}
/>
```

### 3. Add to Search Results
```tsx
// In search card
<ProofScore 
  professionalId={professional.id}
  size="small"
/>
```

### 4. Enable Sorting
Add ProofScore sort option to search filters:
```tsx
<select>
  <option value="proof_score_desc">Highest Rated</option>
  <option value="proof_score_asc">Lowest Rated</option>
</select>
```

---

## Analytics Queries

### Average Score by Industry
```sql
SELECT 
  p.industry,
  AVG(pr.proof_score) as avg_score,
  COUNT(*) as professional_count
FROM professional_ratings pr
JOIN profiles p ON p.id = pr.professional_id
WHERE pr.total_projects_completed > 0
GROUP BY p.industry
ORDER BY avg_score DESC;
```

### Score Distribution
```sql
SELECT 
  CASE 
    WHEN proof_score >= 90 THEN 'Elite (90-100)'
    WHEN proof_score >= 80 THEN 'Excellent (80-89)'
    WHEN proof_score >= 70 THEN 'Good (70-79)'
    WHEN proof_score >= 60 THEN 'Average (60-69)'
    ELSE 'Fair (0-59)'
  END as tier,
  COUNT(*) as count
FROM professional_ratings
WHERE total_projects_completed > 0
GROUP BY tier
ORDER BY MIN(proof_score) DESC;
```

### Top Performers
```sql
SELECT * FROM professional_leaderboard
WHERE total_projects_completed >= 5
LIMIT 20;
```

---

## Future Enhancements

- [ ] **Score History Tracking** - Show score trend over time
- [ ] **Badge System** - Award badges for milestones (100 projects, 95+ score)
- [ ] **Score Guarantees** - "If professional scores <70, you get refund"
- [ ] **Dynamic Weights** - Adjust component weights based on role type
- [ ] **AI Insights** - "This professional excels at communication but could improve response time"
- [ ] **Verified Elite Program** - Special perks for 95+ score professionals
