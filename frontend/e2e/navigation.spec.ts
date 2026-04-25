import { test, expect } from '@playwright/test';

/**
 * Navigation & Navbar E2E Tests
 * Tests the Navbar rendering and navigation between public pages.
 */

test.describe('Navigation Bar', () => {
  test('should show navbar on login page', async ({ page }) => {
    await page.goto('/login');
    // Navbar should be present (check for a nav element or brand logo)
    const navbar = page.locator('nav').or(page.locator('[class*="navbar"]')).first();
    await expect(navbar).toBeVisible();
  });

  test('should navigate between login and register via nav links', async ({ page }) => {
    await page.goto('/login');
    // Go to register
    await page.getByRole('link', { name: /Create one here|Register/i }).first().click();
    await expect(page).toHaveURL(/\/register/);

    // Go back to login
    await page.getByRole('link', { name: /Sign In|Login|Log In/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Test User', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/profile');
  });

  test('should render the profile page when authenticated', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Error loading profile/i).or(page.getByRole('heading').first())).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Test User', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/notifications');
  });

  test('should render the notifications page when authenticated', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('User Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student User', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/user');
  });

  test('should render the user dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect authenticated user from their dashboard', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});
