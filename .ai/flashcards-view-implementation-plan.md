# Plan implementacji widoku „Moje fiszki"

## 1. Przegląd

Widok „Moje fiszki" (`/flashcards`) jest głównym interfejsem do zarządzania fiszkami użytkownika w aplikacji 10xCards. Umożliwia przeglądanie wszystkich fiszek (zarówno utworzonych ręcznie, jak i wygenerowanych przez AI), tworzenie nowych fiszek manualnych, edycję istniejących oraz ich usuwanie. Widok oferuje funkcje filtrowania według źródła (manual, ai_full, ai_edited) oraz sortowania według daty utworzenia.

Główne cele widoku:
- Wyświetlanie listy fiszek w przejrzystej formie (siatka/tabela)
- Umożliwienie szybkiego tworzenia nowych fiszek poprzez modal
- Intuicyjna edycja i usuwanie fiszek z potwierdzeniem
- Filtrowanie i sortowanie dla lepszej organizacji
- Pełna dostępność (A11y) zgodnie z najlepszymi praktykami

## 2. Routing widoku

**Ścieżka:** `/flashcards`

**Dostęp:** Wymagane uwierzytelnienie - użytkownik musi być zalogowany. Middleware Astro powinno sprawdzać `locals.user` i przekierowywać niezalogowanych użytkowników na stronę logowania.

**Struktura plików:**
```
src/pages/flashcards.astro         # Główna strona widoku
src/components/FlashcardListView.tsx   # Główny kontener React
src/components/FlashcardList.tsx       # Lista fiszek
src/components/FlashcardItem.tsx       # Pojedyncza fiszka
src/components/FlashcardFormModal.tsx  # Modal do tworzenia/edycji
src/components/DeleteConfirmationModal.tsx  # Modal potwierdzenia usunięcia
src/components/FilterBar.tsx           # Pasek filtrowania i sortowania
```

## 3. Struktura komponentów

```
flashcards.astro (Astro Layout)
└── FlashcardListView (React "client:load")
    ├── div.page-header
    │   ├── h1 "Moje fiszki"
    │   └── Button "Nowa fiszka" (onClick: openCreateModal)
    │
    ├── FilterBar (React)
    │   ├── Select (Source filter)
    │   └── Select (Sort options)
    │
    ├── FlashcardList (React)
    │   ├── LoadingSkeleton (gdy loading=true)
    │   ├── EmptyState (gdy flashcards.length=0)
    │   └── div.flashcard-grid
    │       └── FlashcardItem[] (dla każdej fiszki)
    │           ├── div.flashcard-content
    │           │   ├── p.flashcard-front
    │           │   ├── p.flashcard-back
    │           │   └── span.flashcard-meta (source, date)
    │           └── div.flashcard-actions
    │               ├── Button "Edytuj" (onClick: openEditModal)
    │               └── Button "Usuń" (onClick: openDeleteModal)
    │
    ├── Pagination (React)
    │   ├── Button "Previous"
    │   ├── span "Page X of Y"
    │   └── Button "Next"
    │
    ├── FlashcardFormModal (React, warunkowe renderowanie)
    │   └── Dialog (shadcn/ui)
    │       ├── DialogHeader
    │       │   └── DialogTitle ("Nowa fiszka" lub "Edytuj fiszkę")
    │       ├── Form
    │       │   ├── FormField "Front"
    │       │   │   ├── Label
    │       │   │   ├── Textarea
    │       │   │   ├── CharacterCounter (np. "45/300")
    │       │   │   └── InlineError (validation errors)
    │       │   └── FormField "Back"
    │       │       ├── Label
    │       │       ├── Textarea
    │       │       ├── CharacterCounter (np. "120/500")
    │       │       └── InlineError (validation errors)
    │       └── DialogFooter
    │           ├── Button "Anuluj" (onClick: closeModal)
    │           └── Button "Zapisz" (onClick: handleSubmit, disabled gdy invalid)
    │
    └── DeleteConfirmationModal (React, warunkowe renderowanie)
        └── Dialog (shadcn/ui)
            ├── DialogHeader
            │   └── DialogTitle "Potwierdź usunięcie"
            ├── DialogDescription
            │   └── p "Czy na pewno chcesz usunąć tę fiszkę?"
            │   └── p.flashcard-preview (pokazuje front)
            └── DialogFooter
                ├── Button "Anuluj" (onClick: closeModal)
                └── Button "Usuń" (onClick: handleDelete, variant="destructive")
```

## 4. Szczegóły komponentów

### 4.1 FlashcardListView

**Opis:** Główny kontener React zarządzający całym widokiem fiszek. Odpowiada za pobieranie danych, zarządzanie stanem globalnym widoku, obsługę modali oraz koordynację akcji użytkownika.

**Główne elementy:**
- Nagłówek strony z tytułem i przyciskiem "Nowa fiszka"
- Komponent `FilterBar` do filtrowania i sortowania
- Komponent `FlashcardList` wyświetlający fiszki
- Komponent `Pagination` do nawigacji między stronami
- Warunkowe renderowanie `FlashcardFormModal` (create/edit)
- Warunkowe renderowanie `DeleteConfirmationModal`
- Komponent `Toaster` z biblioteki sonner do notyfikacji

**Obsługiwane interakcje:**
- `handleCreateClick()`: Otwiera modal w trybie tworzenia
- `handleEditClick(flashcard)`: Otwiera modal w trybie edycji z danymi fiszki
- `handleDeleteClick(flashcard)`: Otwiera modal potwierdzenia usunięcia
- `handleFilterChange(filters)`: Aktualizuje filtry i odświeża listę
- `handlePageChange(page)`: Zmienia stronę paginacji
- `handleCreateSave(data)`: Tworzy nową fiszkę przez API
- `handleEditSave(id, data)`: Aktualizuje fiszkę przez API
- `handleDeleteConfirm(id)`: Usuwa fiszkę przez API
- `handleModalClose()`: Zamyka otwarty modal

**Obsługiwana walidacja:**
- Brak bezpośredniej walidacji (delegowana do `FlashcardFormModal`)
- Walidacja odpowiedzi API (sprawdzanie błędów 400, 401, 404, 500)

**Typy:**
- `FlashcardDto` - pojedyncza fiszka
- `ListFlashcardsResponseDto` - odpowiedź z listą fiszek
- `CreateFlashcardsRequestDto` - żądanie utworzenia fiszek
- `UpdateFlashcardRequestDto` - żądanie aktualizacji fiszki
- `FlashcardFilters` (ViewModel) - stan filtrów
- `ModalState` (ViewModel) - stan modali
- `PaginationState` (ViewModel) - stan paginacji

**Propsy:**
- Brak (komponent główny, pobiera dane samodzielnie na podstawie auth z contextu)

---

### 4.2 FilterBar

**Opis:** Komponent odpowiedzialny za UI filtrowania według źródła fiszki oraz sortowania według daty utworzenia. Wyświetla dwa selecty z opcjami.

**Główne elementy:**
- `<div className="filter-bar">` - kontener flexowy
- `<Select>` dla filtra source z opcjami:
  - "Wszystkie"
  - "Ręczne" (manual)
  - "AI - pełne" (ai_full)
  - "AI - edytowane" (ai_edited)
- `<Select>` dla sortowania z opcjami:
  - "Najnowsze" (desc)
  - "Najstarsze" (asc)

**Obsługiwane interakcje:**
- `onFilterChange(filters: FlashcardFilters)`: Wywołuje callback po zmianie filtrów

**Obsługiwana walidacja:**
- Brak (opcje są predefiniowane)

**Typy:**
- `FlashcardFilters` (ViewModel)
- `FlashcardSource` (z types.ts)

**Propsy:**
```typescript
interface FilterBarProps {
  filters: FlashcardFilters;
  onFilterChange: (filters: FlashcardFilters) => void;
}
```

---

### 4.3 FlashcardList

**Opis:** Komponent renderujący listę fiszek w formie siatki. Obsługuje stany ładowania, pustej listy oraz wyświetlanie wielu elementów `FlashcardItem`.

**Główne elementy:**
- `<LoadingSkeleton />` - gdy `loading === true`
- `<EmptyState />` - gdy `!loading && flashcards.length === 0`
  - Ikona pustego stanu
  - Tekst: "Nie masz jeszcze żadnych fiszek"
  - Przycisk "Utwórz pierwszą fiszkę"
- `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` - siatka fiszek
  - `<FlashcardItem />` dla każdej fiszki
- `<div role="list" aria-label="Lista fiszek">` - dla A11y

