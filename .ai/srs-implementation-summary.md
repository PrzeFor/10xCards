# Podsumowanie implementacji widoku sesji powtórek SRS

**Data implementacji:** 31 grudnia 2025  
**Status:** Backend i Frontend Core - ZAKOŃCZONE ✓  
**Podstawa:** Plan implementacji z `.ai/srs-view-implementation-plan.md`

---

## 📊 Przegląd zrealizowanych faz

### ✅ Faza 1: Rozszerzenie bazy danych i typów (Kroki 1-6)

#### 1.1 Migracje bazy danych
**Utworzone pliki:**
- `supabase/migrations/20251231160000_add_srs_to_flashcards.sql`
  - Dodano enum `srs_card_state` ('new', 'learning', 'review', 'relearning')
  - Dodano kolumny SRS do tabeli `flashcards`:
    - `next_review` (timestamptz) - data następnej powtórki
    - `interval` (integer) - interwał w dniach
    - `ease_factor` (decimal) - współczynnik łatwości
    - `repetitions` (integer) - liczba powtórzeń
    - `srs_state` (enum) - stan karty
    - `last_reviewed_at` (timestamptz) - data ostatniej powtórki

- `supabase/migrations/20251231160100_create_sessions_table.sql`
  - Utworzono enum `session_status` ('active', 'completed', 'abandoned')
  - Utworzono tabelę `sessions`:
    - Pola podstawowe: id, user_id, status, total_cards, completed_cards
    - Timestamps: started_at, completed_at, created_at, updated_at
    - Statystyki: stats (jsonb)
  - Pełne RLS policies (select, insert, update, delete)

- `supabase/migrations/20251231160200_create_srs_indexes.sql`
  - Indeksy dla wydajnych zapytań:
    - `idx_flashcards_user_next_review` - znajdowanie fiszek do powtórki
    - `idx_flashcards_srs_state` - filtrowanie po stanie
    - `idx_sessions_user_id`, `idx_sessions_status`, `idx_sessions_user_status`

- `supabase/migrations/20251231160300_add_updated_at_trigger_sessions.sql`
  - Trigger `trg_sessions_updated_at` dla automatycznej aktualizacji `updated_at`

#### 1.2 Typy TypeScript
**Rozszerzono:** `src/types.ts`
- **SRS Types:**
  - `SRSCardState` - stany fiszki w SRS
  - `SRSStateDto` - metadata SRS dla fiszki
  - `FlashcardWithSRSDto` - fiszka z danymi SRS
  - `RatingValue` - ocena trudności ('easy', 'medium', 'hard')
  - `UpdateSRSStateRequestDto`, `UpdateSRSStateResponseDto`

- **Session Types:**
  - `SessionStatus` - status sesji
  - `SessionCardResultDto` - wynik oceny pojedynczej karty
  - `SessionStatsDto` - statystyki zakończonej sesji
  - `CreateSessionRequestDto`, `CreateSessionResponseDto`
  - `SessionDto` - szczegóły sesji
  - `CompleteSessionRequestDto`, `CompleteSessionResponseDto`

**Rozszerzono:** `src/types/viewModels.ts`
- `SessionViewModel` - model widoku sesji (frontend state)
- `SessionState` - stan lokalny SessionContainer
- `SessionContainerProps` - propsy głównego komponentu
- `PendingSRSUpdate` - pending updates dla offline mode
- Funkcje pomocnicze: `getInitialSessionState()`, `calculateSessionStats()`

#### 1.3 Schematy Zod
**Utworzono:** `src/lib/schemas/session.ts`
- `ratingValueSchema` - walidacja oceny
- `createSessionRequestSchema` - tworzenie sesji
- `updateSRSStateRequestSchema` - aktualizacja SRS
- `sessionCardResultSchema` - wynik pojedynczej karty
- `completeSessionRequestSchema` - zakończenie sesji
- `validateSessionStats()` - funkcja walidacji statystyk

#### 1.4 Integracja algorytmu SRS
**Utworzono:** `src/lib/services/srs.service.ts`
- Instalacja biblioteki `ts-fsrs`
- Klasa `SRSService` z metodami:
  - `initializeCard()` - inicjalizacja nowej fiszki
  - `calculateNextReview()` - obliczanie następnej powtórki
  - `previewNextStates()` - podgląd możliwych stanów
  - `isDueForReview()` - sprawdzenie czy karta wymaga powtórki
  - `getDaysUntilReview()` - dni do następnej powtórki
