# Plan implementacji widoku sesji powtórek SRS

## 1. Przegląd

Widok sesji powtórek SRS to pełnoekranowa, interaktywna sesja nauki wykorzystująca algorytm Spaced Repetition System (SRS). Użytkownik przeglądasequentially fiszki zaplanowane do powtórki, ocenia swoją znajomość materiału (Easy/Medium/Hard), a system automatycznie aktualizuje harmonogram kolejnych powtórek zgodnie z algorytmem SRS. 

Sesja kończy się automatycznie po przejrzeniu wszystkich fiszek i prezentuje podsumowanie z podstawowymi statystykami. Widok został zaprojektowany z myślą o maksymalnej koncentracji użytkownika - brak rozpraszaczy, pełnoekranowy interfejs, wsparcie dla skrótów klawiszowych.

## 2. Routing widoku

**Główna ścieżka:** `/sessions/[sessionId]`

**Parametry URL:**
- `sessionId` (string) - unikalny identyfikator sesji generowany podczas inicjalizacji

**Alternatywne ścieżki:**
- `/sessions/new` - endpoint do automatycznego tworzenia nowej sesji i przekierowania do `/sessions/[sessionId]`
- `/flashcards` - przycisk "Rozpocznij sesję powtórek" przekierowuje do `/sessions/new`

**Middleware i ochrona:**
- Widok chroniony przez middleware uwierzytelniania (wymaga zalogowanego użytkownika)
- Weryfikacja dostępu do sesji (czy sessionId należy do zalogowanego użytkownika)
- Przekierowanie do `/auth/login` jeśli użytkownik nie jest zalogowany
- Przekierowanie do `/flashcards` jeśli brak fiszek do nauki

## 3. Struktura komponentów

### Hierarchia komponentów

```
SessionView.astro (strona Astro)
└── SessionContainer.tsx (React - główny kontener)
    ├── FullscreenWrapper.tsx
    │   ├── ExitButton.tsx
    │   └── ProgressBar.tsx
    ├── FlashcardDisplay.tsx
    │   ├── CardFront.tsx
    │   └── CardBack.tsx (warunkowe renderowanie)
    ├── RevealButton.tsx (warunkowe - tylko gdy karta nieodkryta)
    ├── RatingButtons.tsx (warunkowe - tylko gdy karta odkryta)
    │   ├── SessionButton.tsx (Easy)
    │   ├── SessionButton.tsx (Medium)
    │   └── SessionButton.tsx (Hard)
    └── SessionSummary.tsx (warunkowe - po zakończeniu sesji)
        ├── StatsCard.tsx (liczba kart)
        ├── StatsCard.tsx (podział na trudność)
        ├── StatsCard.tsx (czas trwania)
        └── ActionButtons.tsx
            ├── Button (Zakończ sesję)
            └── Button (Rozpocznij nową)
```

## 4. Szczegóły komponentów

### 4.1 SessionContainer.tsx

**Opis:** Główny komponent React zarządzający logiką sesji SRS. Odpowiedzialny za orkiestrację stanu, komunikację z API, zarządzanie przepływem między kartami oraz obsługę skrótów klawiszowych.

**Główne elementy:**
- Kontener `<div>` z klasą `min-h-screen bg-background`
- Warunkowe renderowanie: aktywna sesja vs podsumowanie
- Komponenty potomne: FullscreenWrapper, FlashcardDisplay, RevealButton, RatingButtons, SessionSummary
- Overlay dla stanów ładowania/błędów

**Obsługiwane zdarzenia:**
- `onCardFlip()` - odkrycie tyłu fiszki
- `onRatingSelect(rating: RatingValue)` - ocena fiszki i przejście do następnej
- `onSessionExit()` - wyjście z sesji (z potwierdzeniem jeśli niezakończona)
- `onSessionComplete()` - zakończenie sesji po ostatniej karcie
- `onRetry()` - ponowienie akcji po błędzie
- Obsługa skrótów klawiszowych (Space/Enter, 1-3, E/M/H, Esc)

**Walidacja:**
- Sprawdzenie czy sesja zawiera minimum 1 fiszkę
- Weryfikacja czy currentIndex mieści się w zakresie
- Blokada równoczesnych wywołań API (prevent double-submit)
- Walidacja rating value przed wysłaniem do API

**Typy:**
- `SessionContainerProps` (propsy)
- `SessionState` (lokalny stan)
- `SessionViewModel` (struktura danych sesji)
- `FlashcardDto` (fiszka z API)
- `SRSStateDto` (metadane SRS dla fiszki)

**Propsy:**
```typescript
interface SessionContainerProps {
  sessionId: string;
  initialFlashcards?: FlashcardWithSRSDto[]; // opcjonalne - dla SSR
}
```

### 4.2 FullscreenWrapper.tsx

**Opis:** Komponent opakowujący widok sesji, zapewniający pełnoekranowy tryb oraz podstawowe kontrolki nawigacyjne (wyjście z sesji, pasek postępu).

**Główne elementy:**
- Container `<div>` z klasą `relative w-full min-h-screen flex flex-col`
- Header z przyciskiem wyjścia i paskiem postępu
- Main content area z `flex-1 flex items-center justify-center`
- Komponenty: ExitButton (góra-lewo), ProgressBar (góra-centrum)

**Obsługiwane zdarzenia:**
- `onExit()` - kliknięcie przycisku wyjścia lub Esc
- `onFullscreenToggle()` - włączenie/wyłączenie trybu pełnoekranowego (opcjonalne)

**Walidacja:** brak specyficznej walidacji

**Typy:**
- `FullscreenWrapperProps`

**Propsy:**
```typescript
interface FullscreenWrapperProps {
  children: React.ReactNode;
  onExit: () => void;
  currentIndex: number;
  totalCards: number;
}
```

### 4.3 ProgressBar.tsx

**Opis:** Wizualizacja postępu sesji - ile fiszek zostało przejrzanych i ile pozostało. Składa się z paska postępu oraz licznika tekstowego.

**Główne elementy:**
- Container `<div>` z aria-label dla accessibility
- Pasek postępu (background bar + filled bar)
- Licznik tekstowy `{current} / {total}`
- Opcjonalnie: procent ukończenia

**Obsługiwane zdarzenia:** brak (komponent prezentacyjny)

**Walidacja:**
- `current` musi być >= 0
- `current` musi być <= `total`
- `total` musi być > 0

**Typy:**
- `ProgressBarProps`

**Propsy:**
```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}
```

### 4.4 FlashcardDisplay.tsx

**Opis:** Komponent wyświetlający treść fiszki z efektem flip animation. Pokazuje przód lub przód + tył w zależności od stanu `isFlipped`. Obsługuje kliknięcie w kartę jako alternatywę dla przycisku "Pokaż odpowiedź".

**Główne elementy:**
- Container `<div>` z perspektywą CSS dla efektu 3D
- Inner wrapper z transformacją rotate dla animacji flip
- CardFront - zawsze renderowany
- CardBack - renderowany warunkowo gdy isFlipped
- CSS: `transform-style: preserve-3d`, `transition: transform 0.6s`

**Obsługiwane zdarzenia:**
- `onClick()` - kliknięcie w kartę (flip jeśli nieodkryta)
- Skróty klawiszowe obsługiwane przez parent (SessionContainer)

