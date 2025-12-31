import type { FlashcardProposalDto, FlashcardSource, FlashcardDto } from '../types';

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
