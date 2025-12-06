import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component Object Model for the Bulk Actions Bar
 * Handles bulk operations on flashcard proposals
 */
export class BulkActionsBarComponent {
  readonly page: Page;
  readonly selectAllCheckbox: Locator;
  readonly acceptAllButton: Locator;
  readonly rejectAllButton: Locator;
  readonly saveSelectedButton: Locator;
  readonly selectedCountBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox');
    this.acceptAllButton = page.getByTestId('accept-all-button');
    this.rejectAllButton = page.getByTestId('reject-all-button');
    this.saveSelectedButton = page.getByTestId('save-selected-button');
    this.selectedCountBadge = page.locator('text=/\\(\\d+\\/\\d+\\)/');
  }

  /**
   * Click the "Select All" checkbox
   */
  async selectAll() {
    await this.selectAllCheckbox.click();
  }

  /**
   * Check if all proposals are selected
   */
  async isAllSelected() {
    return await this.selectAllCheckbox.isChecked();
  }

  /**
   * Click the "Accept All" button
   */
  async acceptAll() {
    await this.acceptAllButton.click();
  }

  /**
   * Click the "Reject All" button
   */
  async rejectAll() {
    await this.rejectAllButton.click();
  }

  /**
   * Click the "Save Selected" button
   */
  async saveSelected() {
    await this.saveSelectedButton.click();
  }

  /**
   * Wait for the save operation to complete
   */
  async waitForSaveComplete() {
    await expect(this.saveSelectedButton).not.toContainText('Zapisuję...');
    await expect(this.saveSelectedButton).toContainText('Zapisz zaznaczone');
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled() {
    return await this.saveSelectedButton.isDisabled();
  }

  /**
   * Check if the component is in saving state
   */
  async isSaving() {
    const text = await this.saveSelectedButton.textContent();
    return text?.includes('Zapisuję...');
  }

  /**
   * Get the number of selected proposals
   */
  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCountBadge.textContent();
    const match = text?.match(/\((\d+)\/\d+\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the total number of proposals
   */
  async getTotalCount(): Promise<number> {
    const text = await this.selectedCountBadge.textContent();
    const match = text?.match(/\(\d+\/(\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Verify selected count matches expected value
   * @param expectedCount - Expected number of selected proposals
   */
  async expectSelectedCount(expectedCount: number) {
    const count = await this.getSelectedCount();
    expect(count).toBe(expectedCount);
  }

  /**
   * Check if Accept All button is disabled
   */
  async isAcceptAllDisabled() {
    return await this.acceptAllButton.isDisabled();
  }

  /**
   * Check if Reject All button is disabled
   */
  async isRejectAllDisabled() {
    return await this.rejectAllButton.isDisabled();
  }
}
