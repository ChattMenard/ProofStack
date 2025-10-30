# Assessment Testing Flow Diagram

This document visualizes the complete flow for testing professional skill assessments.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ProofStack Assessment System                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Supabase DB    │      │   Next.js API    │      │   React UI       │
│                  │      │                  │      │                  │
│ • profiles       │◄────►│ • /api/          │◄────►│ • /professional/ │
│ • skill_         │      │   assessments/   │      │   assessments    │
│   assessments    │      │   available      │      │                  │
│ • RLS policies   │      │ • submit         │      │ • Quiz UI        │
│                  │      │                  │      │ • Timer          │
│ • calculate_     │      │ • Rate limiting  │      │ • Results        │
│   skill_level()  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## Testing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         START: Testing Journey                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 1: Environment Setup        │
              │                                    │
              │   cp .env.example .env.local       │
              │   Configure Supabase credentials   │
              └────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 2: Install Dependencies     │
              │                                    │
              │   npm install                      │
              └────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 3: Create Test Account      │
              │                                    │
              │   npx tsx scripts/                 │
              │   seed-test-professional.ts        │
              │                                    │
              │   Creates:                         │
              │   • testpro@proofstack.test        │
              │   • skill_level: 'unverified'      │
              └────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 4: Start Dev Server         │
              │                                    │
              │   npm run dev                      │
              │   Server: http://localhost:3000    │
              └────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 5: Login                    │
              │                                    │
              │   /auth/signin                     │
              │   Email: testpro@proofstack.test   │
              │   Password: TestPass123!           │
              └────────────────────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────┐
              │   Step 6: Navigate to Assessments  │
              │                                    │
              │   /professional/assessments        │
              │                                    │
              │   Displays:                        │
              │   • Current skill level badge      │
              │   • Statistics (0/2/10)            │
              │   • Assessment cards by level      │
              └────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
     ┌──────────────────────────┐   ┌──────────────────────────┐
     │   Test 1: JS Fundamentals│   │   Test 2: Array Manip    │
     │                          │   │                          │
     │   • 10 questions         │   │   • 5 questions          │
     │   • 20 minutes           │   │   • 30 minutes           │
     │   • 70% to pass          │   │   • 70% to pass          │
     │   • Multiple choice      │   │   • Multiple choice      │
     └──────────────────────────┘   └──────────────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
              ┌────────────────────────────────────┐
              │   Results Processing               │
              │                                    │
              │   1. Calculate score               │
              │   2. Check passing threshold       │
              │   3. Update skill_assessments      │
              │   4. Trigger: calculate_skill_     │
              │      level() function              │
              │   5. Update profiles.skill_level   │
              └────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐
        │   PASSED (≥70%)   │         │   FAILED (<70%)   │
        │                   │         │                   │
        │   • Show success  │         │   • Show retry    │
        │   • Update level  │         │   • No level      │
        │   • Unlock next   │         │     change        │
        └───────────────────┘         └───────────────────┘
                    │
                    │ (After both tests passed)
                    ▼
              ┌────────────────────────────────────┐
              │   Skill Level: JUNIOR              │
              │                                    │
              │   • Badge updated                  │
              │   • Mid-level unlocked             │
              │   • Stats updated                  │
              │   • Completed: 2                   │
              └────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    END: Provide Feedback                              │
│                                                                       │
│   See ASSESSMENT_FEEDBACK.md for detailed analysis                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Assessment Taking Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Individual Assessment Flow                           │
└─────────────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌─────────────────┐
│ Assessment Card │
│                 │
│ • Title         │
│ • Duration      │
│ • Passing %     │
│ • Status        │
└─────────────────┘
      │
      ▼ Click "Start Assessment"
┌─────────────────┐
│ Assessment Page │
│                 │
│ • Timer starts  │
│ • Load Q1       │
└─────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│         Question Display                │
│                                         │
│  Question N of M                        │
│  ─────────────────────────────────      │
│                                         │
│  What is...?                           │
│                                         │
│  ○ A. Answer 1                         │
│  ○ B. Answer 2                         │
│  ○ C. Answer 3                         │
│  ○ D. Answer 4                         │
│                                         │
│  [◄ Previous]  [Progress]  [Next ►]   │
│                                         │
│  Answer Status: [1][2][3][4][5]...     │
│  ■ Answered  □ Unanswered             │
└─────────────────────────────────────────┘
      │
      ▼ Answer all questions
