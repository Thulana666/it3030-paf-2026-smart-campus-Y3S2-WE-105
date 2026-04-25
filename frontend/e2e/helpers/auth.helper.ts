import { test, expect, Page } from '@playwright/test';

/**
 * Shared helper: inject a fake JWT token into localStorage so
 * Playwright tests can bypass the real login flow.
 *
 * The token payload encodes: { sub: email, role: ROLE, exp: far future }
 * These are base64-encoded mock JWTs — they are NOT cryptographically valid,
 * but they are valid for the localStorage-based auth check in the React app.
 */

const MOCK_TOKENS: Record<string, string> = {
  USER: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGNhbXB1cy5lZHUiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock',
  ADMIN: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBjYW1wdXMuZWR1Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock',
  TECHNICIAN: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNoQGNhbXB1cy5lZHUiLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock',
};

const MOCK_USERS: Record<string, object> = {
  USER: { id: 'user1', name: 'Test Student', email: 'user@campus.edu', role: 'USER' },
  ADMIN: { id: 'admin1', name: 'Admin User', email: 'admin@campus.edu', role: 'ADMIN' },
  TECHNICIAN: { id: 'tech1', name: 'Tech User', email: 'tech@campus.edu', role: 'TECHNICIAN' },
};

export async function loginAs(page: Page, role: 'USER' | 'ADMIN' | 'TECHNICIAN') {
  await page.goto('/login');

  // Inject auth state directly into localStorage
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token: MOCK_TOKENS[role], user: MOCK_USERS[role] }
  );
}
