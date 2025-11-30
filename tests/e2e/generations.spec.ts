import { test, expect } from './fixtures/auth.fixture';
import { GenerationsPage } from './page-objects';

// Sample text with 500+ characters for testing
const SAMPLE_TEXT = `
Sztuczna inteligencja coraz mocniej wpływa na proces tworzenia oprogramowania, zmieniając sposób myślenia o architekturze i projektowaniu systemów. Programiści zaczynają budować aplikacje wokół modeli, które potrafią przewidywać, klasyfikować i generować treści, zamiast tworzyć tradycyjne funkcje krok po kroku. Wiele zespołów wprowadza AI do pipeline'ów CI/CD, aby automatycznie analizować jakość kodu, wykrywać potencjalne luki bezpieczeństwa i przewidywać ryzyko awarii. W projektach komercyjnych coraz częściej stosuje się podejście MLOps — łączące DevOps z uczeniem maszynowym — które pozwala kontrolować cykl życia modeli, ich aktualizacje, testy i monitoring. Programista pracujący z AI musi rozumieć nie tylko kod, ale również dane, ich jakość, ryzyko uprzedzeń oraz sposób interpretacji wyników modeli. W najbliższych latach umiejętność wykorzystywania sztucznej inteligencji stanie się podstawowym elementem pracy każdego dewelopera, niezależnie od używanej technologii.
`.trim();

// Configure tests to run serially to avoid conflicts when sharing test user
test.describe.configure({ mode: 'serial' });