┌─────────────────┐
│ All Answered?   │
│                 │
│ Yes ─────────►  │ Enable "Submit"
│                 │
│ No ──────────►  │ "Submit" disabled
└─────────────────┘
      │
      ▼ Click "Submit"
┌─────────────────┐
│ Calculate Score │
│                 │
│ • Count correct │
│ • Calculate %   │
│ • Check passing │
│ • POST to API   │
└─────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│           Results Page                  │
│                                         │
│  🎉 Assessment Passed!                  │
│  ─────────────────────────────────      │
│                                         │
│  Your Score: 90%                        │
│  Passing Score: 70%                     │
│  Time Taken: 12 minutes                 │
│                                         │
│  ┌──────────────────────────────┐      │
│  │  New Skill Level: JUNIOR     │      │
│  └──────────────────────────────┘      │
│                                         │
│  [Back to Assessments]  [View Profile] │
└─────────────────────────────────────────┘
      │
      ▼
    END
```

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Database Updates During Flow                     │
└─────────────────────────────────────────────────────────────────────┘

Initial State (New Professional)
─────────────────────────────────
profiles:
  skill_level: 'unverified'
  skill_level_verified_at: NULL
  
skill_assessments:
  (empty)

        │
        ▼ Complete junior-quiz-1 (PASS)
        │
After First Test
────────────────
profiles:
  skill_level: 'unverified'  ◄── Still unverified (need 2 tests)
  skill_level_verified_at: NULL
  
skill_assessments:
  + assessment_type: 'technical_quiz'
  + target_level: 'junior'
  + score: 90
  + passed: true
  + completed_at: '2025-10-30...'

        │
        ▼ Complete junior-code-1 (PASS)
        │
After Second Test
─────────────────
profiles:
  skill_level: 'junior'  ◄── PROMOTED!
  skill_level_verified_at: '2025-10-30...'
  
skill_assessments:
  + assessment_type: 'technical_quiz'
    target_level: 'junior'
    score: 90
    passed: true
    
  + assessment_type: 'coding_challenge'
    target_level: 'junior'
    score: 100
    passed: true

        │
        ▼ Trigger: calculate_skill_level()
        │
Function Execution
──────────────────
SELECT target_level, COUNT(*) as passed_count
FROM skill_assessments
WHERE profile_id = $1 AND passed = true
GROUP BY target_level
ORDER BY level_order DESC

Result:
  junior: 2 passed
  
Check promotion rules:
  ✓ junior: ≥2 passed → PROMOTE to 'junior'
  
UPDATE profiles
SET skill_level = 'junior',
    skill_level_verified_at = NOW()
WHERE id = $1

RETURN 'junior'
```

## Automated Test Flow (Playwright)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E2E Test Execution Flow                            │
└─────────────────────────────────────────────────────────────────────┘

    START: npx playwright test e2e/assessments.spec.ts
      │
      ▼
┌────────────────────────────────┐
│ Setup Phase                    │
│                                │
│ • Start dev server             │
│ • Open browser (Chromium)      │
│ • Navigate to /                │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Test: Complete junior flow     │
│                                │
│ Step 1: Create account         │
│   • Go to /signup              │
│   • Select "Professional"      │
│   • Fill form                  │
│   • Submit                     │
│   ✓ Verify redirect            │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 2: Navigate to assessments│
│   • Go to /professional/       │
│     assessments                │
│   ✓ Verify page loads          │
│   ✓ Verify "unverified" badge  │
│   ✓ Verify stats (0/2/10)      │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 3: Take JS quiz           │
│   • Click "Start Assessment"   │
│   ✓ Verify timer starts        │
│   • Answer all 10 questions    │
│   • Click "Submit"             │
│   ✓ Verify "Passed" message    │
│   • Click "Back"               │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 4: Take Array quiz        │
│   • Click "Start Assessment"   │
│   ✓ Verify timer starts        │
│   • Answer all 5 questions     │
│   • Click "Submit"             │
│   ✓ Verify "Passed" message    │
│   ✓ Verify level changed       │
│   • Click "Back"               │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 5: Verify promotion       │
│   • Reload page                │
│   ✓ Badge shows "Junior"       │
│   ✓ Completed count = 2        │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 6: Verify mid unlocked    │
│   • Scroll to mid section      │
│   ✓ Mid assessments visible    │
│   ✓ Not locked                 │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Step 7: Verify completed       │
│   • Scroll to junior section   │
│   ✓ Both show "✓ Completed"    │
│   ✓ Buttons disabled           │
└────────────────────────────────┘
      │
      ▼
