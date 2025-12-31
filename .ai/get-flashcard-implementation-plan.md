# API Endpoint Implementation Plan: GET /flashcards/{cardId}

## 1. Przegląd punktu końcowego

Endpoint `GET /flashcards/{cardId}` służy do pobierania szczegółowych informacji o pojedynczej fiszce na podstawie jej identyfikatora UUID. Użytkownik może odczytać tylko własne fiszki, co jest egzekwowane przez mechanizmy uwierzytelniania, autoryzacji oraz polityki Row Level Security (RLS) w bazie danych.

**Główne cechy:**
- Operacja tylko do odczytu (read-only)
- Wymaga uwierzytelnienia użytkownika
- Zwraca kompletny obiekt fiszki z metadanymi
- Stosuje politykę prywatności - użytkownik widzi tylko własne fiszki

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/flashcards/{cardId}
```

### Parametry URL (Path Parameters)
- **cardId** (wymagany, string):
  - Typ: UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
  - Opis: Unikalny identyfikator fiszki do pobrania
  - Walidacja: Musi być poprawnym formatem UUID
  - Przykład: `b1a7f8e2-1234-5678-90ab-cdef12345678`

### Query Parameters
Brak

### Request Headers
- **Authorization** (wymagany): `Bearer <jwt_token>`
- **Content-Type**: Nie wymagany (GET nie zawiera body)

### Request Body
Brak (metoda GET nie przyjmuje body)

## 3. Wykorzystywane typy

### Response DTOs
```typescript
// Z src/types.ts
export type GetFlashcardResponseDto = FlashcardDto;

export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'
>;

export type FlashcardSource = 'manual' | 'ai_full' | 'ai_edited';
```

### Error Response
```typescript
interface ErrorResponse {
  code: string;
  message: string;
}
```

### Service Layer
Wykorzystuje istniejącą metodę z `FlashcardService`:

```typescript
async getFlashcard(userId: string, flashcardId: string): Promise<FlashcardDto | null>
```

## 4. Szczegóły odpowiedzi

### Sukces: 200 OK

**Content-Type**: `application/json`

**Response Body**:
```json
{
  "id": "b1a7f8e2-1234-5678-90ab-cdef12345678",
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "generation_id": null,
  "created_at": "2025-10-26T12:34:56.789Z",
  "updated_at": "2025-10-26T12:34:56.789Z"
}
```

**Pola odpowiedzi**:
- `id` (string, UUID): Identyfikator fiszki
- `front` (string): Przednia strona fiszki (pytanie), max 300 znaków
- `back` (string): Tylna strona fiszki (odpowiedź), max 500 znaków
- `source` (string): Źródło fiszki - `manual`, `ai_full`, lub `ai_edited`
- `generation_id` (string | null): UUID generacji AI (jeśli fiszka pochodzi z AI)
- `created_at` (string, ISO 8601): Data utworzenia
- `updated_at` (string, ISO 8601): Data ostatniej aktualizacji

### Błędy

#### 401 Unauthorized
Brak tokenu uwierzytelniającego lub token jest nieprawidłowy.

```json
{
  "code": "Unauthorized",
  "message": "Authentication required"
}
```

**Headers**: `Content-Type: application/json`

#### 403 Forbidden
**Uwaga**: W implementacji nie zwracamy 403, zamiast tego używamy 404, aby nie ujawniać istnienia fiszki należącej do innego użytkownika.

#### 404 Not Found
Fiszka o podanym `cardId` nie istnieje lub nie należy do zalogowanego użytkownika.

```json
{
  "code": "NotFound",
  "message": "Flashcard not found"
}
```

**Headers**: `Content-Type: application/json`

**Uwaga bezpieczeństwa**: Nie rozróżniamy, czy fiszka nie istnieje, czy należy do innego użytkownika. Zapobiega to wyciekowi informacji o istnieniu zasobów.

#### 500 Internal Server Error
Nieoczekiwany błąd serwera, np. błąd połączenia z bazą danych.

```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

**Headers**: `Content-Type: application/json`

## 5. Przepływ danych