**Obsługiwane interakcje:**
- `onEdit(flashcard)`: Przekazuje zdarzenie edycji do rodzica
- `onDelete(flashcard)`: Przekazuje zdarzenie usunięcia do rodzica
- `onCreate()`: Przekazuje zdarzenie tworzenia do rodzica (z EmptyState)

**Obsługiwana walidacja:**
- Brak (tylko wyświetlanie)

**Typy:**
- `FlashcardDto[]` - lista fiszek

**Propsy:**
```typescript
interface FlashcardListProps {
  flashcards: FlashcardDto[];
  loading: boolean;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  onCreate: () => void;
}
```

---

### 4.4 FlashcardItem

**Opis:** Komponent reprezentujący pojedynczą fiszkę w siatce. Wyświetla przód, tył, metadane (źródło, data) oraz przyciski akcji (edytuj, usuń).

**Główne elementy:**
- `<Card>` (shadcn/ui) jako kontener
  - `<CardHeader>` - metadane
    - Badge ze źródłem (kolorowane: manual=blue, ai_full=green, ai_edited=yellow)
    - Data utworzenia (formatowana, np. "2 dni temu")
  - `<CardContent>` - treść fiszki
    - `<div className="flashcard-front">` - przód fiszki (max 100 znaków + "...")
    - `<div className="flashcard-back">` - tył fiszki (max 150 znaków + "...")
  - `<CardFooter>` - akcje
    - `<Button variant="ghost" size="sm">` z ikoną ołówka - Edytuj
    - `<Button variant="ghost" size="sm">` z ikoną kosza - Usuń
- `<div role="listitem">` dla A11y

**Obsługiwane interakcje:**
- `onClick` przycisku "Edytuj": wywołuje `onEdit(flashcard)`
- `onClick` przycisku "Usuń": wywołuje `onDelete(flashcard)`

**Obsługiwana walidacja:**
- Brak (tylko wyświetlanie)

**Typy:**
- `FlashcardDto` - pojedyncza fiszka

**Propsy:**
```typescript
interface FlashcardItemProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}
```

---

### 4.5 FlashcardFormModal

**Opis:** Modal do tworzenia nowej fiszki lub edycji istniejącej. Zawiera formularz z dwoma polami tekstowymi (front, back), licznikami znaków oraz walidacją. Wykorzystuje komponent `Dialog` z shadcn/ui, który automatycznie obsługuje focus trap.

**Główne elementy:**
- `<Dialog open={isOpen} onOpenChange={onClose}>` - shadcn/ui dialog
  - `<DialogContent>` - zawartość modala
    - `<DialogHeader>`
      - `<DialogTitle>` - "Nowa fiszka" lub "Edytuj fiszkę"
    - `<form onSubmit={handleSubmit}>`
      - **Pole "Front":**
        - `<Label htmlFor="front">Przód fiszki *</Label>`
        - `<Textarea id="front" value={formData.front} onChange={handleFrontChange} />`
        - `<div className="character-counter">` - np. "45/300"
        - `<InlineError>` - komunikat błędu (jeśli jest)
      - **Pole "Back":**
        - `<Label htmlFor="back">Tył fiszki *</Label>`
        - `<Textarea id="back" value={formData.back} onChange={handleBackChange} />`
        - `<div className="character-counter">` - np. "120/500"
        - `<InlineError>` - komunikat błędu (jeśli jest)
    - `<DialogFooter>`
      - `<Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>`
      - `<Button type="submit" disabled={!isValid || isSubmitting}>Zapisz</Button>`

**Obsługiwane interakcje:**
- `handleFrontChange(e)`: Aktualizuje wartość pola front, sprawdza długość
- `handleBackChange(e)`: Aktualizuje wartość pola back, sprawdza długość
- `handleSubmit(e)`: Waliduje formularz i wywołuje `onSave` z danymi
- `onClose()`: Zamyka modal i resetuje formularz

**Obsługiwana walidacja:**
1. **Pole "front":**
   - Nie może być puste
   - Maksymalnie 300 znaków
   - Walidacja na `onChange` (real-time)
   - Komunikat błędu: "Przód fiszki jest wymagany" lub "Maksymalnie 300 znaków"

2. **Pole "back":**
   - Nie może być puste
   - Maksymalnie 500 znaków
   - Walidacja na `onChange` (real-time)
   - Komunikat błędu: "Tył fiszki jest wymagany" lub "Maksymalnie 500 znaków"

3. **Ogólna walidacja formularza:**
   - Przycisk "Zapisz" disabled gdy:
     - front jest pusty LUB przekracza 300 znaków
     - back jest pusty LUB przekracza 500 znaków
     - `isSubmitting === true` (zapobiega wielokrotnym kliknięciom)

**Typy:**
- `FlashcardFormData` (ViewModel) - dane formularza
- `FlashcardFormErrors` (ViewModel) - błędy walidacji
- `CreateFlashcardRequestDto` - format danych do API (create)
- `UpdateFlashcardRequestDto` - format danych do API (update)

**Propsy:**
```typescript
interface FlashcardFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: FlashcardFormData;  // Tylko dla trybu edit
  onSave: (data: FlashcardFormData) => Promise<void>;
  onClose: () => void;
}
```

---

### 4.6 DeleteConfirmationModal

**Opis:** Modal potwierdzenia usunięcia fiszki. Wyświetla ostrzeżenie i preview fiszki, którą użytkownik zamierza usunąć. Wymaga potwierdzenia akcji.

**Główne elementy:**
- `<Dialog open={isOpen} onOpenChange={onClose}>` - shadcn/ui dialog
  - `<DialogContent>`
    - `<DialogHeader>`
      - `<DialogTitle>Potwierdź usunięcie</DialogTitle>`
    - `<DialogDescription>`
      - `<p>Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna.</p>`
      - `<div className="flashcard-preview">`
        - `<strong>Przód:</strong> {flashcard.front}`
    - `<DialogFooter>`
      - `<Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>`
      - `<Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>`
        - {isDeleting ? "Usuwanie..." : "Usuń"}

**Obsługiwane interakcje:**
- `handleConfirm()`: Wywołuje `onConfirm` z ID fiszki i ustawia `isDeleting = true`
- `onClose()`: Zamyka modal

**Obsługiwana walidacja:**
- Brak (tylko potwierdzenie)

**Typy:**
- `FlashcardDto` - fiszka do usunięcia (tylko do wyświetlenia)

**Propsy:**
```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onConfirm: (id: string) => Promise<void>;
  onClose: () => void;
}
```

---

### 4.7 LoadingSkeleton

**Opis:** Komponent wyświetlający placeholder podczas ładowania danych. Pokazuje "szkielet" layoutu fiszek, aby użytkownik wiedział, że dane są pobierane.

**Główne elementy:**
- Siatka (grid) z 6 placeholderami (Card skeleton)
- Każdy placeholder zawiera:
  - Skeleton dla badge i daty
  - Skeleton dla tekstu front (2-3 linie)
  - Skeleton dla tekstu back (3-4 linie)
  - Skeleton dla przycisków akcji

**Obsługiwane interakcje:**
- Brak (tylko wyświetlanie)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak

**Propsy:**
- Brak (lub opcjonalnie `count: number` dla liczby placeholderów)

---

### 4.8 Pagination

**Opis:** Komponent nawigacji między stronami wyników. Wyświetla aktualną stronę, łączną liczbę stron oraz przyciski Previous/Next.

**Główne elementy:**
- `<div className="pagination">`
  - `<Button onClick={handlePrevious} disabled={currentPage === 1}>Poprzednia</Button>`
  - `<span>Strona {currentPage} z {totalPages}</span>`
  - `<Button onClick={handleNext} disabled={currentPage === totalPages}>Następna</Button>`

**Obsługiwane interakcje:**
- `handlePrevious()`: Zmienia offset o `-limit` i wywołuje `onPageChange`
- `handleNext()`: Zmienia offset o `+limit` i wywołuje `onPageChange`

**Obsługiwana walidacja:**
- Przyciski disabled na krańcach (pierwsza/ostatnia strona)

**Typy:**
- `PaginationState` (ViewModel)

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

