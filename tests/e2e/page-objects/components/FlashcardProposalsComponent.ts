import { type Page, type Locator } from '@playwright/test';
import { BulkActionsBarComponent } from './BulkActionsBarComponent';
import { FlashcardItemComponent } from './FlashcardItemComponent';

/**
 * Component Object Model for the Flashcard Proposals List
 * Manages the list of generated flashcard proposals
 */
export class FlashcardProposalsComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly proposalItems: Locator;
  readonly bulkActions: BulkActionsBarComponent;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('flashcard-proposals-list');
    this.proposalItems = page.getByTestId('flashcard-proposal-item');
    this.bulkActions = new BulkActionsBarComponent(page);
  }

  /**
   * Wait for proposals list to be visible
   */
  async waitForProposalsVisible() {
    await this.container.waitFor({ state: 'visible' });
  }

  /**
   * Get the number of proposals displayed
   */
  async getProposalCount() {
    return await this.proposalItems.count();
  }

  /**
   * Get a specific proposal item by index
   * @param index - 0-based index of the proposal
   */
  getProposalItem(index: number): FlashcardItemComponent {
    return new FlashcardItemComponent(this.proposalItems.nth(index));
  }

  /**
   * Select a proposal by index
   * @param index - 0-based index of the proposal
   */
  async selectProposalByIndex(index: number) {
    const item = this.getProposalItem(index);
    await item.toggleSelect();
  }

  /**
   * Select multiple proposals by indices
   * @param indices - Array of 0-based indices
   */
  async selectProposalsByIndices(indices: number[]) {
    for (const index of indices) {
      await this.selectProposalByIndex(index);
    }
  }

  /**
   * Get the number of selected proposals
   */
  async getSelectedCount() {
    return await this.bulkActions.getSelectedCount();
  }

  /**
   * Accept a proposal by index
   * @param index - 0-based index of the proposal
   */
  async acceptProposalByIndex(index: number) {
    const item = this.getProposalItem(index);
    await item.accept();
  }

  /**
   * Reject a proposal by index
   * @param index - 0-based index of the proposal
   */
  async rejectProposalByIndex(index: number) {
    const item = this.getProposalItem(index);
    await item.reject();
  }

  /**
   * Edit a proposal by index
   * @param index - 0-based index of the proposal
   * @param front - New front text
   * @param back - New back text
   */
  async editProposalByIndex(index: number, front: string, back: string) {
    const item = this.getProposalItem(index);
    await item.edit();

    // Handle the edit modal
    const frontInput = this.page.getByTestId('edit-flashcard-front');
    const backInput = this.page.getByTestId('edit-flashcard-back');
    const saveButton = this.page.getByTestId('edit-flashcard-save');

    await frontInput.fill(front);
    await backInput.fill(back);
    await saveButton.click();
  }

  /**
   * Check if proposal is selected
   * @param index - 0-based index of the proposal
   */
  async isProposalSelected(index: number) {
    const item = this.getProposalItem(index);
    return await item.isSelected();
  }

  /**
   * Get the status of a proposal
   * @param index - 0-based index of the proposal
   */
  async getProposalStatus(index: number): Promise<'pending' | 'accepted' | 'rejected' | 'edited'> {
    const item = this.getProposalItem(index);
    return await item.getStatus();
  }

  /**
   * Get front and back text of a proposal
   * @param index - 0-based index of the proposal
   */
  async getProposalContent(index: number) {
    const item = this.getProposalItem(index);
    return {
      front: await item.getFrontText(),
      back: await item.getBackText(),
    };
  }
}
