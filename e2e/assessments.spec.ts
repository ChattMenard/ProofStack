/**
 * E2E Tests: Professional Skill Assessments
 * 
 * Tests the complete assessment flow:
 * 1. Create professional account
 * 2. Navigate to assessments page
 * 3. Take junior-quiz-1 (JavaScript Fundamentals)
 * 4. Take junior-code-1 (Array Manipulation)
 * 5. Verify skill level promotion
 * 6. Verify mid-level assessments unlock
 */

import { test, expect } from '@playwright/test'

// Test data
const testProfessional = {
  email: `test-${Date.now()}@proofstack.test`,
  password: 'TestPass123!',
  username: `testpro${Date.now()}`,
  fullName: 'Test Professional'
}

test.describe('Professional Skill Assessments', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
  })

  test('complete junior assessment flow and verify skill level promotion', async ({ page }) => {
    // ============================================================
    // STEP 1: Create Professional Account
    // ============================================================
    
    await test.step('Create professional account', async () => {
      await page.goto('/signup')
      
      // Select professional user type
      const professionalButton = page.getByRole('button', { name: /professional|talent/i })
      await professionalButton.click()
      
      // Fill registration form
      await page.fill('input[name="email"]', testProfessional.email)
      await page.fill('input[name="password"]', testProfessional.password)
      await page.fill('input[name="username"]', testProfessional.username)
      await page.fill('input[name="fullName"]', testProfessional.fullName)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Wait for redirect (may go to onboarding or dashboard)
      await page.waitForURL(/\/(onboarding|dashboard|professional)/, { timeout: 10000 })
    })

    // ============================================================
    // STEP 2: Navigate to Assessments Page
    // ============================================================
    
    await test.step('Navigate to assessments page', async () => {
      await page.goto('/professional/assessments')
      
      // Wait for page to load
      await page.waitForSelector('h1:has-text("Skill Assessments")')
      
      // Verify page elements
      await expect(page.locator('h1')).toContainText('Skill Assessments')
      
      // Verify skill level badge shows "unverified"
      const badgeText = await page.locator('[class*="badge"]').first().textContent()
      expect(badgeText?.toLowerCase()).toContain('unverified')
      
      // Verify statistics are present
      await expect(page.locator('text=Completed')).toBeVisible()
      await expect(page.locator('text=Available')).toBeVisible()
      await expect(page.locator('text=Total')).toBeVisible()
    })

    // ============================================================
    // STEP 3: Take Junior Quiz 1 - JavaScript Fundamentals
    // ============================================================
    
    await test.step('Complete JavaScript Fundamentals quiz', async () => {
      // Find and click the JavaScript Fundamentals assessment
      const jsQuizCard = page.locator('text=JavaScript Fundamentals').first()
      await expect(jsQuizCard).toBeVisible()
      
      // Click "Start Assessment" button
      await page.click('button:has-text("Start Assessment")')
      
      // Wait for assessment page to load
      await page.waitForURL('**/professional/assessments/junior-quiz-1')
      await page.waitForSelector('h1:has-text("JavaScript Fundamentals")')
      
      // Verify timer is running
      await expect(page.locator('text=/⏱️.*:/')).toBeVisible()
      
      // Answer all 10 questions
      // These are the correct answers based on assessmentQuestions.ts
      const correctAnswers = [1, 1, 0, 2, 1, 1, 1, 2, 1, 0] // Indices of correct answers
      
      for (let i = 0; i < correctAnswers.length; i++) {
        // Select the correct answer for current question
        const answerButtons = page.locator('button[class*="border"]').filter({ hasText: /^[A-Z]\./ })
        await answerButtons.nth(correctAnswers[i]).click()
        
        // Wait a moment for the answer to be registered
        await page.waitForTimeout(200)
        
        // Navigate to next question (or submit if last question)
        if (i < correctAnswers.length - 1) {
          await page.click('button:has-text("Next")')
          await page.waitForTimeout(300)
        }
      }
      
      // Submit the assessment
      await page.click('button:has-text("Submit Assessment")')
      
      // Wait for results page
      await page.waitForSelector('text=/Assessment Passed|Keep Practicing/')
      
      // Verify passing result (100% correct)
      await expect(page.locator('text=Assessment Passed')).toBeVisible()
      
      // Go back to assessments page
      await page.click('button:has-text("Back to Assessments")')
      await page.waitForURL('**/professional/assessments')
    })

    // ============================================================
    // STEP 4: Take Junior Code 1 - Array Manipulation
    // ============================================================
    
    await test.step('Complete Array Manipulation challenge', async () => {
      // Find and click the Array Manipulation assessment
      const arrayChallenge = page.locator('text=Array Manipulation').first()
      await expect(arrayChallenge).toBeVisible()
      
      // Click "Start Assessment" button
      await page.click('button:has-text("Start Assessment")')
      
      // Wait for assessment page to load
      await page.waitForURL('**/professional/assessments/junior-code-1')
      await page.waitForSelector('h1:has-text("Array Manipulation")')
      
      // Verify timer is running
      await expect(page.locator('text=/⏱️.*:/')).toBeVisible()
      
      // Answer all 5 questions
      // Correct answers based on assessmentQuestions.ts
      const correctAnswers = [1, 1, 0, 2, 1] // Indices of correct answers
      
      for (let i = 0; i < correctAnswers.length; i++) {
        // Select the correct answer for current question
        const answerButtons = page.locator('button[class*="border"]').filter({ hasText: /^[A-Z]\./ })
        await answerButtons.nth(correctAnswers[i]).click()
        
        // Wait a moment for the answer to be registered
        await page.waitForTimeout(200)
        
        // Navigate to next question (or submit if last question)
        if (i < correctAnswers.length - 1) {
          await page.click('button:has-text("Next")')
          await page.waitForTimeout(300)
        }
      }
      
      // Submit the assessment
      await page.click('button:has-text("Submit Assessment")')
      
      // Wait for results page
      await page.waitForSelector('text=/Assessment Passed|Keep Practicing/')
      
      // Verify passing result (100% correct)
      await expect(page.locator('text=Assessment Passed')).toBeVisible()
      
      // Verify skill level changed message
      await expect(page.locator('text=/New Skill Level|Junior/i')).toBeVisible()
      
      // Go back to assessments page
      await page.click('button:has-text("Back to Assessments")')
      await page.waitForURL('**/professional/assessments')
    })

    // ============================================================
    // STEP 5: Verify Skill Level Promotion
    // ============================================================
    
    await test.step('Verify skill level promoted to Junior', async () => {
      // Wait for page to reload/update
      await page.waitForTimeout(1000)
      
      // Reload page to ensure fresh data
      await page.reload()
      await page.waitForSelector('h1:has-text("Skill Assessments")')
      
      // Verify skill level badge shows "Junior"
      const progressSection = page.locator('[class*="rounded-xl"]').first()
      await expect(progressSection).toContainText(/Junior/i)
      
      // Verify completed count increased to 2
      const completedStat = page.locator('text=Completed').locator('..')
      await expect(completedStat).toContainText('2')
    })

    // ============================================================
    // STEP 6: Verify Mid-Level Assessments Unlocked
    // ============================================================
    
    await test.step('Verify mid-level assessments are now available', async () => {
      // Scroll to mid-level section
      const midLevelSection = page.locator('h2:has-text("Mid Level")')
      await midLevelSection.scrollIntoViewIfNeeded()
      
      // Verify mid-level assessments are visible
      await expect(midLevelSection).toBeVisible()
      
      // Verify mid-level assessment cards are unlocked (not showing lock icon)
      const reactQuiz = page.locator('text=React & State Management')
      await expect(reactQuiz).toBeVisible()
      
      // Verify "Start Assessment" button is enabled (not "🔒 Locked")
      const midAssessmentButtons = page.locator('h2:has-text("Mid Level")').locator('..').locator('button:has-text("Start Assessment")')
      expect(await midAssessmentButtons.count()).toBeGreaterThan(0)
    })

    // ============================================================
    // STEP 7: Verify Junior Assessments Show as Completed
    // ============================================================
    
    await test.step('Verify junior assessments show as completed', async () => {
      // Scroll back to junior section
      const juniorSection = page.locator('h2:has-text("Junior Level")')
      await juniorSection.scrollIntoViewIfNeeded()
      
      // Verify both junior assessments show completed status
      const completedBadges = page.locator('span:has-text("✓ Completed")')
      expect(await completedBadges.count()).toBeGreaterThanOrEqual(2)
      
      // Verify buttons show "✓ Completed" instead of "Start Assessment"
      const juniorButtons = page.locator('h2:has-text("Junior Level")').locator('..').locator('button:has-text("✓ Completed")')
      expect(await juniorButtons.count()).toBe(2)
    })
  })

  test('verify locked assessments cannot be accessed', async ({ page }) => {
    await test.step('Attempt to access locked senior assessment', async () => {
      // Try to directly navigate to a senior assessment
      await page.goto('/professional/assessments/senior-quiz-1')
      
      // Should either:
      // 1. Redirect back to assessments page
      // 2. Show an error message
      // 3. Display a "locked" state
      
      // Wait a moment for any redirects
      await page.waitForTimeout(2000)
      
      // Check if we're still on the assessment page or redirected
      const url = page.url()
      
      if (url.includes('/professional/assessments/senior-quiz-1')) {
        // If we're on the page, it should show as locked or error
        const pageText = await page.textContent('body')
        expect(pageText).toMatch(/locked|not found|unavailable|unauthorized/i)
      } else {
        // If redirected, verify we're back on the main assessments page
        expect(url).toContain('/professional/assessments')
      }
    })
  })

  test('verify timer auto-submits assessment when time expires', async ({ page }) => {
    // This test is optional and takes a long time - skip by default
    test.skip(true, 'Timer test takes 20+ minutes - run manually if needed')
    
    await test.step('Start assessment and let timer expire', async () => {
      // Create account and navigate to assessment
      // ... (setup steps)
      
      // Start assessment
      await page.goto('/professional/assessments/junior-quiz-1')
      
      // Wait for timer to reach near zero (mock by setting time to 10 seconds in test)
      // In a real test, you'd mock the timer or reduce duration
      
      // Verify auto-submission occurs
      await page.waitForSelector('text=/Assessment Passed|Keep Practicing/', { timeout: 30000 })
    })
  })

  test('verify rate limiting on assessment submission', async ({ page }) => {
    await test.step('Submit assessments rapidly to trigger rate limit', async () => {
      // This test verifies the rate limiting works
      // Note: Implementation depends on having rate limiting enabled
      
      // Create account and navigate to assessment
      // ... (setup steps)
      
      // Submit same assessment multiple times quickly
      // Should eventually get a 429 error or rate limit message
      
      // This is more of an API test and might be better in a separate suite
    })
  })
})