┌────────────────────────────────┐
│ Cleanup                        │
│                                │
│ • Close browser                │
│ • Stop dev server              │
│ • Generate report              │
└────────────────────────────────┘
      │
      ▼
    END: ✅ All tests passed
```

## File Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        File Dependencies                              │
└─────────────────────────────────────────────────────────────────────┘

Documentation Layer
───────────────────
HOW_TO_TEST_ASSESSMENTS.md ──┐
TESTING_ASSESSMENTS.md ───────┤
ASSESSMENT_FEEDBACK.md ───────┤──► User reads these
ASSESSMENT_TESTING_FLOW.md ───┘

Tooling Layer
─────────────
scripts/seed-test-professional.ts ──► Creates test accounts
                                       Uses: @supabase/supabase-js

e2e/assessments.spec.ts ────────────► Automated testing
                                       Uses: @playwright/test

Application Layer
─────────────────
app/professional/assessments/page.tsx ──┐
                                        │
app/professional/assessments/           │
  [id]/page.tsx ────────────────────────┤──► UI Components
                                        │
lib/assessmentQuestions.ts ─────────────┘

API Layer
─────────
app/api/assessments/available/route.ts ──► GET available tests
                                            Uses: supabaseServer
                                            
app/api/assessments/submit/route.ts ─────► POST submission
                                            Uses: requireAuthAppRouter
                                                  supabaseServer

Database Layer
──────────────
supabase/migrations/
  20251027_skill_levels.sql ─────────────► Schema
  20251027_skill_levels_grants.sql ──────► Permissions
  
Database Objects:
  • profiles table
  • skill_assessments table
  • calculate_skill_level() function
  • update_skill_level_after_assessment() trigger
  • RLS policies
```

## Success Criteria

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Testing Success Criteria                       │
└─────────────────────────────────────────────────────────────────────┘

✅ Setup Phase
   • Environment variables configured
   • Dependencies installed
   • Test account created successfully
   • Dev server starts without errors

✅ Account Creation
   • Can create professional account
   • Profile created in database
   • Initial skill_level = 'unverified'
   • Can login successfully

✅ Navigation
   • Assessments page loads
   • Displays current skill level
   • Shows accurate statistics
   • Junior assessments unlocked
   • Higher levels locked

✅ Taking Assessments
   • Can start assessment
   • Timer works correctly
   • Can navigate between questions
   • Can select answers
   • Answer status indicators work
   • Can submit when all answered
   • Results display immediately

✅ Scoring & Promotion
   • Score calculated correctly
   • Pass/fail determined correctly
   • Database records created
   • Skill level updated after 2nd test
   • Timestamp recorded

✅ Progression
   • Completed tests show checkmark
   • Completed tests disabled
   • Mid-level assessments unlock
   • Statistics update correctly

✅ Automated Tests
   • All Playwright tests pass
   • No console errors
   • Screenshots captured
   • Test report generated
```

## Quick Reference Commands

```bash
# Manual Testing
npm run dev                                    # Start server
npx tsx scripts/seed-test-professional.ts     # Create account

# Automated Testing
npx playwright test e2e/assessments.spec.ts   # Run E2E tests
npx playwright test --ui                       # Run with UI
npx playwright show-report                     # View results

# Verification
psql $DATABASE_URL -c "SELECT username, skill_level FROM profiles WHERE username='testpro';"
```

---

**Created**: October 30, 2025  
**Purpose**: Visualize assessment testing flow  
**Status**: ✅ Complete
