# API Endpoint Implementation Plan: GET /flashcards

## 1. Przegląd punktu końcowego

Endpoint **GET /flashcards** umożliwia użytkownikowi pobranie listy swoich fiszek z obsługą paginacji, filtrowania i sortowania. Jest to operacja odczytu (read-only), która zwraca uporządkowaną i stronicowaną listę fiszek należących do uwierzytelnionego użytkownika.

**Główne funkcje:**
- Paginacja wyników (limit/offset)
- Filtrowanie po źródle fiszki (manual, ai_full, ai_edited)
- Sortowanie po dacie utworzenia (ascending/descending)
- Zwracanie metadanych paginacji (total count)
- Zabezpieczenie przez RLS (Row Level Security) - użytkownik widzi tylko swoje fiszki

## 2. Szczegóły żądania

### Metoda HTTP
```
GET /api/flashcards
```

### Struktura URL
```
/api/flashcards?limit={number}&offset={number}&filter[source]={source}&sort[created_at]={direction}
```

### Parametry Query

Wszystkie parametry są opcjonalne:

| Parametr | Typ | Wymagany | Domyślna wartość | Ograniczenia | Opis |
|----------|-----|----------|------------------|--------------|------|
| `limit` | number | Nie | 20 | Min: 1, Max: 100 | Liczba fiszek na stronę |
| `offset` | number | Nie | 0 | Min: 0 | Liczba fiszek do pominięcia |
| `filter[source]` | string | Nie | - | Enum: 'manual', 'ai_full', 'ai_edited' | Filtrowanie po źródle fiszki |
| `sort[created_at]` | string | Nie | 'desc' | Enum: 'asc', 'desc' | Kierunek sortowania po dacie utworzenia |

### Przykładowe żądania

```http
# Podstawowe żądanie (domyślne parametry)
GET /api/flashcards

# Z paginacją
GET /api/flashcards?limit=50&offset=100

# Filtrowanie po źródle
GET /api/flashcards?filter[source]=ai_full

# Sortowanie ascending
GET /api/flashcards?sort[created_at]=asc

# Kombinacja parametrów
GET /api/flashcards?limit=25&offset=50&filter[source]=manual&sort[created_at]=desc
```

### Nagłówki żądania

```http
Authorization: Bearer {jwt_token}
```

### Request Body
Brak - endpoint GET nie przyjmuje body.

## 3. Wykorzystywane typy

### Typy żądania (z `src/types.ts`)

```typescript
// Query parameters DTO
export type ListFlashcardsRequestDto = PaginationParamsDto & {
  filter_source?: FlashcardSource;
  sort_created_at?: 'asc' | 'desc';
};

// Base pagination parameters
export interface PaginationParamsDto {
  limit?: number;
  offset?: number;
}

// Flashcard source enum
export type FlashcardSource = 'manual' | 'ai_full' | 'ai_edited';
```

### Typy odpowiedzi (z `src/types.ts`)

```typescript
// Response DTO
export type ListFlashcardsResponseDto = PaginatedResponse<FlashcardDto>;

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Individual flashcard DTO
export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;
```

### Schema walidacji Zod (do stworzenia)

Należy dodać w `src/lib/schemas/flashcards.ts`:

```typescript
export const listFlashcardsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  filter_source: flashcardSourceSchema.optional(),
  sort_created_at: z.enum(['asc', 'desc']).default('desc'),
});
```

**Uwagi:**
- `z.coerce.number()` automatycznie konwertuje string z query params na number
- `flashcardSourceSchema` już istnieje w pliku schemas/flashcards.ts
- Użycie `.default()` zapewnia domyślne wartości

## 4. Szczegóły odpowiedzi

### Sukces: 200 OK

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "ai_full",
      "generation_id": "660e8400-e29b-41d4-a716-446655440111",
      "created_at": "2025-12-30T10:00:00.000Z",
      "updated_at": "2025-12-30T10:00:00.000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-12-29T15:30:00.000Z",
      "updated_at": "2025-12-29T15:30:00.000Z"
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