**Walidacja:**
- Weryfikacja że `front` i `back` nie są puste
- Sanityzacja HTML jeśli treść zawiera formatowanie (opcjonalne dla MVP)

**Typy:**
- `FlashcardDisplayProps`
- `FlashcardDto`

**Propsy:**
```typescript
interface FlashcardDisplayProps {
  flashcard: FlashcardDto;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}
```

### 4.5 CardFront.tsx & CardBack.tsx

**Opis:** Komponenty prezentacyjne wyświetlające treść przodu i tyłu fiszki. Identyczna struktura, różna stylizacja (np. kolor tła).

**Główne elementy:**
- Container `<div>` z padding i centered content
- Text container z obsługą overflow (scroll dla długich tekstów)
- Typography: odpowiedni rozmiar czcionki dla czytelności

**Obsługiwane zdarzenia:** brak (prezentacyjne)

**Walidacja:** weryfikacja że tekst nie jest pusty

**Typy:**
- `CardSideProps`

**Propsy:**
```typescript
interface CardSideProps {
  text: string;
  className?: string;
}
```

### 4.6 RevealButton.tsx

**Opis:** Przycisk "Pokaż odpowiedź" wyświetlany gdy karta jest nieodkryta. Po kliknięciu odkrywa tył fiszki i aktywuje przyciski oceny.

**Główne elementy:**
- Komponent Button z Shadcn/ui
- Tekst: "Pokaż odpowiedź"
- Wariant: primary, duży rozmiar
- Ikona opcjonalna (np. flip icon)

**Obsługiwane zdarzenia:**
- `onClick()` - odkrycie karty
- Skrót klawiszowy: Space lub Enter (obsługiwany przez parent)

**Walidacja:** brak specyficznej walidacji

**Typy:**
- `RevealButtonProps`

**Propsy:**
```typescript
interface RevealButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

### 4.7 RatingButtons.tsx

**Opis:** Grupa trzech przycisków do oceny trudności fiszki (Easy, Medium, Hard). Widoczne tylko gdy karta jest odkryta. Każdy przycisk ma przypisany skrót klawiszowy i charakterystyczny kolor.

**Główne elementy:**
- Container `<div>` z flexbox dla równego rozłożenia
- Trzy komponenty SessionButton z różnymi wariantami
- Etykiety: "Łatwa (1)", "Średnia (2)", "Trudna (3)"
- Kolory: green (Easy), yellow (Medium), red (Hard)

**Obsługiwane zdarzenia:**
- `onRatingSelect(rating: RatingValue)` - wybór oceny
- Skróty klawiszowe: 1/E (Easy), 2/M (Medium), 3/H (Hard)

**Walidacja:**
- Przyciski aktywne tylko gdy `isFlipped === true`
- Blokada podczas wysyłania do API (loading state)

**Typy:**
- `RatingButtonsProps`
- `RatingValue` ('easy' | 'medium' | 'hard')

**Propsy:**
```typescript
interface RatingButtonsProps {
  onRatingSelect: (rating: RatingValue) => void;
  disabled?: boolean;
  isLoading?: boolean;
}
```

### 4.8 SessionButton.tsx

**Opis:** Reużywalny przycisk do oceny trudności z charakterystycznym kolorem i animacją hover/active. Wykorzystuje komponent Button z Shadcn/ui z custom styling.

**Główne elementy:**
- Komponent Button z Shadcn/ui
- Custom variant dla każdego typu oceny
- Ikona lub emoji opcjonalne
- Focus ring dla accessibility

**Obsługiwane zdarzenia:**
- `onClick()` - kliknięcie przycisku

**Walidacja:** standardowa walidacja Button z Shadcn/ui

**Typy:**
- `SessionButtonProps`
- `ButtonVariant`

**Propsy:**
```typescript
interface SessionButtonProps {
  label: string;
  shortcut: string;
  variant: 'easy' | 'medium' | 'hard';
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}
```

### 4.9 SessionSummary.tsx

**Opis:** Komponent wyświetlający podsumowanie zakończonej sesji z statystykami i akcjami. Pokazuje liczbę przejrzanych kart, rozkład ocen, czas trwania sesji oraz przyciski do zakończenia lub rozpoczęcia nowej sesji.

**Główne elementy:**
- Container `<div>` z centered content
- Nagłówek "Sesja zakończona!"
- Grid z kartami statystyk (StatsCard x3-4)
- Sekcja z akcjami (ActionButtons)
- Opcjonalnie: wykres kołowy rozkładu ocen

**Obsługiwane zdarzenia:**
- `onFinish()` - zakończenie sesji i powrót do `/flashcards`
- `onStartNew()` - rozpoczęcie nowej sesji (redirect do `/sessions/new`)

**Walidacja:** weryfikacja że suma ocen === liczba fiszek

**Typy:**
- `SessionSummaryProps`
- `SessionStatsDto`

**Propsy:**
```typescript
interface SessionSummaryProps {
  stats: SessionStatsDto;
  onFinish: () => void;
  onStartNew: () => void;
}
```

### 4.10 StatsCard.tsx

**Opis:** Reużywalny komponent karty statystyki wyświetlający pojedynczą metrykę (np. liczba kart, czas trwania, procent Easy).

**Główne elementy:**
- Card z Shadcn/ui
- Ikona lub emoji
- Wartość (duża czcionka)
- Label (mniejsza czcionka)

**Obsługiwane zdarzenia:** brak (prezentacyjny)

**Walidacja:** brak specyficznej walidacji

**Typy:**
- `StatsCardProps`

**Propsy:**
```typescript
interface StatsCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}
```

### 4.11 ExitButton.tsx

**Opis:** Przycisk wyjścia z sesji umieszczony w górnym lewym rogu. Po kliknięciu wyświetla modal potwierdzenia (jeśli sesja w trakcie) lub bezpośrednio przekierowuje (jeśli zakończona).

**Główne elementy:**
- Button z ikoną X lub strzałki wstecz
- Tooltip "Wyjdź (Esc)"
- Modal potwierdzenia (Dialog z Shadcn/ui)

**Obsługiwane zdarzenia:**
- `onClick()` - kliknięcie przycisku
- `onConfirmExit()` - potwierdzenie wyjścia w modalu
- Skrót klawiszowy: Esc

**Walidacja:** weryfikacja czy sesja jest w trakcie (wymaga potwierdzenia) czy zakończona (bezpośrednie wyjście)

**Typy:**
- `ExitButtonProps`

**Propsy:**
```typescript
interface ExitButtonProps {
  onExit: () => void;
  requireConfirmation: boolean;
}
```

## 5. Typy

### 5.1 Typy bazowe (DTO) - do zdefiniowania w `src/types.ts`

```typescript
/**
 * Metadata SRS dla pojedynczej fiszki
 */
export interface SRSStateDto {
  /** Data następnej powtórki w formacie ISO 8601 */
  next_review: string;
  /** Interwał do następnej powtórki (w dniach) */
  interval: number;
  /** Współczynnik łatwości (ease factor) */
  ease_factor: number;
  /** Liczba powtórzeń */
  repetitions: number;
  /** Stan fiszki: 'new' | 'learning' | 'review' | 'relearning' */
  state: SRSCardState;
}

/**
 * Możliwe stany fiszki w systemie SRS
 */
export type SRSCardState = 'new' | 'learning' | 'review' | 'relearning';

