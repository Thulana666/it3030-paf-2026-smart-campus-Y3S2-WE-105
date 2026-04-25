import { test, expect } from '@playwright/test';

/**
 * Technician Group – Technician Dashboard & Operational Schedule E2E Tests
 * Tests pages specific to the TECHNICIAN role.
 * Tag: Technician
 */

test.describe('Technician Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNoQGNhbXB1cy5lZHUiLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 't1', name: 'Tech Admin', email: 'tech@campus.edu', role: 'TECHNICIAN' }));
    });
    await page.goto('/dashboard/technician');
  });

  test('should render the Technician Portal heading', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Technician Portal')).toBeVisible({ timeout: 10000 });
  });

  test('should display Assigned Tickets card', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Assigned Tickets/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display Repair Progress card', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Repair Progress/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display Operational Schedule card', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Operational Schedule/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Worklist button should navigate to incident-tickets', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Worklist/i }).click();
    await expect(page).toHaveURL(/incident-tickets/);
  });

  test('View Progress button should navigate to repair-progress', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /View Progress/i }).click();
    await expect(page).toHaveURL(/repair-progress/);
  });

  test('Shift Info button should navigate to schedule', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Shift Info/i }).click();
    await expect(page).toHaveURL(/schedule/);
  });
});

test.describe('Operational Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNoQGNhbXB1cy5lZHUiLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 't1', name: 'Tech Admin', email: 'tech@campus.edu', role: 'TECHNICIAN' }));
    });
    await page.goto('/dashboard/schedule');
  });

  test('should render the schedule page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Technician RBAC', () => {
  test('unauthenticated user cannot access technician dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard/technician');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
