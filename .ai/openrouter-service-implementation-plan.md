# Plan implementacji usługi OpenRouter

## 1. Opis usługi
Usługa `OpenRouterService` to warstwa pośrednicząca między aplikacją a API OpenRouter, odpowiedzialna za:
- Konfigurację i autoryzację połączeń.
- Budowanie i wysyłanie zapytań czatowych (LLM chat completions).
- Parsowanie odpowiedzi zgodnie ze schematem JSON.
- Obsługę błędów i logowanie.

Technologie: TypeScript 5, Astro 5, React 19, Tailwind 4, Shadcn/ui.

---

## 2. Opis konstruktora
Konstruktor przyjmuje:
- `apiKey: string` – klucz API OpenRouter, przechowywany w zmiennej środowiskowej.
- `baseUrl?: string` – URL endpointu OpenRouter (domyślnie `https://openrouter.ai/api`).
- `defaultModel?: string` – nazwa domyślnego modelu.
- `defaultResponseFormat?: ResponseFormat` – domyślny format odpowiedzi.

```ts
constructor(
  apiKey: string,
  options?: {
    baseUrl?: string;
    defaultModel?: string;
    defaultResponseFormat?: ResponseFormat;
  }
)
```

---

## 3. Publiczne metody i pola

### 3.1. Metody
- `sendChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>`
  - Buduje payload z wiadomości.
  - Uzupełnia nagłówki (auth, content-type).
  - Wysyła zapytanie do OpenRouter.
  - Zwraca sparsowaną odpowiedź JSON.

- `setModel(modelName: string): void` – ustawia model.
- `setSystemMessage(message: string): void` – ustawia komunikat systemowy.

### 3.2. Pola
- `apiKey: string`
- `baseUrl: string`
- `defaultModel: string`
- `defaultResponseFormat: ResponseFormat`

---

## 4. Prywatne metody i pola
- `buildPayload(messages: ChatMessage[], options: ChatOptions): RequestPayload`
- `handleResponse(response: Response): Promise<any>` – waliduje schemat JSON.
- `validateSchema(data: any, format: ResponseFormat): boolean`
- `logError(error: any): void`

---

## 5. Obsługa błędów
1. Błąd sieciowy (timeout, brak połączenia).
2. Odpowiedź HTTP ≠ 2xx (401, 429, 500).
3. Błąd walidacji schematu JSON.
4. Brak klucza API.
5. Przekroczenie limitów.

Dla każdego scenariusza:
- Rzucanie `OpenRouterError` z kodem i komunikatem.
- Retry (dla kodów 429 lub 5xx) z wykładniczym backoff.
- Early return i czytelny komunikat dla użytkownika.

---

## 6. Kwestie bezpieczeństwa
- Przechowywanie klucza API w `.env` i dostęp przez `process.env`.
- Ograniczanie logów (bez wrażliwych danych).
- Rate limiting po stronie serwera.
- Sanitizacja i walidacja inputu.

---

## 7. Plan wdrożenia krok po kroku
1. Przygotowanie środowiska:
   - Instalacja dependencies: `npm install axios zod`.
   - Dodanie zmiennej `OPENROUTER_API_KEY` w `.env`.

2. Stworzenie pliku serwisu:
   - `src/lib/services/openRouter.service.ts`.
   - Zaimportowanie `axios`, `zod`.

3. Implementacja konstruktora i pól.

4. Implementacja `sendChatCompletion`:
   - Przykład użycia:
     ```ts
     const messages = [
       { role: 'system', content: 'You are a helpful assistant.' },
       { role: 'user', content: 'Hello, world!' }
     ];
     const response = await service.sendChatCompletion(messages, {
       model: 'gpt-4o-mini',
       response_format: {
         type: 'json_schema',
         json_schema: {
           name: 'ChatCompletionResponse',
           strict: true,
           schema: {
             type: 'object',
             properties: {
               reply: { type: 'string' }
             },
             required: ['reply']
           }
         }
       }
     });
     ```
   - Elementy:
     1. Komunikat systemowy: `{ role: 'system', content: '...' }`
     2. Komunikat użytkownika: `{ role: 'user', content: '...' }`
     3. `response_format` z `json_schema`
     4. `model` np. `'gpt-4o-mini'`
     5. `model_params` np. `{ temperature: 0.7, max_tokens: 500 }`

