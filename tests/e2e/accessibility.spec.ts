import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core
 * Ensures WCAG 2.1 compliance
 */

test.describe('Accessibility Tests', () => {
  test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('registration page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/register');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forgot password page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/auth/login');

    // Check that all input fields have associated labels
    const emailInput = page.getByLabel(/e-mail|email/i);
    const passwordInput = page.getByLabel(/has[łl]o|password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Run focused scan on form controls
    const accessibilityScanResults = await new AxeBuilder({ page }).include('form').withTags(['wcag2a']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/auth/login');

    // All buttons should have accessible names
    const buttons = await page.getByRole('button').all();

    for (const button of buttons) {
      const accessibleName = (await button.getAttribute('aria-label')) || (await button.textContent());
      expect(accessibleName).toBeTruthy();
    }
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).include('body').analyze();

    // Check specifically for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('landmarks should be properly defined', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.getByRole('main');
    await expect(main).toBeAttached();

    // Run landmark-related checks
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    const landmarkViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.includes('landmark') || violation.id.includes('region')
    );

    expect(landmarkViolations).toEqual([]);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    // Check for image-alt violations
    const imageViolations = accessibilityScanResults.violations.filter((violation) => violation.id === 'image-alt');

    expect(imageViolations).toEqual([]);
  });

  test('heading hierarchy should be correct', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    // Check for heading order violations
    const headingViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id.includes('heading')
    );

    expect(headingViolations).toEqual([]);
  });

  test('should allow disabling specific rules if needed', async ({ page }) => {
    await page.goto('/');

    // Example: if you have a known violation that's acceptable
    // You can disable specific rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Example: temporarily disable
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
