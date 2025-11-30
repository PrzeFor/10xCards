import { type Locator } from '@playwright/test';

/**
 * Component Object Model for a single Flashcard Proposal Item
 * Represents one flashcard proposal card
 */
export class FlashcardItemComponent {
  readonly container: Locator;
  readonly checkbox: Locator;
  readonly acceptButton: Locator;
  readonly editButton: Locator;
  readonly rejectButton: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly statusBadge: Locator;

  constructor(container: Locator) {
    this.container = container;
    this.checkbox = container.getByTestId('flashcard-proposal-checkbox');
    this.acceptButton = container.getByTestId('flashcard-accept-button');
    this.editButton = container.getByTestId('flashcard-edit-button');
    this.rejectButton = container.getByTestId('flashcard-reject-button');
    this.frontText = container.locator('text=Przód').locator('..').locator('div').nth(1);
    this.backText = container.locator('text=Tył').locator('..').locator('div').nth(1);
    this.statusBadge = container.locator('.text-xs.font-medium.px-2.py-1.rounded-full');
  }

  /**
   * Toggle the selection checkbox
   */
  async toggleSelect() {
    await this.checkbox.click();
  }

  /**
   * Select the proposal (if not already selected)
   */
  async select() {
    const isChecked = await this.isSelected();
    if (!isChecked) {
      await this.toggleSelect();
    }
  }

  /**
   * Deselect the proposal (if selected)
   */
  async deselect() {
    const isChecked = await this.isSelected();
    if (isChecked) {
      await this.toggleSelect();
    }
  }

  /**
   * Check if the proposal is selected
   */
  async isSelected() {
    return await this.checkbox.isChecked();
  }

  /**
   * Click the accept button
   */
  async accept() {
    await this.acceptButton.click();
  }

  /**
   * Click the edit button
   */
  async edit() {
    await this.editButton.click();
  }

  /**
   * Click the reject button
   */
  async reject() {
    await this.rejectButton.click();
  }

  /**
   * Check if accept button is disabled
   */
  async isAcceptDisabled() {
    return await this.acceptButton.isDisabled();
  }

  /**
   * Check if reject button is disabled
   */
  async isRejectDisabled() {
    return await this.rejectButton.isDisabled();
  }

  /**
   * Get the front text of the flashcard
   */
  async getFrontText() {
    return await this.frontText.textContent() || '';
  }

  /**
   * Get the back text of the flashcard
   */
  async getBackText() {
    return await this.backText.textContent() || '';
  }

  /**
   * Get the status of the proposal
   */
  async getStatus(): Promise<'pending' | 'accepted' | 'rejected' | 'edited'> {
    const isVisible = await this.statusBadge.isVisible();
    
    if (!isVisible) {
      return 'pending';
    }
    
    const statusText = await this.statusBadge.textContent();
    
    if (statusText?.includes('Zaakceptowana')) return 'accepted';
    if (statusText?.includes('Odrzucona')) return 'rejected';
    if (statusText?.includes('Edytowana')) return 'edited';
    
    return 'pending';
  }

  /**
   * Wait for the proposal to have a specific status
   * @param status - Expected status
   */
  async waitForStatus(status: 'accepted' | 'rejected' | 'edited') {
    const expectedText = {
      accepted: 'Zaakceptowana',
      rejected: 'Odrzucona',
      edited: 'Edytowana',
    }[status];
    
    await this.statusBadge.waitFor({ state: 'visible' });
    await this.container.locator(`text=${expectedText}`).waitFor({ state: 'visible' });
  }
}