/**
 * Fiszka z metadanymi SRS
 */
export interface FlashcardWithSRSDto extends FlashcardDto {
  srs_state: SRSStateDto;
}

/**
 * Ocena trudności fiszki przez użytkownika
 */
export type RatingValue = 'easy' | 'medium' | 'hard';

/**
 * Żądanie aktualizacji stanu SRS fiszki
 */
export interface UpdateSRSStateRequestDto {
  rating: RatingValue;
  /** Czas spędzony na karcie (w sekundach) - opcjonalne */
  review_duration?: number;
}

/**
 * Odpowiedź po aktualizacji stanu SRS
 */
export interface UpdateSRSStateResponseDto {
  flashcard: FlashcardWithSRSDto;
  /** Data następnej powtórki */
  next_review: string;
}

/**
 * Wynik oceny pojedynczej fiszki w sesji
 */
export interface SessionCardResultDto {
  flashcard_id: string;
  rating: RatingValue;
  /** Timestamp w formacie ISO 8601 */
  timestamp: string;
  /** Czas spędzony na karcie (w sekundach) */
  review_duration: number;
}

/**
 * Statystyki zakończonej sesji
 */
export interface SessionStatsDto {
  /** Całkowita liczba fiszek w sesji */
  total_cards: number;
  /** Liczba ocen "łatwa" */
  easy_count: number;
  /** Liczba ocen "średnia" */
  medium_count: number;
  /** Liczba ocen "trudna" */
  hard_count: number;
  /** Czas trwania sesji w sekundach */
  duration: number;
  /** Data rozpoczęcia sesji */
  started_at: string;
  /** Data zakończenia sesji */
  completed_at: string;
}

/**
 * Request body dla utworzenia sesji
 */
export interface CreateSessionRequestDto {
  /** Opcjonalne: konkretne IDs fiszek do sesji. Jeśli puste, system wybiera fiszki do powtórki */
  flashcard_ids?: string[];
  /** Maksymalna liczba fiszek w sesji */
  max_cards?: number;
}

/**
 * Odpowiedź po utworzeniu sesji
 */
export interface CreateSessionResponseDto {
  session_id: string;
  flashcards: FlashcardWithSRSDto[];
  /** Liczba fiszek w sesji */
  total_cards: number;
  /** Data utworzenia sesji */
  created_at: string;
}

/**
 * Szczegóły sesji
 */
export interface SessionDto {
  id: string;
  user_id: string;
  status: SessionStatus;
  total_cards: number;
  completed_cards: number;
  started_at: string;
  completed_at: string | null;
  stats: SessionStatsDto | null;
}

/**
 * Status sesji
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned';

/**
 * Request body dla zakończenia sesji
 */
export interface CompleteSessionRequestDto {
  results: SessionCardResultDto[];
  stats: SessionStatsDto;
}
```

### 5.2 ViewModels - do zdefiniowania w `src/types/viewModels.ts`

```typescript
/**
 * Model widoku dla sesji SRS
 */
export interface SessionViewModel {
  /** ID sesji */
  sessionId: string;
  /** Lista fiszek w sesji */
  flashcards: FlashcardWithSRSDto[];
  /** Indeks bieżącej fiszki (0-based) */
  currentIndex: number;
  /** Czy bieżąca karta jest odkryta (pokazany tył) */
  isFlipped: boolean;
  /** Wyniki ocen dla ukończonych kart */
  completedResults: SessionCardResultDto[];
  /** Status sesji */
  status: SessionStatus;
  /** Timestamp rozpoczęcia sesji */
  startedAt: string;
  /** Timestamp rozpoczęcia przeglądania bieżącej karty (dla obliczenia review_duration) */
  currentCardStartedAt: string | null;
}

/**
 * Stan lokalny komponentu SessionContainer
 */
export interface SessionState {
  /** Dane sesji */
  session: SessionViewModel | null;
  /** Stan ładowania */
  isLoading: boolean;
  /** Czy trwa zapisywanie oceny */
  isSavingRating: boolean;
  /** Błąd */
  error: string | null;
  /** Czy wyświetlić podsumowanie */
  showSummary: boolean;
}

/**
 * Props dla komponentu SessionContainer
 */
export interface SessionContainerProps {
  sessionId: string;
  /** Opcjonalne dane początkowe dla SSR */
  initialFlashcards?: FlashcardWithSRSDto[];
}
```

### 5.3 Rozszerzenie schematów Zod - do zdefiniowania w `src/lib/schemas/session.ts`

```typescript
import { z } from 'zod';
import type {
  RatingValue,
  CreateSessionRequestDto,
  UpdateSRSStateRequestDto,
  SessionCardResultDto,
  CompleteSessionRequestDto,
} from '../../types';

/**
 * Schema dla oceny trudności fiszki
 */
export const ratingValueSchema = z.enum(['easy', 'medium', 'hard'] as const) satisfies z.ZodType<RatingValue>;

/**
 * Schema dla żądania utworzenia sesji
 */
export const createSessionRequestSchema = z.object({
  flashcard_ids: z.array(z.string().uuid()).optional(),
  max_cards: z.number().int().min(1).max(100).default(20),
}) satisfies z.ZodType<CreateSessionRequestDto>;

/**
 * Schema dla aktualizacji stanu SRS
 */
export const updateSRSStateRequestSchema = z.object({
  rating: ratingValueSchema,
  review_duration: z.number().min(0).optional(),
}) satisfies z.ZodType<UpdateSRSStateRequestDto>;

/**
 * Schema dla wyniku pojedynczej karty
 */
export const sessionCardResultSchema = z.object({
  flashcard_id: z.string().uuid(),
  rating: ratingValueSchema,
  timestamp: z.string().datetime(),
  review_duration: z.number().min(0),
}) satisfies z.ZodType<SessionCardResultDto>;

/**
 * Schema dla zakończenia sesji
 */
export const completeSessionRequestSchema = z.object({
  results: z.array(sessionCardResultSchema),
  stats: z.object({
    total_cards: z.number().int().min(0),
    easy_count: z.number().int().min(0),
    medium_count: z.number().int().min(0),
    hard_count: z.number().int().min(0),
    duration: z.number().min(0),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
  }),
});
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny (useState)

Komponent `SessionContainer` zarządza stanem sesji używając React useState:

```typescript
const [sessionState, setSessionState] = useState<SessionState>({
  session: null,
  isLoading: true,
  isSavingRating: false,
  error: null,
  showSummary: false,
});
```

**Przepływ danych:**
1. **Inicjalizacja:** Ładowanie danych sesji z API przy montowaniu komponentu
2. **Odkrycie karty:** Zmiana `isFlipped` na `true`, rozpoczęcie pomiaru czasu
3. **Ocena karty:** 
   - Obliczenie `review_duration`
   - Wywołanie API do aktualizacji SRS
   - Dodanie wyniku do `completedResults`
   - Reset `isFlipped`, inkrementacja `currentIndex`
4. **Zakończenie sesji:** Zmiana `status` na 'completed', pokazanie `SessionSummary`

### 6.2 Custom Hook: useSession

Hook `useSession` enkapsuluje logikę zarządzania sesją:

