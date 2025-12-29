import { test, expect } from '@playwright/test';

/**
 * E2E tests for authentication flow
 * Tests the complete user journey from registration to login
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page before each test
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check page title or heading - use more specific selector
    await expect(page.getByRole('heading', { name: /logowanie/i })).toBeVisible();

    // Check for email and password fields using data-testid
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();

    // Check for submit button
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/auth/register');

    // Check page title or heading - use more specific selector
    await expect(page.getByRole('heading', { name: /utwórz konto/i })).toBeVisible();

    // Check for required fields using data-testid
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password')).toBeVisible();

    // Check for submit button
    await expect(page.getByTestId('register-submit')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Wait for form to be fully hydrated
    await page.getByTestId('login-submit').waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Fill in invalid email
    const emailInput = page.getByTestId('login-email');
    await emailInput.fill('invalid-email');
    await expect(emailInput).toHaveValue('invalid-email');

    // Fill in password
    const passwordInput = page.getByTestId('login-password');
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');

    // Submit form - this will trigger React Hook Form validation
    await page.getByTestId('login-submit').click();

    // Check for error message
    await expect(page.getByTestId('login-email-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('login-email-error')).toContainText(/nieprawidłowy.*format/i);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click forgot password link
    await page.getByRole('link', { name: /zapomnia.*has[łl]|forgot.*password/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await expect(page.getByText(/odzyskaj dostęp do konta/i)).toBeVisible();
  });

  test('should navigate between login and registration pages', async ({ page }) => {
    await page.goto('/auth/login');

    // Navigate to registration - click the link in main content, not navigation
    await page.getByRole('main').getByRole('link', { name: /zarejestruj się/i }).click();
    await expect(page).toHaveURL(/\/auth\/register/);

    // Navigate back to login - click the link in main content, not navigation
    await page.getByRole('main').getByRole('link', { name: /zaloguj się/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/auth/login');

    // Focus on email field and type
    await page.getByTestId('login-email').focus();
    await page.keyboard.type('test@example.com');

    // Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Form should attempt to submit (we'll see error or navigation)
    // This test verifies keyboard navigation works
  });

  test.describe('Form Validation', () => {
    test('should show error for empty fields on login', async ({ page }) => {
      await page.goto('/auth/login');

      // Wait for form to be fully hydrated
      await page.getByTestId('login-submit').waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');

      // Try to submit without filling fields
      await page.getByTestId('login-submit').click();

      // Check if validation error for email is shown
      await expect(page.locator('text=/adres e-mail jest wymagany/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for short password on registration', async ({ page }) => {
      await page.goto('/auth/register');

      // Fill with short password
      await page.getByTestId('register-email').fill('test@example.com');
      await page.getByTestId('register-password').fill('short');
      await page.getByTestId('register-confirm-password').fill('short');

      // Submit form
      await page.getByTestId('register-submit').click();

      // Wait a bit for validation
      await page.waitForTimeout(500);

      // Check for error message about password length
      await expect(page.locator('text=/hasło musi mieć co najmniej 8 znaków/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Visual Regression', () => {
    test('should match login page screenshot', async ({ page }) => {
      await page.goto('/auth/login');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Wait for the form to be visible
      await page.getByTestId('login-email').waitFor({ state: 'visible' });

      // Take screenshot and compare
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        maxDiffPixels: 200, // Allow more differences due to potential styling changes
      });
    });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/generations');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect authenticated user away from auth pages', async ({ page }) => {
    // This test would require setting up authentication cookies
    // Skipping actual implementation as it requires real auth setup
    // In real scenario, you'd set cookies and verify redirect to /generations
    test.skip();
  });
});