### Diagram przepływu
```
1. Żądanie HTTP GET → Astro API Route (/api/flashcards/[cardId].ts)
   ↓
2. Sprawdzenie dostępności Supabase Client (locals.supabase)
   ↓
3. Sprawdzenie uwierzytelnienia użytkownika (locals.user)
   ↓
4. Ekstrakcja parametru cardId z Astro.params
   ↓
5. Walidacja formatu UUID cardId
   ↓
6. Inicjalizacja FlashcardService(locals.supabase)
   ↓
7. Wywołanie flashcardService.getFlashcard(userId, cardId)
   ↓
8. Query do bazy danych:
   SELECT id, user_id, generation_id, front, back, source, created_at, updated_at
   FROM flashcards
   WHERE id = cardId AND user_id = userId
   LIMIT 1
   ↓
9. Polityki RLS weryfikują user_id (dodatkowa warstwa bezpieczeństwa)
   ↓
10. Serwis zwraca FlashcardDto | null
    ↓
11. Route Handler:
    - null → 404 Not Found
    - FlashcardDto → 200 OK z danymi
    - Error → odpowiedni kod błędu
```

### Interakcje z bazą danych

**Tabela**: `flashcards`

**Query**:
```sql
SELECT 
  id, 
  user_id, 
  generation_id, 
  front, 
  back, 
  source, 
  created_at, 
  updated_at
FROM flashcards
WHERE id = $1 AND user_id = $2
LIMIT 1;
```

**Wykorzystywane indeksy**:
- Primary Key na `id` (szybkie wyszukiwanie po ID)
- Index `idx_flashcards_user_id` (optymalizuje filtrowanie po user_id)

**RLS Policies**:
- Policy: `USING (auth.uid() = user_id)`
- Dodatkowa warstwa ochrony na poziomie bazy danych

### Zewnętrzne usługi
Brak - endpoint nie korzysta z zewnętrznych API.

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)
- **Mechanizm**: JWT Bearer token w header `Authorization`
- **Implementacja**: Token weryfikowany przez middleware Astro
- **Dostęp**: `locals.user` zawiera dane zalogowanego użytkownika
- **Błąd**: Brak tokenu lub nieprawidłowy token → 401 Unauthorized

### Autoryzacja (Authorization)
- **Kontrola dostępu**: Użytkownik może pobierać tylko własne fiszki
- **Implementacja**: 
  - Service layer filtruje po `user_id`
  - Query zawiera klauzulę `WHERE user_id = :userId`
- **RLS (Row Level Security)**: Polityki Supabase egzekwują `auth.uid() = user_id`
- **Błąd**: Próba dostępu do cudzej fiszki → 404 Not Found (nie ujawniamy istnienia)

### Walidacja danych wejściowych