```typescript
function useSession(sessionId: string, initialFlashcards?: FlashcardWithSRSDto[]) {
  const [state, setState] = useState<SessionState>({...});
  
  // Inicjalizacja sesji
  useEffect(() => {
    if (initialFlashcards) {
      // Użyj danych SSR
      initializeSession(initialFlashcards);
    } else {
      // Fetch z API
      fetchSession(sessionId);
    }
  }, [sessionId]);
  
  // Funkcje pomocnicze
  const flipCard = () => {...};
  const rateCard = async (rating: RatingValue) => {...};
  const exitSession = () => {...};
  const calculateStats = (): SessionStatsDto => {...};
  
  return {
    session: state.session,
    currentFlashcard: state.session?.flashcards[state.session.currentIndex],
    isFlipped: state.session?.isFlipped ?? false,
    isLoading: state.isLoading,
    isSavingRating: state.isSavingRating,
    error: state.error,
    showSummary: state.showSummary,
    stats: state.showSummary ? calculateStats() : null,
    flipCard,
    rateCard,
    exitSession,
  };
}
```

### 6.3 Custom Hook: useKeyboardShortcuts

Hook obsługujący skróty klawiszowe:

```typescript
function useKeyboardShortcuts(
  isFlipped: boolean,
  onFlip: () => void,
  onRate: (rating: RatingValue) => void,
  onExit: () => void,
  disabled: boolean = false
) {
  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Flip card
      if ((event.key === ' ' || event.key === 'Enter') && !isFlipped) {
        event.preventDefault();
        onFlip();
      }
      
      // Rating
      if (isFlipped) {
        if (event.key === '1' || event.key.toLowerCase() === 'e') {
          event.preventDefault();
          onRate('easy');
        } else if (event.key === '2' || event.key.toLowerCase() === 'm') {
          event.preventDefault();
          onRate('medium');
        } else if (event.key === '3' || event.key.toLowerCase() === 'h') {
          event.preventDefault();
          onRate('hard');
        }
      }
      
      // Exit
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, disabled, onFlip, onRate, onExit]);
}
```

### 6.4 Custom Hook: useSRSAlgorithm

Hook integrujący algorytm SRS (np. ts-fsrs):

```typescript
function useSRSAlgorithm() {
  // Inicjalizacja algorytmu (np. FSRS)
  const fsrs = useMemo(() => new FSRS(), []);
  
  const calculateNextReview = (
    currentState: SRSStateDto,
    rating: RatingValue
  ): SRSStateDto => {
    // Mapowanie rating na wartość algorytmu
    const ratingMap = {
      'easy': Rating.Easy,
      'medium': Rating.Good,
      'hard': Rating.Hard,
    };
    
    // Obliczenie nowego stanu
    const result = fsrs.repeat(currentState, ratingMap[rating]);
    
    return {
      next_review: result.card.due.toISOString(),
      interval: result.card.scheduled_days,
      ease_factor: result.card.stability,
      repetitions: result.card.reps,
      state: result.card.state,
    };
  };
  
  return { calculateNextReview };
}
```

## 7. Integracja API

### 7.1 Endpoints wymagane do implementacji

#### POST /api/sessions

**Opis:** Utworzenie nowej sesji nauki z fiszkami zaplanowanymi do powtórki.

**Request:**
```typescript
// POST /api/sessions
// Content-Type: application/json
// Authorization: Bearer {token}

{
  "flashcard_ids": ["uuid1", "uuid2"], // opcjonalne
  "max_cards": 20 // opcjonalne, default 20
}
```

**Response 201 Created:**
```typescript
{
  "session_id": "uuid",
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "manual|ai_full|ai_edited",
      "srs_state": {
        "next_review": "2025-01-15T10:00:00Z",
        "interval": 7,
        "ease_factor": 2.5,
        "repetitions": 3,
        "state": "review"
      }
    }
  ],
  "total_cards": 10,
  "created_at": "2025-01-08T10:00:00Z"
}
```

**Errors:**
- 400 Bad Request: błędna walidacja (np. invalid UUID)
- 401 Unauthorized: brak tokenu lub nieprawidłowy
- 404 Not Found: brak fiszek do powtórki
- 500 Internal Server Error

**Typ żądania:** `CreateSessionRequestDto`  
**Typ odpowiedzi:** `CreateSessionResponseDto`

#### GET /api/sessions/:sessionId

**Opis:** Pobranie szczegółów sesji (do walidacji dostępu lub wznowienia).

**Request:**
```typescript
// GET /api/sessions/{sessionId}
// Authorization: Bearer {token}
```

**Response 200 OK:**
```typescript
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "active|completed|abandoned",
  "total_cards": 10,
  "completed_cards": 5,
  "started_at": "2025-01-08T10:00:00Z",
  "completed_at": null,
  "stats": null
}
```

**Errors:**
- 401 Unauthorized
- 403 Forbidden: sesja należy do innego użytkownika
- 404 Not Found: sesja nie istnieje
- 500 Internal Server Error

**Typ odpowiedzi:** `SessionDto`

#### PUT /api/flashcards/:cardId/srs

**Opis:** Aktualizacja stanu SRS fiszki po ocenie przez użytkownika.

**Request:**
```typescript
// PUT /api/flashcards/{cardId}/srs
// Content-Type: application/json
// Authorization: Bearer {token}

{
  "rating": "easy|medium|hard",
  "review_duration": 12 // opcjonalne, w sekundach
}
```

**Response 200 OK:**
```typescript
{
  "flashcard": {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "source": "manual",
    "srs_state": {
      "next_review": "2025-01-22T10:00:00Z",
      "interval": 14,
      "ease_factor": 2.6,
      "repetitions": 4,
      "state": "review"
    }
  },
  "next_review": "2025-01-22T10:00:00Z"
}
```

**Errors:**
- 400 Bad Request: błędna walidacja
- 401 Unauthorized
- 403 Forbidden: fiszka należy do innego użytkownika
- 404 Not Found: fiszka nie istnieje
- 500 Internal Server Error

**Typ żądania:** `UpdateSRSStateRequestDto`  
**Typ odpowiedzi:** `UpdateSRSStateResponseDto`

#### POST /api/sessions/:sessionId/complete

**Opis:** Zakończenie sesji i zapisanie statystyk.

**Request:**
```typescript
// POST /api/sessions/{sessionId}/complete
// Content-Type: application/json
// Authorization: Bearer {token}

{
  "results": [
    {
      "flashcard_id": "uuid",
      "rating": "easy",
      "timestamp": "2025-01-08T10:05:00Z",
      "review_duration": 12
    }
  ],
  "stats": {
    "total_cards": 10,
    "easy_count": 4,
    "medium_count": 3,
    "hard_count": 3,
    "duration": 300,
    "started_at": "2025-01-08T10:00:00Z",
    "completed_at": "2025-01-08T10:05:00Z"
  }
}
```

**Response 200 OK:**
```typescript
{
  "success": true,
  "session": {
    "id": "uuid",
    "status": "completed",
    "stats": {
      "total_cards": 10,
      "easy_count": 4,
      "medium_count": 3,
      "hard_count": 3,
      "duration": 300,
      "started_at": "2025-01-08T10:00:00Z",
      "completed_at": "2025-01-08T10:05:00Z"
    }
  }
}
```

**Errors:**
- 400 Bad Request: błędna walidacja
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict: sesja już zakończona
- 500 Internal Server Error

