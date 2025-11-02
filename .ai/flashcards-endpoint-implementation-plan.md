# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego
Endpoint `POST /flashcards` umożliwia uwierzytelnionemu użytkownikowi tworzenie jednej lub wielu fiszek. Dopuszcza zarówno dodanie ręczne (źródło `manual`), jak i akceptację propozycji AI (źródła `ai_full` lub `ai_edited`). Każda fiszka jest przypisana do użytkownika i opcjonalnie do istniejącej sesji generacji AI.

### Cele:
- Bezpieczne przyjmowanie zbioru obiektów fiszek.
- Walidacja i ochrona przed nieautoryzowanymi operacjami.
- Wstawienie fiszek w jednej transakcji do bazy Supabase.
- Zwrócenie pełnych rekordów wraz z metadanymi.

## 2. Szczegóły żądania
- Metoda HTTP: **POST**
- Ścieżka URL: `/flashcards`
- Nagłówki:
  - `Authorization: Bearer <token>` — token JWT Supabase zweryfikowany w middleware.
  - `Content-Type: application/json`

### Parametry URL i zapytania:
Brak.

### Body (JSON):
```json
{
  "flashcards": [
    {
      "front": "string (1–300 chars)",
      "back": "string (1–500 chars)",
      "source": "manual|ai_full|ai_edited",
      "generation_id": "uuid" // wymagane gdy source != 'manual'
    }
  ]
}
```

#### Szczegółowe walidacje każdego obiektu:
- `front`: typ `string`, niepusty, maks. 300 znaków.
- `back`: typ `string`, niepusty, maks. 500 znaków.
- `source`: dokładnie jedna z wartości: `manual`, `ai_full`, `ai_edited`.
- `generation_id`:
  - jeśli `source` to `ai_full` lub `ai_edited`, pole jest obowiązkowe;
  - musi być poprawnym UUID;
  - rekord w tabeli `generations` o tym UUID musi istnieć i należeć do aktualnego `user_id`.

## 3. Wykorzystywane typy i modele
- **DTO żądania:**
  - `CreateFlashcardsRequestDto`: zawiera listę `CreateFlashcardRequestDto`.
  - `CreateFlashcardRequestDto`: pola `front`, `back`, `source`, opcjonalne `generation_id`.
- **Schemat walidacji:** Zod schema `createFlashcardsSchema` w `src/lib/schemas/flashcards.ts`.
- **Model serwisowy:** obiekty przetwarzane przez metodę `FlashcardService.createFlashcards`.
- **DTO odpowiedzi:**
  - `FlashcardDto`: zawiera pola `id`, `user_id`, `generation_id`, `front`, `back`, `source`, `created_at`, `updated_at`.

## 4. Szczegóły odpowiedzi
- **Kod statusu:** 201 Created
- **Body (JSON):** tablica obiektów typu `FlashcardDto`.

Przykład pojedynczego elementu odpowiedzi:
```json
{
  "id": "b1a7f8e2-1234-5678-90ab-cdef12345678",
  "user_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "generation_id": null,
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "created_at": "2025-10-26T12:34:56Z",
  "updated_at": "2025-10-26T12:34:56Z"
}
```

### Możliwe kody błędów:
- **400 Bad Request** — nieprawidłowa struktura lub zawartość `flashcards`.
- **401 Unauthorized** — brak/wadliwy token.
- **404 Not Found** — brak sesji generacji (`generation_id`) lub nie należy do użytkownika.
- **500 Internal Server Error** — nieprzewidziany błąd serwera.

## 5. Przepływ danych i logika
1. **Middleware** (`src/middleware/index.ts`) konfiguruje klienta Supabase i weryfikuje token.
2. **Endpoint** w `src/pages/api/flashcards.ts`:
   a. Parsuje nagłówki i body.
   b. Waliduje schema Zod.
   c. Pobiera `user_id` z `context.locals.supabase.auth.getUser()`.
3. **Pre-walidacja sesji**:
   - Jeśli `generation_id` podany: zapytanie do `generations` filtrując po `id` i `user_id`.
   - W przypadku braku — wyrzucenie błędu 404.
4. **Operacja wstawienia**:
   - Przygotowanie tablicy z rekordami do insertu.
   - Jedna transakcja `.from('flashcards').insert(records)`.
5. **Mapowanie wyników** do `FlashcardDto` i zwrot klientowi.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** JWT Supabase, middleware rzuca 401 przy braku/wygaśnięciu.
- **Autoryzacja:** `user_id` nie pochodzi z body, tylko z uwierzytelnienia.
- **Walidacja:** ogranicza długości i wartości, zabezpiecza przed niepożądanym payload.
- **Bezpieczeństwo DB:** użycie Supabase Client z query parameter binding.

## 7. Obsługa błędów
| Kod  | Przyczyna                                                              | Odpowiedź (JSON)                                                        |
|------|------------------------------------------------------------------------|-------------------------------------------------------------------------|
| 400  | Błąd walidacji Zod (struktura, długość)                                | `{ code: "ValidationError", message: "Opis błędu walidacji..." }`   |
| 401  | Brak lub niepoprawny JWT                                               | `{ code: "Unauthorized", message: "Brak lub nieprawny token." }`    |
| 404  | `generation_id` nie istnieje lub brak dostępu                          | `{ code: "NotFound", message: "Generacja nie znaleziona." }`        |
| 500  | Błąd DB lub nieoczekiwany wyjątek                                      | `{ code: "InternalServerError", message: "Wystąpił błąd wewnętrzny." }` |

## 8. Rozważania dotyczące wydajności
- **Batch insert:** wstawianie wielu rekordów w jednym zapytaniu.
- **Limit liczby elementów:** opcjonalne ograniczenie do np. 100 fiszek na request.
- **Indeksy DB:** upewnić się, że `user_id` i `generation_id` są zaindeksowane.
- **Cache:** rozważyć CDN lub cache na warstwie aplikacji dla list flashcards.

## 9. Kroki wdrożenia
1. Utworzyć `src/lib/schemas/flashcards.ts`:
   - Zod schemat `createFlashcardsSchema`, enum `FlashcardSourceSchema`.
2. Zaimplementować `FlashcardService` w `src/lib/services/flashcard.service.ts`:
   - Metoda `createFlashcards(supabase, userId, requests)` obsługująca batch insert.
3. Utworzyć endpoint w `src/pages/api/flashcards.ts`:
   - Parsowanie, walidacja, autoryzacja, wywołanie serwisu.
4. Napisać testy unit i integracyjne:
   - Dla schematu Zod.
   - Dla serwisu z mockiem Supabase.
   - Dla endpointu przy użyciu Supertest lub Astro test utils.

