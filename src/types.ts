import type { Database } from './db/database.types';

// Extract row and insert types for convenience
type GenerationRow = Database['public']['Tables']['generations']['Row'];
type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
type GenerationErrorRow = Database['public']['Tables']['generation_error_logs']['Row'];

/**
 * Request payload to create a new flashcard generation.
 */
export interface CreateGenerationRequestDto {
  source_text: string;
}

/**
 * Common pagination parameters for list endpoints.
 */
export interface PaginationParamsDto {
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing generation requests.
 * filter_status corresponds to filter[status]
 * sort_created_at corresponds to sort[created_at]
 */
export type ListGenerationsRequestDto = PaginationParamsDto & {
  filter_status?: GenerationStatus;
  sort_created_at?: 'asc' | 'desc';
};

/**
 * Query parameters for listing flashcards.
 * filter_source corresponds to filter[source]
 * sort_created_at corresponds to sort[created_at]
 */
export type ListFlashcardsRequestDto = PaginationParamsDto & {
  filter_source?: FlashcardSource;
  sort_created_at?: 'asc' | 'desc';
};

/**
 * Query parameters for listing flashcards of a specific generation.
 */
export type ListGenerationFlashcardsRequestDto = PaginationParamsDto;

/**
 * A proposed flashcard returned from AI generation.
 */
export interface FlashcardProposalDto {
  id: string;
  front: string;
  back: string;
  source: FlashcardSource;
}

/**
 * Response payload after creating a generation request.
 */
export interface CreateGenerationResponseDto {
  id: string;
  model: string;
  status: GenerationStatus;
  generated_count: number;
  generation_duration: number; // Duration in milliseconds
  flashcards_proposals: FlashcardProposalDto[];
}

export type GenerationStatus = 'pending' | 'completed' | 'failed';

/**
 * A summary item in the list of generations.
 */
export interface GenerationListItemDto {
  id: string;
  model: string;
  status: GenerationStatus;
  generated_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  source_text_length: number;
  created_at: string;
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List of generation summaries.
 */
export type ListGenerationsResponseDto = PaginatedResponse<GenerationListItemDto>;

/**
 * Detailed generation metadata.
 */
export type GetGenerationResponseDto = Pick<
  GenerationRow,
  'id' | 'status' | 'generated_count' | 'accepted_unedited_count' | 'accepted_edited_count' | 'source_text_length'
>;

/**
 * Query parameters for listing flashcards of a specific generation.
 */
export type ListGenerationFlashcardsResponseDto = PaginatedResponse<FlashcardProposalDto>;

/**
 * Command to accept or reject all proposals in a generation.
 */
export interface BulkFlashcardActionRequestDto {
  action: 'accept_all' | 'reject_all';
}

/**
 * Result of a bulk accept/reject operation.
 */
export interface BulkFlashcardActionResponseDto {
  accepted: number;
  rejected: number;
}

/**
 * Error log entry for a failed generation.
 */
export type GenerationErrorDto = Pick<GenerationErrorRow, 'id' | 'error_message'>;

/**
 * List of errors for a failed generation.
 */
export type ListGenerationErrorsResponseDto = GenerationErrorDto[];

/**
 * Full flashcard object as stored in the database.
 */
export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;

/**
 * List all flashcards for a user.
 */
export type ListFlashcardsResponseDto = PaginatedResponse<FlashcardDto>;

/**
 * Payload for creating a single flashcard.
 */
export interface CreateFlashcardRequestDto {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id?: string;
}

/**
 * Payload to create one or more flashcards.
 * Uses CreateFlashcardRequest for each item in the list.
 */
export interface CreateFlashcardsRequestDto {
  flashcards: CreateFlashcardRequestDto[];
}

/**
 * Response after creating flashcards.
 */
export type CreateFlashcardsResponseDto = FlashcardDto[];

/**
 * Retrieve a single flashcard.
 */
export type GetFlashcardResponseDto = FlashcardDto;

/**
 * Payload to update an existing flashcard.
 */
export type UpdateFlashcardRequestDto = Pick<FlashcardInsert, 'front' | 'back' | 'source' | 'generation_id'>;

/**
 * Response after updating a flashcard.
 */
export type UpdateFlashcardResponseDto = FlashcardDto;

/**
 * Response after deleting a flashcard (204 No Content).
 */
export type DeleteFlashcardResponseDto = void;

/**
 * Generation metrics for user dashboard.
 * Keys: total requests, accepted generations, edited generations, rejected generations.
 */
export interface GenerationStatsResponseDto {
  total: number;
  accepted: number;
  edited: number;
  rejected: number;
}

/**
 * Flashcard acceptance/edit statistics.
 */
export interface FlashcardStatsResponseDto {
  total: number;
  accepted: number;
  edited: number;
  rejected: number;
}

/**
 * Possible flashcard sources.
 */
export type FlashcardSource = 'manual' | 'ai_full' | 'ai_edited';

// ============================================================================
// SRS (Spaced Repetition System) Types
// ============================================================================

/**
 * Possible states of a flashcard in the SRS system
 */
export type SRSCardState = 'new' | 'learning' | 'review' | 'relearning';

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
  /** Data ostatniej powtórki (opcjonalna) */
  last_reviewed_at?: string;
}

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

// ============================================================================
// Session Types
// ============================================================================

/**
 * Status sesji
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned';

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
  flashcards?: FlashcardWithSRSDto[];
}

/**
 * Request body dla zakończenia sesji
 */
export interface CompleteSessionRequestDto {
  results: SessionCardResultDto[];
  stats: SessionStatsDto;
}

/**
 * Response po zakończeniu sesji
 */
export interface CompleteSessionResponseDto {
  success: boolean;
  session: SessionDto;
}