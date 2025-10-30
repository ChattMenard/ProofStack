# Testing Professional Skill Assessments

This guide provides comprehensive instructions for testing the skill assessment system, including creating test accounts, navigating the assessment flow, and evaluating the assessments.

## Overview

ProofStack's skill assessment system has 4 tiers:
- **Junior Level**: Entry-level skills (2 assessments)
- **Mid Level**: Intermediate skills (2 assessments)
- **Senior Level**: Advanced skills (3 assessments)
- **Lead Level**: Leadership skills (3 assessments)

## Quick Start - Manual Testing

### Prerequisites

1. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure required variables (minimum):
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### Creating a Test Professional Account

#### Option 1: Manual Account Creation
1. Navigate to `http://localhost:3000/signup`
2. Select **"I'm a Professional"** (displays as "Talent")
3. Fill in the registration form:
   - Email: `test.professional@example.com`
   - Password: Create a secure password
   - Username: `testpro`
   - Full Name: `Test Professional`
4. Verify email (if email verification is enabled)
5. Complete onboarding if prompted

#### Option 2: Using Seed Script (Recommended)
```bash
# Run the seed script to create a test professional
npx tsx scripts/seed-test-professional.ts
```

This creates a professional account with:
- Email: `testpro@proofstack.test`
- Username: `testpro`
- Initial skill level: `unverified`
- Ready to take assessments

### Testing the Assessment Flow

#### 1. Navigate to Assessments Page
- URL: `http://localhost:3000/professional/assessments`
- Should display:
  - Current skill level badge
  - Statistics (completed/available/total)
  - Assessment cards grouped by level

#### 2. First Tier Tests (Junior Level)

##### Test 1: JavaScript Fundamentals Quiz
- **Assessment ID**: `junior-quiz-1`
- **Type**: Technical Quiz
- **Duration**: 20 minutes
- **Questions**: 10 multiple-choice questions
- **Passing Score**: 70% (7/10 correct)
- **Topics Covered**:
  - JavaScript types and operators
  - Variables and scope
  - Functions and closures
  - Arrays and objects
  - Common JavaScript quirks

**To Take This Test**:
1. Click "Start Assessment" on the "JavaScript Fundamentals" card
2. Navigate to `/professional/assessments/junior-quiz-1`
3. Answer all 10 questions
4. Timer counts down from 20:00
5. Click "Submit Assessment" when done
6. View results immediately

##### Test 2: Array Manipulation Challenge
- **Assessment ID**: `junior-code-1`
- **Type**: Coding Challenge
- **Duration**: 30 minutes
- **Questions**: 5 multiple-choice questions
- **Passing Score**: 70% (4/5 correct)
- **Topics Covered**:
  - Array methods (map, filter, reduce)
  - Array manipulation
  - Combining arrays
  - Removing elements

**To Take This Test**:
1. Click "Start Assessment" on the "Array Manipulation" card
2. Navigate to `/professional/assessments/junior-code-1`
3. Answer all 5 questions
4. Timer counts down from 30:00
5. Click "Submit Assessment" when done
6. View results immediately

#### 3. Verification After Completion

After completing both junior assessments with passing scores:
- Check `profiles` table - `skill_level` should update to `'junior'`
- Check `skill_assessments` table - records created for each assessment
- Profile badge should display "Junior" level
- Mid-level assessments should now be unlocked

### Database Verification

```sql
-- Check profile skill level
SELECT 
  username,
  skill_level,
  skill_level_verified_at
FROM profiles
WHERE username = 'testpro';

-- Check completed assessments
SELECT 
  assessment_type,
  target_level,
  score,
  passed,
  completed_at
FROM skill_assessments sa
JOIN profiles p ON sa.profile_id = p.id
WHERE p.username = 'testpro'
ORDER BY completed_at DESC;

-- Verify skill level calculation
SELECT public.calculate_skill_level(
  (SELECT id FROM profiles WHERE username = 'testpro')
) as calculated_level;
```