test.describe('Flashcard Generation Flow', () => {
  let generationsPage: GenerationsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    generationsPage = new GenerationsPage(authenticatedPage);
    await generationsPage.goto(); // goto() already calls waitForPageLoad()
  });

  test.afterEach(async ({ authenticatedPage }) => {
    // Clear any browser state to ensure test isolation
    await authenticatedPage.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('should complete full generation and save flow', async () => {
    // Step 1: Fill source text
    await generationsPage.generationForm.fillSourceText(SAMPLE_TEXT);

    // Verify character count is displayed
    const charCount = await generationsPage.generationForm.getCharacterCount();
    expect(charCount).toBeGreaterThan(500);

    // Step 2: Generate flashcards
    await generationsPage.generationForm.clickGenerate();

    // Verify loading state
    expect(await generationsPage.isLoading()).toBe(true);
    await generationsPage.generationForm.waitForGeneratingState();

    // Wait for generation to complete
    await generationsPage.waitForLoadingComplete();
    await generationsPage.flashcardProposals.waitForProposalsVisible();

    // Verify proposals are generated
    const proposalCount = await generationsPage.flashcardProposals.getProposalCount();
    expect(proposalCount).toBeGreaterThan(0);

    // Step 3: Select two proposals
    await generationsPage.flashcardProposals.selectProposalByIndex(0);
    await generationsPage.flashcardProposals.selectProposalByIndex(1);

    // Verify selection count
    const selectedCount = await generationsPage.flashcardProposals.getSelectedCount();
    expect(selectedCount).toBe(2);

    // Step 4: Save selected proposals
    await generationsPage.flashcardProposals.bulkActions.saveSelected();

    // Wait for save to complete
    await generationsPage.flashcardProposals.bulkActions.waitForSaveComplete();

    // Verify proposals are removed after saving
    const remainingCount = await generationsPage.flashcardProposals.getProposalCount();
    expect(remainingCount).toBe(proposalCount - 2);
  });

  test('should allow accepting proposals before saving', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    // Accept first proposal
    await generationsPage.flashcardProposals.acceptProposalByIndex(0);

    // Verify status changed
    const status = await generationsPage.flashcardProposals.getProposalStatus(0);
    expect(status).toBe('accepted');

    // Verify it's automatically selected
    const isSelected = await generationsPage.flashcardProposals.isProposalSelected(0);
    expect(isSelected).toBe(true);
  });

  test('should allow rejecting proposals', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    // Reject first proposal
    await generationsPage.flashcardProposals.rejectProposalByIndex(0);

    // Verify status changed
    const status = await generationsPage.flashcardProposals.getProposalStatus(0);
    expect(status).toBe('rejected');

    // Verify it's automatically deselected
    const isSelected = await generationsPage.flashcardProposals.isProposalSelected(0);
    expect(isSelected).toBe(false);
  });

  test('should allow editing proposals', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    const newFront = 'Edited front text';
    const newBack = 'Edited back text';

    // Edit first proposal
    await generationsPage.flashcardProposals.editProposalByIndex(0, newFront, newBack);

    // Verify status changed to edited
    const status = await generationsPage.flashcardProposals.getProposalStatus(0);
    expect(status).toBe('edited');

    // Verify content was updated
    const content = await generationsPage.flashcardProposals.getProposalContent(0);
    expect(content.front).toContain(newFront);
    expect(content.back).toContain(newBack);
  });

  test('should allow selecting all proposals at once', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    const totalCount = await generationsPage.flashcardProposals.getProposalCount();

    // Select all
    await generationsPage.flashcardProposals.bulkActions.selectAll();

    // Verify all are selected
    const selectedCount = await generationsPage.flashcardProposals.getSelectedCount();
    expect(selectedCount).toBe(totalCount);

    const allSelected = await generationsPage.flashcardProposals.bulkActions.isAllSelected();
    expect(allSelected).toBe(true);
  });

  test('should allow accepting all proposals at once', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    // Accept all
    await generationsPage.flashcardProposals.bulkActions.acceptAll();

    // Verify all proposals are accepted
    const proposalCount = await generationsPage.flashcardProposals.getProposalCount();
    for (let i = 0; i < proposalCount; i++) {
      const status = await generationsPage.flashcardProposals.getProposalStatus(i);
      expect(status).toBe('accepted');
    }
  });

  test('should disable save button when no proposals are selected', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    // Verify save button is disabled when nothing is selected
    const isDisabled = await generationsPage.flashcardProposals.bulkActions.isSaveButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should validate minimum text length', async () => {
    const shortText = 'This text is too short';

    await generationsPage.generationForm.fillSourceText(shortText);

    // Verify inline validation feedback is shown
    const hasFeedback = await generationsPage.generationForm.hasInlineValidationFeedback();
    expect(hasFeedback).toBe(true);

    // Verify generate button is disabled
    const isDisabled = await generationsPage.generationForm.isGenerateButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should disable generate button when text is invalid', async () => {
    // Empty text
    await generationsPage.generationForm.clearSourceText();

    const isDisabled = await generationsPage.generationForm.isGenerateButtonDisabled();
    expect(isDisabled).toBe(true);
  });
});

test.describe('Flashcard Generation - Edge Cases', () => {
  let generationsPage: GenerationsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    generationsPage = new GenerationsPage(authenticatedPage);
    await generationsPage.goto(); // goto() already calls waitForPageLoad()
  });

  test.afterEach(async ({ authenticatedPage }) => {
    // Clear any browser state to ensure test isolation
    await authenticatedPage.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('should handle mixed selection states correctly', async () => {
    await generationsPage.generateFlashcards(SAMPLE_TEXT);

    const proposalCount = await generationsPage.flashcardProposals.getProposalCount();

    if (proposalCount >= 3) {
      // Accept first, reject second, leave third as pending
      await generationsPage.flashcardProposals.acceptProposalByIndex(0);
      await generationsPage.flashcardProposals.rejectProposalByIndex(1);

      // Manually select the third
      await generationsPage.flashcardProposals.selectProposalByIndex(2);

      // Verify we can save mixed states
      const selectedCount = await generationsPage.flashcardProposals.getSelectedCount();
      expect(selectedCount).toBeGreaterThan(0);

      const isSaveEnabled = !(await generationsPage.flashcardProposals.bulkActions.isSaveButtonDisabled());
      expect(isSaveEnabled).toBe(true);
    }
  });
});

