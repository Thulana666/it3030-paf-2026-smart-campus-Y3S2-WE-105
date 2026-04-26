import { test, expect } from '@playwright/test';

/**
 * Tickets Group – Incident Ticket E2E Tests
 * Tests ticket creation and listing pages.
 * Tag: Tickets
 */

test.describe('Incident Tickets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/incident-tickets');
  });

  test('should render the tickets list page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not redirect authenticated user away from tickets', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Ticket Create Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Student', email: 'user@campus.edu', role: 'USER' }));
    });
    await page.goto('/dashboard/tickets/create');
  });

  test('should render the ticket creation form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Should have some form inputs visible
    const inputs = page.getByRole('textbox');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should not redirect away when authenticated', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Repair Progress Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
      localStorage.setItem('user', JSON.stringify({ id: 't1', name: 'Tech', email: 'tech@campus.edu', role: 'TECHNICIAN' }));
    });
    await page.goto('/dashboard/repair-progress');
  });

  test('should render the repair progress page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Unauthenticated Ticket Access', () => {
  test('should redirect to login when accessing tickets without auth', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard/incident-tickets');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