### Błąd: 401 Unauthorized

```json
{
  "code": "Unauthorized",
  "message": "Authentication required"
}
```

**Kiedy:** Brak tokenu autoryzacyjnego lub nieprawidłowy token.

### Błąd: 400 Bad Request

```json
{
  "code": "ValidationError",
  "message": "Invalid query parameter: limit must be between 1 and 100"
}
```

**Kiedy:** Nieprawidłowe parametry query (np. ujemny limit, nieprawidłowa wartość source).

### Błąd: 500 Internal Server Error

```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

**Kiedy:** Błąd połączenia z bazą danych lub nieoczekiwany wyjątek.

## 5. Przepływ danych

### Diagram przepływu

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/flashcards?limit=20&filter[source]=ai_full
       ▼
┌─────────────────────────────────┐
│  Astro Middleware               │
│  - Weryfikacja JWT token        │
│  - Inicjalizacja Supabase       │
│  - Ustawienie locals.user       │
└──────┬──────────────────────────┘
       │ locals.user, locals.supabase
       ▼
┌─────────────────────────────────┐
│  GET Handler                    │
│  (/api/flashcards.ts)           │
│  1. Sprawdzenie auth            │
│  2. Parsowanie query params     │
│  3. Walidacja z Zod             │
└──────┬──────────────────────────┘
       │ Validated query params
       ▼
┌─────────────────────────────────┐
│  FlashcardService               │
│  .listFlashcards()              │
│  1. Build Supabase query        │
│  2. Apply filters               │
│  3. Apply sorting               │
│  4. Apply pagination            │
│  5. Get total count             │
│  6. Execute query               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase (PostgreSQL)          │
│  - RLS filters by user_id       │
│  - Executes query               │
│  - Returns results + count      │
└──────┬──────────────────────────┘
       │ Flashcard records
       ▼
┌─────────────────────────────────┐
│  FlashcardService               │
│  - Transform to FlashcardDto[]  │
│  - Build PaginatedResponse      │
└──────┬──────────────────────────┘
       │ PaginatedResponse
       ▼
┌─────────────────────────────────┐
│  GET Handler                    │
│  - Return 200 OK with JSON      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

### Kluczowe operacje bazodanowe

**Zapytanie Supabase:**

```typescript
// 1. Podstawowe zapytanie z selekcją kolumn
let query = supabase
  .from('flashcards')
  .select('id, front, back, source, generation_id, created_at, updated_at', { count: 'exact' })
  .eq('user_id', userId); // RLS dodatkowo wymusza to, ale jest to explicit

// 2. Opcjonalne filtrowanie
if (filter_source) {
  query = query.eq('source', filter_source);
}

// 3. Sortowanie
query = query.order('created_at', { ascending: sort_created_at === 'asc' });

// 4. Paginacja
query = query.range(offset, offset + limit - 1);

// 5. Wykonanie z licznikiem
const { data, error, count } = await query;
```

**Transformacja do DTO:**

```typescript
const items: FlashcardDto[] = data.map(record => ({
  id: record.id,
  front: record.front,
  back: record.back,
  source: record.source as FlashcardSource,
  generation_id: record.generation_id,
  created_at: record.created_at,
  updated_at: record.updated_at,
}));

const response: ListFlashcardsResponseDto = {
  items,
  total: count || 0,
  limit,
  offset,
};
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

✅ **Implementacja:**
- JWT token weryfikowany przez middleware Astro
- Użytkownik dostępny w `locals.user`
- Brak `locals.user` → 401 Unauthorized

**Kod w endpoincie:**
```typescript
if (!locals.user) {
  return new Response(
    JSON.stringify({
      code: 'Unauthorized',
      message: 'Authentication required',
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Autoryzacja (Authorization)

✅ **Row Level Security (RLS):**
- Polityki RLS w Supabase automatycznie filtrują rekordy po `user_id`
- Użytkownik widzi tylko swoje fiszki
- Dodatkowe zabezpieczenie: explicit `.eq('user_id', userId)` w zapytaniu

**RLS Policy (przypomnienie):**
```sql
-- Policy dla SELECT
CREATE POLICY flashcards_select_policy ON flashcards
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Walidacja danych wejściowych

