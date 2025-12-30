# API Endpoint Implementation Plan: PUT /flashcards/{cardId}

## 1. Przegląd punktu końcowego

Endpoint `PUT /flashcards/{cardId}` umożliwia aktualizację istniejącej flashcardy należącej do uwierzytelnionego użytkownika. Endpoint pozwala na modyfikację zawartości flashcardy (front, back), jej źródła (source) oraz powiązanego identyfikatora generacji (generation_id).

**Cel**: Zapewnić bezpieczny i zwalidowany sposób aktualizacji flashcard przez użytkownika.

**Kluczowe funkcjonalności**:
- Aktualizacja treści flashcardy (front i back)
- Zmiana źródła flashcardy (manual, ai_full, ai_edited)
- Aktualizacja powiązania z generacją AI
- Walidacja właściciela zasobu (autoryzacja)
- Walidacja integralności danych biznesowych

## 2. Szczegóły żądania

### Metoda HTTP
`PUT`

### Struktura URL
```
PUT /api/flashcards/{cardId}
```

### Parametry URL
- **cardId** (wymagane, string, UUID): Unikalny identyfikator flashcardy do zaktualizowania

### Nagłówki żądania
- **Authorization** (wymagane): `Bearer <JWT_TOKEN>`
- **Content-Type** (wymagane): `application/json`

### Request Body
```json
{
  "front": "string (1-300 chars)",
  "back": "string (1-500 chars)",
  "source": "manual" | "ai_full" | "ai_edited",
  "generation_id": "uuid (optional, required for ai_full/ai_edited)"
}
```

**Struktura zgodna z**: `UpdateFlashcardRequestDto` (Pick<FlashcardInsert, 'front' | 'back' | 'source' | 'generation_id'>)

### Parametry Request Body

#### Wymagane:
- **front** (string): 
  - Tekst na przedniej stronie flashcardy
  - Minimum: 1 znak (po trim)
  - Maximum: 300 znaków
  - Automatyczne trimowanie białych znaków

- **back** (string):
  - Tekst na tylnej stronie flashcardy
  - Minimum: 1 znak (po trim)
  - Maximum: 500 znaków
  - Automatyczne trimowanie białych znaków

- **source** (enum):
  - Źródło pochodzenia flashcardy
  - Dozwolone wartości: `"manual"`, `"ai_full"`, `"ai_edited"`

#### Opcjonalne (warunkowo wymagane):
- **generation_id** (string, UUID):
  - Identyfikator generacji AI powiązanej z flashcardą
  - **Wymagane** gdy `source` = `"ai_full"` lub `"ai_edited"`
  - **Opcjonalne** gdy `source` = `"manual"`
  - Musi być prawidłowym UUID
  - Musi należeć do uwierzytelnionego użytkownika

### Przykładowe żądanie
```http
PUT /api/flashcards/b1a7f8e2-1234-5678-90ab-cdef12345678 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "front": "What is the capital of France?",
  "back": "Paris is the capital and most populous city of France.",
  "source": "ai_edited",
  "generation_id": "d3c4e5f6-3456-7890-12cd-efab34567890"
}
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

#### UpdateFlashcardRequestDto
```typescript
// Zdefiniowane w src/types.ts
export type UpdateFlashcardRequestDto = Pick<
  FlashcardInsert, 
  'front' | 'back' | 'source' | 'generation_id'
>;
```

#### UpdateFlashcardResponseDto
```typescript
// Zdefiniowane w src/types.ts
export type UpdateFlashcardResponseDto = FlashcardDto;
```

#### FlashcardDto
```typescript
// Zdefiniowane w src/types.ts
export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;
```

### Schematy Walidacji (Zod)

Wykorzystać istniejący schemat z `src/lib/schemas/flashcards.ts`:

```typescript
// Schemat do walidacji pojedynczej flashcardy (już istnieje)
export const createFlashcardRequestSchema