5. Walidacja i obsługa błędów:
   - Użycie Zod do walidacji odpowiedzi.
   - Retry/backoff.
   - Mapowanie błędów na `OpenRouterError`.

6. Integracja w UI:
   - Wywołanie serwisu w hooku `useGenerateFlashcards`.
   - Wyświetlanie błędów przez `InlineError`.

---

## 8. ✅ STATUS IMPLEMENTACJI - UKOŃCZONE

### Zrealizowane kroki (1-6):

1. ✅ **Przygotowanie środowiska**
   - ✅ Zainstalowano `axios` (v1.7.9)
   - ✅ `zod` już dostępny (v3.25.76)
   - ✅ `OPENROUTER_API_KEY` już w `env.d.ts`

2. ✅ **Utworzone pliki**
   - ✅ `src/lib/services/openRouter.service.ts` (473 linii) - główny serwis
   - ✅ `src/lib/services/openRouter.types.ts` (125 linii) - typy i interfejsy
   - ✅ `src/lib/services/openRouter.factory.ts` (46 linii) - factory functions
   - ✅ `src/lib/services/openRouter.examples.ts` (216 linii) - przykłady

3. ✅ **Implementacja konstruktora i konfiguracji**
   - ✅ Walidacja klucza API z odpowiednimi błędami
   - ✅ Axios instance z predefiniowanymi nagłówkami
   - ✅ Konfigurowalne timeout, retries, baseUrl, defaultModel

4. ✅ **Implementacja `sendChatCompletion`**
   - ✅ Obsługa messages i options
   - ✅ Wsparcie dla JSON Schema (structured outputs)
   - ✅ Model parameters (temperature, max_tokens, etc.)
   - ✅ System messages
   - ✅ Parsowanie i walidacja odpowiedzi

5. ✅ **Walidacja i obsługa błędów**
   - ✅ Zod do walidacji schematów JSON
   - ✅ Konwersja JSON Schema → Zod Schema
   - ✅ Retry logic z eksponencjalnym backoff (3 próby domyślnie)
   - ✅ Dedykowana klasa `OpenRouterError` z kodami:
     - `MISSING_API_KEY`, `AUTHENTICATION_FAILED`
     - `RATE_LIMIT_EXCEEDED`, `NETWORK_ERROR`
     - `SERVER_ERROR`, `MAX_RETRIES_EXCEEDED`
     - `SCHEMA_VALIDATION_FAILED`, `INVALID_RESPONSE_FORMAT`

6. ✅ **Integracja w aplikacji**
   - ✅ Refaktoryzacja `GenerationService.callAIService()`
   - ✅ Usunięto bezpośrednie wywołania fetch
   - ✅ Wykorzystanie OpenRouterService z JSON Schema
   - ✅ Aktualizacja `/api/generations` endpoint
   - ✅ Szczegółowa obsługa błędów w API
   - ✅ Hook `useGenerateFlashcards` działa przez endpoint

### Kluczowe funkcjonalności:

✅ **Konfiguracja i bezpieczeństwo**
- Klucz API z zmiennych środowiskowych
- Brak logowania wrażliwych danych
- Input validation

✅ **Komunikacja z API**
- Chat completions z OpenRouter
- JSON Schema dla structured responses
- Konfigurowalne parametry modelu

✅ **Niezawodność**
- Automatyczne retry z backoff
- Timeout handling
- Rate limiting awareness
- Szczegółowe kody błędów

✅ **Developer Experience**
- Factory functions dla łatwej inicjalizacji
- TypeScript types dla wszystkich interfejsów
- 7 przykładów użycia w dokumentacji
- Re-export wszystkich typów

### Zmodyfikowane pliki:

1. **src/lib/services/generation.service.ts**
   - Integracja z OpenRouterService
   - JSON Schema dla fiszek
   - Mapowanie błędów OpenRouter

2. **src/pages/api/generations.ts**
   - Obsługa `OpenRouterError`
   - Szczegółowe kody błędów HTTP
   - Nagłówek `Retry-After`

### Następne kroki (opcjonalne):
- [ ] Testy jednostkowe dla OpenRouterService
- [ ] Testy integracyjne dla GenerationService
- [ ] Monitoring wywołań API
- [ ] Cache dla powtarzających się żądań