✅ **Zod Schema:**
- Wszystkie parametry query walidowane
- Automatyczna konwersja typów (coerce)
- Sprawdzanie zakresów (min/max)
- Walidacja enum values

**Chronione przed:**
- SQL Injection (Supabase używa prepared statements)
- Type coercion attacks (Zod validation)
- Out-of-range values (min/max constraints)
- Invalid enum values (strict enum checking)

### Ochrona przed atakami

| Atak | Ochrona |
|------|---------|
| **SQL Injection** | Supabase client używa parametryzowanych zapytań |
| **NoSQL Injection** | Nie dotyczy (PostgreSQL) |
| **Authorization Bypass** | RLS policies + explicit user_id filter |
| **DoS via pagination** | Max limit: 100, reasonable default: 20 |
| **Parameter Pollution** | Zod parsuje tylko zdefiniowane parametry |
| **XSS** | JSON response, nie renderowany HTML |

### Rate Limiting

⚠️ **Rekomendacja:** 
- Implementacja rate limiting na poziomie middleware
- Przykładowe limity: 100 żądań/minutę per user
- Out of scope dla tego endpointa, ale ważne dla produkcji

## 7. Obsługa błędów

### Macierz błędów

| Kod | Scenariusz | Code | Message | Akcja |
|-----|-----------|------|---------|-------|
| **401** | Brak tokenu JWT | `Unauthorized` | `Authentication required` | Użytkownik musi się zalogować |
| **401** | Nieprawidłowy token | `Unauthorized` | `Authentication required` | Middleware zwróci 401 |
| **400** | Ujemny limit | `ValidationError` | `Invalid query parameter: limit must be between 1 and 100` | Poprawić wartość limit |
| **400** | Limit > 100 | `ValidationError` | `Invalid query parameter: limit must be between 1 and 100` | Zmniejszyć limit |
| **400** | Ujemny offset | `ValidationError` | `Invalid query parameter: offset must be non-negative` | Poprawić offset |
| **400** | Nieprawidłowy source | `ValidationError` | `Invalid query parameter: filter[source] must be one of: manual, ai_full, ai_edited` | Użyć prawidłowej wartości enum |
| **400** | Nieprawidłowy sort | `ValidationError` | `Invalid query parameter: sort[created_at] must be 'asc' or 'desc'` | Użyć 'asc' lub 'desc' |
| **500** | Brak Supabase client | `InternalServerError` | `Database connection not available` | Sprawdzić konfigurację Supabase |
| **500** | Błąd bazy danych | `InternalServerError` | `An unexpected error occurred` | Logować i monitorować |
| **500** | Nieoczekiwany wyjątek | `InternalServerError` | `An unexpected error occurred` | Logować stack trace |

### Struktura odpowiedzi błędu

```typescript
interface ErrorResponse {
  code: string;
  message: string;
}
```