```typescript
// Pojedyncza fiszka
export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;

// Odpowiedź z listą fiszek (paginowana)
export type ListFlashcardsResponseDto = PaginatedResponse<FlashcardDto>;

// Żądanie utworzenia pojedynczej fiszki
export interface CreateFlashcardRequestDto {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id?: string;
}

// Żądanie utworzenia wielu fiszek
export interface CreateFlashcardsRequestDto {
  flashcards: CreateFlashcardRequestDto[];
}

// Odpowiedź po utworzeniu fiszek
export type CreateFlashcardsResponseDto = FlashcardDto[];

// Żądanie aktualizacji fiszki
export type UpdateFlashcardRequestDto = Pick<
  FlashcardInsert,
  'front' | 'back' | 'source' | 'generation_id'
>;

// Odpowiedź po aktualizacji
export type UpdateFlashcardResponseDto = FlashcardDto;

// Źródło fiszki
export type FlashcardSource = 'manual' | 'ai_full' | 'ai_edited';

// Paginacja
export interface PaginationParamsDto {
  limit?: number;
  offset?: number;
}

// Parametry listowania fiszek
export type ListFlashcardsRequestDto = PaginationParamsDto & {
  filter_source?: FlashcardSource;
  sort_created_at?: 'asc' | 'desc';
};

// Generyczna odpowiedź paginowana
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
```

### 5.2 Nowe typy ViewModels (do utworzenia w src/types/viewModels.ts)

```typescript
/**
 * Stan filtrów widoku fiszek
 */
export interface FlashcardFilters {
  source?: FlashcardSource;  // undefined = wszystkie
  sortBy: 'created_at';
  sortOrder: 'asc' | 'desc';
}

/**
 * Stan paginacji
 */
export interface PaginationState {
  currentPage: number;    // Aktualna strona (1-indexed)
  limit: number;          // Liczba elementów na stronę (domyślnie 20)
  offset: number;         // Offset dla API (0-indexed)
  total: number;          // Całkowita liczba elementów
  totalPages: number;     // Całkowita liczba stron
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
  flashcard?: FlashcardDto;  // Dla edit i delete
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
```

### 5.3 Typy błędów API (używane w obsłudze błędów)

```typescript
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
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów

**FlashcardListView** (główny komponent):
- `flashcards: FlashcardDto[]` - lista pobranych fiszek
- `loading: boolean` - czy dane są w trakcie ładowania
- `error: string | null` - komunikat błędu globalnego
- `filters: FlashcardFilters` - aktywne filtry
- `pagination: PaginationState` - stan paginacji
- `modalState: ModalState` - stan modali

**FlashcardFormModal**:
- `formData: FlashcardFormData` - wartości pól formularza
- `errors: FlashcardFormErrors` - błędy walidacji
- `isSubmitting: boolean` - czy formularz jest w trakcie wysyłania

**DeleteConfirmationModal**:
- `isDeleting: boolean` - czy usuwanie jest w trakcie

### 6.2 Custom hooki

#### useFlashcards

Hook zarządzający pobieraniem i cache'owaniem listy fiszek.

```typescript
interface UseFlashcardsParams {
  filters: FlashcardFilters;
  pagination: PaginationState;
}

