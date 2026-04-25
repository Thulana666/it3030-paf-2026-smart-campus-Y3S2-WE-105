import { test, expect } from '@playwright/test';

/**
 * Admin Group – Admin Dashboard, User Management & Analytics E2E Tests
 * Tests admin-only pages and role-based access control.
 * Tag: Admin
 */

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBjYW1wdXMuZWR1Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'a1', name: 'Admin', email: 'admin@campus.edu', role: 'ADMIN' }));
    });
    await page.goto('/dashboard/admin');
  });

  test('should render admin dashboard for ADMIN role', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect admin to login', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('User Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBjYW1wdXMuZWR1Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'a1', name: 'Admin', email: 'admin@campus.edu', role: 'ADMIN' }));
    });
    await page.goto('/dashboard/users');
  });

  test('should render user management page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBjYW1wdXMuZWR1Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'a1', name: 'Admin', email: 'admin@campus.edu', role: 'ADMIN' }));
    });
    await page.goto('/dashboard/analytics');
  });

  test('should render global analytics page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect admin away from analytics', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Role-Based Access Control', () => {
  test('non-admin user should not access admin-only pages', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/users');
    // Should be redirected away or show forbidden
    await page.waitForLoadState('networkidle');
    // Ensure we don't stay on the admin-only page
    await expect(page).not.toHaveURL(/\/dashboard\/users/);
  });

  test('unauthenticated user should not access admin pages', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard/analytics');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
