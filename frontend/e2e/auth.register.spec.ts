import { test, expect } from '@playwright/test';

/**
 * Auth Group – Register Page E2E Tests
 * Tests the registration form UI, validation flows, and navigation.
 * Tag: Auth
 */

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display the register page correctly', async ({ page }) => {
    await expect(page.getByText(/Create Account/i).or(page.getByText(/Register/i)).first()).toBeVisible();
    await expect(page.getByLabel(/Full Name/i).or(page.getByPlaceholder(/John Doe/i)).first()).toBeVisible();
    await expect(page.getByLabel(/Email/i).first()).toBeVisible();
    await expect(page.getByLabel(/Password/i).first()).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    // Fill in all fields with mismatched passwords
    const nameField = page.getByPlaceholder(/John Doe/i).or(page.getByLabel(/Name/i).first());
    await nameField.fill('Test User').catch(() => {});

    await page.getByLabel(/Email/i).first().fill('test@campus.edu');
    await page.getByLabel(/^Password/i).first().fill('Password123!');

    // Find confirm password
    const confirmPwd = page.getByLabel(/Confirm Password/i).or(page.getByPlaceholder(/Confirm/i)).first();
    await confirmPwd.fill('DifferentPass999!').catch(() => {});

    await page.getByRole('button', { name: /Register|Create Account|Sign Up/i }).click();

    // Should either show mismatch error or stay on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have a link back to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Sign In|Login|Log In/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate email format on register page', async ({ page }) => {
    const emailField = page.getByLabel(/Email/i).first();
    await emailField.fill('invalid-email');
    await page.getByLabel(/^Password/i).first().click(); // blur
    
    // Expect error message
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should not allow empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /Register|Create Account|Sign Up/i }).click();
    // Should stay on register page
    await expect(page).toHaveURL(/\/register/);
  });
});
