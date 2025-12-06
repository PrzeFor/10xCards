import { type Page, type Locator } from '@playwright/test';
import { GenerationFormComponent } from './components/GenerationFormComponent';
import { FlashcardProposalsComponent } from './components/FlashcardProposalsComponent';

/**
 * Page Object Model for the Generations page
 * Represents the main page where users generate and manage flashcard proposals
 */
export class GenerationsPage {
  readonly page: Page;
  readonly generationForm: GenerationFormComponent;
  readonly flashcardProposals: FlashcardProposalsComponent;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generationForm = new GenerationFormComponent(page);
    this.flashcardProposals = new FlashcardProposalsComponent(page);
    this.loadingSkeleton = page.getByTestId('loading-skeleton');
  }

  /**
   * Navigate to the generations page
   * Forces a full page reload to ensure clean state for tests
   */
  async goto() {
    await this.page.goto('/generations', { waitUntil: 'domcontentloaded' });
    // Force a full reload to clear any React state from previous tests
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to be fully loaded
   * Includes waiting for React hydration
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');

    // Give extra time for React to hydrate (client:load directive)
    await this.page.waitForTimeout(2000);

    try {
      // Wait for React component to hydrate and render
      // Increased timeout for slower environments
      await this.generationForm.sourceTextArea.waitFor({
        state: 'visible',
        timeout: 15000,
      });
    } catch (error) {
      // Debug: Take screenshot and log info
      await this.page.screenshot({ path: 'test-results/page-load-failure.png', fullPage: true });

      console.error('\n❌ React component failed to hydrate!');
      console.error('Current URL:', this.page.url());
      console.error('Page title:', await this.page.title());

      // Check if we got redirected
      if (this.page.url().includes('/auth/login')) {
        console.error('⚠️  Redirected to login - authentication failed!');
      }

      // Check for JavaScript errors
      console.error('\n🔍 Checking for the component in DOM...');
      const textareaCount = await this.page.getByTestId('generation-source-text').count();
      console.error('Textarea elements found:', textareaCount);

      // Check if GenerationsView container exists
      const bodyHTML = await this.page.locator('body').innerHTML();
      const hasGenerationsView = bodyHTML.includes('GenerationsView') || bodyHTML.includes('generation-source-text');
      console.error('GenerationsView in HTML:', hasGenerationsView);

      // Get page content for debugging
      const bodyText = await this.page.locator('body').textContent();
      console.error('\nPage body preview:', bodyText?.substring(0, 300));

      console.error('\n💡 Possible causes:');
      console.error('1. React hydration failed (check browser console)');
      console.error('2. client:load directive not working');
      console.error('3. JavaScript error preventing render');
      console.error('\nSee screenshot: test-results/page-load-failure.png\n');

      throw error;
    }
  }

  /**
   * Check if loading skeleton is visible
   */
  async isLoading() {
    return await this.loadingSkeleton.isVisible();
  }

  /**
   * Wait for loading to complete
   * Handles cases where loading completes too fast and skeleton never appears
   */
  async waitForLoadingComplete() {
    try {
      // First check if the loading skeleton is visible
      const isVisible = await this.loadingSkeleton.isVisible({ timeout: 1000 });

      if (isVisible) {
        // If it's visible, wait for it to be hidden
        await this.loadingSkeleton.waitFor({ state: 'hidden', timeout: 30000 });
      }
      // If it's not visible, loading is already complete or was too fast
    } catch (error) {
      // If the element doesn't exist or check times out, continue
      // This means loading completed very quickly or skeleton never appeared
      const count = await this.loadingSkeleton.count();
      if (count === 0) {
        // Element doesn't exist in DOM, loading is complete
        return;
      }
      // Re-throw if it's a different error
      throw error;
    }
  }

  /**
   * Complete flow: generate flashcards from text
   * @param sourceText - Text to generate flashcards from (500-15000 characters)
   */
  async generateFlashcards(sourceText: string) {
    await this.generationForm.fillSourceText(sourceText);
    await this.generationForm.submit();
    await this.waitForLoadingComplete();
    await this.flashcardProposals.waitForProposalsVisible();
  }

  /**
   * Complete flow: select multiple proposals and save them
   * @param indices - Array of proposal indices to select (0-based)
   */
  async selectAndSaveProposals(indices: number[]) {
    for (const index of indices) {
      await this.flashcardProposals.selectProposalByIndex(index);
    }
    await this.flashcardProposals.bulkActions.saveSelected();
  }
}