## Automated Testing

### Using Playwright E2E Tests

Run the complete assessment flow test:

```bash
# Run all assessment tests
npx playwright test e2e/assessments.spec.ts

# Run with UI
npx playwright test e2e/assessments.spec.ts --ui

# Run specific test
npx playwright test e2e/assessments.spec.ts -g "complete junior assessment"
```

The E2E test covers:
1. Professional account creation
2. Navigation to assessments page
3. Taking and passing junior-quiz-1
4. Taking and passing junior-code-1
5. Verification of skill level promotion
6. Unlocking mid-level assessments

## Assessment Content Review

### Junior-Quiz-1: JavaScript Fundamentals

**Difficulty Level**: ★★☆☆☆ (Appropriate for Entry Level)

**Question Examples**:
1. `typeof null` - Tests knowledge of JavaScript quirks
2. Array methods - push, pop, shift, unshift
3. Variable declarations - const, let, var
4. Closures - Understanding scope
5. Equality operators - == vs ===

**Time Analysis**:
- 10 questions in 20 minutes = 2 minutes per question
- Adequate for multiple-choice format
- No coding required, just conceptual knowledge

**Difficulty Assessment**:
- ✅ Appropriate for junior developers
- ✅ Covers fundamental concepts
- ✅ Questions are clear and unambiguous
- ✅ Explanations provided for learning

### Junior-Code-1: Array Manipulation

**Difficulty Level**: ★★☆☆☆ (Appropriate for Entry Level)

**Question Examples**:
1. Array.map() - Understanding transformation
2. Array.filter() - Filtering elements
3. Array.concat() - Combining arrays
4. Array.reduce() - Accumulation
5. Array.pop() - Removing elements

**Time Analysis**:
- 5 questions in 30 minutes = 6 minutes per question
- More time than quiz, appropriate for "coding challenge"
- Still multiple-choice (not actual coding)
- Generous time allocation

**Difficulty Assessment**:
- ✅ Appropriate for junior developers
- ✅ Focuses on practical array operations
- ⚠️  Could benefit from actual coding problems
- ✅ Covers essential JavaScript array methods

## Feedback and Recommendations

### Strengths
1. **Clear Progression**: Junior → Mid → Senior → Lead path is logical
2. **Adequate Time**: Time limits are generous for question count
3. **Immediate Feedback**: Results shown immediately after submission
4. **Skill Level Tracking**: Automatic promotion based on assessment completion
5. **Locked/Unlocked System**: Prevents skipping ahead inappropriately

### Areas for Improvement

#### 1. Add Real Coding Challenges
**Current**: Multiple-choice questions labeled as "coding challenges"
**Recommendation**: Integrate actual code editor for challenges
- Use Monaco Editor or CodeMirror
- Provide test cases to validate solutions
- Support multiple languages (JavaScript, Python, etc.)

#### 2. More Questions Per Assessment
**Current**: 10 questions (quiz), 5 questions (challenge)
**Recommendation**: 
- Increase to 15-20 questions for quizzes
- Add 3-5 actual coding problems for challenges
- Prevents luck from playing too large a role

#### 3. Add Question Difficulty Indicators
**Current**: All questions weighted equally
**Recommendation**: Mark questions as Easy/Medium/Hard
- Show difficulty breakdown after completion
- Weighted scoring based on difficulty

#### 4. Partial Credit for Close Answers
**Current**: Binary correct/incorrect
**Recommendation**: For certain questions, give partial credit
- Example: Multi-select questions where 2/3 correct = 0.66 points

#### 5. Add Practice Mode
**Current**: Only graded assessments
**Recommendation**: Add practice versions
- No impact on skill level
- Can retake unlimited times
- Shows explanations after each question

#### 6. Assessment History and Analytics
**Current**: Basic completion tracking
**Recommendation**: Add analytics dashboard
- Time spent per question
- Questions frequently missed
- Performance over time
- Comparison to other professionals

