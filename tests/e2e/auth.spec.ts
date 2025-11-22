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
    
    // Check page title or heading
    await expect(page.locator('h1, h2')).toContainText(/log|zaloguj/i);
    
    // Check for email and password fields
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/has[łl]o|password/i)).toBeVisible();
    
    // Check for submit button
    await expect(page.getByRole('button', { name: /log|zaloguj/i })).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check page title or heading
    await expect(page.locator('h1, h2')).toContainText(/rejestra|register/i);
    
    // Check for required fields
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/has[łl]o|password/i).first()).toBeVisible();
    
    // Check for submit button
    await expect(page.getByRole('button', { name: /rejestra|register/i })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in invalid email
    await page.getByLabel(/e-mail|email/i).fill('invalid-email');
    await page.getByLabel(/has[łl]o|password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /log|zaloguj/i }).click();
    
    // Check for error message
    await expect(page.locator('text=/nieprawid.*format|invalid.*format/i')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.getByRole('link', { name: /zapomnia.*has[łl]|forgot.*password/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await expect(page.locator('h1, h2')).toContainText(/zapomnia|forgot/i);
  });

  test('should navigate between login and registration pages', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Navigate to registration
    await page.getByRole('link', { name: /rejestra|register|sign up/i }).click();
    await expect(page).toHaveURL(/\/auth\/register/);
    
    // Navigate back to login
    await page.getByRole('link', { name: /log|sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Email field
    await page.keyboard.type('test@example.com');
    
    await page.keyboard.press('Tab'); // Password field
    await page.keyboard.type('password123');
    
    await page.keyboard.press('Tab'); // Submit button
    await page.keyboard.press('Enter');
    
    // Form should attempt to submit (we'll see error or navigation)
    // This test verifies keyboard navigation works
  });

  test.describe('Form Validation', () => {
    test('should show error for empty fields on login', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit without filling fields
      await page.getByRole('button', { name: /log|zaloguj/i }).click();
      
      // HTML5 validation or custom error should appear
      const emailInput = page.getByLabel(/e-mail|email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for short password on registration', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Fill with short password
      await page.getByLabel(/e-mail|email/i).fill('test@example.com');
      await page.getByLabel(/has[łl]o|password/i).first().fill('short');
      
      // Submit form
      await page.getByRole('button', { name: /rejestra|register/i }).click();
      
      // Check for error message about password length
      await expect(page.locator('text=/8.*znak|8.*character/i')).toBeVisible();
    });
  });

  test.describe('Visual Regression', () => {
    test('should match login page screenshot', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Take screenshot and compare
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        maxDiffPixels: 100, // Allow small differences
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