#### Walidacja parametru cardId
- **Format**: UUID v4 (regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
- **Biblioteka**: Użyj Zod schema dla spójności z resztą aplikacji
- **Błąd walidacji**: 400 Bad Request lub 404 Not Found

**Przykład schematu Zod**:
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid();
```

### Zapobieganie atakom

#### SQL Injection
- **Ochrona**: Supabase Client automatycznie parametryzuje zapytania
- **Dodatkowa walidacja**: UUID format validation zapobiega wstrzyknięciom

#### Information Disclosure
- **Problem**: Ujawnianie, czy zasób istnieje, gdy użytkownik nie ma dostępu
- **Rozwiązanie**: Zwracamy 404 zarówno dla nieistniejących fiszek, jak i dla tych należących do innych użytkowników
- **Implementacja**: Nie rozróżniamy w komunikacie błędu przyczyny braku dostępu

#### Brute Force / Enumeration
- **Ryzyko**: Próby odgadnięcia UUID fiszek innych użytkowników
- **Ochrona**: 
  - UUID są losowe i nieprzewidywalne (128-bit entropy)
  - Rate limiting na poziomie infrastruktury (opcjonalnie)
  - Brak ujawniania informacji o istnieniu zasobu

### Bezpieczeństwo danych
- **Poufność**: Dane fiszki widoczne tylko dla właściciela
- **Integralność**: Operacja read-only nie modyfikuje danych
- **Dostępność**: Zoptymalizowane zapytania dzięki indeksom

## 7. Obsługa błędów

### Katalog błędów

| Kod HTTP | Error Code | Scenariusz | Message |
|----------|------------|------------|---------|
| 400 | ValidationError | Nieprawidłowy format UUID w cardId | "Invalid flashcard ID format" |
| 401 | Unauthorized | Brak tokenu lub token nieprawidłowy | "Authentication required" |
| 404 | NotFound | Fiszka nie istnieje lub brak dostępu | "Flashcard not found" |
| 500 | InternalServerError | Brak połączenia z Supabase | "Database connection not available" |
| 500 | InternalServerError | Błąd zapytania do bazy | "An unexpected error occurred" |

### Szczegółowe scenariusze

#### 1. Brak dostępu do Supabase Client
```typescript
if (!locals.supabase) {
  return new Response(
    JSON.stringify({
      code: 'InternalServerError',
      message: 'Database connection not available',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

#### 2. Brak uwierzytelnienia
```typescript
if (!locals.user) {
  return new Response(
    JSON.stringify({
      code: 'Unauthorized',
      message: 'Authentication required',
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

#### 3. Nieprawidłowy format UUID
```typescript
// Walidacja za pomocą Zod
const uuidSchema = z.string().uuid();
const validationResult = uuidSchema.safeParse(cardId);

if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      code: 'ValidationError',
      message: 'Invalid flashcard ID format',
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

#### 4. Fiszka nie znaleziona lub brak dostępu
```typescript
const flashcard = await flashcardService.getFlashcard(userId, cardId);

if (!flashcard) {
  return new Response(
    JSON.stringify({
      code: 'NotFound',
      message: 'Flashcard not found',
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

#### 5. Błąd bazy danych
```typescript
try {
  const flashcard = await flashcardService.getFlashcard(userId, cardId);
  // ...
} catch (error) {
  console.error('Error retrieving flashcard:', error);
  
  return new Response(
    JSON.stringify({
      code: 'InternalServerError',
      message: 'An unexpected error occurred',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### Logowanie błędów
- **Poziom ERROR**: Nieoczekiwane błędy bazy danych, wyjątki
- **Poziom WARN**: Próby dostępu do nieistniejących fiszek (opcjonalnie dla audytu)
- **Poziom INFO**: Udane pobranie fiszki (opcjonalnie)

**Przykład**:
```typescript
console.error('Error retrieving flashcard:', {
  userId: locals.user?.id,
  cardId,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

#### Wykorzystanie indeksów
- **Primary Key na `id`**: O(log n) lookup time
- **Index na `user_id`**: Przyspiesza filtrowanie WHERE user_id = :userId
- **Złożone zapytanie**: WHERE id = :cardId AND user_id = :userId korzysta z obu indeksów

#### Strategia SELECT
- **Explicit column selection**: Pobieramy tylko potrzebne kolumny (nie używamy SELECT *)
- **Single row query**: `.single()` w Supabase optymalizuje do LIMIT 1

### Caching

#### HTTP Caching Headers (opcjonalnie)
Możliwość dodania cache headers, jeśli fiszki są rzadko modyfikowane:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, max-age=60', // Cache na 60 sekund
  'ETag': generateETag(flashcard), // Opcjonalne - dla conditional requests
}
```

**Uwaga**: Cache powinien być `private` (nie `public`), ponieważ dane są specyficzne dla użytkownika.

#### Application-level caching
- Rozważyć cache na poziomie aplikacji (np. Redis) dla często pobieranych fiszek
- TTL: 5-10 minut
- Invalidation: Po każdej aktualizacji fiszki

### Limity i throttling

#### Rate Limiting (opcjonalnie)
- Limit: 100 requestów/minutę na użytkownika
- Implementacja: Middleware lub API Gateway (np. Cloudflare, nginx)
- Response: 429 Too Many Requests

#### Connection Pooling
- Supabase Client zarządza connection poolem automatycznie
- Konfiguracja: Domyślne ustawienia są zazwyczaj optymalne

### Monitoring

#### Metryki do śledzenia
- **Response time**: Średni czas odpowiedzi (target: < 100ms)
- **Error rate**: Procent żądań zakończonych błędem (target: < 1%)
- **Database query time**: Czas wykonania zapytania (target: < 50ms)
- **404 rate**: Procent żądań 404 (może wskazywać na problemy z klientem)

#### Alerty
- Response time > 500ms
- Error rate > 5%
- Database errors > 10/min

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury plików
**Cel**: Utworzyć plik endpointu zgodnie z konwencją Astro.

**Akcje**:
```bash
# Struktura pliku dla dynamic route w Astro
src/pages/api/flashcards/[cardId].ts
```

**Szablon początkowy**:
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

interface ErrorResponse {
  code: string;
  message: string;
}

export const GET: APIRoute = async ({ params, locals }) => {
  // TODO: Implementation
};
```

### Krok 2: Implementacja podstawowej walidacji i guard clauses
**Cel**: Zabezpieczyć endpoint przed nieprawidłowymi żądaniami.

**Akcje**:
1. Sprawdzić dostępność `locals.supabase`
2. Sprawdzić uwierzytelnienie `locals.user`
3. Wyodrębnić `cardId` z `params`
4. Zwalidować format UUID `cardId` za pomocą Zod

**Kod**:
```typescript
import { z } from 'zod';
import { FlashcardService } from '../../../lib/services/flashcard.service';

const cardIdSchema = z.string().uuid();

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Guard: Supabase client availability
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guard: User authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = locals.user.id;
    const cardId = params.cardId;

    // Validate cardId format
    const validationResult = cardIdSchema.safeParse(cardId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid flashcard ID format',
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Service call and response
    
  } catch (error) {
    // TODO: Error handling
  }
};
```

### Krok 3: Integracja z FlashcardService
**Cel**: Wykorzystać istniejącą metodę serwisu do pobrania fiszki.

**Akcje**:
1. Utworzyć instancję `FlashcardService`
2. Wywołać metodę `getFlashcard(userId, cardId)`
3. Obsłużyć przypadek null (404)
4. Zwrócić sukces (200) z danymi fiszki

**Kod**:
```typescript
// Po walidacji...
console.log(`Retrieving flashcard ${cardId} for user ${userId}`);

// Initialize service
const flashcardService = new FlashcardService(locals.supabase);

// Get flashcard
const flashcard = await flashcardService.getFlashcard(userId, cardId);

// Handle not found
if (!flashcard) {
  console.log(`Flashcard ${cardId} not found for user ${userId}`);
  
  return new Response(
    JSON.stringify({
      code: 'NotFound',
      message: 'Flashcard not found',
    } as ErrorResponse),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

// Return success response
console.log(`Successfully retrieved flashcard ${cardId}`);

return new Response(
  JSON.stringify(flashcard),
  {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }
);
```

### Krok 4: Implementacja obsługi błędów
**Cel**: Zapewnić graceful handling wszystkich błędów z odpowiednimi komunikatami.

**Akcje**:
1. Catch block dla wyjątków
2. Logowanie błędów
3. Zwracanie 500 Internal Server Error

**Kod**:
```typescript
} catch (error) {
  console.error('Error retrieving flashcard:', {
    userId: locals.user?.id,
    cardId: params.cardId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

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
```

### Krok 5: Dodanie testów jednostkowych
**Cel**: Przetestować wszystkie ścieżki wykonania endpointu.

**Akcje**:
1. Utworzyć plik testowy: `tests/integration/api/flashcards-get-single.test.ts`
2. Przetestować scenariusze:
   - ✅ Pomyślne pobranie fiszki (200)
   - ✅ Brak uwierzytelnienia (401)
   - ✅ Nieprawidłowy UUID (400)
   - ✅ Fiszka nie znaleziona (404)
   - ✅ Próba dostępu do cudzej fiszki (404)
   - ✅ Błąd bazy danych (500)

**Przykład testu**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIContext } from 'astro';
import { GET } from '../../../src/pages/api/flashcards/[cardId]';

describe('GET /api/flashcards/[cardId]', () => {
  it('should return 200 with flashcard data when found', async () => {
    const mockFlashcard = {
      id: 'test-uuid',
      front: 'Question',
      back: 'Answer',
      source: 'manual',
      generation_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockService = {
      getFlashcard: vi.fn().mockResolvedValue(mockFlashcard),
    };

    const context = {
      params: { cardId: 'test-uuid' },
      locals: {
        supabase: {},
        user: { id: 'user-id' },
      },
    } as unknown as APIContext;

    // Mock FlashcardService
    vi.mock('../../../src/lib/services/flashcard.service', () => ({
      FlashcardService: vi.fn(() => mockService),
    }));

    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockFlashcard);
  });

  it('should return 401 when user is not authenticated', async () => {
    const context = {
      params: { cardId: 'test-uuid' },
      locals: {
        supabase: {},
        user: null,
      },
    } as unknown as APIContext;

    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('Unauthorized');
  });

  // ... więcej testów dla innych scenariuszy
});
```

### Krok 6: Dodanie testów integracyjnych (opcjonalnie)
**Cel**: Przetestować endpoint z rzeczywistą (testową) bazą danych.

**Akcje**:
1. Skonfigurować testową instancję Supabase
2. Utworzyć testowe dane (setup)
3. Wykonać rzeczywiste HTTP requesty
4. Zweryfikować odpowiedzi
5. Wyczyścić dane (teardown)

### Krok 7: Dodanie testów E2E z Playwright (opcjonalnie)
**Cel**: Przetestować endpoint w kontekście całej aplikacji.

**Akcje**:
1. Utworzyć testowy scenariusz w `tests/e2e/flashcards-single.spec.ts`
2. Zalogować użytkownika
3. Utworzyć fiszkę
4. Pobrać fiszkę przez API
5. Zweryfikować odpowiedź

**Przykład**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('GET /api/flashcards/[cardId]', () => {
  test('should retrieve a flashcard successfully', async ({ request, page }) => {
    // Login
    await page.goto('/auth/login');
    // ... login logic

    // Create a flashcard
    const createResponse = await request.post('/api/flashcards', {
      data: {
        flashcards: [{
          front: 'Test Question',
          back: 'Test Answer',
          source: 'manual',
        }],
      },
    });

    const [flashcard] = await createResponse.json();
    const cardId = flashcard.id;

    // Get the flashcard
    const getResponse = await request.get(`/api/flashcards/${cardId}`);
    
    expect(getResponse.status()).toBe(200);
    
    const data = await getResponse.json();
    expect(data.id).toBe(cardId);
    expect(data.front).toBe('Test Question');
    expect(data.back).toBe('Test Answer');
  });
});
```

### Krok 8: Dokumentacja i Code Review
**Cel**: Przygotować endpoint do wdrożenia produkcyjnego.

**Akcje**:
1. Dodać komentarze JSDoc do funkcji
2. Zaktualizować dokumentację API (jeśli istnieje)
3. Wykonać code review
4. Sprawdzić zgodność z linterem i formatowaniem
5. Uruchomić wszystkie testy

### Krok 9: Deployment i monitoring
**Cel**: Wdrożyć endpoint na produkcję i monitorować jego działanie.

**Akcje**:
1. Merge do branch głównego
2. Wdrożenie przez CI/CD pipeline
3. Weryfikacja smoke tests na produkcji
4. Monitoring metryk:
   - Response time
   - Error rate
   - 404 rate
5. Sprawdzić logi pod kątem błędów

## 10. Checklist wdrożenia

- [ ] Utworzony plik `src/pages/api/flashcards/[cardId].ts`
- [ ] Zaimplementowane guard clauses (Supabase, auth)
- [ ] Walidacja UUID za pomocą Zod
- [ ] Integracja z `FlashcardService.getFlashcard()`
- [ ] Obsługa wszystkich kodów błędów (400, 401, 404, 500)
- [ ] Logowanie błędów z kontekstem
- [ ] Testy jednostkowe (wszystkie scenariusze)
- [ ] Testy integracyjne (opcjonalnie)
- [ ] Testy E2E (opcjonalnie)
- [ ] Dokumentacja JSDoc
- [ ] Code review
- [ ] Linter i formatter passed
- [ ] Deployment na środowisko testowe
- [ ] Smoke tests na produkcji
- [ ] Monitoring skonfigurowany

## 11. Potencjalne rozszerzenia (Future Enhancements)

### Conditional Requests (ETag)
Implementacja ETag headers dla optymalizacji:
- `If-None-Match` header → 304 Not Modified
- Oszczędność transferu danych

### Partial Response (Fields Selection)
Query param `fields` do wyboru konkretnych pól:
```
GET /api/flashcards/{cardId}?fields=id,front,back
```

### Include Related Resources
Query param `include` do pobierania powiązanych danych:
```
GET /api/flashcards/{cardId}?include=generation
```
Zwróci również dane o generacji AI (jeśli generation_id != null).

### Audit Trail
Logowanie każdego dostępu do fiszki (kto, kiedy, z jakiego IP).

### Rate Limiting Headers
Dodanie headers informujących o limitach:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

**Dokument utworzony**: 2025-12-30  
**Wersja**: 1.0  
**Autor**: AI Implementation Planner

