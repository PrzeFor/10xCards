# Page Object Model (POM) - Dokumentacja

Struktura Page Object Model dla testów E2E aplikacji 10xCards.

## 📁 Struktura

```
tests/e2e/page-objects/
├── index.ts                              # Główny punkt eksportu
├── GenerationsPage.ts                    # Główna strona generacji
└── components/
    ├── GenerationFormComponent.ts        # Formularz generowania fiszek
    ├── FlashcardProposalsComponent.ts    # Lista propozycji
    ├── FlashcardItemComponent.ts         # Pojedyncza propozycja
    └── BulkActionsBarComponent.ts        # Pasek akcji grupowych
```

## 🎯 Wzorce projektowe

### GenerationsPage
Główna klasa strony reprezentująca `/generations`. Zarządza całym przepływem generowania i zapisywania fiszek.

**Główne metody:**
- `goto()` - Przejdź do strony generacji
- `generateFlashcards(text)` - Kompletny przepływ generowania fiszek
- `selectAndSaveProposals(indices)` - Kompletny przepływ wyboru i zapisu
- `waitForLoadingComplete()` - Poczekaj na zakończenie ładowania

**Przykład użycia:**
```typescript
const generationsPage = new GenerationsPage(page);
await generationsPage.goto();
await generationsPage.generateFlashcards(sampleText);
await generationsPage.selectAndSaveProposals([0, 1, 2]);
```

### GenerationFormComponent
Komponent formularza do wprowadzania tekstu i generowania fiszek.

**Główne metody:**
- `fillSourceText(text)` - Wypełnij pole tekstowe
- `clickGenerate()` - Kliknij przycisk generowania
- `submit(text?)` - Wypełnij i wyślij formularz
- `isGenerateButtonDisabled()` - Sprawdź czy przycisk jest wyłączony
- `getCharacterCount()` - Pobierz liczbę znaków
- `hasValidationError(message?)` - Sprawdź błędy walidacji

**Przykład użycia:**
```typescript
await generationsPage.generationForm.fillSourceText(text);
await generationsPage.generationForm.clickGenerate();

// lub krócej:
await generationsPage.generationForm.submit(text);
```

### FlashcardProposalsComponent
Komponent zarządzający listą wygenerowanych propozycji fiszek.

**Główne metody:**
- `getProposalCount()` - Pobierz liczbę propozycji
- `getProposalItem(index)` - Pobierz konkretną propozycję
- `selectProposalByIndex(index)` - Zaznacz propozycję
- `selectProposalsByIndices(indices)` - Zaznacz wiele propozycji
- `acceptProposalByIndex(index)` - Zaakceptuj propozycję
- `rejectProposalByIndex(index)` - Odrzuć propozycję
- `editProposalByIndex(index, front, back)` - Edytuj propozycję
- `getSelectedCount()` - Pobierz liczbę zaznaczonych
- `getProposalContent(index)` - Pobierz zawartość propozycji

**Przykład użycia:**
```typescript
// Zaznacz pierwsze dwie propozycje
await generationsPage.flashcardProposals.selectProposalsByIndices([0, 1]);

// Akceptuj trzecią propozycję
await generationsPage.flashcardProposals.acceptProposalByIndex(2);

// Edytuj czwartą propozycję
await generationsPage.flashcardProposals.editProposalByIndex(
  3, 
  'New front', 
  'New back'
);
```

### FlashcardItemComponent
Komponent reprezentujący pojedynczą kartę z propozycją fiszki.

**Główne metody:**
- `select()` / `deselect()` / `toggleSelect()` - Zarządzanie zaznaczeniem
- `isSelected()` - Sprawdź czy zaznaczone
- `accept()` - Zaakceptuj
- `reject()` - Odrzuć
- `edit()` - Edytuj (otwiera modal)
- `getFrontText()` / `getBackText()` - Pobierz tekst
- `getStatus()` - Pobierz status ('pending' | 'accepted' | 'rejected' | 'edited')
- `waitForStatus(status)` - Poczekaj na konkretny status