// Dodatkowo stworzyć schemat walidacji UUID dla cardId
export const flashcardIdParamSchema = z.object({
  cardId: z.string().uuid('Card ID must be a valid UUID')
});
```

**Uwaga**: Schemat `createFlashcardRequestSchema` może być użyty do walidacji request body w endpoint PUT, ponieważ struktura jest identyczna.

### Database Types

```typescript
// Z src/db/database.types.ts
type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
```

## 4. Szczegóły odpowiedzi

### Odpowiedź Success (200 OK)

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body**: Zaktualizowana flashcarda jako `UpdateFlashcardResponseDto` (FlashcardDto)

```json
{
  "id": "b1a7f8e2-1234-5678-90ab-cdef12345678",
  "front": "What is the capital of France?",
  "back": "Paris is the capital and most populous city of France.",
  "source": "ai_edited",
  "generation_id": "d3c4e5f6-3456-7890-12cd-efab34567890",
  "created_at": "2025-10-26T12:34:56Z",
  "updated_at": "2025-12-30T15:22:10Z"
}
```

### Odpowiedzi błędów

#### 400 Bad Request

**Przyczyny**:
- Nieprawidłowy format UUID dla `cardId`
- Walidacja request body nie przeszła
- Brak wymaganego pola
- Przekroczenie limitów znaków
- generation_id wymagane ale nie podane (gdy source='ai_full' lub 'ai_edited')
- Nieprawidłowy Content-Type
- Nieprawidłowy JSON

**Przykład odpowiedzi**:
```json
{
  "code": "ValidationError",
  "message": "Front text cannot exceed 300 characters"
}
```

**Inne przykłady**:
```json
{
  "code": "ValidationError",
  "message": "Card ID must be a valid UUID"
}
```

```json
{
  "code": "ValidationError",
  "message": "Generation ID is required when source is ai_full or ai_edited"
}
```

#### 401 Unauthorized

**Przyczyny**:
- Brak tokena Authorization
- Nieprawidłowy token
- Token wygasł

**Przykład odpowiedzi**:
```json
{
  "code": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden

**Przyczyny**:
- Użytkownik próbuje zaktualizować flashcardę należącą do innego użytkownika
- Podany generation_id należy do innego użytkownika

**Przykład odpowiedzi**:
```json
{
  "code": "Forbidden",
  "message": "You do not have permission to update this flashcard"
}
```

```json
{
  "code": "Forbidden",
  "message": "The specified generation does not belong to you"
}
```

#### 404 Not Found

**Przyczyny**:
- Flashcarda o podanym `cardId` nie istnieje
- generation_id nie istnieje w bazie (jeśli podane)

**Przykład odpowiedzi**:
```json
{
  "code": "NotFound",
  "message": "Flashcard not found"
}
```

```json
{
  "code": "NotFound",
  "message": "The specified generation does not exist"
}
```

#### 500 Internal Server Error

**Przyczyny**:
- Błąd połączenia z bazą danych
- Błąd Supabase client
- Nieoczekiwany błąd serwera

**Przykład odpowiedzi**:
```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred. Please try again."
}
```

## 5. Przepływ danych

### Diagram przepływu danych

```
1. Client → API Endpoint (PUT /api/flashcards/{cardId})
   ├─ Headers: Authorization Bearer Token, Content-Type
   ├─ URL Param: cardId (UUID)
   └─ Body: UpdateFlashcardRequestDto

2. API Endpoint (src/pages/api/flashcards/[cardId].ts)
   ├─ Walidacja: locals.supabase exists (500 jeśli brak)
   ├─ Walidacja: locals.user exists (401 jeśli brak)
   ├─ Walidacja: Content-Type = application/json (400 jeśli nie)
   ├─ Parsowanie: request.json() (400 jeśli błąd)
   ├─ Walidacja: cardId UUID (400 jeśli nieprawidłowy)
   ├─ Walidacja: Request body (Zod schema) (400 jeśli nieprawidłowy)
   └─ Wywołanie: flashcardService.updateFlashcard(userId, cardId, validatedData)

3. FlashcardService.updateFlashcard()
   ├─ Krok 1: Sprawdzenie istnienia flashcardy
   │   ├─ Query: SELECT * FROM flashcards WHERE id = cardId
   │   ├─ Jeśli nie istnieje → throw Error (404)
   │   └─ Jeśli istnieje → kontynuuj
   │
   ├─ Krok 2: Weryfikacja właściciela
   │   ├─ Sprawdzenie: flashcard.user_id === userId
   │   ├─ Jeśli nie → throw Error (403)
   │   └─ Jeśli tak → kontynuuj
   │
   ├─ Krok 3: Walidacja generation_id (jeśli podane)
   │   ├─ Query: SELECT * FROM generations WHERE id = generation_id AND user_id = userId
   │   ├─ Jeśli nie istnieje → throw Error (404)
   │   ├─ Jeśli należy do innego użytkownika → throw Error (403)
   │   └─ Jeśli OK → kontynuuj
   │
   ├─ Krok 4: Aktualizacja flashcardy
   │   ├─ Query: UPDATE flashcards SET front, back, source, generation_id, updated_at WHERE id = cardId
   │   ├─ Trigger automatycznie ustawia updated_at
   │   └─ Zwrócenie zaktualizowanego rekordu
   │
   └─ Krok 5: Transformacja do DTO
       ├─ Mapowanie: Database Row → FlashcardDto
       └─ Return: FlashcardDto

4. API Endpoint
   ├─ Success: Response 200 OK z FlashcardDto
   └─ Error: Response z odpowiednim kodem i ErrorResponse

5. Client ← API Response
   └─ Otrzymanie: UpdateFlashcardResponseDto lub ErrorResponse
```

### Interakcje z bazą danych

#### Query 1: Pobranie istniejącej flashcardy
```typescript
const { data, error } = await supabase
  .from('flashcards')
  .select('*')
  .eq('id', cardId)
  .single();
```

**Cel**: Sprawdzić czy flashcarda istnieje i pobrać jej user_id do weryfikacji właściciela.

#### Query 2: Weryfikacja generation_id (jeśli podane)
```typescript
const { data, error } = await supabase
  .from('generations')
  .select('user_id')
  .eq('id', generation_id)
  .single();
```

**Cel**: Sprawdzić czy generation istnieje i czy należy do użytkownika.

#### Query 3: Aktualizacja flashcardy
```typescript
const { data, error } = await supabase
  .from('flashcards')
  .update({
    front: updateData.front,
    back: updateData.back,
    source: updateData.source,
    generation_id: updateData.generation_id,
    updated_at: new Date().toISOString(),
  })
  .eq('id', cardId)
  .select()
  .single();
```

**Cel**: Zaktualizować flashcardę i zwrócić zaktualizowany rekord.

**Uwaga**: Trigger `update_flashcards_updated_at` automatycznie ustawia `updated_at`, ale możemy to również jawnie przekazać.

### RLS (Row Level Security)

Polityki RLS dla tabeli `flashcards` powinny zapewniać:
- Użytkownik może czytać/modyfikować tylko swoje flashcardy (WHERE user_id = auth.uid())
- API endpoint dodatkowo weryfikuje właściciela przed wykonaniem operacji

Zgodnie z migracją `20251026160600_disable_rls_policies.sql`, RLS może być wyłączone, więc weryfikacja właściciela musi być wykonana w warstwie aplikacji.

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

**Mechanizm**: JWT Bearer Token przekazywany w nagłówku Authorization

**Implementacja**:
```typescript
// Middleware (src/middleware/index.ts) automatycznie weryfikuje token
// i ustawia locals.user jeśli token jest prawidłowy

// W endpoint:
if (!locals.user) {
  return new Response(
    JSON.stringify({
      code: 'Unauthorized',
      message: 'Authentication required'
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Zabezpieczenia**:
- Token musi być prawidłowy i niewyexpirowany
- Middleware automatycznie weryfikuje token przez Supabase Auth
- Brak tokenu → 401 Unauthorized

### Autoryzacja (Authorization)

**Zasada**: Użytkownik może aktualizować tylko swoje flashcardy

**Implementacja w FlashcardService**:
```typescript
// 1. Pobranie flashcardy
const existingFlashcard = await this.getFlashcard(userId, cardId);

if (!existingFlashcard) {
  throw new Error('Flashcard not found');
}

// 2. Weryfikacja właściciela (już wykonana w getFlashcard)
// getFlashcard pobiera flashcardy tylko dla danego userId
```

**Zabezpieczenia IDOR** (Insecure Direct Object Reference):
- Zawsze filtrować zapytania przez `user_id` uwierzytelnionego użytkownika
- Nie polegać wyłącznie na RLS (może być wyłączone)
- Jawna weryfikacja właściciela w warstwie serwisowej

### Walidacja generation_id

**Zagrożenie**: Użytkownik może próbować przypisać flashcardę do generacji innego użytkownika

**Zabezpieczenie**:
```typescript
if (updateData.generation_id) {
  const { data: generation, error } = await supabase
    .from('generations')
    .select('user_id')
    .eq('id', updateData.generation_id)
    .single();

  if (error || !generation) {
    throw new Error('The specified generation does not exist');
  }

  if (generation.user_id !== userId) {
    throw new Error('The specified generation does not belong to you');
  }
}
```

### Walidacja danych wejściowych

**Zabezpieczenia**:
1. **UUID Validation**: Użycie Zod do walidacji formatu UUID dla cardId
2. **Field Validation**: Użycie Zod schema dla front, back, source, generation_id
3. **Business Rules**: Walidacja wymagalności generation_id w zależności od source
4. **String Trimming**: Automatyczne trimowanie białych znaków (zabezpieczenie przed pustymi stringami)
5. **Length Limits**: Wymuszenie limitów znaków (300 dla front, 500 dla back)

### SQL Injection

**Zabezpieczenie**: Używanie Supabase Client który automatycznie parametryzuje zapytania
- Wszystkie wartości są przekazywane jako parametry, nie interpolowane do SQL
- Brak bezpośrednich zapytań SQL

### XSS (Cross-Site Scripting)

**Zakres odpowiedzialności**: Backend API nie renderuje HTML
- Sanityzacja danych powinna być wykonana przez frontend przed wyświetleniem
- API przechowuje surowe dane

### Rate Limiting

**Obecna implementacja**: Brak
**Zalecenia na przyszłość**:
- Implementacja rate limiting dla authenticated users (np. 100 requests/minute)
- Monitoring nadużyć API
- Możliwa integracja z Cloudflare Rate Limiting

### Content-Type Validation

**Zabezpieczenie**:
```typescript
const contentType = request.headers.get('content-type');
if (!contentType?.includes('application/json')) {
  return new Response(
    JSON.stringify({
      code: 'ValidationError',
      message: 'Content-Type must be application/json'
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Error Information Disclosure

**Zabezpieczenie**:
- Nie ujawniać szczegółów wewnętrznych błędów w response
- Logować szczegóły błędów tylko po stronie serwera (console.error)
- Zwracać generyczne komunikaty błędów do klienta
- Nie ujawniać struktury bazy danych w komunikatach błędów

## 7. Obsługa błędów

### Strategie obsługi błędów

#### 1. Guard Clauses (Early Returns)

Wszystkie walidacje i sprawdzenia wykonywane na początku handlera:

```typescript
// Check 1: Supabase client availability
if (!locals.supabase) {
  return errorResponse(500, 'InternalServerError', 'Database connection not available');
}

// Check 2: Authentication
if (!locals.user) {
  return errorResponse(401, 'Unauthorized', 'Authentication required');
}

// Check 3: Content-Type
if (!contentType?.includes('application/json')) {
  return errorResponse(400, 'ValidationError', 'Content-Type must be application/json');
}
```

#### 2. Try-Catch Blocks

Owinięcie całej logiki w try-catch dla nieoczekiwanych błędów:

```typescript
export const PUT: APIRoute = async ({ request, locals, params }) => {
  try {
    // ... guard clauses ...
    // ... business logic ...
  } catch (error) {
    console.error('Update flashcard error:', error);
    return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
  }
};
```

#### 3. Service Layer Error Handling

Service rzuca błędy z odpowiednimi komunikatami, które są przechwytywane przez endpoint:

```typescript
// W FlashcardService
if (!existingFlashcard) {
  throw new Error('Flashcard not found'); // 404
}

if (existingFlashcard.user_id !== userId) {
  throw new Error('Forbidden'); // 403
}

// W endpoint
try {
  const result = await flashcardService.updateFlashcard(...);
  return successResponse(200, result);
} catch (error) {
  if (error.message === 'Flashcard not found') {
    return errorResponse(404, 'NotFound', 'Flashcard not found');
  }
  if (error.message === 'Forbidden') {
    return errorResponse(403, 'Forbidden', 'You do not have permission to update this flashcard');
  }
  // ... etc
}
```

### Mapowanie błędów na kody HTTP

| Typ błędu | HTTP Status | Code | Przykładowy komunikat |
|-----------|-------------|------|----------------------|
| Brak uwierzytelnienia | 401 | Unauthorized | Authentication required |
| Nie swoja flashcarda | 403 | Forbidden | You do not have permission to update this flashcard |
| Nie swoja generacja | 403 | Forbidden | The specified generation does not belong to you |
| Flashcarda nie istnieje | 404 | NotFound | Flashcard not found |
| Generacja nie istnieje | 404 | NotFound | The specified generation does not exist |
| Nieprawidłowy UUID | 400 | ValidationError | Card ID must be a valid UUID |
| Nieprawidłowy request body | 400 | ValidationError | Front text cannot exceed 300 characters |
| Brak generation_id dla AI | 400 | ValidationError | Generation ID is required when source is ai_full or ai_edited |
| Nieprawidłowy Content-Type | 400 | ValidationError | Content-Type must be application/json |
| Nieprawidłowy JSON | 400 | ValidationError | Invalid JSON in request body |
| Błąd bazy danych | 500 | InternalServerError | An unexpected error occurred. Please try again. |
| Nieoczekiwany błąd | 500 | InternalServerError | An unexpected error occurred. Please try again. |

### Struktura odpowiedzi błędu

```typescript
interface ErrorResponse {
  code: string;
  message: string;
}
```

### Funkcje pomocnicze

```typescript
// Helper do tworzenia odpowiedzi błędów
function errorResponse(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ code, message } as ErrorResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Helper do tworzenia odpowiedzi sukcesu
function successResponse(status: number, data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### Logowanie błędów

```typescript
// Logować szczegółowe błędy po stronie serwera
console.error('Update flashcard error:', {
  userId,
  cardId,
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
});
```

**Uwaga**: W produkcji rozważyć integrację z systemem monitoringu (np. Sentry).

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Multiple Database Queries

**Problem**: Endpoint wykonuje kilka sekwencyjnych zapytań do bazy danych:
- Pobranie istniejącej flashcardy
- Weryfikacja generation_id (jeśli podane)
- Aktualizacja flashcardy

**Wpływ**: Każde zapytanie dodaje latencję (~10-50ms per query)

**Optymalizacja**:
- Rozważyć użycie Database Transaction dla atomowości
- W przyszłości: użyć Stored Procedure lub Database Function do wykonania wszystkich operacji w jednym round-trip

#### 2. UUID Validation Overhead

**Problem**: Walidacja UUID przez Zod może dodać minimalny overhead

**Wpływ**: Nieznaczny (~1ms)

**Optymalizacja**: Brak potrzeby na tym etapie - wydajność Zod jest wystarczająca

#### 3. JSON Parsing

**Problem**: Parsowanie request body przez `request.json()`

**Wpływ**: Proporcjonalny do rozmiaru payloadu (dla małych payloadów ~1-5ms)

**Optymalizacja**: Brak potrzeby - payload jest mały

### Strategie optymalizacji

#### 1. Database Indexes

**Istniejące indeksy** (z pliku migrations):
```sql
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
```

**Wykorzystanie**:
- `idx_flashcards_user_id`: Szybkie filtrowanie flashcard po user_id
- `idx_flashcards_generation_id`: Szybka weryfikacja powiązań z generacją
- Primary Key Index na `flashcards.id`: Szybkie lookup po cardId

**Zalecenie**: Obecne indeksy są wystarczające dla tego endpointu.

#### 2. Connection Pooling

**Implementacja**: Supabase Client automatycznie zarządza connection poolingiem

**Zalecenie**: Brak dodatkowych działań wymaganych

#### 3. Caching

**Obecna implementacja**: Brak cachingu

**Rozważania**:
- Dla operacji UPDATE caching zazwyczaj nie jest stosowany (modyfikacja danych)
- Można rozważyć cache invalidation po udanej aktualizacji (jeśli implementowany caching GET)

**Zalecenie**: Brak cachingu dla tego endpointu - nie jest to operacja read-heavy

#### 4. Response Size Optimization

**Problem**: Response zawiera wszystkie pola flashcardy

**Obecna implementacja**: Response zawiera tylko niezbędne pola (FlashcardDto)

**Zalecenie**: Obecna implementacja jest optymalna

### Monitoring wydajności

**Zalecenia na przyszłość**:
- Implementacja Application Performance Monitoring (APM) np. New Relic, Datadog
- Logowanie czasu wykonania operacji
- Monitorowanie slow queries w Supabase Dashboard
- Alerting na wysokie latencje

### Szacowany czas odpowiedzi

W warunkach normalnych:
- Walidacja: ~2-5ms
- Database queries (3 queries): ~30-100ms
- JSON serialization: ~1-2ms
- **Łączny szacowany czas**: ~50-150ms

Dla 95% requestów powinno to być poniżej 200ms.

### Limity skalowalności

**Database**:
- Supabase PostgreSQL może obsłużyć tysiące concurrent connections
- Write operations są szybkie dzięki indeksom

**API**:
- Astro z SSR może obsłużyć setki requestów/sekundę na instancję
- Skalowanie horyzontalne możliwe przez Cloudflare Workers / load balancer

**Zalecenie**: Obecna implementacja jest wystarczająca dla małych i średnich aplikacji (do ~10k daily active users).

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie schematu walidacji

**Lokalizacja**: `src/lib/schemas/flashcards.ts`

**Zadania**:
1. Dodać nowy schemat walidacji dla parametru URL:
```typescript
export const flashcardIdParamSchema = z.object({
  cardId: z.string().uuid('Card ID must be a valid UUID'),
});
```

2. (Opcjonalne) Stworzyć alias dla update request schema:
```typescript
// Dla czytelności można stworzyć alias
export const updateFlashcardRequestSchema = createFlashcardRequestSchema;
```

**Walidacja**: Uruchomić TypeScript compiler, upewnić się że brak błędów typowania.

### Krok 2: Rozszerzenie FlashcardService

**Lokalizacja**: `src/lib/services/flashcard.service.ts`

**Zadania**:
1. Dodać nową metodę `updateFlashcard`:

```typescript
/**
 * Updates an existing flashcard
 * @param userId - The authenticated user ID
 * @param cardId - The flashcard ID to update
 * @param updateData - The update data
 * @returns Updated flashcard DTO
 * @throws Error if flashcard not found, forbidden, or generation validation fails
 */
async updateFlashcard(
  userId: string,
  cardId: string,
  updateData: CreateFlashcardRequestDto
): Promise<FlashcardDto> {
  // Step 1: Fetch existing flashcard
  const existingFlashcard = await this.getFlashcard(userId, cardId);
  
  if (!existingFlashcard) {
    throw new Error('Flashcard not found');
  }

  // Step 2: Verify ownership (already done by getFlashcard filtering by userId)
  // No additional check needed

  // Step 3: Validate generation_id if provided
  if (updateData.generation_id) {
    const { data: generation, error } = await this.supabase
      .from('generations')
      .select('user_id')
      .eq('id', updateData.generation_id)
      .single();

    if (error) {
      console.error('Error fetching generation:', error);
      throw new Error('Failed to validate generation');
    }

    if (!generation) {
      throw new Error('Generation not found');
    }

    if (generation.user_id !== userId) {
      throw new Error('Generation forbidden');
    }
  }

  // Step 4: Update flashcard
  const { data, error } = await this.supabase
    .from('flashcards')
    .update({
      front: updateData.front,
      back: updateData.back,
      source: updateData.source,
      generation_id: updateData.generation_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('user_id', userId) // Double-check ownership
    .select()
    .single();

  if (error) {
    console.error('Database error updating flashcard:', error);
    throw new Error(`Failed to update flashcard: ${error.message}`);
  }

  if (!data) {
    throw new Error('Flashcard not found after update');
  }

  // Step 5: Transform to DTO
  return {
    id: data.id,
    front: data.front,
    back: data.back,
    source: data.source as FlashcardSource,
    generation_id: data.generation_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
```

**Walidacja**:
- Sprawdzić czy metoda kompiluje się bez błędów TypeScript
- Upewnić się że typy są zgodne z interfejsami

### Krok 3: Utworzenie API endpoint

**Lokalizacja**: `src/pages/api/flashcards/[cardId].ts` (nowy plik)

**Zadania**:
1. Utworzyć nowy plik dla dynamic route
2. Zaimplementować handler PUT:

```typescript
import type { APIRoute } from 'astro';
import { FlashcardService } from '@/lib/services/flashcard.service';
import { createFlashcardRequestSchema, flashcardIdParamSchema } from '@/lib/schemas/flashcards';

export const prerender = false;

/**
 * Error response structure
 */
interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * PUT /api/flashcards/{cardId} - Update a flashcard
 */
export const PUT: APIRoute = async ({ request, locals, params }) => {
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

    // Guard clause: Validate cardId parameter
    const paramValidation = flashcardIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      const firstError = paramValidation.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: firstError.message,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { cardId } = paramValidation.data;

    console.log(`Processing flashcard update request for user: ${userId}, cardId: ${cardId}`);

    // Guard clause: Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Content-Type must be application/json',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request schema
    const validationResult = createFlashcardRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `${firstError.path.join('.')}: ${firstError.message}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const updateData = validationResult.data;

    // Initialize service and update flashcard
    const flashcardService = new FlashcardService(locals.supabase);

    const updatedFlashcard = await flashcardService.updateFlashcard(
      userId,
      cardId,
      updateData
    );

    console.log(`Flashcard updated successfully: ${cardId}`);

    // Return success response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update flashcard error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Map service errors to HTTP status codes
    if (error instanceof Error) {
      if (error.message === 'Flashcard not found') {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Flashcard not found',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message === 'Generation not found') {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'The specified generation does not exist',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message === 'Generation forbidden') {
        return new Response(
          JSON.stringify({
            code: 'Forbidden',
            message: 'The specified generation does not belong to you',
          } as ErrorResponse),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again.',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Walidacja**:
- Sprawdzić czy plik kompiluje się bez błędów
- Upewnić się że routing działa (Astro automatycznie rozpozna dynamic route)

### Krok 4: Testowanie manualne

**Narzędzia**: Postman, curl, lub test script

**Scenariusze testowe**:

1. **Happy Path - Successful Update**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{valid-card-id} \
  -H "Authorization: Bearer {valid-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Updated front",
    "back": "Updated back",
    "source": "manual"
  }'

# Expected: 200 OK with updated flashcard
```

2. **Unauthorized - No Token**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -d '{"front": "Test", "back": "Test", "source": "manual"}'

# Expected: 401 Unauthorized
```

3. **Validation Error - Invalid UUID**
```bash
curl -X PUT http://localhost:4321/api/flashcards/invalid-uuid \
  -H "Authorization: Bearer {valid-token}" \
  -H "Content-Type: application/json" \
  -d '{"front": "Test", "back": "Test", "source": "manual"}'

# Expected: 400 Bad Request - "Card ID must be a valid UUID"
```

4. **Validation Error - Front Too Long**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{valid-card-id} \
  -H "Authorization: Bearer {valid-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "' + 'A'.repeat(301) + '",
    "back": "Test",
    "source": "manual"
  }'

# Expected: 400 Bad Request - "Front text cannot exceed 300 characters"
```

5. **Validation Error - Missing generation_id for AI**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{valid-card-id} \
  -H "Authorization: Bearer {valid-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Test",
    "back": "Test",
    "source": "ai_full"
  }'

# Expected: 400 Bad Request - "Generation ID is required when source is ai_full or ai_edited"
```

6. **Not Found - Nonexistent Flashcard**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{nonexistent-uuid} \
  -H "Authorization: Bearer {valid-token}" \
  -H "Content-Type: application/json" \
  -d '{"front": "Test", "back": "Test", "source": "manual"}'

# Expected: 404 Not Found
```

7. **Forbidden - Other User's Flashcard**
```bash
# Create flashcard with user1, try to update with user2
curl -X PUT http://localhost:4321/api/flashcards/{user1-card-id} \
  -H "Authorization: Bearer {user2-token}" \
  -H "Content-Type: application/json" \
  -d '{"front": "Test", "back": "Test", "source": "manual"}'

# Expected: 404 Not Found (because getFlashcard filters by userId)
# OR 403 Forbidden (depending on implementation)
```

8. **Forbidden - Other User's Generation**
```bash
curl -X PUT http://localhost:4321/api/flashcards/{valid-card-id} \
  -H "Authorization: Bearer {user2-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Test",
    "back": "Test",
    "source": "ai_full",
    "generation_id": "{user1-generation-id}"
  }'

# Expected: 403 Forbidden
```

### Krok 5: Napisanie testów jednostkowych

**Lokalizacja**: `tests/unit/services/flashcard.service.test.ts`

**Zadania**:
Dodać test suite dla metody `updateFlashcard`:

```typescript
describe('FlashcardService.updateFlashcard', () => {
  it('should successfully update a flashcard', async () => {
    // Test implementation
  });

  it('should throw error if flashcard not found', async () => {
    // Test implementation
  });

  it('should throw error if flashcard belongs to another user', async () => {
    // Test implementation (via getFlashcard filtering)
  });

  it('should throw error if generation_id does not exist', async () => {
    // Test implementation
  });

  it('should throw error if generation belongs to another user', async () => {
    // Test implementation
  });

  it('should update flashcard with new generation_id', async () => {
    // Test implementation
  });

  it('should update flashcard and clear generation_id when source is manual', async () => {
    // Test implementation
  });
});
```

**Uruchomienie**:
```bash
npm run test:unit
```

### Krok 6: Napisanie testów integracyjnych

**Lokalizacja**: `tests/integration/api/flashcards-update.test.ts` (nowy plik)

**Zadania**:
Stworzyć test suite dla endpointu PUT /api/flashcards/{cardId}:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Import test utilities

describe('PUT /api/flashcards/{cardId}', () => {
  it('should return 401 if not authenticated', async () => {
    // Test implementation
  });

  it('should return 400 for invalid cardId UUID', async () => {
    // Test implementation
  });

  it('should return 400 for invalid request body', async () => {
    // Test implementation
  });

  it('should return 404 if flashcard not found', async () => {
    // Test implementation
  });

  it('should return 403 if flashcard belongs to another user', async () => {
    // Test implementation
  });

  it('should return 403 if generation_id belongs to another user', async () => {
    // Test implementation
  });

  it('should successfully update flashcard', async () => {
    // Test implementation
  });

  it('should update flashcard with AI source and generation_id', async () => {
    // Test implementation
  });
});
```

**Uruchomienie**:
```bash
npm run test:integration
```

### Krok 7: Napisanie testów E2E

**Lokalizacja**: `tests/e2e/flashcards.spec.ts`

**Zadania**:
Dodać test case dla aktualizacji flashcardy:

```typescript
test.describe('Flashcard Update', () => {
  test('user can update their own flashcard', async ({ page }) => {
    // 1. Login
    // 2. Create a flashcard
    // 3. Navigate to flashcard edit
    // 4. Update content
    // 5. Verify update success
  });

  test('user cannot update another users flashcard', async ({ page }) => {
    // Test scenario with two users
  });
});
```

**Uruchomienie**:
```bash
npm run test:e2e
```

### Krok 8: Przegląd kodu i refaktoryzacja

**Zadania**:
1. Przejrzeć kod pod kątem:
   - Zgodności z coding practices z reguł projektu
   - Czytelności i maintainability
   - Komentarzy i dokumentacji
   - Error handling patterns
   - Security best practices

2. Sprawdzić feedback z linterów:
```bash
npm run lint
```

3. Poprawić wszelkie ostrzeżenia i błędy

### Krok 9: Aktualizacja dokumentacji

**Zadania**:
1. Zaktualizować `.ai/api-plan.md`:
   - Dodać szczegóły implementacji dla PUT /flashcards/{cardId}
   - Dodać przykłady request/response
   - Zaznaczyć endpoint jako zaimplementowany

2. Zaktualizować `README.md` (jeśli zawiera API documentation)

3. Stworzyć przykładowy skrypt testowy dla tego endpointu (opcjonalnie):
   - `test-flashcard-update-endpoint.js`

### Krok 10: Deployment i monitoring

**Zadania przed deployment**:
1. Upewnić się że wszystkie testy przechodzą:
```bash
npm run test
npm run test:e2e
```

2. Zbudować projekt:
```bash
npm run build
```

3. Sprawdzić czy build się powiódł bez błędów

**Po deployment**:
1. Wykonać smoke tests na produkcji/staging
2. Monitorować logi pod kątem błędów
3. Sprawdzić metryki wydajności (response time, error rate)
4. Skonfigurować alerty dla błędów 5xx

### Krok 11: Walidacja i akceptacja

**Checklist**:
- [ ] Endpoint poprawnie aktualizuje flashcardy
- [ ] Walidacja działa zgodnie ze specyfikacją
- [ ] Autoryzacja właściciela jest wymuszana
- [ ] Walidacja generation_id działa poprawnie
- [ ] Wszystkie kody błędów są obsługiwane
- [ ] Testy jednostkowe przechodzą (coverage > 80%)
- [ ] Testy integracyjne przechodzą
- [ ] Testy E2E przechodzą
- [ ] Dokumentacja jest zaktualizowana
- [ ] Kod jest zgodny z zasadami projektu
- [ ] Linter nie zgłasza błędów
- [ ] Performance jest akceptowalna (< 200ms dla 95%)
- [ ] Security review completed
- [ ] Deployment na staging successful
- [ ] Smoke tests na staging passed

---

## Dodatkowe uwagi

### Kompatybilność z istniejącym kodem

Implementacja powinna wykorzystywać:
- Istniejący `FlashcardService` (rozszerzony o metodę `updateFlashcard`)
- Istniejący schemat walidacji `createFlashcardRequestSchema`
- Ten sam pattern co w innych endpointach (`POST /api/flashcards`, `GET /api/flashcards`)
- Ten sam error handling pattern

### Konsystencja API

Endpoint powinien być spójny z:
- `POST /api/flashcards` (podobna struktura request body)
- `GET /api/flashcards/{cardId}` (jeśli istnieje)
- Innymi endpoints w projekcie (format błędów, authentication pattern)

### Przyszłe usprawnienia

Rozważenia na przyszłość:
1. **Partial Updates**: Rozważyć PATCH zamiast PUT dla częściowych aktualizacji
2. **Optimistic Locking**: Dodać pole `version` do zapobiegania konfliktom concurrent updates
3. **Audit Log**: Logować historię zmian flashcardy
4. **Bulk Update**: Endpoint do aktualizacji wielu flashcard naraz
5. **Webhooks**: Powiadomienia o aktualizacjach flashcard
6. **Rate Limiting**: Implementacja per-user rate limits
7. **Caching**: Cache invalidation strategy gdy flashcarda jest aktualizowana

### Zasoby referencyjne

- **Astro Docs**: https://docs.astro.build/en/guides/endpoints/
- **Supabase Docs**: https://supabase.com/docs/reference/javascript/introduction
- **Zod Documentation**: https://zod.dev/
- **REST API Best Practices**: https://restfulapi.net/

---

**Koniec planu implementacji**