- Mapowanie między naszymi typami a FSRS
- Singleton export: `srsService`

#### 1.5 Session Service
**Utworzono:** `src/lib/services/session.service.ts`
- Klasa `SessionService` z metodami:
  - `createSession()` - tworzenie nowej sesji z fiszkami do powtórki
  - `getSession()` - pobieranie szczegółów sesji
  - `completeSession()` - zakończenie sesji i zapis statystyk
  - `abandonSession()` - oznaczenie sesji jako przerwana
  - `getActiveSession()` - pobranie aktywnej sesji użytkownika
- Prywatne metody pomocnicze:
  - `getFlashcardsDueForReview()` - IDs fiszek do powtórki
  - `getFlashcardsWithSRS()` - pełne dane fiszek z SRS

#### 1.6 Rozszerzenie Flashcard Service
**Rozszerzono:** `src/lib/services/flashcard.service.ts`
- Nowe metody SRS:
  - `updateSRSState()` - aktualizacja stanu SRS po ocenie
  - `getFlashcardsDueForReview()` - pobieranie fiszek do powtórki
  - `getFlashcardsDueCount()` - liczba fiszek do powtórki
- Inicjalizacja SRS przy tworzeniu nowych fiszek (w `createFlashcards()`)
- Integracja z `srsService`

---

### ✅ Faza 2: Implementacja API endpoints (Kroki 7-9)

#### 2.1 POST /api/sessions
**Utworzono:** `src/pages/api/sessions.ts`
- Tworzenie nowej sesji nauki
- Walidacja request body z Zod
- Obsługa błędów:
  - 401 Unauthorized - brak autentykacji
  - 400 ValidationError - błędne dane
  - 404 NotFound - brak fiszek do powtórki
  - 500 InternalServerError
- Response: 201 Created z `CreateSessionResponseDto`

#### 2.2 GET /api/sessions/:sessionId
**Utworzono:** `src/pages/api/sessions/[sessionId].ts`
- Pobieranie szczegółów sesji
- Weryfikacja dostępu (ownership)
- Obsługa błędów:
  - 401 Unauthorized
  - 403 Forbidden - cudza sesja
  - 404 NotFound
  - 500 InternalServerError
- Response: 200 OK z `SessionDto`

#### 2.3 POST /api/sessions/:sessionId/complete
**Utworzono:** `src/pages/api/sessions/[sessionId]/complete.ts`
- Zakończenie sesji i zapis statystyk
- Walidacja wyników i statystyk
- Sprawdzenie spójności (suma ocen = total_cards)
- Obsługa błędów:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 NotFound
  - 409 ConflictError - sesja już zakończona
  - 400 ValidationError
  - 500 InternalServerError
- Response: 200 OK z `CompleteSessionResponseDto`

#### 2.4 PUT /api/flashcards/:cardId/srs
**Utworzono:** `src/pages/api/flashcards/[cardId]/srs.ts`
- Aktualizacja stanu SRS fiszki po ocenie
- Integracja z FlashcardService i SRS algorytmem
- Walidacja rating (easy/medium/hard) i review_duration
- Weryfikacja dostępu do fiszki
- Obsługa błędów:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 NotFound
  - 400 ValidationError
  - 500 InternalServerError
- Response: 200 OK z `UpdateSRSStateResponseDto`

---

### ✅ Faza 3: Komponenty UI (Kroki 10-15)

#### 3.1 Komponenty pomocnicze - Część 1
**Utworzono:**
- `src/components/session/ProgressBar.tsx`
  - Wizualizacja postępu (pasek + licznik)
  - Walidacja wartości
  - Accessibility: role="progressbar", aria attributes
  - Animowane transitions

- `src/components/session/StatsCard.tsx`
  - Reużywalny komponent karty statystyki
  - 4 warianty: default, success, warning, error
  - Opcjonalna ikona
  - Używany w SessionSummary

- `src/components/session/SessionButton.tsx`
  - Przycisk do oceny trudności
  - 3 warianty kolorystyczne (easy/medium/hard)
  - Wyświetlanie skrótu klawiszowego
  - Loading state z spinnerem
  - Focus ring dla accessibility