**Typ żądania:** `CompleteSessionRequestDto`  
**Typ odpowiedzi:** `{ success: boolean; session: SessionDto }`

### 7.2 Implementacja w serwisach

Utworzenie nowego pliku `src/lib/services/session.service.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
  SessionDto,
  CompleteSessionRequestDto,
} from '../../types';

export class SessionService {
  constructor(private supabase: SupabaseClient) {}
  
  async createSession(
    userId: string,
    request: CreateSessionRequestDto
  ): Promise<CreateSessionResponseDto> {
    // 1. Pobierz fiszki do powtórki (gdzie next_review <= now)
    // 2. Utwórz rekord sesji w bazie
    // 3. Zwróć dane sesji
  }
  
  async getSession(sessionId: string, userId: string): Promise<SessionDto> {
    // Pobierz sesję i zweryfikuj użytkownika
  }
  
  async completeSession(
    sessionId: string,
    userId: string,
    data: CompleteSessionRequestDto
  ): Promise<SessionDto> {
    // 1. Zaktualizuj status sesji
    // 2. Zapisz statystyki
    // 3. Zwróć zaktualizowane dane
  }
}
```

Rozszerzenie istniejącego `src/lib/services/flashcard.service.ts`:

```typescript
async updateSRSState(
  flashcardId: string,
  userId: string,
  request: UpdateSRSStateRequestDto
): Promise<UpdateSRSStateResponseDto> {
  // 1. Pobierz fiszkę i zweryfikuj użytkownika
  // 2. Oblicz nowy stan SRS używając algorytmu
  // 3. Zaktualizuj fiszkę w bazie
  // 4. Zwróć zaktualizowane dane
}
```

### 7.3 Wywołania API w komponentach

Przykład użycia w `useSession` hook:

```typescript
// Utworzenie sesji
const createSession = async () => {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ max_cards: 20 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    const data: CreateSessionResponseDto = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Ocena fiszki
const submitRating = async (
  flashcardId: string,
  rating: RatingValue,
  reviewDuration: number
) => {
  try {
    const response = await fetch(`/api/flashcards/${flashcardId}/srs`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, review_duration: reviewDuration }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update SRS state');
    }
    
    const data: UpdateSRSStateResponseDto = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};
```

## 8. Interakcje użytkownika

### 8.1 Rozpoczęcie sesji

**Lokalizacja:** Przycisk "Rozpocznij sesję powtórek" w widoku `/flashcards`

**Przepływ:**
1. Użytkownik klika przycisk "Rozpocznij sesję powtórek"
2. System wywołuje POST `/api/sessions` bez parametrów (domyślnie max 20 kart)
3. Jeśli API zwróci 404 (brak fiszek do powtórki):
   - Wyświetlenie Toast: "Nie masz fiszek zaplanowanych do powtórki"
   - Pozostanie w widoku `/flashcards`
4. Jeśli API zwróci 201:
   - Przekierowanie do `/sessions/{sessionId}`
   - Rozpoczęcie sesji

**Alternatywny przepływ:** Link bezpośredni do `/sessions/new` który automatycznie tworzy sesję i przekierowuje.

### 8.2 Przeglądanie fiszki (flip)

**Triggers:**
- Kliknięcie przycisku "Pokaż odpowiedź"
- Kliknięcie w kartę (gdy nieodkryta)
- Naciśnięcie Space lub Enter (gdy nieodkryta)

**Przepływ:**
1. Użytkownik wykonuje jedną z powyższych akcji
2. Stan `isFlipped` zmienia się na `true`
3. Animacja flip (CSS transform rotate)
4. Wyświetlenie tyłu karty (CardBack)
5. Ukrycie przycisku "Pokaż odpowiedź"
6. Pokazanie przycisków oceny (RatingButtons)
7. Rozpoczęcie pomiaru czasu dla `review_duration`

**Walidacja:**
- Akcja dostępna tylko gdy `isFlipped === false`
- Blokada podczas `isSavingRating === true`

### 8.3 Ocena fiszki (rating)

**Triggers:**
- Kliknięcie przycisku Easy/Medium/Hard
- Naciśnięcie klawisza 1/E (Easy), 2/M (Medium), 3/H (Hard)

**Przepływ:**
1. Użytkownik wybiera ocenę trudności
2. Obliczenie `review_duration` (czas od flip do rating)
3. Zmiana stanu `isSavingRating` na `true` (disabled przyciski)
4. Wywołanie PUT `/api/flashcards/{cardId}/srs` z rating i review_duration
5. Jeśli sukces (200 OK):
   - Dodanie wyniku do `completedResults`
   - Inkrementacja `currentIndex`
   - Reset `isFlipped` na `false`
   - Przejście do następnej karty lub podsumowania (jeśli ostatnia)
6. Jeśli błąd:
   - Wyświetlenie Toast z błędem
   - Opcja "Spróbuj ponownie" (przycisk lub auto-retry)
   - Zapisanie stanu w localStorage (offline fallback)
7. Zmiana stanu `isSavingRating` na `false`

**Walidacja:**
- Akcja dostępna tylko gdy `isFlipped === true`
- Blokada podczas `isSavingRating === true`
- Rating musi być jedną z wartości: 'easy' | 'medium' | 'hard'

### 8.4 Zakończenie sesji

**Scenario A: Naturalne zakończenie (po ostatniej karcie)**

1. Użytkownik ocenia ostatnią fiszkę
2. `currentIndex` osiąga `flashcards.length`
3. Zmiana `status` na 'completed'
4. Obliczenie statystyk (`SessionStatsDto`)
5. Wywołanie POST `/api/sessions/{sessionId}/complete` z wynikami i statystykami
6. Zmiana `showSummary` na `true`
7. Wyświetlenie `SessionSummary` z animacją

**Scenario B: Przedwczesne wyjście (Esc lub przycisk Exit)**

1. Użytkownik klika ExitButton lub naciska Esc
2. Jeśli sesja w trakcie (`completedResults.length < flashcards.length`):
   - Wyświetlenie modalu potwierdzenia:
     - Tytuł: "Czy na pewno chcesz wyjść?"
     - Treść: "Postęp sesji zostanie utracony."
     - Przyciski: "Anuluj" / "Wyjdź"
3. Jeśli użytkownik potwierdzi:
   - Opcjonalne: zapis częściowych wyników (abandoned session)
   - Przekierowanie do `/flashcards`
4. Jeśli sesja zakończona:
   - Bezpośrednie przekierowanie do `/flashcards`

### 8.5 Akcje po zakończeniu sesji

**Dostępne akcje w SessionSummary:**

1. **"Zakończ sesję"** (primary button)
   - Przekierowanie do `/flashcards`
   - Toast sukcesu: "Sesja zakończona! Świetna robota! 🎉"

2. **"Rozpocznij nową sesję"** (secondary button)
   - Wywołanie POST `/api/sessions` (nowa sesja)
   - Przekierowanie do `/sessions/{newSessionId}`
   - Reset całego stanu

### 8.6 Obsługa błędów podczas sesji

**Scenario: Błąd sieci podczas oceny fiszki**

