import type {
  FlashcardProposalDto,
  FlashcardSource,
  FlashcardDto,
  FlashcardWithSRSDto,
  SessionStatus,
  SessionCardResultDto,
  SessionStatsDto,
} from '../types';

/**
 * Extended flashcard proposal with UI state for the generations view
 */
export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  isSelected: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  editedFront?: string;
  editedBack?: string;
}

/**
 * Stan filtrów widoku fiszek
 */
export interface FlashcardFilters {
  source?: FlashcardSource; // undefined = wszystkie
  sortBy: 'created_at';
  sortOrder: 'asc' | 'desc';
}

/**
 * Stan paginacji
 */
export interface PaginationState {
  currentPage: number; // Aktualna strona (1-indexed)
  limit: number; // Liczba elementów na stronę (domyślnie 20)
  offset: number; // Offset dla API (0-indexed)
  total: number; // Całkowita liczba elementów
  totalPages: number; // Całkowita liczba stron
}

/**
 * Dane formularza fiszki (używane w FlashcardFormModal)
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Błędy walidacji formularza fiszki
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

/**
 * Stan modali w widoku
 */
export interface ModalState {
  type: 'create' | 'edit' | 'delete' | null;
  flashcard?: FlashcardDto; // Dla edit i delete
}

/**
 * Opcje źródła dla selecta
 */
export interface SourceFilterOption {
  value: FlashcardSource | 'all';
  label: string;
}

/**
 * Opcje sortowania dla selecta
 */
export interface SortOption {
  field: 'created_at';
  order: 'asc' | 'desc';
  label: string;
}

/**
 * Struktura błędu z API
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
}

/**
 * Typy kodów błędów
 */
export type ApiErrorCode =
  | 'ValidationError'
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'ConflictError'
  | 'ServiceUnavailable'
  | 'InternalServerError'
  | 'RequestTimeout';

/**
 * Funkcje pomocnicze dla typów
 */
export function getDefaultFilters(): FlashcardFilters {
  return {
    source: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  };
}

export function getInitialPagination(): PaginationState {
  return {
    currentPage: 1,
    limit: 20,
    offset: 0,
    total: 0,
    totalPages: 0,
  };
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

// ============================================================================
// SRS Session ViewModels
// ============================================================================

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

/**
 * Pending SRS update dla offline support
 */
export interface PendingSRSUpdate {
  flashcardId: string;
  rating: 'easy' | 'medium' | 'hard';
  reviewDuration: number;
  timestamp: string;
}

/**
 * Funkcje pomocnicze dla sesji
 */
export function getInitialSessionState(): SessionState {
  return {
    session: null,
    isLoading: true,
    isSavingRating: false,
    error: null,
    showSummary: false,
  };
}

export function calculateSessionStats(
  completedResults: SessionCardResultDto[],
  startedAt: string,
  completedAt: string
): SessionStatsDto {
  const easyCount = completedResults.filter((r) => r.rating === 'easy').length;
  const mediumCount = completedResults.filter((r) => r.rating === 'medium').length;
  const hardCount = completedResults.filter((r) => r.rating === 'hard').length;

  const duration = Math.floor(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );

  return {
    total_cards: completedResults.length,
    easy_count: easyCount,
    medium_count: mediumCount,
    hard_count: hardCount,
    duration,
    started_at: startedAt,
    completed_at: completedAt,
  };
}
