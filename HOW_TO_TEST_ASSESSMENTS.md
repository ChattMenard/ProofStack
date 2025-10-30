# How to Test Professional Skill Assessments

This guide provides quick instructions for testing the skill assessment system that was created for your issue.

## Quick Start (5 Minutes)

### Step 1: Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Test Professional Account

```bash
npx tsx scripts/seed-test-professional.ts
```

This creates a test account:
- **Email**: `testpro@proofstack.test`
- **Password**: `TestPass123!`
- **Username**: `testpro`
- **Skill Level**: unverified (ready to take assessments)

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Login and Test

1. Open http://localhost:3000/auth/signin
2. Login with the test account credentials above
3. Navigate to http://localhost:3000/professional/assessments
4. Take the two junior-level tests:
   - **JavaScript Fundamentals** (10 questions, 20 minutes)
   - **Array Manipulation** (5 questions, 30 minutes)

## What You're Testing

### Test 1: JavaScript Fundamentals (junior-quiz-1)
- **Format**: Multiple choice quiz
- **Questions**: 10 questions covering JS basics
- **Time**: 20 minutes
- **Pass**: 70% (7/10 correct)
- **Topics**: Variables, functions, arrays, closures, operators

**To pass easily, choose these answers:**
1. B (object)
2. B (push())
3. A (Enables stricter parsing)
4. C (const x = 5)
5. B (function with access to outer scope)
6. B (function myFunc() {})
7. B (=== checks type and value)
8. C (// comment)
9. B (ordered list of values)
10. A (in)

### Test 2: Array Manipulation (junior-code-1)
- **Format**: Multiple choice quiz (labeled "coding challenge")
- **Questions**: 5 questions about array methods
- **Time**: 30 minutes
- **Pass**: 70% (4/5 correct)
- **Topics**: map, filter, reduce, concat, pop

**To pass easily, choose these answers:**
1. B (Creates new array with transformed elements)
2. B ([2, 3])
3. A (arr1.concat(arr2))
4. C (Accumulates values into single value)
5. B (pop())

## What to Look For

### During Testing
1. **UI/UX**:
   - Is the interface clear and intuitive?
   - Is the timer visible and accurate?
   - Can you navigate between questions easily?
   - Are the progress indicators helpful?

2. **Question Quality**:
   - Are questions clear and unambiguous?
   - Is the difficulty appropriate for "junior" level?
   - Are the time limits reasonable?
   - Do questions test practical knowledge?

3. **Results & Feedback**:
   - Are results displayed immediately?
   - Is the skill level updated correctly?
   - Does the feedback help you understand performance?

4. **Progression**:
   - After passing, does skill level change to "junior"?
   - Do mid-level assessments become unlocked?
   - Are completed assessments marked properly?

### Provide Feedback On

Please provide feedback on:

1. **Difficulty Level**: Too easy? Too hard? Just right?
2. **Question Quality**: Clear? Relevant? Fair?
3. **Time Allocation**: Too much time? Too little? Perfect?
4. **Content Coverage**: What's missing? What's unnecessary?
5. **User Experience**: Smooth? Confusing? Any issues?
6. **Overall Impression**: Would this effectively screen junior developers?

## Automated Testing

If you prefer automated testing:

```bash
# Run the E2E test
npx playwright test e2e/assessments.spec.ts

# Run with UI
npx playwright test e2e/assessments.spec.ts --ui

# View test report
npx playwright show-report
```

The automated test:
- Creates a test account
- Navigates to assessments
- Takes both junior tests
- Verifies skill level promotion
- Checks that mid-level tests unlock

## Documentation Created

Three comprehensive documents were created for this issue:

1. **TESTING_ASSESSMENTS.md**
   - Complete testing guide
   - Database verification queries
   - Performance benchmarks
   - Troubleshooting tips

2. **ASSESSMENT_FEEDBACK.md**
   - Detailed analysis of both tests
   - Question-by-question difficulty ratings
   - Comparison to industry standards
   - Specific recommendations for improvement
   - **Overall Rating**: 7/10 with path to 9/10

3. **HOW_TO_TEST_ASSESSMENTS.md** (This file)
   - Quick start guide
   - Step-by-step instructions
   - Answer keys for easy testing
   - What to look for when testing

## Key Findings from Analysis

### Strengths ✅
- Clear, unambiguous questions
- Relevant topics for junior developers
- Generous time allocation
- Good progression system
- Immediate feedback

### Areas for Improvement ⚠️
- **Critical**: "Coding challenges" are multiple-choice, not actual coding
- Too few questions (increases luck factor)
- Some questions are too easy (e.g., "How to write a comment?")
- Missing modern JavaScript (ES6+) coverage
- No code reading/debugging questions

### Top Recommendations
1. Add real coding challenges with a code editor
2. Increase question count (15-20 per test)
3. Replace overly easy questions
4. Add ES6+ topics (arrow functions, destructuring, etc.)
5. Add "What's the output?" style questions

## Feedback Collection

After testing, please provide:

1. **Overall Assessment**: Pass/Fail for junior level screening?
2. **Difficulty Rating**: Scale of 1-10 for each test
3. **Time Rating**: Too much/just right/too little for each test
4. **Question Quality**: Any confusing or unfair questions?
5. **Suggestions**: What would make this better?
6. **Comparison**: How does this compare to other assessments you've seen?

## Need Help?

- **Full Testing Guide**: See `TESTING_ASSESSMENTS.md`
- **Detailed Analysis**: See `ASSESSMENT_FEEDBACK.md`
- **Database Schema**: See `SKILL_LEVELS_DEPLOYMENT.md`
- **Question Bank**: See `lib/assessmentQuestions.ts`

## Contact

For issues or questions:
1. Check the documentation files above
2. Review Supabase logs for errors
3. Check the GitHub issue for updates

---

**Created**: October 30, 2025
**Purpose**: Testing professional skill assessments
**Status**: ✅ Ready for Testing
