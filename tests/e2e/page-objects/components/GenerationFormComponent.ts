import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component Object Model for the Generation Form
 * Handles text input and flashcard generation
 */
export class GenerationFormComponent {
  readonly page: Page;
  readonly sourceTextArea: Locator;
  readonly generateButton: Locator;
  readonly characterCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextArea = page.getByTestId('generation-source-text');
    this.generateButton = page.getByTestId('generate-flashcards-button');
    this.characterCount = page.locator('text=/Znaki: \\d+/');
  }

  /**
   * Fill the source text area with the provided text
   * @param text - Text to generate flashcards from
   */
  async fillSourceText(text: string) {
    // Ensure element is visible and ready
    await this.sourceTextArea.waitFor({ state: 'visible' });
    await this.sourceTextArea.fill(text);
  }

  /**
   * Clear the source text area
   */
  async clearSourceText() {
    await this.sourceTextArea.clear();
  }

  /**
   * Get the current value of the source text area
   */
  async getSourceText() {
    return await this.sourceTextArea.inputValue();
  }

  /**
   * Click the generate button
   */
  async clickGenerate() {
    await this.generateButton.waitFor({ state: 'visible' });
    await this.generateButton.click();
  }

  /**
   * Submit the form (fill text and click generate)
   * @param text - Optional text to fill before submitting
   */
  async submit(text?: string) {
    if (text) {
      await this.fillSourceText(text);
    }
    await this.clickGenerate();
  }

  /**
   * Check if the generate button is disabled
   */
  async isGenerateButtonDisabled() {
    return await this.generateButton.isDisabled();
  }

  /**
   * Check if the generate button is enabled
   */
  async isGenerateButtonEnabled() {
    return await this.generateButton.isEnabled();
  }

  /**
   * Wait for the form to be in generating state
   */
  async waitForGeneratingState() {
    await expect(this.generateButton).toContainText('Generuję fiszki...');
  }

  /**
   * Wait for the form to be in idle state (ready to generate)
   */
  async waitForIdleState() {
    await expect(this.generateButton).toContainText('Generuj fiszki');
  }

  /**
   * Get the character count displayed
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.characterCount.textContent();
    const match = text?.match(/Znaki: ([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
  }

  /**
   * Check if validation error is displayed (inline error with role="alert")
   * @param errorMessage - Expected error message
   */
  async hasValidationError(errorMessage?: string) {
    const errorLocator = this.page.getByRole('alert');
    const isVisible = await errorLocator.isVisible();

    if (errorMessage && isVisible) {
      await expect(errorLocator).toContainText(errorMessage);
    }

    return isVisible;
  }

  /**
   * Check if inline validation feedback is displayed
   * This is the text that shows "Potrzebujesz jeszcze X znaków"
   */
  async hasInlineValidationFeedback() {
    const feedbackLocator = this.page.locator('text=/Potrzebujesz jeszcze \\d+ znaków/');
    return await feedbackLocator.isVisible();
  }

  /**
   * Get the inline validation feedback text
   */
  async getInlineValidationFeedback() {
    const feedbackLocator = this.page.locator('text=/Potrzebujesz jeszcze \\d+ znaków/');
    return await feedbackLocator.textContent();
  }
}
