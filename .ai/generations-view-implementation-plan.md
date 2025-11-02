# Plan implementacji widoku Generowanie fiszek AI

## 1. Przegląd
Widok służy do wklejenia dowolnego tekstu (500–15 000 znaków), wysłania go do API LLM, wyświetlenia maksymalnie 10 propozycji fiszek i umożliwienia użytkownikowi zaakceptowania, edycji lub odrzucenia każdej z nich oraz wykonania operacji zbiorczych.

## 2. Routing widoku
Ścieżka: `/generations`

## 3. Struktura komponentów
- GenerationsPage (strona Astro)
  - GenerationForm
  - SkeletonLoader (podczas ładowania)
  - FlashcardList
    - BulkActionsBar
    - FlashcardItem[]
    - FlashcardEditModal (warunkowo)
  - Toaster (Shadcn/ui)

## 4. Szczegóły komponentów

### GenerationForm
- Opis: formularz z textarea i przyciskiem wysyłającym żądanie generacji.
- Główne elementy: `<textarea aria-describedby="sourceTextError"/>`, `<button>Generuj fiszki</button>`, InlineError.
- Obsługiwane zdarzenia:
  - onChange(text) – aktualizacja stanu `sourceText`
  - onSubmit() – walidacja długości i wywołanie `generate()`
- Walidacja:
  - min: 500 znaków, max: 15 000;
  - blokada przycisku gdy invalid lub `isGenerating`.
- Typy:
  - request: `CreateGenerationRequestDto` ({ source_text: string })
- Propsy:
  - onGenerate(sourceText: string)
  - isGenerating: boolean
  - errorMessage?: string


### FlashcardList
- Opis: kontener na listę propozycji i pasek akcji zbiorczych.
- Główne elementy: BulkActionsBar, lista FlashcardItem.
- Propsy:
  - proposals: `FlashcardProposalViewModel[]`
  - onAccept(id), onReject(id), onEdit(id), onToggleSelect(id)
  - onAcceptAll(), onRejectAll(), onSaveSelected(selectedIds[])


### FlashcardItem
- Opis: prezentuje jedną propozycję fiszki z kontrolkami.
- Elementy: `<input type="checkbox"/>`, front/back, przyciski Accept/Edit/Reject.
- Obsługiwane zdarzenia:
  - onToggleSelect(id)
  - onAccept(id)
  - onReject(id)
  - onEdit(id)
- Propsy: proposal: `FlashcardProposalViewModel`


### BulkActionsBar
- Opis: pasek z operacjami zbiorczymi.
- Elementy: `<input type="checkbox"/>` (select all), `<button>Akceptuj wszystkie</button>`, `<button>Odrzuć wszystkie</button>`, `<button>Zapisz zaznaczone</button>`
- Zdarzenia: onSelectAll(), onAcceptAll(), onRejectAll(), onSaveSelected()
- Walidacja: disabled jeśli `isGenerating` lub brak zaznaczonych.


### FlashcardEditModal
- Opis: modal z formularzem edycji front/back.
- Elementy: dwa `<input/>`/`<textarea/>`, przyciski Save/Cancel.
- Walidacja: front non-empty (≤300), back non-empty (≤500).
- Zdarzenia: onSave(id, front, back), onClose().
- A11y: focus trap, aria-labelledby, aria-describedby.


### InlineError
- Opis: niewielki komponent wyświetlający komunikat błędu pod polem.
- Propsy: message: string


### Toaster
- Opis: globalny kontener notyfikacji.
- Użycie: hook `const toast = useToast()`; toast({ title, description, status }).

## 5. Typy

```typescript
// Z importów z src/types.ts i lokalnych ViewModel:
interface FlashcardProposalViewModel extends FlashcardProposalDto {
  isSelected: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  editedFront?: string;
  editedBack?: string;
}
```
- CreateGenerationRequestDto { source_text: string }
- CreateGenerationResponseDto
- CreateFlashcardsRequestDto { flashcards: CreateFlashcardRequestDto[] }

## 6. Zarządzanie stanem
- useState dla: sourceText, formError, isGenerating, proposals (FlashcardProposalViewModel[]), editingId.
- useToast do notyfikacji.
- Custom hook `useGenerateFlashcards()` zwracający `{ generate, isLoading, error }`.
- Custom hook `useSaveFlashcards()` zwracający `{ saveSelected, isSaving, error }`.

## 7. Integracja API
- generate(sourceText):
  ```ts
  const res = await fetch('/api/generations', { method: 'POST', body: JSON.stringify({ source_text: text }) });
  ```
  typ odpowiedzi: `CreateGenerationResponseDto` → uzupełnić `proposals`.
- saveSelected(ids):
  ```ts
  const payload: CreateFlashcardsRequestDto = {
    flashcards: selectedProposals.map(p => ({
      front: p.status === 'edited' ? p.editedFront! : p.front,
      back: p.status === 'edited' ? p.editedBack! : p.back,
      source: p.status === 'edited' ? 'ai_edited' : 'ai_full',
      generation_id: genId
    }))
  };
  fetch('/api/flashcards', { method: 'POST', body: JSON.stringify(payload) });
  ```
- Uwaga: edytowane fiszki są zapisywane z `source: 'ai_edited'`, a pozostałe z `source: 'ai_full'`.

## 8. Interakcje użytkownika
- Wpisanie i walidacja tekstu w GenerationForm.
- Klik „Generuj fiszki”: wyświetlenie skeleton, wywołanie API.
- Po sukcesie: wyświetlenie FlashcardList.
- Klik elementarny Accept/Edit/Reject.
- Otwórz modal Edit → save → aktualizacja widoku.
- Zaznacz wszystkie → Accept All/Reject All → Save Selected → usunięcie zaakceptowanych z widoku.
- Obsługa retry przy błędach (Toast + przycisk akcji).
- Zapis edytowanych fiszek z `source: 'ai_edited'` podczas operacji zapisu.

## 9. Warunki i walidacja
- client: długość tekstu 500–15000 przed wysłaniem.
- modale: front/back nie-puste i długość max.
- disabled buttons: gdy loading/saving lub invalid.

## 10. Obsługa błędów
- InlineError dla walidacji pól.
- Toast na 400/429/500 z odpowiednimi komunikatami i opcją retry.

## 11. Kroki implementacji
1. Stworzyć stronę `src/pages/generations.astro` i layout.
2. Zaimportować i umieścić `<GenerationForm/>`.
3. Zaimplementować `useGenerateFlashcards` i komponent LoadingSkeleton.
4. Stworzyć `FlashcardList` z `BulkActionsBar` i `FlashcardItem`.
5. Zaimplementować `FlashcardEditModal` z walidacją.
6. Dodać `InlineError` i `Toast` (Shadcn/ui).
7. Podłączyć API `/api/generations` i `/api/flashcards`.
8. Dodać testy jednostkowe walidacji i integracji.
9. Zapewnić A11y (aria-describedby, focus trap).
10. Przegląd kodu i optymalizacja styli z Tailwind.
```