1. Użytkownik ocenia fiszkę
2. Wywołanie API kończy się błędem (timeout, 500, brak sieci)
3. Wyświetlenie Toast: "Wystąpił problem z zapisem. Spróbujemy ponownie..."
4. Auto-retry z exponential backoff (3 próby: 1s, 2s, 4s)
5. Jeśli wszystkie próby nieudane:
   - Zapisanie wyniku w localStorage z kluczem `pending_srs_updates_{sessionId}`
   - Toast: "Zapisano lokalnie. Zsynchronizujemy gdy będziesz online."
   - Kontynuacja sesji (przejście do następnej karty)
6. Przy powrocie online:
   - Automatyczna synchronizacja pending updates w tle
   - Czyszczenie localStorage po sukcesie

**Scenario: Utrata sesji (odświeżenie strony)**

1. Użytkownik przypadkowo odświeża stronę podczas sesji
2. Przy ponownym załadowaniu komponent SessionContainer:
   - Wywołuje GET `/api/sessions/{sessionId}`
   - Sprawdza status sesji
3. Jeśli sesja `active`:
   - Próba wznowienia (warning: "Nie możesz wznowić sesji. Rozpocznij nową.")
   - Przekierowanie do `/flashcards`
4. Jeśli sesja `completed`:
   - Pokazanie `SessionSummary` z zapisanymi statystykami

## 9. Warunki i walidacja

### 9.1 Warunki dostępu do widoku

**Przed renderowaniem SessionView:**

1. **Uwierzytelnienie:**
   - Użytkownik musi być zalogowany
   - Jeśli nie: redirect do `/auth/login` z `redirect=/sessions/{sessionId}`
   - Middleware: `src/middleware/index.ts`

2. **Weryfikacja sesji:**
   - `sessionId` musi być prawidłowym UUID
   - Sesja musi istnieć w bazie
   - Sesja musi należeć do zalogowanego użytkownika
   - Jeśli nie: redirect do `/flashcards` z Toast "Nie znaleziono sesji"

3. **Status sesji:**
   - Jeśli sesja `completed`: pokazanie tylko SessionSummary
   - Jeśli sesja `abandoned`: redirect do `/flashcards`
   - Jeśli sesja `active`: normalny przepływ

### 9.2 Walidacja po stronie komponentu SessionContainer

**Inicjalizacja sesji:**

```typescript
// Walidacja danych z API
if (!flashcards || flashcards.length === 0) {
  throw new Error('Sesja nie zawiera fiszek');
}

// Walidacja każdej fiszki
flashcards.forEach((card, index) => {
  if (!card.id || !card.front || !card.back) {
    throw new Error(`Fiszka ${index} ma nieprawidłowe dane`);
  }
  
  if (!card.srs_state) {
    throw new Error(`Fiszka ${index} nie ma stanu SRS`);
  }
});
```

**Walidacja przed flip:**

```typescript
const handleFlip = () => {
  // Guard clauses
  if (isFlipped) {
    console.warn('Karta już odkryta');
    return;
  }
  
  if (isSavingRating) {
    console.warn('Czekaj na zakończenie zapisywania');
    return;
  }
  
  // Happy path
  setIsFlipped(true);
  setCurrentCardStartedAt(new Date().toISOString());
};
```

**Walidacja przed rating:**

```typescript
const handleRating = async (rating: RatingValue) => {
  // Guard clauses
  if (!isFlipped) {
    console.warn('Odkryj kartę przed oceną');
    return;
  }
  
  if (isSavingRating) {
    console.warn('Ocena w trakcie zapisywania');
    return;
  }
  
  if (!['easy', 'medium', 'hard'].includes(rating)) {
    throw new Error(`Nieprawidłowa ocena: ${rating}`);
  }
  
  if (!currentFlashcard) {
    throw new Error('Brak bieżącej fiszki');
  }
  
  // Happy path
  setIsSavingRating(true);
  try {
    await submitRating(currentFlashcard.id, rating, calculateReviewDuration());
    // ... continue
  } finally {
    setIsSavingRating(false);
  }
};
```

### 9.3 Walidacja parametrów API

**PUT /api/flashcards/:cardId/srs:**

```typescript
// Walidacja w endpoint (src/pages/api/flashcards/[cardId]/srs.ts)
const validationResult = updateSRSStateRequestSchema.safeParse(requestBody);
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      code: 'ValidationError',
      message: validationResult.error.errors[0].message,
    }),
    { status: 400 }
  );
}

// Walidacja business logic
const flashcard = await flashcardService.getFlashcard(cardId, userId);
if (!flashcard) {
  return new Response(
    JSON.stringify({
      code: 'NotFound',
      message: 'Fiszka nie znaleziona',
    }),
    { status: 404 }
  );
}

if (flashcard.user_id !== userId) {
  return new Response(
    JSON.stringify({
      code: 'Forbidden',
      message: 'Brak dostępu do fiszki',
    }),
    { status: 403 }
  );
}
```

### 9.4 Walidacja UI (disabled states)

**RevealButton:**
- Disabled gdy `isFlipped === true`
- Disabled gdy `isSavingRating === true`

**RatingButtons:**
- Disabled (hidden) gdy `isFlipped === false`
- Disabled gdy `isSavingRating === true`
- Każdy przycisk pokazuje loading state gdy aktywny

**ExitButton:**
- Zawsze enabled (ale może wymagać potwierdzenia)

### 9.5 Warunki zakończenia sesji

**Automatyczne zakończenie:**
```typescript
if (currentIndex >= flashcards.length) {
  // Wszystkie karty ocenione
  await completeSession();
  setShowSummary(true);
}
```

**Walidacja statystyk:**
```typescript
const validateStats = (stats: SessionStatsDto): boolean => {
  const sumRatings = stats.easy_count + stats.medium_count + stats.hard_count;
  
  if (sumRatings !== stats.total_cards) {
    console.error('Niezgodność liczby ocen z liczbą kart');
    return false;
  }
  
  if (stats.duration < 0) {
    console.error('Ujemny czas trwania sesji');
    return false;
  }
  
  return true;
};
```

## 10. Obsługa błędów

### 10.1 Kategorie błędów

**1. Błędy uwierzytelniania (401 Unauthorized)**

**Przyczyna:** Brak tokenu lub token wygasł

**Obsługa:**
```typescript
if (response.status === 401) {
  // Wylogowanie użytkownika
  await supabase.auth.signOut();
  
  // Zapisanie intended destination
  localStorage.setItem('intended_url', window.location.pathname);
  
  // Redirect do logowania
  window.location.href = '/auth/login';
  
  // Toast
  toast.error('Sesja wygasła. Zaloguj się ponownie.');
}
```

**2. Błędy dostępu (403 Forbidden)**

**Przyczyna:** Próba dostępu do cudzej sesji lub fiszki

**Obsługa:**
```typescript
if (response.status === 403) {
  toast.error('Nie masz dostępu do tej sesji');
  router.push('/flashcards');
}
```

**3. Błędy braku zasobów (404 Not Found)**

**Przyczyna:** Sesja lub fiszka nie istnieje, lub brak fiszek do powtórki

**Obsługa:**
```typescript
if (response.status === 404) {
  const error = await response.json();
  
  if (error.message.includes('fiszek do powtórki')) {
    toast.info('Nie masz fiszek zaplanowanych do powtórki');
  } else {
    toast.error('Nie znaleziono sesji');
  }
  
  router.push('/flashcards');
}
```

**4. Błędy walidacji (400 Bad Request)**

**Przyczyna:** Nieprawidłowe dane w żądaniu

