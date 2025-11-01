# API Endpoint Implementation Plan: POST /generations

## 1. Przegląd punktu końcowego
- **Cel:** Pozwolić zalogowanym użytkownikom na przesłanie dużego fragmentu tekstu (500–15000 znaków) i otrzymanie w odpowiedzi propozycji fiszek wygenerowanych przez usługę AI.
- **Zastosowanie biznesowe:** Użytkownicy mogą automatycznie tworzyć materiały do nauki, co zwiększa zaangażowanie i przyspiesza proces tworzenia treści edukacyjnych.
- **Metoda HTTP:** POST
- **Ścieżka:** `/generations`
- **Autoryzacja:** Bearer token (Supabase Auth) wymagany w nagłówku

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **URL:** `/generations`
- **Nagłówki:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Parametry:**
  - **Wymagane:**
    - `source_text` (string) – oryginalny tekst źródłowy, min. 500, max. 15000 znaków
  - **Opcjonalne:** brak
- **Przykład żądania (curl):**
  ```bash
  curl -X POST https://api.example.com/generations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"source_text": "Długi tekst do analizy..."}'
  ```
- **Walidacja wejścia:**
  - Po stronie serwera (Zod) i bazy (CHECK constraint)
  - Wczesne zwrócenie 400, jeśli `source_text` poza zakresem

## 3. Wykorzystywane typy
- **Wejście:**
  - `CreateGenerationRequestDto`:
    ```ts
    { source_text: string }
    ```
- **Wyjście (sukces):**
  - `CreateGenerationResponseDto`:
    ```ts
    {
      id: string,
      model: string,
      status: 'completed' | 'pending' | 'failed',
      generated_count: number,
      flashcards_proposals: FlashcardProposalDto[]
    }
    ```
  - `FlashcardProposalDto`:
    ```ts
    { id: string; front: string; back: string; source: FlashcardSource }
    ```
- **Wyjście (błąd):**
  - `ErrorResponseDto` (wspólne):
    ```ts
    { code: string; message: string }
    ```

## 4. Przepływ danych
- **High-level diagram:**
  ```text
  Client -> Middleware (RateLimiting, Auth, BodyParser) -> API Handler -> GenerationService -> Database -> AI Service -> Database -> API Handler -> Client
  ```
1. **Odbiór żądania** w Astro endpoint (`src/pages/api/generations.ts`).
2. **Autoryzacja**: pobranie `user_id` z `context.locals.supabase.auth.getUser()`. Zwrot 401, jeśli brak tokenu.
3. **Walidacja** przy użyciu Zod schema w `src/lib/schemas/generation.ts`.
4. **Inicjalizacja transakcji DB** (Supabase client):
   - Wstawienie rekordu w `generations` z `status='pending'`, `source_text`, `source_text_length`, `user_id`, `model=null`, `generated_count=0`.
5. **Wywołanie AI** przez `GenerationService.generateFlashcards(sourceText)`:
   - Asynchroniczne połączenie z Openrouter.ai
   - Obsługa timeout i retry (2 próby) z backoff.
6. **Success path:**
   - Pobranie listy propozycji fiszek (JSON) z AI.
   - **Batch insert** wszystkich fiszek do `flashcards` (`generation_id`, `source='ai_full'`, `user_id`).
   - **Update** rekordu `generations`: `status='completed'`, `model`, `generated_count`, `updated_at`.
   - Commit transakcji.
   - Zwrócenie 201 z `CreateGenerationResponseDto`.
7. **Error path (AI lub sieć):**
   - Rollback transakcji lub kontynuacja w nowej transakcji.
   - Wstawienie rekordu do `generation_error_logs` z `generation_id` i szczegółowym `error_message`.
   - Aktualizacja `generations.status = 'failed'`.
   - Zwrócenie 500 z kodem `AIServiceError`.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie & autoryzacja:** mechanizm oparty na Supabase Auth; każda prośba weryfikowana poprzez `context.locals.supabase.auth.getUser()`, wymuszenie poprawnego tokenu JWT i nadanie `user_id`.
- **Audyt dostępu i logi:** rejestrować wszystkie żądania, w tym nieudane próby uwierzytelniania (user_id, timestamp, endpoint, status).
- **Ochrona przed injection:** użycie parametrów zapytań Supabase zamiast interpolacji.
- **Limit rozmiaru ciała:** odrzucenie payloadów > 16KB.
- **Logowanie:** minimalne logi, maskowanie wrażliwych danych.

## 6. Obsługa błędów
| Status | Kod błędu            | Warunek                                      | Odpowiedź                                              |
|--------|----------------------|-----------------------------------------------|--------------------------------------------------------|
| 400    | InvalidSourceText    | `source_text` < 500 lub > 15000              | `{ code: 'InvalidSourceText', message: '...' }`        |
| 401    | Unauthorized         | Brak lub nieprawidłowy token                 | `{ code: 'Unauthorized', message: 'Authentication required.' }` | 
| 500    | AIServiceError       | Błąd AI lub DB                                | `{ code: 'AIServiceError', message: '...' }`           |

## 7. Rozważania dotyczące wydajności
- **Batch inserts:** zmniejsza liczbę round-tripów do DB.
- **Connection pooling:** w kliencie Supabase.
- **Asynchroniczne wywołania:** nieblokujące IO.
- **Limit generowanych fiszek:** max 50 na jedną generację.
_ **Timeout dla AI** max 60 sekund

## 8. Kroki implementacji
1. Zdefiniować struktury danych i walidację wejścia/wyjścia (DTO) oraz zasady walidacji na poziomie API.
2. Utworzyć i zarejestrować warstwę serwisów (services):
   - Stworzyć klasę `GenerationService` w `src/lib/services/generation.service.ts`.
   - Zaimplementować metody:
     - `createGeneration(userId: string, sourceText: string)` – inicjalizacja wpisu, wywołanie AI, zapis wyników.
     - `callAIService(text: string)` – obsługa komunikacji z AI model, retry i timeout.
3. Skonfigurować uwierzytelnianie przez Supabase Auth:
   - Zainicjalizować klienta Supabase w middleware.
   - Dodać `supabase` do `context.locals` w handlerze.
   - Weryfikować token JWT (`context.locals.supabase.auth.getUser()`) i zwracać 401 dla nieautoryzowanych żądań.
4. Zaimplementować handler endpointu:
   - Pobranie i weryfikacja tożsamości użytkownika przy użyciu Supabase Auth (`context.locals.supabase.auth.getUser()`).
   - Parsowanie i walidacja żądania przy pomocy Zod schematów.
   - Wywołanie `GenerationService` i zwrócenie odpowiedzi HTTP z odpowiednim kodem.
5. Dodać middleware/warstwy pośrednie:
   - Ochrona przed nadmierną liczbą żądań (rate limiting).
   - Uniwersalne obsługiwanie błędów i mapowanie na kody statusu.
6. Zaplanować i napisać testy jednostkowe i integracyjne dla:
   - Zod schematów (walidacja danych).
   - Logiki serwisu generacji i zapisu do bazy.
   - End-to-end dla całego endpointu.
7. Zaktualizować typy i modele w warstwie bazy danych lub migracje, jeśli to konieczne.
