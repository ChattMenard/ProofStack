import { test, expect } from '@playwright/test';

test.describe('ProofStack E2E Smoke Test', () => {
  test('should load home page and display auth form', async ({ page }) => {
    await page.goto('/');

    // Check page title and basic elements
    await expect(page).toHaveTitle(/ProofStack/);

    // Check auth form is present - use more specific selector
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('text=Send Magic Link')).toBeVisible();
    await expect(page.locator('text=Sign in with GitHub')).toBeVisible();

    // Check demo upload section
    await expect(page.locator('text=Demo upload')).toBeVisible();
  });

  test('should navigate to upload page', async ({ page }) => {
    await page.goto('/upload');

    // Check upload page loads
    await expect(page.locator('text=Upload a demo sample')).toBeVisible();
    await expect(page.locator('text=Paste a short text sample')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Check login page loads
    await expect(page.locator('text=Sign in to ProofStack')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');

    // Check signup page loads
    await expect(page.locator('text=Create ProofStack Account')).toBeVisible();
  });
});