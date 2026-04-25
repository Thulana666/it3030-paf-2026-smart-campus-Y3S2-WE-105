import { test, expect } from '@playwright/test';

/**
 * Auth Group – Login Page E2E Tests
 * Tests the login form UI, validation, and navigation.
 * Tag: Auth
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display the login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Smart Campus/i);
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Login to your Smart Campus account')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    // Click on email, then blur away without entering anything
    await page.getByLabel('Email Address').click();
    await page.getByLabel('Password').click();
    await expect(page.getByText(/valid email/i).or(page.getByText(/email is required/i))).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel('Email Address').fill('not-an-email');
    await page.getByLabel('Password').click(); // blur
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('TestPass123!');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye toggle button
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.getByRole('link', { name: /Create one here/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/Create Account/i).or(page.getByText(/Register/i)).first()).toBeVisible();
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.getByLabel('Email Address').fill('wrong@user.com');
    await page.getByPlaceholder('••••••••').fill('WrongPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should show an error message (network error or auth error)
    await expect(page.locator('.error-alert')).toBeVisible({ timeout: 8000 });
  });

  test('should redirect root URL to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