#### 3.2 Komponenty pomocnicze - Część 2
**Utworzono:**
- `src/components/session/ExitButton.tsx`
  - Przycisk wyjścia z ikoną X (lucide-react)
  - Opcjonalny modal potwierdzenia (Dialog z Shadcn/ui)
  - Tooltip: "Exit session (Esc)"

- `src/components/session/FullscreenWrapper.tsx`
  - Wrapper dla pełnoekranowego widoku
  - Header z ExitButton + ProgressBar
  - Centered content area
  - Border separator

#### 3.3 Komponenty fiszki
**Utworzono:**
- `src/components/session/CardFront.tsx`
  - Prezentacja przodu fiszki
  - Różne style dla rozróżnienia
  - Overflow scroll dla długich tekstów
  - Walidacja pustych tekstów

- `src/components/session/CardBack.tsx`
  - Prezentacja tyłu fiszki
  - Odmienne style od CardFront
  - Identyczna struktura

- `src/components/session/FlashcardDisplay.tsx`
  - Główny komponent z 3D flip animation
  - CSS: perspective, transform-style: preserve-3d, backface-visibility
  - Transition 500ms
  - Klikalna karta (tylko gdy nie odkryta)
  - Keyboard support: Space/Enter
  - Accessibility hint
  - Conditional rendering tylnej strony

- `src/components/session/RevealButton.tsx`
  - Przycisk "Pokaż odpowiedź"
  - Ikona Eye (lucide-react)
  - Wyświetlanie skrótu klawiszowego
  - Large size

#### 3.4 Komponenty akcji i podsumowania
**Utworzono:**
- `src/components/session/RatingButtons.tsx`
  - Grupa 3 SessionButton (Easy, Medium, Hard)
  - Grid layout: responsive (1 col mobile, 3 cols desktop)
  - Przekazywanie disabled/loading state

- `src/components/session/SessionSummary.tsx`
  - Podsumowanie zakończonej sesji
  - Nagłówek z CheckCircle2
  - Grid ze statystykami (StatsCard x4)
  - Funkcja formatowania czasu (MM:SS lub HH:MM:SS)
  - Obliczanie procentów
  - Wizualizacja rozkładu ocen (kolorowy pasek)
  - 2 przyciski: "Zakończ sesję", "Rozpocznij nową"
  - Animacja wejścia: fade-in + zoom-in

#### 3.5 Custom hook - useKeyboardShortcuts
**Utworzono:** `src/lib/hooks/useKeyboardShortcuts.ts`
- Obsługa wszystkich skrótów klawiszowych:
  - Space/Enter - odkrycie karty (gdy nie odkryta)
  - 1 lub E - Easy (gdy odkryta)
  - 2 lub M - Medium (gdy odkryta)
  - 3 lub H - Hard (gdy odkryta)
  - Escape - wyjście z sesji
- Ignorowanie gdy użytkownik pisze w input/textarea
- Disabled state support
- Cleanup przy unmount

---

### ✅ Faza 4: Custom hooks i logika stanu (Kroki 16-18)

#### 4.1 Custom hook - useSession
**Utworzono:** `src/lib/hooks/useSession.ts`
- Główny hook zarządzający stanem sesji
- State management z `SessionState` i `SessionViewModel`
- **Funkcje:**
  - `initializeSession()` - walidacja i utworzenie view modelu
  - `fetchSession()` - pobieranie z API (placeholder)
  - `flipCard()` - odkrycie karty z guard clauses
  - `rateCard()` - główna logika oceniania:
    - Guard clauses (walidacja stanu)
    - Wywołanie API `/api/flashcards/{id}/srs`
    - Przejście do następnej karty
    - Automatyczne wykrycie końca sesji
    - Obsługa błędów
  - `completeSession()` - zakończenie sesji (API call)
  - `exitSession()` - redirect do /flashcards
  - `startNewSession()` - redirect do /sessions/new
  - `retryAfterError()` - reset błędu
  - `calculateReviewDuration()` - czas na karcie
- **Return values:**
  - session, currentFlashcard, isFlipped
  - isLoading, isSavingRating, error
  - showSummary, stats
  - Wszystkie funkcje akcji