### Implementacja obsługi błędów

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Guard clause: Supabase client
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Guard clause: Authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      filter_source: url.searchParams.get('filter[source]'),
      sort_created_at: url.searchParams.get('sort[created_at]'),
    };

    const validationResult = listFlashcardsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Invalid query parameter: ${firstError.path.join('.')} - ${firstError.message}`,
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Call service (happy path)
    const flashcardService = new FlashcardService(locals.supabase);
    const result = await flashcardService.listFlashcards(locals.user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 5. Catch unexpected errors
    console.error('Error in GET /api/flashcards:', error);
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Logowanie błędów

```typescript
// W catch block
console.error('Error in GET /api/flashcards:', {
  userId: locals.user?.id,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

**Produkcja:** Użyć odpowiedniego serwisu logowania (np. Sentry, LogRocket).

## 8. Rozważania dotyczące wydajności

### Indeksy bazodanowe

✅ **Istniejące indeksy (z migracji):**

```sql
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
```

**Analiza:**
- `idx_flashcards_user_id` - idealny dla filtrowania po user_id ✅
- Sortowanie po `created_at` może wymagać dodatkowego indeksu dla większych zbiorów danych

**Rekomendacja dla przyszłości:**
```sql
-- Composite index dla user_id + created_at (jeśli performance problem)
CREATE INDEX idx_flashcards_user_created 
  ON flashcards(user_id, created_at DESC);
```

### Optymalizacje zapytań

1. **Użycie `count: 'exact'`:**
   - Pobiera total count w jednym zapytaniu
   - Dla dużych tabel może być wolne
   - **Alternatywa:** `count: 'planned'` (szacunkowy, szybszy)

2. **Limit max 100:**
   - Zapobiega pobieraniu zbyt dużych zbiorów danych
   - Zmniejsza obciążenie serwera i czasy odpowiedzi

3. **Selekcja tylko potrzebnych kolumn:**
   - Nie pobieramy niepotrzebnych danych
   - Zmniejsza transfer przez sieć

### Caching

❌ **Nie implementujemy na razie** (read-after-write consistency)

Powody:
- Dane fiszek często się zmieniają (CRUD operations)
- Cache invalidation jest trudna
- RLS wymaga per-user cache

**Przyszła optymalizacja:**
- Redis cache z kluczem: `flashcards:${userId}:${hash(queryParams)}`
- TTL: 60 sekund
- Invalidacja przy POST/PUT/DELETE

### Monitoring wydajności

**Metryki do śledzenia:**
- Response time (target: < 200ms)
- Database query time
- Number of queries per request (powinno być 1)
- Cache hit rate (jeśli zaimplementujemy)

**Query explain (PostgreSQL):**
```sql
EXPLAIN ANALYZE
SELECT id, front, back, source, generation_id, created_at, updated_at
FROM flashcards
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie struktury walidacji

**1.1. Utworzenie schematu Zod dla query parameters**

Plik: `src/lib/schemas/flashcards.ts`

```typescript
// Dodać na końcu pliku:

/**
 * Schema for validating query parameters for listing flashcards
 */
export const listFlashcardsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .default(0),
  filter_source: flashcardSourceSchema.optional(),
  sort_created_at: z.enum(['asc', 'desc']).default('desc'),
});

// Type dla walidowanego wyniku
export type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
```

**Uwagi:**
- `z.coerce.number()` automatycznie konwertuje string → number
- `.default()` zapewnia wartości domyślne dla opcjonalnych parametrów
- Używamy istniejącego `flashcardSourceSchema`

### Faza 2: Implementacja logiki w Service

**2.1. Dodanie metody `listFlashcards` do FlashcardService**

Plik: `src/lib/services/flashcard.service.ts`

```typescript
// Import dodatkowych typów na górze pliku
import type {
  CreateFlashcardRequestDto,
  FlashcardDto,
  FlashcardSource,
  ListFlashcardsResponseDto,
} from '../../types';
import type { ListFlashcardsQuery } from '../schemas/flashcards';

// Dodać metodę do klasy FlashcardService:

/**
 * Lists flashcards for a user with pagination, filtering, and sorting
 * @param userId - The authenticated user ID
 * @param query - Query parameters (limit, offset, filters, sort)
 * @returns Paginated list of flashcards
 */
