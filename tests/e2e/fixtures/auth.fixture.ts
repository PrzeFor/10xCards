import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Auth fixture for E2E tests
 * Provides authenticated page context for protected routes
 */

export interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Login helper function
 * Logs in a user through the UI
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials using data-testid (most reliable)
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);

  // Submit form
  await page.getByTestId('login-submit').click();

  // Wait for redirect to authenticated page (increased timeout to account for API call + 500ms delay)
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 15000,
  });

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
}

/**
 * Extended test with authenticated page fixture
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, callback) => {
    // Get credentials from environment variables
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        '❌ TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test\n' +
          '\n' +
          'Required variables in .env.test:\n' +
          '  - TEST_USER_EMAIL=test@example.com\n' +
          '  - TEST_USER_PASSWORD=TestPassword123!\n' +
          '  - E2E_USER_ID=4d803b8f-2add-4610-9af3-2103e9b6714b\n' +
          '  - SUPABASE_URL=https://your-project.supabase.co\n' +
          '  - SUPABASE_PUBLIC_KEY=eyJhbGciOi... (anon public key)\n' +
          '\n' +
          'See tests/e2e/QUICK_START.md for setup instructions'
      );
    }

    try {
      // Login before each test
      await loginUser(page, email, password);

      // Verify we're authenticated (should be redirected away from login)
      await expect(page).not.toHaveURL(/\/auth\/login/);

      // Use the authenticated page
      await callback(page);
    } catch (error) {
      // Take screenshot on login failure
      await page.screenshot({ path: 'test-results/login-failure.png', fullPage: true });

      console.error('\n❌ Login failed!');
      console.error('Email:', email);
      console.error('Current URL:', page.url());
      console.error('\nCheck:');
      console.error('1. Is .env.test configured correctly?');
      console.error('2. Does the test user exist in the database?');
      console.error('3. Are credentials correct?');
      console.error('\nSee screenshot: test-results/login-failure.png\n');

      throw error;
    }

    // Cleanup: logout after test (optional)
    // await page.goto('/api/auth/logout');
  },
});

export { expect };