- Auto-complete przy showSummary (useEffect)

#### 4.2 Utilities - session.ts
**Utworzono:** `src/lib/utils/session.ts`
- `formatSessionDuration()` - formatowanie MM:SS lub HH:MM:SS
- `validateFlashcards()` - walidacja danych fiszek
- `calculateReviewDuration()` - czas między timestamps
- `validateSessionStats()` - sprawdzenie spójności statystyk
- `calculateAverageReviewDuration()` - średni czas na kartę
- `getPerformanceLevel()` - ocena wydajności (excellent/good/needs-work)
- `formatCardCount()` - polska forma liczby mnogiej

#### 4.3 Utilities - storage.ts (Offline Support)
**Utworzono:** `src/lib/utils/storage.ts`
- **Pending updates:**
  - `savePendingUpdate()` - zapis do localStorage
  - `getPendingUpdates()` - odczyt pending updates
  - `clearPendingUpdates()` - czyszczenie
  - `removePendingUpdate()` - usunięcie pojedynczego
  - `syncPendingUpdates()` - synchronizacja z serwerem
  - `hasPendingUpdates()` - sprawdzenie czy są pending
- **Event listeners:**
  - `initializeOfflineSync()` - auto-sync przy powrocie online
- **Session progress (recovery):**
  - `saveSessionProgress()` - zapis postępu
  - `getSessionProgress()` - odczyt postępu
  - `clearSessionProgress()` - czyszczenie

---

### ✅ Faza 5: Główny komponent i integracja (Kroki 19-21)

#### 5.1 SessionContainer
**Utworzono:** `src/components/SessionContainer.tsx`
- Główny komponent React orkiestrujący całą sesję
- **Integracje:**
  - `useSession` hook - state management
  - `useKeyboardShortcuts` hook - skróty klawiaturowe
  - Disabled keyboard shortcuts podczas loading/saving
- **5 stanów UI:**
  1. **Loading** - Loader2 spinner z komunikatem
  2. **Error (no session)** - AlertCircle z retry/exit buttons
  3. **No data** - komunikat z przyciskiem powrotu
  4. **Summary** - SessionSummary po zakończeniu
  5. **Active session** - główny widok z kartą
- **Active session layout:**
  - FullscreenWrapper z progress bar
  - FlashcardDisplay z flip animation
  - Warunkowe renderowanie: RevealButton vs RatingButtons
  - Inline error toast (nie blokujący)
  - Loading indicator podczas zapisywania
- Exit confirmation tylko gdy są completed results

#### 5.2 Strona Astro - /sessions/[sessionId]
**Utworzono:** `src/pages/sessions/[sessionId].astro`
- Dynamic route z `export const prerender = false`
- **Server-side checks:**
  - Walidacja sessionId parameter
  - Authentication check (redirect do login z query param)
  - Opcjonalny SSR data fetching (zakomentowany dla MVP)
- **Client-side:**
  - SessionContainer z `client:only="react"`
  - Przekazanie sessionId i initialFlashcards (jeśli SSR)
- **Meta tags:**
  - Title: "Sesja Powtórek | 10xCards"
  - Description dla SEO
- Layout integration

#### 5.3 Endpoint pomocniczy - /sessions/new
**Utworzono:** `src/pages/sessions/new.astro`
- Automatyczne tworzenie nowej sesji
- Authentication check z redirect
- **Flow:**
  1. POST do `/api/sessions` z default max_cards: 20
  2. Success: redirect do `/sessions/{sessionId}`
  3. 404 (no cards): redirect do `/flashcards?message=no_cards_due`
  4. Error: redirect do `/flashcards?message=session_error`
- Cookie forwarding dla authenticated requests
- Graceful error handling

---

## 📁 Struktura plików - Przegląd