async listFlashcards(
  userId: string,
  query: ListFlashcardsQuery
): Promise<ListFlashcardsResponseDto> {
  const { limit, offset, filter_source, sort_created_at } = query;

  // Build base query with count
  let supabaseQuery = this.supabase
    .from('flashcards')
    .select('id, front, back, source, generation_id, created_at, updated_at', {
      count: 'exact',
    })
    .eq('user_id', userId); // Explicit user filter (RLS also enforces this)

  // Apply optional source filter
  if (filter_source) {
    supabaseQuery = supabaseQuery.eq('source', filter_source);
  }

  // Apply sorting
  const ascending = sort_created_at === 'asc';
  supabaseQuery = supabaseQuery.order('created_at', { ascending });

  // Apply pagination
  supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Database error listing flashcards:', error);
    throw new Error(`Failed to list flashcards: ${error.message}`);
  }

  // Transform to DTOs
  const items: FlashcardDto[] = (data || []).map((record) => ({
    id: record.id,
    front: record.front,
    back: record.back,
    source: record.source as FlashcardSource,
    generation_id: record.generation_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));

  // Return paginated response
  return {
    items,
    total: count || 0,
    limit,
    offset,
  };
}
```

**Kluczowe elementy:**
- Explicit user_id filter (defense in depth)
- Opcjonalne filtrowanie po source
- Sortowanie z możliwością wyboru kierunku
- Paginacja przez `.range()`
- `count: 'exact'` dla dokładnej liczby rekordów
- Error handling z rzucaniem wyjątku (catch w endpoint handler)

### Faza 3: Implementacja endpoint handler

**3.1. Dodanie GET handlera do flashcards endpoint**

Plik: `src/pages/api/flashcards.ts`

Na górze pliku, dodać import:
```typescript
import { listFlashcardsQuerySchema } from '../../lib/schemas/flashcards';
```

Dodać na końcu pliku (przed lub po innych metodach):

```typescript
/**
 * GET /api/flashcards - List user's flashcards with pagination
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Guard clause: Check Supabase client availability
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guard clause: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;

    console.log(`Processing flashcards list request for user: ${userId}`);

    // Parse query parameters from URL
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      filter_source: url.searchParams.get('filter[source]'),
      sort_created_at: url.searchParams.get('sort[created_at]'),
    };

    // Validate query parameters
    const validationResult = listFlashcardsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Invalid query parameter: ${firstError.path.join('.')} - ${firstError.message}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Get paginated flashcards
    const result = await flashcardService.listFlashcards(userId, validationResult.data);

    console.log(`Returned ${result.items.length} flashcards (total: ${result.total})`);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error in GET /api/flashcards:', {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Uwaga:** Upewnij się, że na górze pliku jest:
```typescript
export const prerender = false;
```

### Faza 4: Testowanie

**4.1. Testy manualne**

Przygotować żądania HTTP (np. w Postman, Insomnia, lub curl):

```bash
# 1. Test podstawowy (bez parametrów)
curl -X GET "http://localhost:4321/api/flashcards" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Test paginacji
curl -X GET "http://localhost:4321/api/flashcards?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Test filtrowania
curl -X GET "http://localhost:4321/api/flashcards?filter[source]=ai_full" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Test sortowania
curl -X GET "http://localhost:4321/api/flashcards?sort[created_at]=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Test kombinacji
curl -X GET "http://localhost:4321/api/flashcards?limit=5&offset=10&filter[source]=manual&sort[created_at]=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. Test walidacji (nieprawidłowy limit)
curl -X GET "http://localhost:4321/api/flashcards?limit=200" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. Test walidacji (nieprawidłowy source)
curl -X GET "http://localhost:4321/api/flashcards?filter[source]=invalid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 8. Test bez autoryzacji
curl -X GET "http://localhost:4321/api/flashcards"
```

**4.2. Testy jednostkowe (Vitest)**

Plik: `tests/unit/services/flashcard.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardService } from '../../../src/lib/services/flashcard.service';

describe('FlashcardService.listFlashcards', () => {
  let mockSupabase: any;
  let service: FlashcardService;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    service = new FlashcardService(mockSupabase);
  });

  it('should return paginated flashcards with default parameters', async () => {
    const mockData = [
      {
        id: '1',
        front: 'Front 1',
        back: 'Back 1',
        source: 'manual',
        generation_id: null,
        created_at: '2025-12-30T10:00:00Z',
        updated_at: '2025-12-30T10:00:00Z',
      },
    ];

    mockSupabase.range.mockResolvedValue({
      data: mockData,
      error: null,
      count: 1,
    });

    const result = await service.listFlashcards('user-123', {
      limit: 20,
      offset: 0,
      sort_created_at: 'desc',
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should apply source filter when provided', async () => {
    await service.listFlashcards('user-123', {
      limit: 20,
      offset: 0,
      filter_source: 'ai_full',
      sort_created_at: 'desc',
    });

    expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'ai_full');
  });

  it('should handle database errors', async () => {
    mockSupabase.range.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: null,
    });

    await expect(
      service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      })
    ).rejects.toThrow('Failed to list flashcards');
  });
});
```

**4.3. Testy integracyjne**

Plik: `tests/integration/api/flashcards.test.ts`

Sprawdzić czy endpoint poprawnie:
- Zwraca 401 bez tokenu
- Zwraca 400 dla nieprawidłowych parametrów
- Zwraca 200 z poprawnymi danymi
- Filtruje według source
- Sortuje według created_at
- Paginuje wyniki

**4.4. Testy E2E (Playwright)**

Plik: `tests/e2e/flashcards.spec.ts`

Przetestować flow użytkownika:
- Zalogowanie
- Pobranie listy fiszek
- Nawigacja między stronami (pagination)
- Filtrowanie w UI

### Faza 5: Dokumentacja

**5.1. Aktualizacja API documentation**

Dodać do dokumentacji API (jeśli istnieje) opis endpointa GET /flashcards.

**5.2. Komentarze w kodzie**

Upewnić się, że wszystkie funkcje mają JSDoc comments z opisem parametrów i zwracanych wartości.

### Faza 6: Code review i deployment

**6.1. Code review checklist**

- [ ] Walidacja query parameters działa poprawnie
- [ ] Authentication i authorization są sprawdzane
- [ ] Error handling jest kompletny
- [ ] Wszystkie testy przechodzą
- [ ] Kod jest zgodny z style guide
- [ ] Nie ma linter errors
- [ ] Performance jest akceptowalna
- [ ] Logowanie jest odpowiednie (nie za dużo, nie za mało)

**6.2. Deployment**

1. Merge do branch development
2. Uruchomienie CI/CD pipeline
3. Testy automatyczne
4. Deploy do staging
5. Smoke tests na staging
6. Deploy do production
7. Monitoring przez pierwsze godziny

## 10. Podsumowanie

### Kluczowe punkty implementacji

1. **Walidacja**: Zod schema z automatyczną konwersją typów i domyślnymi wartościami
2. **Service Layer**: Nowa metoda `listFlashcards` w `FlashcardService`
3. **Endpoint Handler**: GET handler z guard clauses i obsługą błędów
4. **Bezpieczeństwo**: RLS + explicit filtering, JWT authentication
5. **Performance**: Indeksy, limit max 100, selekcja tylko potrzebnych kolumn

### Pliki do modyfikacji

1. `src/lib/schemas/flashcards.ts` - dodanie `listFlashcardsQuerySchema`
2. `src/lib/services/flashcard.service.ts` - dodanie metody `listFlashcards`
3. `src/pages/api/flashcards.ts` - dodanie GET handlera

### Szacowany czas implementacji

- Faza 1 (Schema): 15 min
- Faza 2 (Service): 30 min
- Faza 3 (Endpoint): 45 min
- Faza 4 (Testing): 2 godz.
- Faza 5 (Dokumentacja): 30 min
- **Łącznie: ~4 godziny**

### Następne kroki

Po zaimplementowaniu GET /flashcards, można przejść do:
1. PUT /flashcards/:id (update flashcard)
2. DELETE /flashcards/:id (delete flashcard)
3. Implementacja cache'owania (jeśli potrzebne)
4. Dodanie rate limiting
5. Monitoring i alerting

---

**Wersja dokumentu**: 1.0  
**Data utworzenia**: 2025-12-30  
**Autor**: AI Architect  
**Status**: Gotowy do implementacji

