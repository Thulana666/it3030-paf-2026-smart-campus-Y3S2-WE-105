import { test, expect } from '@playwright/test';

/**
 * Resources Group – Booking System & Facilities E2E Tests
 * Tests the resource/booking UI pages for a logged-in USER.
 * Tag: Resources
 */

test.describe('Facilities Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/facilities');
  });

  test('should show facilities/resources page content', async ({ page }) => {
    // Wait for some heading or content
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect authenticated user away from facilities', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Booking System Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/bookings');
  });

  test('should render the booking page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect authenticated user from bookings page', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Unauthenticated Resource Access', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    // Clear storage to simulate logged-out state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard/facilities');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should redirect booking page to login if not authenticated', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard/bookings');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