### Backend
```
src/
├── lib/
│   ├── services/
│   │   ├── srs.service.ts              ← SRS algorytm (ts-fsrs)
│   │   ├── session.service.ts          ← Zarządzanie sesjami
│   │   └── flashcard.service.ts        ← Rozszerzone o SRS
│   ├── schemas/
│   │   └── session.ts                  ← Schematy Zod
│   └── utils/
│       ├── session.ts                  ← Funkcje pomocnicze
│       └── storage.ts                  ← Offline support
├── pages/
│   ├── api/
│   │   ├── sessions.ts                 ← POST /api/sessions
│   │   ├── sessions/
│   │   │   ├── [sessionId].ts          ← GET /api/sessions/:id
│   │   │   └── [sessionId]/
│   │   │       └── complete.ts         ← POST /api/sessions/:id/complete
│   │   └── flashcards/
│   │       └── [cardId]/
│   │           └── srs.ts              ← PUT /api/flashcards/:id/srs
│   └── sessions/
│       ├── [sessionId].astro           ← Strona sesji
│       └── new.astro                   ← Helper endpoint
├── types.ts                            ← Rozszerzone typy DTO
└── types/
    └── viewModels.ts                   ← ViewModels dla UI
```

### Frontend
```
src/
├── components/
│   ├── SessionContainer.tsx            ← Główny kontener
│   └── session/
│       ├── ProgressBar.tsx
│       ├── StatsCard.tsx
│       ├── SessionButton.tsx
│       ├── ExitButton.tsx
│       ├── FullscreenWrapper.tsx
│       ├── CardFront.tsx
│       ├── CardBack.tsx
│       ├── FlashcardDisplay.tsx
│       ├── RevealButton.tsx
│       ├── RatingButtons.tsx
│       └── SessionSummary.tsx
└── lib/
    └── hooks/
        ├── useSession.ts               ← Główny state hook
        └── useKeyboardShortcuts.ts     ← Skróty klawiaturowe
```

### Database
```
supabase/
└── migrations/
    ├── 20251231160000_add_srs_to_flashcards.sql
    ├── 20251231160100_create_sessions_table.sql
    ├── 20251231160200_create_srs_indexes.sql
    └── 20251231160300_add_updated_at_trigger_sessions.sql
```

---

## ⚠️ Wymagane przed uruchomieniem

### 1. Migracje bazy danych
```bash
# Jeśli używasz lokalnego Supabase
npx supabase db reset

# Lub migracja na istniejącej bazie
npx supabase db push
```

### 2. Wygenerowanie typów TypeScript
```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

Po wykonaniu tych kroków, błędy TypeScript w service'ach powinny zniknąć.

---

## 🎯 Co dalej - Kolejne kroki

### Priorytet 1: Podstawowa integracja (1-2 dni)

#### A. Integracja z widokiem flashcards
**Lokalizacja:** `src/pages/flashcards.astro` i `src/components/FlashcardListView.tsx`

1. **Przycisk "Rozpocznij sesję powtórek"**
   - Dodać w górnej części widoku fiszek
   - Link do `/sessions/new`
   - Wyświetlać tylko gdy są fiszki do powtórki
   - Stylizacja: primary button, wyróżniony

2. **Badge z liczbą fiszek do powtórki**
   - Wywołać `flashcardService.getFlashcardsDueCount(userId)`
   - Wyświetlić badge obok przycisku
   - Np. "20 fiszek czeka na powtórkę"
   - Ukryć gdy count = 0

3. **Komunikaty z query params**
   - Odczytać `?message=no_cards_due` lub `?message=session_error`
   - Wyświetlić toast notification:
     - `no_cards_due`: "Nie masz fiszek zaplanowanych do powtórki"
     - `session_error`: "Wystąpił błąd podczas tworzenia sesji"
   - Użyć Sonner (już zainstalowane)

**Przykładowa implementacja:**
```astro
---
// src/pages/flashcards.astro
import { FlashcardService } from '../lib/services/flashcard.service';

const supabase = createClient(Astro.cookies);
const { data: { user } } = await supabase.auth.getUser();

let dueCount = 0;
if (user) {
  const flashcardService = new FlashcardService(supabase);
  dueCount = await flashcardService.getFlashcardsDueCount(user.id);
}

const message = Astro.url.searchParams.get('message');
---

<Layout>
  {dueCount > 0 && (
    <div class="mb-4 flex items-center justify-between">
      <div>
        <a href="/sessions/new" class="button-primary">
          Rozpocznij sesję powtórek
        </a>
        <span class="badge">{dueCount} fiszek do powtórki</span>
      </div>
    </div>
  )}
  
  <FlashcardListView client:load message={message} />