**Przykład użycia:**
```typescript
const item = generationsPage.flashcardProposals.getProposalItem(0);
await item.accept();
await item.waitForStatus('accepted');

const status = await item.getStatus();
expect(status).toBe('accepted');
```

### BulkActionsBarComponent
Komponent paska z akcjami grupowymi.

**Główne metody:**
- `selectAll()` - Zaznacz wszystkie
- `isAllSelected()` - Sprawdź czy wszystkie zaznaczone
- `acceptAll()` - Zaakceptuj wszystkie
- `rejectAll()` - Odrzuć wszystkie
- `saveSelected()` - Zapisz zaznaczone
- `waitForSaveComplete()` - Poczekaj na zakończenie zapisu
- `isSaving()` - Sprawdź czy trwa zapisywanie
- `getSelectedCount()` - Pobierz liczbę zaznaczonych
- `getTotalCount()` - Pobierz liczbę wszystkich
- `expectSelectedCount(count)` - Asercja liczby zaznaczonych

**Przykład użycia:**
```typescript
// Zaakceptuj wszystkie i zapisz
await generationsPage.flashcardProposals.bulkActions.acceptAll();
await generationsPage.flashcardProposals.bulkActions.saveSelected();
await generationsPage.flashcardProposals.bulkActions.waitForSaveComplete();

// Sprawdź liczbę zaznaczonych
const count = await generationsPage.flashcardProposals.bulkActions.getSelectedCount();
expect(count).toBe(5);
```

## 🔐 Autoryzacja w testach

Strona `/generations` wymaga autoryzacji. Użyj fixture `authenticatedPage`:

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { GenerationsPage } from './page-objects';