**Obsługa:**
```typescript
if (response.status === 400) {
  const error = await response.json();
  
  toast.error(`Błąd walidacji: ${error.message}`);
  
  // Nie przekierowuj - pozwól użytkownikowi spróbować ponownie
  setError(error.message);
}
```

**5. Błędy serwera (500 Internal Server Error)**

**Przyczyna:** Nieoczekiwany błąd backendu

**Obsługa:**
```typescript
if (response.status >= 500) {
  toast.error('Wystąpił problem z serwerem. Spróbuj ponownie później.');
  
  // Auto-retry z exponential backoff
  if (retryCount < MAX_RETRIES) {
    setTimeout(() => {
      retryAction(retryCount + 1);
    }, Math.pow(2, retryCount) * 1000);
  }
}
```

**6. Błędy sieci (Network Error)**

**Przyczyna:** Brak połączenia z internetem

**Obsługa:**
```typescript
try {
  const response = await fetch(...);
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error
    toast.error('Brak połączenia z internetem');
    
    // Zapisz w localStorage do późniejszej synchronizacji
    saveToLocalStorage(pendingUpdate);
    
    // Pozwól kontynuować sesję offline
    continueSessionOffline();
  }
}
```

### 10.2 Strategie recovery

**Strategy 1: Auto-retry z exponential backoff**

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Retry tylko dla 5xx i network errors
      if (response.ok || response.status < 500) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }
    
    // Exponential backoff
    if (i < maxRetries - 1) {
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw lastError!;
}
```

**Strategy 2: Offline fallback (localStorage)**

```typescript
const savePendingUpdate = (update: PendingSRSUpdate) => {
  const key = `pending_srs_updates_${sessionId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(update);
  localStorage.setItem(key, JSON.stringify(existing));
};

const syncPendingUpdates = async () => {
  const key = `pending_srs_updates_${sessionId}`;
  const pending = JSON.parse(localStorage.getItem(key) || '[]');
  
  if (pending.length === 0) return;
  
  for (const update of pending) {
    try {
      await submitRating(update.flashcardId, update.rating, update.reviewDuration);
      
      // Remove from pending after success
      const remaining = pending.filter(u => u !== update);
      localStorage.setItem(key, JSON.stringify(remaining));
    } catch (error) {
      console.error('Failed to sync update:', error);
      // Zostaw w localStorage na później
    }
  }
};

// Sync przy powrocie online
window.addEventListener('online', () => {
  syncPendingUpdates();
});
```

**Strategy 3: Graceful degradation**

```typescript
// Jeśli zapisanie oceny się nie powiedzie, pozwól kontynuować sesję
const handleRatingError = (error: Error) => {
  console.error('Rating save failed:', error);
  
  // 1. Zapisz lokalnie
  savePendingUpdate({
    flashcardId: currentFlashcard.id,
    rating,
    reviewDuration,
    timestamp: new Date().toISOString(),
  });
  
  // 2. Dodaj do completedResults (lokalnie)
  setCompletedResults(prev => [...prev, {
    flashcard_id: currentFlashcard.id,
    rating,
    timestamp: new Date().toISOString(),
    review_duration: reviewDuration,
  }]);
  
  // 3. Przejdź do następnej karty
  setCurrentIndex(prev => prev + 1);
  setIsFlipped(false);
  
  // 4. Pokaż warning toast
  toast.warning('Zapisano lokalnie. Zsynchronizujemy gdy będziesz online.');
};
```

### 10.3 Error boundaries

**Implementacja Error Boundary dla SessionContainer:**

```typescript
// src/components/SessionErrorBoundary.tsx
import React from 'react';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SessionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Session error:', error, errorInfo);
    
    // Opcjonalnie: wyślij do error tracking service
    // logErrorToService(error, errorInfo);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };
  
  handleExit = () => {
    window.location.href = '/flashcards';
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">
              Wystąpił nieoczekiwany błąd
            </h1>
            <p className="text-muted-foreground">
              Przepraszamy, coś poszło nie tak podczas sesji.
            </p>
            {this.state.error && (
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleRetry}>
                Spróbuj ponownie
              </Button>
              <Button onClick={this.handleExit} variant="outline">
                Wróć do fiszek
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 10.4 Logging i monitoring

**Kluczowe eventy do logowania:**

1. **Session start:** `session.started`
2. **Card flip:** `card.flipped`
3. **Card rated:** `card.rated`
4. **Session completed:** `session.completed`
5. **Session abandoned:** `session.abandoned`
6. **Error occurred:** `error.occurred`

```typescript
const logEvent = (event: string, data: Record<string, any>) => {
  console.log(`[Session] ${event}`, data);
  
  // Opcjonalnie: wysłanie do analytics service
  // analytics.track(event, data);
};

// Użycie
logEvent('session.started', {
  sessionId,
  flashcardCount: flashcards.length,
  userId,
});

logEvent('card.rated', {
  sessionId,
  flashcardId: currentFlashcard.id,
  rating,
  reviewDuration,
  cardIndex: currentIndex,
});
```

## 11. Kroki implementacji

### Faza 1: Rozszerzenie bazy danych i typów (1-2 dni)

**1.1 Migracja bazy danych**
- [ ] Utworzenie tabeli `sessions` z polami:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key do auth.users)
  - `status` (enum: 'active', 'completed', 'abandoned')
  - `total_cards` (integer)
  - `completed_cards` (integer)
  - `started_at` (timestamp)
  - `completed_at` (timestamp, nullable)
  - `stats` (jsonb, nullable)
  - `created_at`, `updated_at` (timestamps)

- [ ] Rozszerzenie tabeli `flashcards` o kolumny SRS:
  - `next_review` (timestamp, default now())
  - `interval` (integer, default 1)
  - `ease_factor` (decimal, default 2.5)
  - `repetitions` (integer, default 0)
  - `srs_state` (enum: 'new', 'learning', 'review', 'relearning', default 'new')
  - `last_reviewed_at` (timestamp, nullable)

- [ ] Utworzenie indeksów:
  - Index na `flashcards(user_id, next_review)` dla wydajnego query fiszek do powtórki
  - Index na `sessions(user_id, status)` dla listowania sesji

- [ ] Utworzenie RLS policies dla tabeli `sessions`

**1.2 Definicja typów**
- [ ] Rozszerzenie `src/types.ts` o typy SRS (SRSStateDto, FlashcardWithSRSDto, etc.)
- [ ] Utworzenie typów dla sesji (SessionDto, CreateSessionResponseDto, etc.)
- [ ] Utworzenie `src/types/viewModels.ts` z SessionViewModel i SessionState
- [ ] Utworzenie `src/lib/schemas/session.ts` ze schematami Zod

**1.3 Integracja algorytmu SRS**
- [ ] Instalacja biblioteki: `npm install ts-fsrs`
- [ ] Utworzenie `src/lib/services/srs.service.ts` z implementacją algorytmu
- [ ] Testy jednostkowe dla SRS service

### Faza 2: Implementacja API endpoints (2-3 dni)

**2.1 Session endpoints**
- [ ] Utworzenie `src/lib/services/session.service.ts` z metodami:
  - `createSession(userId, request)`
  - `getSession(sessionId, userId)`
  - `completeSession(sessionId, userId, data)`

- [ ] Utworzenie `src/pages/api/sessions.ts` z handler POST
- [ ] Utworzenie `src/pages/api/sessions/[sessionId].ts` z handler GET
- [ ] Utworzenie `src/pages/api/sessions/[sessionId]/complete.ts` z handler POST

**2.2 Flashcard SRS endpoint**
- [ ] Rozszerzenie `src/lib/services/flashcard.service.ts` o metodę:
  - `updateSRSState(flashcardId, userId, request)`
  - `getFlashcardsDueForReview(userId, limit)`

- [ ] Utworzenie `src/pages/api/flashcards/[cardId]/srs.ts` z handler PUT

**2.3 Testy API**
- [ ] Testy jednostkowe dla session.service.ts
- [ ] Testy jednostkowe dla flashcard.service.ts (SRS methods)
- [ ] Testy e2e dla endpoints (Playwright)

### Faza 3: Implementacja komponentów UI (3-4 dni)

**3.1 Komponenty pomocnicze**
- [ ] `src/components/session/ProgressBar.tsx`
- [ ] `src/components/session/StatsCard.tsx`
- [ ] `src/components/session/SessionButton.tsx`
- [ ] `src/components/session/ExitButton.tsx`
- [ ] Testy jednostkowe dla każdego komponentu (Vitest + RTL)

**3.2 Komponenty fiszki**
- [ ] `src/components/session/CardFront.tsx`
- [ ] `src/components/session/CardBack.tsx`
- [ ] `src/components/session/FlashcardDisplay.tsx` z animacją flip
- [ ] `src/components/session/RevealButton.tsx`
- [ ] Testy jednostkowe

**3.3 Komponenty akcji**
- [ ] `src/components/session/RatingButtons.tsx`
- [ ] Testy interakcji (kliknięcia, disabled states)

**3.4 Komponenty layoutu**
- [ ] `src/components/session/FullscreenWrapper.tsx`
- [ ] `src/components/session/SessionSummary.tsx`
- [ ] `src/components/session/SessionErrorBoundary.tsx`
- [ ] Testy

### Faza 4: Custom hooks i logika stanu (2-3 dni)

**4.1 Hooks**
- [ ] `src/lib/hooks/useSession.ts` - główna logika sesji
- [ ] `src/lib/hooks/useKeyboardShortcuts.ts` - obsługa klawiszy
- [ ] `src/lib/hooks/useSRSAlgorithm.ts` - integracja z ts-fsrs
- [ ] Testy jednostkowe dla każdego hooka

**4.2 Utilities**
- [ ] `src/lib/utils/session.ts` - funkcje pomocnicze (calculateStats, formatDuration, etc.)
- [ ] `src/lib/utils/storage.ts` - localStorage operations dla offline support
- [ ] Testy

### Faza 5: Główny komponent i integracja (2-3 dni)

**5.1 SessionContainer**
- [ ] `src/components/SessionContainer.tsx` - główny komponent React
- [ ] Integracja wszystkich sub-komponentów
- [ ] Integracja hooków
- [ ] Obsługa stanów: loading, error, active session, summary
- [ ] Testy integracyjne

**5.2 Strona Astro**
- [ ] `src/pages/sessions/[sessionId].astro` - strona widoku
- [ ] Middleware protection (authentication check)
- [ ] SSR: opcjonalne wstępne załadowanie danych sesji
- [ ] Error handling (404, 403)

**5.3 Routing pomocniczy**
- [ ] `src/pages/sessions/new.astro` - endpoint tworzący nową sesję
- [ ] Redirect logic po utworzeniu

### Faza 6: Integracja z resztą aplikacji (1-2 dni)

**6.1 Flashcards view**
- [ ] Dodanie przycisku "Rozpocznij sesję powtórek" w `/flashcards`
- [ ] Obsługa przypadku braku fiszek do powtórki
- [ ] Link do sesji w nawigacji (jeśli aktywna sesja)

**6.2 Dashboard**
- [ ] Dodanie statystyk sesji SRS (opcjonalne dla MVP)
- [ ] Widget "Fiszki do powtórki dziś: X"

**6.3 Nawigacja**
- [ ] Aktualizacja `NavigationMenu` z linkiem do sesji (jeśli są fiszki do powtórki)
- [ ] Badge z liczbą fiszek do powtórki

### Faza 7: Accessibility i UX polish (1-2 dni)

**7.1 Accessibility**
- [ ] ARIA labels i live regions
- [ ] Focus management (auto-focus na przyciskach)
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Color contrast verification (WCAG 2.1)

**7.2 Animacje i transitions**
- [ ] Flip animation dla kart (CSS transforms)
- [ ] Transition między kartami
- [ ] Loading states i skeletons
- [ ] Toast animations

**7.3 Responsive design**
- [ ] Mobile layout (smaller buttons, adjusted typography)
- [ ] Tablet layout
- [ ] Desktop fullscreen mode

### Faza 8: Testy end-to-end (1-2 dni)

**8.1 Scenariusze testowe (Playwright)**
- [ ] Test: Utworzenie sesji i przejście przez wszystkie karty
- [ ] Test: Odkrycie karty i ocena (Easy/Medium/Hard)
- [ ] Test: Skróty klawiszowe (Space, 1-3, Esc)
- [ ] Test: Wyjście z sesji w trakcie (modal potwierdzenia)
- [ ] Test: Zakończenie sesji i wyświetlenie podsumowania
- [ ] Test: Brak fiszek do powtórki
- [ ] Test: Błędy API (404, 500)
- [ ] Test: Offline mode (localStorage fallback)

**8.2 Testy accessibility**
- [ ] Axe-core automated tests
- [ ] Manual keyboard navigation testing
- [ ] Screen reader testing (NVDA/JAWS)

### Faza 9: Optimization i monitoring (1 dzień)

**9.1 Performance**
- [ ] Lazy loading komponentów
- [ ] Memoization (useMemo, React.memo)
- [ ] Bundle size analysis
- [ ] Lighthouse audit (Performance, Accessibility)

**9.2 Error tracking**
- [ ] Integracja z error tracking service (opcjonalne)
- [ ] Logging kluczowych eventów
- [ ] Monitoring API response times

### Faza 10: Dokumentacja i deployment (1 dzień)

**10.1 Dokumentacja**
- [ ] README dla widoku sesji
- [ ] Dokumentacja API endpoints
- [ ] Przykłady użycia custom hooks
- [ ] Diagramy przepływu danych

**10.2 Deployment**
- [ ] Uruchomienie migracji na produkcji
- [ ] Smoke tests na staging
- [ ] Deploy na produkcję
- [ ] Monitoring pierwszych sesji użytkowników

### Podsumowanie timeline

**Całkowity szacunek: 15-22 dni robocze (3-4.5 tygodnia)**

**Priorytetyzacja dla MVP:**
- **Must have (Fazy 1-5):** Core functionality - 10-13 dni
- **Should have (Fazy 6-7):** Integration & UX - 3-4 dni
- **Nice to have (Fazy 8-10):** Testing, optimization, docs - 2-5 dni

**Quick wins (jeśli czas jest ograniczony):**
1. Uprość SessionSummary (tylko podstawowe statystyki, bez wykresów)
2. Pomiń offline support (localStorage) w MVP
3. Użyj prostego algorytmu SRS zamiast ts-fsrs
4. Zredukuj ilość animacji
5. Pomiń auto-retry logic (tylko podstawowy error handling)