#### 7. Add More Assessment Variety
**Current**: 2 junior, 2 mid, 3 senior, 3 lead
**Recommendation**: Add multiple versions
- Allow retakes with different questions
- Add domain-specific assessments (React, Node.js, Python, etc.)
- Add portfolio review process for senior+ levels

## Testing Checklist

Use this checklist when testing assessments:

### Pre-Test Setup
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Test professional account created
- [ ] Application running on localhost:3000

### Assessment Flow Testing
- [ ] Navigate to `/professional/assessments`
- [ ] Verify current skill level displays correctly
- [ ] Verify statistics are accurate
- [ ] Verify junior assessments are unlocked
- [ ] Verify higher-level assessments are locked

### Taking Junior-Quiz-1
- [ ] Click "Start Assessment" button
- [ ] Timer starts at 20:00
- [ ] All 10 questions display correctly
- [ ] Can select answers
- [ ] Can navigate between questions
- [ ] Answer status indicators work
- [ ] Submit button enabled when all answered
- [ ] Timer auto-submits at 0:00
- [ ] Results page displays correctly
- [ ] Skill level updates if passed

### Taking Junior-Code-1
- [ ] Assessment becomes available after first completion
- [ ] Click "Start Assessment" button
- [ ] Timer starts at 30:00
- [ ] All 5 questions display correctly
- [ ] Can select answers
- [ ] Can navigate between questions
- [ ] Submit button works
- [ ] Results page displays correctly
- [ ] Skill level updates to 'junior' after both passed

### Post-Test Verification
- [ ] Profile shows updated skill level badge
- [ ] Database records created in `skill_assessments`
- [ ] Profile `skill_level_verified_at` timestamp set
- [ ] Mid-level assessments now unlocked
- [ ] Can view completed assessments with checkmarks

### Rate Limiting Testing
- [ ] Submit assessment 5 times quickly
- [ ] 6th submission returns 429 error
- [ ] Wait 1 minute, can submit again

### Security Testing
- [ ] Cannot access other users' assessment results
- [ ] Cannot manipulate score in submission
- [ ] Cannot bypass locked assessments
- [ ] RLS policies prevent unauthorized access

## Common Issues and Solutions

### Issue: Assessment not found
**Cause**: Assessment ID doesn't match `assessmentQuestions` keys
**Solution**: Check `/lib/assessmentQuestions.ts` for valid IDs

### Issue: Skill level not updating
**Cause**: Trigger not firing or function error
**Solution**: Check Supabase logs, verify migrations applied

### Issue: Timer not working
**Cause**: JavaScript disabled or React issue
**Solution**: Check browser console for errors

### Issue: Cannot submit assessment
**Cause**: Not all questions answered
**Solution**: Ensure all answers array elements are >= 0

### Issue: 401 Unauthorized
**Cause**: Not logged in or session expired
**Solution**: Re-authenticate, check Supabase session

## Performance Benchmarks

Expected performance metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Page Load | < 2s | Test locally |
| Assessment Start | < 500ms | Test locally |
| Question Navigation | < 100ms | Test locally |
| Submission Processing | < 3s | Test locally |
| Skill Level Update | < 2s | Test locally |

## Support and Resources

- **Assessment Questions**: `/lib/assessmentQuestions.ts`
- **API Routes**: `/app/api/assessments/*/route.ts`
- **UI Components**: `/app/professional/assessments/`
- **Database Schema**: See `SKILL_LEVELS_DEPLOYMENT.md`
- **Migrations**: `/supabase/migrations/20251027_skill_levels*.sql`

## Contact

For issues or questions about assessments:
1. Check Supabase logs for errors
2. Review this testing guide
3. Check `SKILL_LEVELS_DEPLOYMENT.md` for deployment info
4. Open GitHub issue with details

---

**Last Updated**: October 30, 2025
**Version**: 1.0
**Status**: Ready for Testing