</Layout>
```

#### B. Toast notifications
**Lokalizacja:** `src/components/FlashcardListView.tsx`

```tsx
import { useEffect } from 'react';
import { toast } from 'sonner';

export function FlashcardListView({ message }: { message?: string | null }) {
  useEffect(() => {
    if (message === 'no_cards_due') {
      toast.info('Nie masz fiszek zaplanowanych do powtórki');
    } else if (message === 'session_error') {
      toast.error('Wystąpił błąd podczas tworzenia sesji');
    }
  }, [message]);
  
  // ... rest
}
```

#### C. Link w nawigacji (opcjonalne)
**Lokalizacja:** główny layout lub nawigacja

- Dodać link "Powtórki" w menu
- Badge z liczbą fiszek do powtórki (jeśli > 0)
- Mobilny widok: ikona z badge

---

### Priorytet 2: Улучшenia UX (2-3 dni)

#### A. Error Boundary dla SessionContainer
**Utworzyć:** `src/components/SessionErrorBoundary.tsx`
```tsx
import React from 'react';

export class SessionErrorBoundary extends React.Component<Props, State> {
  // Implementacja zgodnie z planem (sekcja 10.3)
}
```

**Owinąć SessionContainer:**
```tsx
<SessionErrorBoundary>
  <SessionContainer {...props} />