interface UseFlashcardsReturn {
  flashcards: FlashcardDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useFlashcards(params: UseFlashcardsParams): UseFlashcardsReturn
```

**Działanie:**
1. Przy montowaniu lub zmianie `filters`/`pagination` wykonuje GET request do `/api/flashcards`
2. Buduje query params z filters i pagination
3. Parsuje odpowiedź i aktualizuje stan
4. Obsługuje błędy i ustawia `error` state
5. Zwraca funkcję `refetch()` do ręcznego odświeżania

#### useFlashcardMutations

Hook zarządzający operacjami CRUD na fiszkach (create, update, delete).

```typescript
interface UseFlashcardMutationsReturn {
  createFlashcard: (data: FlashcardFormData) => Promise<FlashcardDto>;
  updateFlashcard: (id: string, data: FlashcardFormData) => Promise<FlashcardDto>;
  deleteFlashcard: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function useFlashcardMutations(): UseFlashcardMutationsReturn
```

**Działanie:**
1. **createFlashcard:**
   - Przygotowuje payload `CreateFlashcardsRequestDto` z source="manual"
   - Wysyła POST do `/api/flashcards`
   - Zwraca utworzoną fiszkę lub rzuca błąd

2. **updateFlashcard:**
   - Przygotowuje payload `UpdateFlashcardRequestDto`
   - Wysyła PUT do `/api/flashcards/{id}`
   - Zwraca zaktualizowaną fiszkę lub rzuca błąd

3. **deleteFlashcard:**
   - Wysyła DELETE do `/api/flashcards/{id}`
   - Obsługuje 204 No Content
   - Rzuca błąd w przypadku problemów

4. Wszystkie mutacje obsługują błędy API i parsują `ApiErrorResponse`

#### useFlashcardModal

Hook zarządzający stanem modali (otwieranie, zamykanie, przekazywanie danych).

```typescript
interface UseFlashcardModalReturn {
  modalState: ModalState;
  openCreateModal: () => void;
  openEditModal: (flashcard: FlashcardDto) => void;
  openDeleteModal: (flashcard: FlashcardDto) => void;
  closeModal: () => void;
}

function useFlashcardModal(): UseFlashcardModalReturn
```

**Działanie:**
1. Zarządza stanem `modalState`
2. Funkcje pomocnicze do otwierania każdego typu modala
3. `closeModal()` resetuje stan do `{ type: null }`

### 6.3 Przepływ danych

```
User Action → Component Event → Hook Function → API Call → State Update → UI Re-render
```

**Przykład: Tworzenie fiszki**

1. User klika "Nowa fiszka" → `openCreateModal()`
2. Modal się otwiera z pustym formularzem
3. User wypełnia pola → aktualizacja lokalnego `formData`
4. User klika "Zapisz" → `handleSubmit()`
5. Walidacja formularza (client-side)
6. Wywołanie `createFlashcard(formData)` z hooka
7. POST request do `/api/flashcards`
8. Odpowiedź 201 z nową fiszką
9. Modal się zamyka → `closeModal()`
10. Lista się odświeża → `refetch()`
11. Toast z sukcesem → `toast.success("Fiszka została utworzona")`

## 7. Integracja API

### 7.1 GET /api/flashcards - Listowanie fiszek

**Endpoint:** `GET /api/flashcards`

**Kiedy wywoływane:**
- Przy montowaniu komponentu `FlashcardListView`
- Po zmianie filtrów (source, sortowanie)
- Po zmianie strony (paginacja)
- Po utworzeniu, edycji lub usunięciu fiszki (odświeżenie)

**Query Parameters:**
```typescript
{
  limit: number;              // np. 20 (domyślnie)
  offset: number;             // np. 0, 20, 40...
  'filter[source]'?: string;  // 'manual' | 'ai_full' | 'ai_edited'
  'sort[created_at]'?: string; // 'asc' | 'desc'
}
```

**Request Type:** Brak body (GET request)

**Response Type:** `ListFlashcardsResponseDto`
```typescript
{
  items: FlashcardDto[];  // Lista fiszek
  total: number;          // Całkowita liczba fiszek (dla paginacji)
  limit: number;          // Echo z requestu
  offset: number;         // Echo z requestu
}
```

**Przykład wywołania:**
```typescript
const params = new URLSearchParams({
  limit: '20',
  offset: '0',
  'filter[source]': 'manual',
  'sort[created_at]': 'desc'
});

const response = await fetch(`/api/flashcards?${params}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Dla cookies z sesją
});

if (!response.ok) {
  throw new Error('Failed to fetch flashcards');
}

const data: ListFlashcardsResponseDto = await response.json();
```

**Obsługa błędów:**
- `401 Unauthorized`: Przekierowanie na `/auth/login`
- `500 Internal Server Error`: Toast z błędem i przycisk "Spróbuj ponownie"

---

### 7.2 POST /api/flashcards - Tworzenie fiszki

**Endpoint:** `POST /api/flashcards`

**Kiedy wywoływane:**
- Po zatwierdzeniu formularza w `FlashcardFormModal` w trybie `create`

**Request Body Type:** `CreateFlashcardsRequestDto`
```typescript
{
  flashcards: [
    {
      front: string;           // Wartość z formularza (max 300 chars)
      back: string;            // Wartość z formularza (max 500 chars)
      source: 'manual';        // Zawsze 'manual' dla ręcznego tworzenia
      generation_id: undefined // Zawsze undefined dla manual
    }
  ]
}
```

**Response Type:** `CreateFlashcardsResponseDto` (tablica utworzonych fiszek)
```typescript
[
  {
    id: string;
    user_id: string;
    generation_id: null;
    front: string;
    back: string;
    source: 'manual';
    created_at: string;
    updated_at: string;
  }
]
```

**Przykład wywołania:**
```typescript
const response = await fetch('/api/flashcards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    flashcards: [
      {
        front: formData.front,
        back: formData.back,
        source: 'manual',
      }
    ]
  }),
});

if (!response.ok) {
  const error: ApiErrorResponse = await response.json();
  throw new Error(error.message);
}

const created: CreateFlashcardsResponseDto = await response.json();
const newFlashcard = created[0]; // Pierwsza (i jedyna) utworzona fiszka
```

**Obsługa błędów:**
- `400 ValidationError`: Wyświetlenie błędów walidacji w formularzu
- `401 Unauthorized`: Przekierowanie na login
- `500 InternalServerError`: Toast z błędem

---

### 7.3 PUT /api/flashcards/{cardId} - Aktualizacja fiszki

**Endpoint:** `PUT /api/flashcards/{cardId}`

**Kiedy wywoływane:**
- Po zatwierdzeniu formularza w `FlashcardFormModal` w trybie `edit`

**Request Body Type:** `UpdateFlashcardRequestDto`
```typescript
{
  front: string;           // Nowa wartość (max 300 chars)
  back: string;            // Nowa wartość (max 500 chars)
  source: FlashcardSource; // 'manual', 'ai_full', lub 'ai_edited'
  generation_id?: string;  // Opcjonalne, kopiowane z oryginalnej fiszki
}
```

**Response Type:** `UpdateFlashcardResponseDto`
```typescript
{
  id: string;
  user_id: string;
  generation_id: string | null;
  front: string;
  back: string;
  source: FlashcardSource;
  created_at: string;
  updated_at: string;
}
```

**Przykład wywołania:**
```typescript
const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    front: formData.front,
    back: formData.back,
    source: originalFlashcard.source, // Zachowujemy oryginalne źródło
    generation_id: originalFlashcard.generation_id,
  }),
});

if (!response.ok) {
  const error: ApiErrorResponse = await response.json();
  throw new Error(error.message);
}

const updated: UpdateFlashcardResponseDto = await response.json();
```

**Obsługa błędów:**
- `400 ValidationError`: Wyświetlenie błędów w formularzu
- `401 Unauthorized`: Przekierowanie na login
- `403 Forbidden`: Toast "Nie masz uprawnień do edycji tej fiszki"
- `404 Not Found`: Toast "Fiszka nie istnieje" + odświeżenie listy
- `500 InternalServerError`: Toast z błędem

---

### 7.4 DELETE /api/flashcards/{cardId} - Usuwanie fiszki

**Endpoint:** `DELETE /api/flashcards/{cardId}`

**Kiedy wywoływane:**
- Po potwierdzeniu w `DeleteConfirmationModal`

**Request Body:** Brak

**Response:** `204 No Content` (brak body)

**Przykład wywołania:**
```typescript
const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: 'DELETE',
  credentials: 'include',
});

if (!response.ok) {
  if (response.status === 404) {
    // Fiszka już nie istnieje, ale to nie jest błąd dla usera
    return;
  }
  
  const error: ApiErrorResponse = await response.json();
  throw new Error(error.message);
}

// Sukces - 204 No Content
```

**Obsługa błędów:**
- `401 Unauthorized`: Przekierowanie na login
- `403 Forbidden`: Toast "Nie masz uprawnień do usunięcia tej fiszki"
- `404 Not Found`: Ignorujemy (fiszka już nie istnieje) + odświeżenie listy
- `500 InternalServerError`: Toast z błędem

## 8. Interakcje użytkownika

### 8.1 Ładowanie strony

**Akcja:** Użytkownik przechodzi na `/flashcards`

**Przepływ:**
1. Middleware Astro sprawdza `locals.user`
2. Jeśli niezalogowany → redirect na `/auth/login`
3. Jeśli zalogowany → renderuje `flashcards.astro`
4. Komponent `FlashcardListView` montuje się
5. Hook `useFlashcards` wykonuje GET `/api/flashcards?limit=20&offset=0&sort[created_at]=desc`
6. Podczas ładowania: wyświetla `<LoadingSkeleton />`
7. Po załadowaniu: wyświetla listę fiszek lub `<EmptyState />` jeśli brak danych

**Oczekiwany wynik:**
- Użytkownik widzi nagłówek "Moje fiszki"
- Przycisk "Nowa fiszka" w prawym górnym rogu
- Pasek filtrów (domyślnie: wszystkie źródła, sortowanie malejące)
- Lista fiszek w siatce (jeśli są) lub komunikat o pustej liście
- Paginacja na dole (jeśli > 20 fiszek)

---

### 8.2 Tworzenie nowej fiszki

**Akcja:** Użytkownik klika "Nowa fiszka"

**Przepływ:**
1. `openCreateModal()` → ustawia `modalState = { type: 'create' }`
2. `FlashcardFormModal` renderuje się z pustym formularzem
3. Focus automatycznie przenosi się na pole "Front" (A11y)
4. Użytkownik wpisuje tekst w polu "Front":
   - Real-time licznik znaków: "45/300"
   - Jeśli > 300: pole ma czerwoną obwódkę + błąd "Maksymalnie 300 znaków"
5. Użytkownik wpisuje tekst w polu "Back":
   - Real-time licznik znaków: "120/500"
   - Jeśli > 500: pole ma czerwoną obwódkę + błąd "Maksymalnie 500 znaków"
6. Walidacja przy próbie zapisania:
   - Jeśli front pusty → błąd "Przód fiszki jest wymagany"
   - Jeśli back pusty → błąd "Tył fiszki jest wymagany"
7. Użytkownik klika "Zapisz":
   - Przycisk zmienia się na "Zapisywanie..." (disabled)
   - POST `/api/flashcards` z danymi
   - Sukces → modal się zamyka
   - Lista odświeża się → nowa fiszka pojawia się na początku (sort desc)
   - Toast: "Fiszka została utworzona"
8. Alternatywnie, użytkownik klika "Anuluj":
   - Modal się zamyka bez zapisywania
   - Formularz resetuje się

**Oczekiwany wynik:**
- Nowa fiszka widoczna na liście
- Toast z potwierdzeniem
- Modal zamknięty

---

### 8.3 Edycja istniejącej fiszki

**Akcja:** Użytkownik klika ikonę "Edytuj" przy fiszce

**Przepływ:**
1. `openEditModal(flashcard)` → ustawia `modalState = { type: 'edit', flashcard }`
2. `FlashcardFormModal` renderuje się z wypełnionym formularzem:
   - Pole "Front" zawiera aktualną wartość `flashcard.front`
   - Pole "Back" zawiera aktualną wartość `flashcard.back`
   - Tytuł modala: "Edytuj fiszkę"
3. Użytkownik modyfikuje tekst:
   - Walidacja działa tak samo jak przy tworzeniu
   - Liczniki znaków aktualizują się
4. Użytkownik klika "Zapisz":
   - Przycisk zmienia się na "Zapisywanie..." (disabled)
   - PUT `/api/flashcards/{id}` z nowymi danymi
   - Sukces → modal się zamyka
   - Fiszka w liście aktualizuje się (bez pełnego refetch)
   - Toast: "Fiszka została zaktualizowana"
5. Alternatywnie, użytkownik klika "Anuluj":
   - Modal się zamyka bez zapisywania zmian
   - Fiszka pozostaje niezmieniona

**Oczekiwany wynik:**
- Zaktualizowana fiszka widoczna na liście
- Toast z potwierdzeniem
- Modal zamknięty

---

### 8.4 Usuwanie fiszki

**Akcja:** Użytkownik klika ikonę "Usuń" przy fiszce

**Przepływ:**
1. `openDeleteModal(flashcard)` → ustawia `modalState = { type: 'delete', flashcard }`
2. `DeleteConfirmationModal` renderuje się:
   - Tytuł: "Potwierdź usunięcie"
   - Opis: "Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna."
   - Preview: Pokazuje przód fiszki
   - Przyciski: "Anuluj" i "Usuń" (czerwony)
3. Użytkownik klika "Usuń":
   - Przycisk zmienia się na "Usuwanie..." (disabled)
   - DELETE `/api/flashcards/{id}`
   - Sukces → modal się zamyka
   - Fiszka znika z listy (optymistic update lub refetch)
   - Toast: "Fiszka została usunięta"
4. Alternatywnie, użytkownik klika "Anuluj":
   - Modal się zamyka bez usuwania
   - Fiszka pozostaje na liście

**Oczekiwany wynik:**
- Fiszka usunięta z listy
- Toast z potwierdzeniem
- Modal zamknięty

---

### 8.5 Filtrowanie fiszek

**Akcja:** Użytkownik zmienia filtr źródła w `FilterBar`

**Przepływ:**
1. Użytkownik wybiera z selecta np. "Ręczne" (manual)
2. `handleFilterChange()` aktualizuje `filters.source = 'manual'`
3. Hook `useFlashcards` wykrywa zmianę i wykonuje nowy request:
   - GET `/api/flashcards?limit=20&offset=0&filter[source]=manual&sort[created_at]=desc`
4. Lista pokazuje `<LoadingSkeleton />` podczas ładowania
5. Po załadowaniu: wyświetla tylko fiszki z source='manual'
6. Paginacja resetuje się do strony 1

**Oczekiwany wynik:**
- Lista zawiera tylko fiszki wybranego typu
- Paginacja zaktualizowana do nowej liczby wyników

---

### 8.6 Sortowanie fiszek

**Akcja:** Użytkownik zmienia sortowanie w `FilterBar`

**Przepływ:**
1. Użytkownik wybiera z selecta "Najstarsze" (asc)
2. `handleFilterChange()` aktualizuje `filters.sortOrder = 'asc'`
3. Hook `useFlashcards` wykonuje nowy request:
   - GET `/api/flashcards?limit=20&offset=0&sort[created_at]=asc`
4. Lista pokazuje `<LoadingSkeleton />` podczas ładowania
5. Po załadowaniu: wyświetla fiszki posortowane rosnąco według daty

**Oczekiwany wynik:**
- Lista jest posortowana zgodnie z wyborem użytkownika
- Najstarsze fiszki na początku

---

### 8.7 Paginacja

**Akcja:** Użytkownik klika "Następna" w paginacji

**Przepływ:**
1. `handlePageChange(2)` → aktualizuje `pagination.currentPage = 2` i `pagination.offset = 20`
2. Hook `useFlashcards` wykonuje nowy request:
   - GET `/api/flashcards?limit=20&offset=20&sort[created_at]=desc`
3. Lista pokazuje `<LoadingSkeleton />` podczas ładowania
4. Po załadowaniu: wyświetla fiszki 21-40
5. Przyciski paginacji aktualizują się:
   - "Poprzednia" aktywny
   - "Następna" aktywny lub disabled (jeśli ostatnia strona)

**Oczekiwany wynik:**
- Użytkownik widzi kolejne 20 fiszek
- Numer strony zaktualizowany: "Strona 2 z X"

---

### 8.8 Stan pusty (brak fiszek)

**Akcja:** Użytkownik ma pustą listę fiszek

**Przepływ:**
1. GET `/api/flashcards` zwraca `{ items: [], total: 0, limit: 20, offset: 0 }`
2. `FlashcardList` renderuje `<EmptyState />`
3. EmptyState zawiera:
   - Ikonę (np. pustą kartę lub folder)
   - Tekst: "Nie masz jeszcze żadnych fiszek"
   - Podpis: "Zacznij tworzyć fiszki ręcznie lub wygeneruj je za pomocą AI"
   - Przycisk "Utwórz pierwszą fiszkę" → wywołuje `openCreateModal()`

**Oczekiwany wynik:**
- Przyjazny komunikat motywujący do utworzenia pierwszej fiszki
- Bezpośredni przycisk do akcji

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie klienta (FlashcardFormModal)

#### Pole "Front"

**Warunki:**
1. **Nie może być puste**
   - Sprawdzane przy: blur, submit
   - Komunikat błędu: "Przód fiszki jest wymagany"
   - Wpływ na UI: InlineError pod polem, czerwona obwódka inputa

2. **Maksymalnie 300 znaków**
   - Sprawdzane przy: onChange (real-time)
   - Licznik znaków: "{current}/300"
   - Kolor licznika:
     - Zielony: 0-270 znaków
     - Pomarańczowy: 271-300 znaków
     - Czerwony: > 300 znaków
   - Komunikat błędu (jeśli > 300): "Maksymalnie 300 znaków"
   - Wpływ na UI: Czerwona obwódka, przycisk "Zapisz" disabled

#### Pole "Back"

**Warunki:**
1. **Nie może być puste**
   - Sprawdzane przy: blur, submit
   - Komunikat błędu: "Tył fiszki jest wymagany"
   - Wpływ na UI: InlineError pod polem, czerwona obwódka inputa

2. **Maksymalnie 500 znaków**
   - Sprawdzane przy: onChange (real-time)
   - Licznik znaków: "{current}/500"
   - Kolor licznika:
     - Zielony: 0-450 znaków
     - Pomarańczowy: 451-500 znaków
     - Czerwony: > 500 znaków
   - Komunikat błędu (jeśli > 500): "Maksymalnie 500 znaków"
   - Wpływ na UI: Czerwona obwódka, przycisk "Zapisz" disabled

#### Walidacja całego formularza

**Przycisk "Zapisz" jest disabled gdy:**
- `formData.front.trim() === ''` ALBO `formData.front.length > 300`
- ALBO `formData.back.trim() === ''` ALBO `formData.back.length > 500`
- ALBO `isSubmitting === true`

**Funkcja walidacji:**
```typescript
function validateForm(data: FlashcardFormData): FlashcardFormErrors {
  const errors: FlashcardFormErrors = {};
  
  if (!data.front.trim()) {
    errors.front = 'Przód fiszki jest wymagany';
  } else if (data.front.length > 300) {
    errors.front = 'Maksymalnie 300 znaków';
  }
  
  if (!data.back.trim()) {
    errors.back = 'Tył fiszki jest wymagany';
  } else if (data.back.length > 500) {
    errors.back = 'Maksymalnie 500 znaków';
  }
  
  return errors;
}

function isFormValid(errors: FlashcardFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
```

### 9.2 Walidacja po stronie serwera (API)

API wykonuje dodatkową walidację zgodnie z implementacją w `src/lib/schemas/flashcards.ts`:

**Schema walidacyjny (Zod):**
```typescript
const createFlashcardRequestSchema = z.object({
  front: z.string().min(1, 'Front is required').max(300, 'Front max 300 chars'),
  back: z.string().min(1, 'Back is required').max(500, 'Back max 500 chars'),
  source: z.enum(['manual', 'ai_full', 'ai_edited']),
  generation_id: z.string().uuid().optional(),
});
```

**Błędy zwracane przez API:**
- Status 400 z kodem `ValidationError`
- Message zawiera szczegóły: `"Validation failed: front: Front max 300 chars"`

**Obsługa w komponencie:**
```typescript
try {
  await createFlashcard(formData);
} catch (error) {
  if (error.code === 'ValidationError') {
    // Parsuj message i przypisz błędy do odpowiednich pól
    setErrors(parseApiValidationErrors(error.message));
  } else {
    toast.error('Wystąpił błąd. Spróbuj ponownie.');
  }
}
```

### 9.3 Warunki autoryzacji

**Sprawdzane na każdym żądaniu API:**

1. **Użytkownik musi być zalogowany**
   - Sprawdzane przez: middleware Astro (`locals.user`)
   - Błąd: 401 Unauthorized
   - Obsługa: Przekierowanie na `/auth/login`

2. **Użytkownik może edytować tylko swoje fiszki**
   - Sprawdzane przez: API przed UPDATE/DELETE (user_id === flashcard.user_id)
   - Błąd: 403 Forbidden
   - Obsługa: Toast "Nie masz uprawnień do tej operacji" + odświeżenie listy

3. **Użytkownik widzi tylko swoje fiszki**
   - Automatycznie filtrowane przez: API w GET /flashcards (WHERE user_id = $1)
   - Nie ma możliwości zobaczenia fiszek innych użytkowników

### 9.4 Warunki biznesowe

1. **Source "manual" dla ręcznie tworzonych**
   - Zawsze ustawiany automatycznie w komponencie
   - generation_id zawsze undefined dla manual

2. **Source "ai_edited" po edycji AI fiszki**
   - Jeśli edytujemy fiszkę z source='ai_full', po zapisie może pozostać 'ai_full'
   - (Uwaga: PRD nie specyfikuje zmiany na 'ai_edited' przy edycji, wymaga clarification)

3. **Nie można usunąć generation_id z AI fiszki**
   - generation_id jest kopiowane przy edycji (nie można go zmienić)

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem, timeout

**Objawy:**
- Request nie dostaje odpowiedzi
- Fetch rzuca błąd `TypeError: Failed to fetch`

**Obsługa:**
```typescript
try {
  const response = await fetch('/api/flashcards');
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie.');
    setError('network_error');
  }
}
```

**Akcje użytkownika:**
- Toast z komunikatem błędu
- Przycisk "Spróbuj ponownie" w UI (wywołuje `refetch()`)

---

### 10.2 Błędy uwierzytelniania (401)

**Scenariusz:** Token wygasł lub jest nieprawidłowy

**Objawy:**
- API zwraca 401 Unauthorized
- Body: `{ "code": "Unauthorized", "message": "Authentication required" }`

**Obsługa:**
```typescript
if (response.status === 401) {
  // Przekierowanie na login
  window.location.href = '/auth/login?redirect=/flashcards';
}
```

**Akcje użytkownika:**
- Automatyczne przekierowanie na stronę logowania
- Po zalogowaniu: powrót na `/flashcards`

---

### 10.3 Błędy walidacji (400)

**Scenariusz:** Dane nie przechodzą walidacji API (client-side validation pominięta lub nieaktualna)

**Objawy:**
- API zwraca 400 Bad Request
- Body: `{ "code": "ValidationError", "message": "Validation failed: front: Front max 300 chars" }`

**Obsługa:**
```typescript
if (response.status === 400) {
  const error: ApiErrorResponse = await response.json();
  
  if (error.code === 'ValidationError') {
    // Parsuj message i przypisz błędy do pól
    const fieldErrors = parseValidationMessage(error.message);
    setErrors(fieldErrors);
  } else {
    toast.error(error.message || 'Nieprawidłowe dane formularza');
  }
}
```

**Akcje użytkownika:**
- InlineError pod odpowiednimi polami formularza
- Modal pozostaje otwarty
- Użytkownik poprawia dane i ponawia submit

---

### 10.4 Błędy uprawnień (403)

**Scenariusz:** Użytkownik próbuje edytować/usunąć fiszkę innego użytkownika

**Objawy:**
- API zwraca 403 Forbidden
- Body: `{ "code": "Forbidden", "message": "Access denied" }`

**Obsługa:**
```typescript
if (response.status === 403) {
  toast.error('Nie masz uprawnień do wykonania tej operacji');
  closeModal();
  refetch(); // Odśwież listę na wszelki wypadek
}
```

**Akcje użytkownika:**
- Toast z komunikatem
- Modal zamyka się automatycznie
- Lista odświeża się

---

### 10.5 Błędy "nie znaleziono" (404)

**Scenariusz:** Fiszka została usunięta przez inną sesję lub nie istnieje

**Objawy:**
- API zwraca 404 Not Found
- Body: `{ "code": "NotFound", "message": "Flashcard not found" }`

**Obsługa:**
```typescript
if (response.status === 404) {
  toast.warning('Fiszka nie istnieje lub została już usunięta');
  closeModal();
  refetch(); // Odśwież listę
}
```

**Akcje użytkownika:**
- Toast z informacją
- Modal zamyka się
- Lista odświeża się (fiszka zniknie z widoku)

---

### 10.6 Błędy serwera (500)

**Scenariusz:** Błąd bazy danych, błąd wewnętrzny serwera

**Objawy:**
- API zwraca 500 Internal Server Error
- Body: `{ "code": "InternalServerError", "message": "An unexpected error occurred" }`

**Obsługa:**
```typescript
if (response.status === 500) {
  const error: ApiErrorResponse = await response.json();
  toast.error('Wystąpił błąd serwera. Spróbuj ponownie za chwilę.');
  console.error('Server error:', error);
}
```

**Akcje użytkownika:**
- Toast z komunikatem
- Modal pozostaje otwarty (użytkownik może spróbować ponownie)
- Opcjonalnie: przycisk "Spróbuj ponownie" w toaście

---

### 10.7 Stan pusty (empty state)

**Scenariusz:** Użytkownik nie ma jeszcze żadnych fiszek

**Objawy:**
- API zwraca `{ items: [], total: 0, limit: 20, offset: 0 }`

**Obsługa:**
```typescript
if (flashcards.length === 0 && !loading) {
  return <EmptyState onCreate={openCreateModal} />;
}
```

**Akcje użytkownika:**
- Przyjazny komunikat
- Przycisk "Utwórz pierwszą fiszkę" → otwiera modal tworzenia

---

### 10.8 Błędy optymistycznych aktualizacji

**Scenariusz:** UI zaktualizowane optymistycznie, ale API zwróciło błąd

**Objawy:**
- Fiszka zniknęła z listy (delete), ale API zwróciło 500
- Fiszka zaktualizowana w UI (edit), ale API zwróciło błąd

**Obsługa:**
```typescript
// Przy usuwaniu
const optimisticDelete = (id: string) => {
  const originalFlashcards = [...flashcards];
  
  // Optymistic update
  setFlashcards(flashcards.filter(f => f.id !== id));
  
  deleteFlashcard(id).catch(error => {
    // Rollback
    setFlashcards(originalFlashcards);
    toast.error('Nie udało się usunąć fiszki');
  });
};
```

**Akcje użytkownika:**
- Toast z informacją o błędzie
- UI wraca do stanu przed akcją (rollback)

---

### 10.9 Błędy parsowania odpowiedzi

**Scenariusz:** API zwróciło niepoprawny JSON lub nieoczekiwany format

**Objawy:**
- `response.json()` rzuca błąd
- Dane nie pasują do typu TypeScript

**Obsługa:**
```typescript
try {
  const data = await response.json();
  
  // Runtime validation (opcjonalnie z Zod)
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid response format');
  }
  
  return data;
} catch (error) {
  console.error('Failed to parse response:', error);
  toast.error('Otrzymano nieprawidłowe dane z serwera');
  throw error;
}
```

**Akcje użytkownika:**
- Toast z komunikatem
- Logi w konsoli dla debugowania

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i ViewModels

**Pliki do utworzenia/modyfikacji:**
- `src/types/viewModels.ts` (nowy plik)

**Zadania:**
1. Utwórz plik `src/types/viewModels.ts`
2. Zdefiniuj wszystkie ViewModels z sekcji 5.2:
   - `FlashcardFilters`
   - `PaginationState`
   - `FlashcardFormData`
   - `FlashcardFormErrors`
   - `ModalState`
   - `SourceFilterOption`
   - `SortOption`
   - `ApiErrorResponse`
3. Dodaj helper functions dla typów:
   - `getDefaultFilters(): FlashcardFilters`
   - `getInitialPagination(): PaginationState`
   - `calculateTotalPages(total: number, limit: number): number`

**Definicja gotowości:** Wszystkie typy są zdefiniowane i eksportowane poprawnie, brak błędów TypeScript.

---

### Krok 2: Implementacja custom hooków

**Pliki do utworzenia:**
- `src/lib/hooks/useFlashcards.ts`
- `src/lib/hooks/useFlashcardMutations.ts`
- `src/lib/hooks/useFlashcardModal.ts`

**Zadania:**

**2.1 useFlashcards:**
1. Zaimportuj typy: `FlashcardDto`, `ListFlashcardsResponseDto`, `FlashcardFilters`, `PaginationState`
2. Utwórz hook przyjmujący parametry: `filters` i `pagination`
3. Użyj `useState` dla: `flashcards`, `loading`, `error`
4. Użyj `useEffect` do pobierania danych gdy zmienią się filtry/paginacja
5. Zaimplementuj funkcję `fetchFlashcards()`:
   - Buduj query params z filters i pagination
   - Wykonaj fetch GET `/api/flashcards?...`
   - Parsuj odpowiedź
   - Aktualizuj state
   - Obsłuż błędy (401, 500)
6. Zwróć: `{ flashcards, loading, error, refetch }`

**2.2 useFlashcardMutations:**
1. Zaimportuj typy: `FlashcardFormData`, `CreateFlashcardsRequestDto`, itd.
2. Użyj `useState` dla: `isLoading`, `error`
3. Zaimplementuj `createFlashcard(data)`:
   - Przygotuj payload z source='manual'
   - POST `/api/flashcards`
   - Obsłuż błędy
   - Zwróć utworzoną fiszkę
4. Zaimplementuj `updateFlashcard(id, data)`:
   - PUT `/api/flashcards/{id}`
   - Obsłuż błędy
   - Zwróć zaktualizowaną fiszkę
5. Zaimplementuj `deleteFlashcard(id)`:
   - DELETE `/api/flashcards/{id}`
   - Obsłuż błędy
6. Zwróć wszystkie funkcje i stany

**2.3 useFlashcardModal:**
1. Zaimportuj typ: `ModalState`
2. Użyj `useState` dla: `modalState`
3. Zaimplementuj funkcje:
   - `openCreateModal()` → `setModalState({ type: 'create' })`
   - `openEditModal(flashcard)` → `setModalState({ type: 'edit', flashcard })`
   - `openDeleteModal(flashcard)` → `setModalState({ type: 'delete', flashcard })`
   - `closeModal()` → `setModalState({ type: null })`
4. Zwróć modalState i wszystkie funkcje

**Definicja gotowości:** Wszystkie hooki działają poprawnie, testy jednostkowe przechodzą (opcjonalnie).

---

### Krok 3: Implementacja komponentów UI pomocniczych

**Pliki do utworzenia:**
- `src/components/LoadingSkeleton.tsx`
- `src/components/InlineError.tsx` (jeśli nie istnieje)

**Zadania:**

**3.1 LoadingSkeleton:**
1. Utwórz komponent bez propsów (lub z opcjonalnym `count`)
2. Użyj Tailwind i shadcn/ui `Skeleton`
3. Renderuj siatkę 6 placeholderów Card
4. Każdy placeholder zawiera:
   - Skeleton dla badge i daty (h-4 w-20)
   - Skeleton dla tekstu front (h-6 w-full, 2 linie)
   - Skeleton dla tekstu back (h-4 w-full, 3 linie)
   - Skeleton dla przycisków (h-8 w-16, 2 sztuki)

**3.2 InlineError:**
1. Sprawdź czy `src/components/InlineError.tsx` istnieje
2. Jeśli nie, utwórz komponent przyjmujący props: `{ message?: string }`
3. Renderuj `<p className="text-sm text-red-600 mt-1">{message}</p>` tylko gdy message istnieje
4. Dodaj ikonę błędu (opcjonalnie)

**Definicja gotowości:** Komponenty renderują się poprawnie, stylizacja jest zgodna z designem.

---

### Krok 4: Implementacja FilterBar

**Plik do utworzenia:**
- `src/components/FilterBar.tsx`

**Zadania:**
1. Zaimportuj typy: `FlashcardFilters`, `FlashcardSource`
2. Zdefiniuj interface `FilterBarProps`
3. Przygotuj opcje dla selecta source:
   ```typescript
   const sourceOptions = [
     { value: 'all', label: 'Wszystkie' },
     { value: 'manual', label: 'Ręczne' },
     { value: 'ai_full', label: 'AI - pełne' },
     { value: 'ai_edited', label: 'AI - edytowane' },
   ];
   ```
4. Przygotuj opcje dla selecta sortowania:
   ```typescript
   const sortOptions = [
     { value: 'desc', label: 'Najnowsze' },
     { value: 'asc', label: 'Najstarsze' },
   ];
   ```
5. Użyj shadcn/ui `Select` dla obu filtrów
6. Obsłuż onChange dla każdego selecta → wywołaj `onFilterChange` z nowymi filtrami
7. Stylizuj z Tailwind (flexbox, gap, responsive)

**Definicja gotowości:** Select działa, zmiany filtrów wywołują callback, UI jest responsywne.

---

### Krok 5: Implementacja FlashcardItem

**Plik do utworzenia:**
- `src/components/FlashcardItem.tsx`

**Zadania:**
1. Zaimportuj typy: `FlashcardDto`
2. Zdefiniuj interface `FlashcardItemProps`
3. Użyj shadcn/ui `Card`, `CardHeader`, `CardContent`, `CardFooter`
4. W `CardHeader`:
   - Badge ze źródłem (conditional styling: manual=blue, ai_full=green, ai_edited=yellow)
   - Data formatowana (użyj `date-fns` lub `Intl.DateTimeFormat`)
5. W `CardContent`:
   - `<p>` dla front (truncate max 100 znaków + "...")
   - `<p>` dla back (truncate max 150 znaków + "...")
6. W `CardFooter`:
   - Button "Edytuj" z ikoną ołówka (Lucide `Pencil`)
   - Button "Usuń" z ikoną kosza (Lucide `Trash2`)
   - Oba `variant="ghost" size="sm"`
7. Dodaj role="listitem" dla A11y
8. Obsłuż onClick dla przycisków → wywołaj `onEdit(flashcard)` i `onDelete(flashcard)`

**Definicja gotowości:** Karta wyświetla się poprawnie, przyciski działają, stylizacja pasuje do designu.

---

### Krok 6: Implementacja FlashcardList

**Plik do utworzenia:**
- `src/components/FlashcardList.tsx`

**Zadania:**
1. Zaimportuj typy: `FlashcardDto`
2. Zdefiniuj interface `FlashcardListProps`
3. Zaimplementuj logikę renderowania:
   ```typescript
   if (loading) return <LoadingSkeleton />;
   if (flashcards.length === 0) return <EmptyState onCreate={onCreate} />;
   ```
4. Renderuj siatkę:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Lista fiszek">
     {flashcards.map(flashcard => (
       <FlashcardItem
         key={flashcard.id}
         flashcard={flashcard}
         onEdit={onEdit}
         onDelete={onDelete}
       />
     ))}
   </div>
   ```
5. Utwórz komponent `EmptyState`:
   - Ikona (np. `FileQuestion` z Lucide)
   - Tekst: "Nie masz jeszcze żadnych fiszek"
   - Podtekst: "Zacznij tworzyć fiszki ręcznie lub wygeneruj je za pomocą AI"
   - Button "Utwórz pierwszą fiszkę" → wywołuje `onCreate()`

**Definicja gotowości:** Lista renderuje się poprawnie, EmptyState działa, A11y roles są obecne.

---

### Krok 7: Implementacja FlashcardFormModal

**Plik do utworzenia:**
- `src/components/FlashcardFormModal.tsx`

**Zadania:**
1. Zaimportuj typy: `FlashcardFormData`, `FlashcardFormErrors`
2. Zdefiniuj interface `FlashcardFormModalProps`
3. Użyj shadcn/ui `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
4. Użyj `useState` dla: `formData`, `errors`, `isSubmitting`
5. Użyj `useEffect` do pre-fill w trybie edit:
   ```typescript
   useEffect(() => {
     if (mode === 'edit' && initialData) {
       setFormData(initialData);
     } else {
       setFormData({ front: '', back: '' });
     }
   }, [mode, initialData, isOpen]);
   ```
6. Zaimplementuj `handleFrontChange`:
   - Aktualizuj `formData.front`
   - Waliduj długość (real-time)
   - Ustaw error jeśli > 300
7. Zaimplementuj `handleBackChange`:
   - Aktualizuj `formData.back`
   - Waliduj długość (real-time)
   - Ustaw error jeśli > 500
8. Zaimplementuj `handleSubmit`:
   - Prevent default
   - Waliduj cały formularz
   - Jeśli valid: `setIsSubmitting(true)`, wywołaj `onSave(formData)`
   - Po sukces/błąd: `setIsSubmitting(false)`
9. Renderuj pola:
   - Label + Textarea dla "Front"
   - CharacterCounter: `{formData.front.length}/300`
   - InlineError z `errors.front`
   - Analogicznie dla "Back"
10. Przyciski:
    - "Anuluj" → `onClose()`
    - "Zapisz" → `handleSubmit()`, disabled gdy invalid lub isSubmitting
11. Dodaj focus trap (automatyczny w shadcn Dialog)

**Definicja gotowości:** Modal działa w obu trybach (create/edit), walidacja działa, formularz się submituje.

---

### Krok 8: Implementacja DeleteConfirmationModal

**Plik do utworzenia:**
- `src/components/DeleteConfirmationModal.tsx`

**Zadania:**
1. Zaimportuj typy: `FlashcardDto`
2. Zdefiniuj interface `DeleteConfirmationModalProps`
3. Użyj shadcn/ui `Dialog` z `DialogContent`, `DialogHeader`, `DialogDescription`, `DialogFooter`
4. Użyj `useState` dla: `isDeleting`
5. Zaimplementuj `handleConfirm`:
   - `setIsDeleting(true)`
   - Wywołaj `onConfirm(flashcard.id)`
   - Po zakończeniu: `setIsDeleting(false)` (lub modal się zamknie)
6. Renderuj:
   - Tytuł: "Potwierdź usunięcie"
   - Opis: "Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna."
   - Preview: `<strong>Przód:</strong> {flashcard?.front}`
7. Przyciski:
   - "Anuluj" → `onClose()`
   - "Usuń" (variant="destructive") → `handleConfirm()`, disabled gdy isDeleting
   - Tekst przycisku: {isDeleting ? "Usuwanie..." : "Usuń"}

**Definicja gotowości:** Modal działa, preview fiszki widoczny, przyciski funkcjonują.

---

### Krok 9: Implementacja Pagination

**Plik do utworzenia:**
- `src/components/Pagination.tsx`

**Zadania:**
1. Zdefiniuj interface `PaginationProps`
2. Zaimplementuj obliczenia:
   - `canGoPrevious = currentPage > 1`
   - `canGoNext = currentPage < totalPages`
3. Renderuj:
   - Button "Poprzednia" → `onPageChange(currentPage - 1)`, disabled={!canGoPrevious}
   - Span: "Strona {currentPage} z {totalPages}"
   - Button "Następna" → `onPageChange(currentPage + 1)`, disabled={!canGoNext}
4. Stylizuj z Tailwind (flexbox, justify-between, responsive)
5. Dodaj aria-labels dla A11y

**Definicja gotowości:** Paginacja działa, przyciski są disabled na krańcach, UI jest intuicyjne.

---

### Krok 10: Implementacja FlashcardListView (główny kontener React)

**Plik do utworzenia:**
- `src/components/FlashcardListView.tsx`

**Zadania:**
1. Zaimportuj wszystkie hooki i komponenty
2. Zainicjalizuj state:
   ```typescript
   const [filters, setFilters] = useState<FlashcardFilters>(getDefaultFilters());
   const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
   ```
3. Użyj custom hooków:
   ```typescript
   const { flashcards, loading, error, refetch } = useFlashcards({ filters, pagination });
   const { createFlashcard, updateFlashcard, deleteFlashcard } = useFlashcardMutations();
   const { modalState, openCreateModal, openEditModal, openDeleteModal, closeModal } = useFlashcardModal();
   ```
4. Zaimplementuj handlery:
   - `handleCreateClick()` → `openCreateModal()`
   - `handleEditClick(flashcard)` → `openEditModal(flashcard)`
   - `handleDeleteClick(flashcard)` → `openDeleteModal(flashcard)`
   - `handleFilterChange(newFilters)` → `setFilters(newFilters)`, reset pagination
   - `handlePageChange(page)` → aktualizuj pagination
   - `handleCreateSave(data)`:
     - Wywołaj `createFlashcard(data)`
     - Na sukces: `closeModal()`, `refetch()`, `toast.success("Fiszka została utworzona")`
     - Na błąd: wyświetl toast z błędem
   - `handleEditSave(id, data)`:
     - Wywołaj `updateFlashcard(id, data)`
     - Na sukces: `closeModal()`, `refetch()`, `toast.success("Fiszka została zaktualizowana")`
     - Na błąd: wyświetl toast
   - `handleDeleteConfirm(id)`:
     - Wywołaj `deleteFlashcard(id)`
     - Na sukces: `closeModal()`, `refetch()`, `toast.success("Fiszka została usunięta")`
     - Na błąd: wyświetl toast
5. Renderuj strukturę:
   ```tsx
   <div className="container mx-auto p-6">
     <div className="flex justify-between items-center mb-6">
       <h1 className="text-3xl font-bold">Moje fiszki</h1>
       <Button onClick={handleCreateClick}>Nowa fiszka</Button>
     </div>
     
     <FilterBar filters={filters} onFilterChange={handleFilterChange} />
     
     <FlashcardList
       flashcards={flashcards}
       loading={loading}
       onEdit={handleEditClick}
       onDelete={handleDeleteClick}
       onCreate={handleCreateClick}
     />
     
     {!loading && flashcards.length > 0 && (
       <Pagination
         currentPage={pagination.currentPage}
         totalPages={pagination.totalPages}
         onPageChange={handlePageChange}
       />
     )}
     
     <FlashcardFormModal
       isOpen={modalState.type === 'create' || modalState.type === 'edit'}
       mode={modalState.type === 'create' ? 'create' : 'edit'}
       initialData={modalState.flashcard ? {
         front: modalState.flashcard.front,
         back: modalState.flashcard.back,
       } : undefined}
       onSave={modalState.type === 'create' ? handleCreateSave : (data) => handleEditSave(modalState.flashcard!.id, data)}
       onClose={closeModal}
     />
     
     <DeleteConfirmationModal
       isOpen={modalState.type === 'delete'}
       flashcard={modalState.flashcard || null}
       onConfirm={handleDeleteConfirm}
       onClose={closeModal}
     />
     
     <Toaster />
   </div>
   ```
6. Obsłuż błędy globalne (np. 401 → redirect)

**Definicja gotowości:** Wszystkie interakcje działają, dane są pobierane i aktualizowane poprawnie.

---

### Krok 11: Implementacja strony Astro

**Plik do utworzenia:**
- `src/pages/flashcards.astro`

**Zadania:**
1. Zaimportuj layout: `import Layout from '../components/layouts/Layout.astro'`
2. Sprawdź uwierzytelnienie:
   ```astro
   ---
   const user = Astro.locals.user;
   if (!user) {
     return Astro.redirect('/auth/login?redirect=/flashcards');
   }
   ---
   ```
3. Renderuj:
   ```astro
   <Layout title="Moje fiszki">
     <FlashcardListView client:load />
   </Layout>
   ```
4. Dodaj meta tags (title, description)

**Definicja gotowości:** Strona renderuje się, middleware sprawdza auth, komponent React ładuje się.

---

### Krok 12: Testowanie i polishing

**Zadania:**

**12.1 Testy manualne:**
1. Zaloguj się jako użytkownik testowy
2. Przejdź na `/flashcards`
3. Przetestuj każdy user story:
   - US-003: Utwórz nową fiszkę
   - US-004: Edytuj istniejącą fiszkę
   - US-005: Usuń fiszkę
4. Przetestuj walidację:
   - Puste pola
   - Przekroczenie limitu znaków
5. Przetestuj filtrowanie i sortowanie
6. Przetestuj paginację
7. Przetestuj responsywność (mobile, tablet, desktop)

**12.2 Testy A11y:**
1. Sprawdź focus trap w modalach (Tab, Shift+Tab)
2. Sprawdź aria-labels i roles
3. Przetestuj z screen readerem (opcjonalnie)
4. Sprawdź kontrast kolorów (WCAG AA)

**12.3 Testy jednostkowe (opcjonalnie):**
1. Testy dla custom hooków (useFlashcards, useFlashcardMutations)
2. Testy dla komponentów (FlashcardFormModal walidacja)
3. Mock API responses z MSW

**12.4 Testy E2E (opcjonalnie):**
1. Utwórz test Playwright dla pełnego flow:
   - Login → navigate to /flashcards → create → edit → delete

**12.5 Polishing:**
1. Dodaj loading states dla wszystkich akcji
2. Sprawdź wszystkie komunikaty błędów
3. Upewnij się, że toasty są przyjazne użytkownikowi
4. Optymalizuj performance (memoizacja, lazy loading)
5. Dodaj transitions/animations (opcjonalnie)

**Definicja gotowości:** Wszystkie user stories działają, brak bugów krytycznych, A11y jest OK, UI jest polish.

---

### Krok 13: Dokumentacja i cleanup

**Zadania:**
1. Dodaj komentarze JSDoc do komponentów i hooków
2. Zaktualizuj README jeśli potrzeba
3. Usuń console.log i debugowanie kodu
4. Sprawdź linter i popraw wszystkie warningi
5. Sformatuj kod (Prettier)
6. Commit zmian z opisowymi messagami

**Definicja gotowości:** Kod jest czysty, udokumentowany, gotowy do review.

---

## 12. Podsumowanie i Next Steps

Po implementacji widoku „Moje fiszki" użytkownik będzie mógł:
- Przeglądać wszystkie swoje fiszki w przejrzystej siatce
- Tworzyć nowe fiszki ręcznie z walidacją
- Edytować istniejące fiszki
- Usuwać fiszki z potwierdzeniem
- Filtrować według źródła (manual, AI)
- Sortować według daty
- Nawigować między stronami (paginacja)

**Potencjalne rozszerzenia na przyszłość:**
1. **Wyszukiwanie:** Dodać pole search do filtrowania po treści front/back
2. **Bulk operations:** Zaznaczanie wielu fiszek i masowe usuwanie
3. **Export/Import:** Eksport do CSV/JSON, import z pliku
4. **Kolekcje (US-010):** Organizacja fiszek w zestawy/foldery
5. **Tagi:** Dodawanie tagów do fiszek dla lepszej kategoryzacji
6. **Infinite scroll:** Alternatywa dla paginacji
7. **Drag & drop:** Zmiana kolejności fiszek
8. **Quick preview:** Hover/click aby zobaczyć pełną treść bez otwierania edycji

**Zależności:**
- Widok „Moje fiszki" jest niezależny od widoku generowania
- Integracja z widokiem SRS (sesje powtórek) będzie wymagać dodatkowego API
- Collections feature (US-010) wymaga rozszerzenia bazy danych i API

**Metryki sukcesu:**
- Czas ładowania listy < 1s
- Wszystkie interakcje responsywne < 200ms
- 100% user stories spełnionych
- Zero błędów A11y w automatycznych testach
- Pozytywny feedback od użytkowników testowych