test('my test', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  // authenticatedPage jest już zalogowany
});
```

Zobacz `tests/e2e/README.md` dla szczegółów konfiguracji.

## 🧪 Przykładowe scenariusze testowe

### Scenariusz 1: Podstawowy przepływ generowania i zapisywania

```typescript
test('complete flow', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  await generationsPage.goto();
  
  // 1. Generuj fiszki
  await generationsPage.generateFlashcards(SAMPLE_TEXT);
  
  // 2. Wybierz dwie propozycje
  await generationsPage.selectAndSaveProposals([0, 1]);
  
  // 3. Sprawdź czy zapisano
  const remainingCount = await generationsPage.flashcardProposals.getProposalCount();
  expect(remainingCount).toBe(totalCount - 2);
});
```

### Scenariusz 2: Akceptowanie przed zapisem

```typescript
test('accept before save', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  await generationsPage.goto();
  await generationsPage.generateFlashcards(SAMPLE_TEXT);
  
  // Zaakceptuj konkretne propozycje
  await generationsPage.flashcardProposals.acceptProposalByIndex(0);
  await generationsPage.flashcardProposals.acceptProposalByIndex(2);
  
  // Sprawdź statusy
  expect(await generationsPage.flashcardProposals.getProposalStatus(0)).toBe('accepted');
  expect(await generationsPage.flashcardProposals.getProposalStatus(2)).toBe('accepted');
  
  // Zapisz zaakceptowane
  await generationsPage.flashcardProposals.bulkActions.saveSelected();
});
```

### Scenariusz 3: Edycja propozycji

```typescript
test('edit proposal', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  await generationsPage.goto();
  await generationsPage.generateFlashcards(SAMPLE_TEXT);
  
  // Edytuj pierwszą propozycję
  await generationsPage.flashcardProposals.editProposalByIndex(
    0,
    'Pytanie edytowane',
    'Odpowiedź edytowana'
  );
  
  // Sprawdź status i treść
  expect(await generationsPage.flashcardProposals.getProposalStatus(0)).toBe('edited');
  
  const content = await generationsPage.flashcardProposals.getProposalContent(0);
  expect(content.front).toContain('Pytanie edytowane');
  expect(content.back).toContain('Odpowiedź edytowana');
});
```

### Scenariusz 4: Operacje grupowe

```typescript
test('bulk operations', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  await generationsPage.goto();
  await generationsPage.generateFlashcards(SAMPLE_TEXT);
  
  // Zaznacz wszystkie
  await generationsPage.flashcardProposals.bulkActions.selectAll();
  
  // Sprawdź czy wszystkie zaznaczone
  const totalCount = await generationsPage.flashcardProposals.getTotalCount();
  await generationsPage.flashcardProposals.bulkActions.expectSelectedCount(totalCount);
  
  // Zaakceptuj wszystkie
  await generationsPage.flashcardProposals.bulkActions.acceptAll();
  
  // Zapisz
  await generationsPage.flashcardProposals.bulkActions.saveSelected();
  await generationsPage.flashcardProposals.bulkActions.waitForSaveComplete();
});
```

## 🔍 Lokalizacja elementów

Wszystkie elementy używają atrybutów `data-testid` dla pewnej lokalizacji:

| Element | data-testid |
|---------|-------------|
| Pole tekstowe źródłowe | `generation-source-text` |
| Przycisk generowania | `generate-flashcards-button` |
| Skeleton ładowania | `loading-skeleton` |
| Lista propozycji | `flashcard-proposals-list` |
| Karta propozycji | `flashcard-proposal-item` |
| Checkbox propozycji | `flashcard-proposal-checkbox` |
| Przycisk akceptacji | `flashcard-accept-button` |
| Przycisk edycji | `flashcard-edit-button` |
| Przycisk odrzucenia | `flashcard-reject-button` |
| Checkbox "Zaznacz wszystkie" | `select-all-checkbox` |
| Przycisk "Akceptuj wszystkie" | `accept-all-button` |
| Przycisk "Odrzuć wszystkie" | `reject-all-button` |
| Przycisk "Zapisz zaznaczone" | `save-selected-button` |
| Modal edycji - pole przód | `edit-flashcard-front` |
| Modal edycji - pole tył | `edit-flashcard-back` |
| Modal edycji - zapisz | `edit-flashcard-save` |
| Modal edycji - anuluj | `edit-flashcard-cancel` |

## 💡 Dobre praktyki

1. **Używaj metod wysokiego poziomu** dla kompletnych przepływów:
   ```typescript
   // ✅ Dobrze
   await generationsPage.generateFlashcards(text);
   
   // ❌ Nie najlepiej
   await generationsPage.generationForm.fillSourceText(text);
   await generationsPage.generationForm.clickGenerate();
   await generationsPage.waitForLoadingComplete();
   ```

2. **Komponenty są re-używalne** - można ich używać niezależnie:
   ```typescript
   // Bezpośredni dostęp do komponentu
   await generationsPage.generationForm.hasValidationError('Tekst musi mieć co najmniej 500 znaków');
   ```

3. **Łącz asercje z metodami sprawdzającymi**:
   ```typescript
   await generationsPage.flashcardProposals.bulkActions.expectSelectedCount(3);
   ```

4. **Używaj wait* metod** dla synchronizacji:
   ```typescript
   await generationsPage.waitForLoadingComplete();
   await generationsPage.flashcardProposals.bulkActions.waitForSaveComplete();
   ```

## 🚀 Uruchamianie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy generations
npx playwright test generations

# Uruchom z UI mode
npx playwright test --ui

# Uruchom w trybie debug
npx playwright test --debug

# Zobacz raport
npx playwright show-report
```

## 📝 Rozszerzanie POM

Aby dodać nowy komponent:

1. Utwórz plik w `components/` (np. `NewComponent.ts`)
2. Zaimplementuj klasę z lokatorami i metodami
3. Dodaj eksport w `index.ts`
4. Integruj z odpowiednią stroną

```typescript
// components/NewComponent.ts
export class NewComponent {
  readonly container: Locator;
  
  constructor(pageOrLocator: Page | Locator) {
    const page = 'page' in pageOrLocator ? pageOrLocator : pageOrLocator.page();
    this.container = page.getByTestId('new-component');
  }
  
  async doSomething() {
    // implementacja
  }
}
```