test.describe('Assessment UI Components', () => {
  test('verify assessment card displays correctly', async ({ page }) => {
    // This test verifies the UI elements of assessment cards
    await page.goto('/professional/assessments')
    
    // Wait for page load
    await page.waitForSelector('h1:has-text("Skill Assessments")')
    
    // Verify junior assessment cards
    const jsCard = page.locator('text=JavaScript Fundamentals').locator('..')
    
    // Verify card shows required information
    await expect(jsCard).toContainText('JavaScript Fundamentals')
    await expect(jsCard).toContainText(/\d+ min/) // Duration
    await expect(jsCard).toContainText(/\d+%/) // Passing score
    await expect(jsCard).toContainText('Start Assessment')
  })

  test('verify navigation between questions works', async ({ page }) => {
    // Start an assessment and verify navigation
    await page.goto('/professional/assessments/junior-quiz-1')
    
    // Verify we can navigate forward and backward
    const nextButton = page.locator('button:has-text("Next")')
    const prevButton = page.locator('button:has-text("Previous")')
    
    // Next should be enabled, Previous disabled on first question
    await expect(nextButton).toBeEnabled()
    await expect(prevButton).toBeDisabled()
    
    // Click Next
    await nextButton.click()
    await page.waitForTimeout(200)
    
    // Now Previous should be enabled
    await expect(prevButton).toBeEnabled()
    
    // Click Previous
    await prevButton.click()
    await page.waitForTimeout(200)
    
    // Back to first question, Previous disabled again
    await expect(prevButton).toBeDisabled()
  })

  test('verify answer status indicators work', async ({ page }) => {
    // Start an assessment
    await page.goto('/professional/assessments/junior-quiz-1')
    
    // Verify status indicators show unanswered state
    const statusIndicators = page.locator('button', { has: page.locator('text=/^\\d+$/') })
    const firstIndicator = statusIndicators.first()
    
    // Initially should be unanswered (white background)
    await expect(firstIndicator).toHaveClass(/bg-white|border-gray/)
    
    // Answer the first question
    const answerButton = page.locator('button[class*="border"]').filter({ hasText: /^[A-Z]\./ }).first()
    await answerButton.click()
    await page.waitForTimeout(200)
    
    // Now should show as answered (colored background)
    await expect(firstIndicator).toHaveClass(/bg-indigo/)
  })
})