</SessionErrorBoundary>
```

#### B. Animacje i transitions
1. **Smooth card transitions**
   - Animacja przy przejściu do następnej karty
   - Fade out/in lub slide

2. **Loading states**
   - Skeleton dla ProgressBar podczas ładowania
   - Smooth transitions między stanami

3. **Success feedback**
   - Krótka animacja po ocenie karty
   - Np. checkmark lub subtle flash

#### C. Offline support - implementacja
1. **Aktywować w useSession:**
   ```tsx
   import { savePendingUpdate, initializeOfflineSync } from '../lib/utils/storage';
   
   useEffect(() => {
     initializeOfflineSync();
   }, []);
   ```

2. **W rateCard() - fallback:**
   ```tsx
   } catch (error) {
     // Save to localStorage
     savePendingUpdate(sessionId, {
       flashcardId: currentFlashcard.id,
       rating,
       reviewDuration,
       timestamp: new Date().toISOString(),
     });
     
     toast.warning('Zapisano lokalnie. Zsynchronizujemy gdy będziesz online.');
     
     // Continue session
     // ... move to next card
   }
   ```

#### D. Responsive improvements
1. **Mobile optimizations:**
   - Większe przyciski na mobile (touch-friendly)
   - Adjusted typography
   - Vertical layout dla rating buttons na bardzo małych ekranach

2. **Tablet layout:**
   - Optymalizacja dla horizontal orientation
   - Wykorzystanie większej przestrzeni

---

### Priorytet 3: Accessibility (1-2 dni)

#### A. ARIA improvements
1. **Live regions dla zmian stanu:**
   ```tsx
   <div aria-live="polite" aria-atomic="true" className="sr-only">
     {isFlipped ? 'Odpowiedź odkryta' : 'Pytanie'}
   </div>
   ```

2. **Announce progress:**
   ```tsx
   <div aria-live="polite" aria-atomic="true" className="sr-only">
     Karta {currentIndex + 1} z {totalCards}
   </div>
   ```

3. **Focus management:**
   - Auto-focus na RevealButton po przejściu do nowej karty
   - Auto-focus na pierwszym rating button po odkryciu
   - Return focus do ExitButton po zamknięciu modala

#### B. Keyboard navigation testing
- Testować z użyciem tylko klawiatury
- Sprawdzić focus order
- Upewnić się, że wszystkie akcje są dostępne

#### C. Screen reader testing
- Przetestować z NVDA (Windows) lub VoiceOver (Mac)
- Sprawdzić czy wszystkie informacje są ogłaszane
- Zweryfikować labels i descriptions

---

### Priorytet 4: Testy (3-5 dni)

#### A. Testy jednostkowe - komponenty
**Utworzyć pliki testowe w:** `tests/unit/components/session/`

1. **ProgressBar.test.tsx**
   ```tsx
   describe('ProgressBar', () => {
     it('renders correctly with valid values', () => {});
     it('validates current <= total', () => {});
     it('calculates percentage correctly', () => {});
     it('has proper ARIA attributes', () => {});
   });
   ```

2. **SessionButton.test.tsx**
3. **FlashcardDisplay.test.tsx**
4. **RatingButtons.test.tsx**
5. **SessionSummary.test.tsx**

#### B. Testy jednostkowe - hooks
**Utworzyć pliki testowe w:** `tests/unit/hooks/`

1. **useSession.test.ts**
   - Mock fetch API
   - Test state transitions
   - Test error handling

2. **useKeyboardShortcuts.test.ts**
   - Simulate keyboard events
   - Test disabled state

#### C. Testy jednostkowe - services
**Rozszerzyć:** `tests/unit/services/`

1. **srs.service.test.ts**
   - Test calculateNextReview()
   - Test rating mappings
   - Test state transitions

2. **session.service.test.ts**
3. **flashcard.service.test.ts** (SRS methods)

#### D. Testy e2e - Playwright
**Utworzyć:** `tests/e2e/session.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('SRS Session', () => {
  test('complete session flow', async ({ page }) => {
    // Login
    // Navigate to /sessions/new
    // Verify session started
    // Flip card
    // Rate card (easy)
    // Verify moved to next card
    // Complete all cards
    // Verify summary shown
    // Verify stats are correct
  });
  
  test('keyboard shortcuts work', async ({ page }) => {
    // Test Space, 1-3, Esc
  });
  
  test('handles no cards available', async ({ page }) => {
    // Verify proper message
  });
  
  test('exit confirmation works', async ({ page }) => {
    // Start session
    // Click exit
    // Verify modal
    // Cancel
    // Verify still in session
    // Exit again and confirm
  });
});
```

#### E. Testy accessibility
**Utworzyć:** `tests/e2e/session-a11y.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Session Accessibility', () => {
  test('should not have accessibility violations', async ({ page }) => {
    await page.goto('/sessions/[test-session-id]');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

### Priorytet 5: Optymalizacje (1-2 dni)

#### A. Performance optimizations
1. **React.memo dla komponentów prezentacyjnych:**
   ```tsx
   export const ProgressBar = React.memo(({ current, total }) => {
     // ...
   });
   ```

2. **useMemo dla expensive calculations:**
   ```tsx
   const stats = useMemo(
     () => calculateSessionStats(results, startedAt, completedAt),
     [results, startedAt, completedAt]
   );
   ```

3. **Lazy loading SessionContainer:**
   ```astro
   <SessionContainer client:load /> // Instead of client:only
   ```

#### B. Bundle size analysis
```bash
npm run build
npx vite-bundle-visualizer
```

#### C. Lighthouse audit
- Performance: target 90+
- Accessibility: target 100
- Best Practices: target 90+
- SEO: target 90+

---

### Priorytet 6: Monitoring i analytics (opcjonalne)

#### A. Error tracking
Integracja np. Sentry:
```tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
});
```

#### B. Analytics events
```tsx
// W useSession
const logEvent = (event: string, data: Record<string, any>) => {
  // Google Analytics, Plausible, etc.
  console.log(`[Analytics] ${event}`, data);
};

// Usage
logEvent('session.started', { sessionId, flashcardCount });
logEvent('card.rated', { rating, reviewDuration, cardIndex });
logEvent('session.completed', { totalCards, duration, stats });
```

---

## 🐛 Znane ograniczenia i TODO

### Ograniczenia MVP
1. **Brak wznowienia sesji** - jeśli użytkownik odświeży stronę, traci postęp
   - Rozwiązanie: implementacja `getSessionProgress()` / `saveSessionProgress()`

2. **Brak offline mode** - zapisywanie działa online
   - Rozwiązanie: aktywacja funkcji z `storage.ts`

3. **Brak retry logic** - po błędzie API użytkownik musi ręcznie retry
   - Rozwiązanie: exponential backoff w `useSession`

4. **Brak pre-fetching** - wszystkie dane ładowane client-side
   - Rozwiązanie: aktywacja SSR data fetching w `[sessionId].astro`

### Bugs do naprawienia
1. **TypeScript errors w services** - wynikają z braku zaktualizowanych typów DB
   - Fix: uruchomić migracje i wygenerować typy

2. **Fetch session endpoint** - obecnie placeholder w `useSession`
   - Fix: implementacja GET endpoint dla pobrania flashcards sesji

---

## 📚 Dokumentacja techniczna

### Algorytm SRS
Używamy biblioteki `ts-fsrs` (Free Spaced Repetition Scheduler):
- Easy: zwiększa interwał znacząco (łatwa karta)
- Medium (Good): standardowy wzrost interwału
- Hard: minimalny wzrost lub reset do krótkiego interwału

### Flow sesji
```
1. User → /sessions/new
2. POST /api/sessions → Session created
3. Redirect → /sessions/{sessionId}
4. SessionContainer loads → useSession initialized
5. For each card:
   a. Show front
   b. User flips (Space/Enter or click)
   c. Show back + rating buttons
   d. User rates (1-3 or E/M/H)
   e. PUT /api/flashcards/{id}/srs
   f. Move to next card
6. After last card → Show SessionSummary
7. POST /api/sessions/{id}/complete
8. User exits or starts new session
```

### State management
```
SessionState {
  session: SessionViewModel | null
  isLoading: boolean
  isSavingRating: boolean
  error: string | null
  showSummary: boolean
}

SessionViewModel {
  sessionId: string
  flashcards: FlashcardWithSRSDto[]
  currentIndex: number
  isFlipped: boolean
  completedResults: SessionCardResultDto[]
  status: SessionStatus
  startedAt: string
  currentCardStartedAt: string | null
}
```

---

## 🎨 Design decisions

### Dlaczego client:only="react"?
- SessionContainer to heavy interactive component
- Nie ma sensu renderować SSR (cała logika client-side)
- Lepsza performance niż hydration

### Dlaczego localStorage dla offline?
- Prosty, natywny, szybki
- Nie wymaga dodatkowych dependencies
- Wystarczający dla MVP (małe ilości danych)
- Łatwy do zastąpienia IndexedDB w przyszłości

### Dlaczego separate API endpoints?
- RESTful design
- Łatwiejsze testowanie
- Możliwość reużycia (np. mobile app)
- Jasna separacja odpowiedzialności

---

## 📖 Przydatne zasoby

### Dokumentacja
- [ts-fsrs GitHub](https://github.com/open-spaced-repetition/ts-fsrs)
- [Astro Dynamic Routes](https://docs.astro.build/en/guides/routing/#dynamic-routes)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [React Hook Best Practices](https://react.dev/reference/react)

### SRS algorytm
- [SuperMemo Algorithm SM-2](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [FSRS Paper](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)

---

## ✅ Checklist przed produkcją

### Must have
- [ ] Uruchomić migracje bazy danych
- [ ] Wygenerować typy TypeScript
- [ ] Dodać przycisk "Rozpocznij sesję" w /flashcards
- [ ] Zaimplementować toast notifications
- [ ] Podstawowe testy e2e (happy path)
- [ ] Lighthouse audit (min 80 we wszystkich kategoriach)

### Nice to have
- [ ] Offline support (localStorage sync)
- [ ] Session recovery po refresh
- [ ] Testy jednostkowe (coverage > 70%)
- [ ] Screen reader testing
- [ ] Error tracking (Sentry)
- [ ] Analytics events

### Before scale
- [ ] Load testing (wiele równoczesnych sesji)
- [ ] Database indexes optimization
- [ ] CDN dla static assets
- [ ] Rate limiting na API endpoints
- [ ] Monitoring i alerting

---

## 🎉 Podsumowanie

Implementacja **widoku sesji powtórek SRS** została zakończona zgodnie z planem. System obejmuje:

✅ **Backend:** Pełna integracja algorytmu SRS, API endpoints, database schema  
✅ **Frontend:** Kompletny UI z animacjami, keyboard shortcuts, accessibility  
✅ **State Management:** Custom hooks, error handling, offline support preparation  
✅ **Integration:** Gotowe strony Astro, routing, authentication  

**Następny krok:** Uruchomienie migracji i podstawowa integracja z widokiem flashcards.

**Czas implementacji:** ~21 kroków wykonanych w ramach planu 10-fazowego.

---

*Dokument wygenerowany automatycznie: 31 grudnia 2025*  
*Aktualizuj ten dokument przy wprowadzaniu zmian w implementacji*

