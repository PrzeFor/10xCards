# OpenRouter Service

Usługa do komunikacji z OpenRouter API dla generowania treści przez LLM (Large Language Models).

## Struktura plików

```
src/lib/services/
├── openRouter.service.ts    # Główna implementacja serwisu
├── openRouter.types.ts      # Typy TypeScript i interfejsy
├── openRouter.factory.ts    # Factory functions do tworzenia instancji
└── openRouter.examples.ts   # Przykłady użycia
```

## Szybki start

### 1. Podstawowe użycie

```typescript
import { createOpenRouterService } from './openRouter.factory';

const service = createOpenRouterService();

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
];

const response = await service.sendChatCompletion(messages);
console.log(response.choices[0].message.content);
```

### 2. Użycie z JSON Schema (Structured Outputs)

```typescript
import { createOpenRouterService } from './openRouter.factory';
import type { ResponseFormat } from './openRouter.types';

const service = createOpenRouterService();

const responseFormat: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'FlashcardsResponse',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' }
            },
            required: ['front', 'back']
          }
        }
      },
      required: ['flashcards']
    }
  }
};

const response = await service.sendChatCompletion(messages, {
  response_format: responseFormat,
  model_params: {
    temperature: 0.7,
    max_tokens: 2000
  }
});
```

### 3. Użycie dedykowanej factory dla fiszek

```typescript
import { createFlashcardGenerationService } from './openRouter.factory';

// Pre-konfigurowany serwis dla generowania fiszek
const service = createFlashcardGenerationService();
```

## Konfiguracja

### Zmienne środowiskowe

Dodaj do `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Opcje konstruktora

```typescript
interface OpenRouterServiceOptions {
  baseUrl?: string;           // Domyślnie: 'https://openrouter.ai/api/v1'
  defaultModel?: string;      // Domyślnie: 'anthropic/claude-3.5-sonnet'
  defaultResponseFormat?: ResponseFormat;
  timeout?: number;           // Domyślnie: 60000 (60s)
  maxRetries?: number;        // Domyślnie: 3
  retryDelay?: number;        // Domyślnie: 1000 (1s)
}
```

## API

### Metody publiczne

#### `sendChatCompletion(messages, options?)`
Wysyła żądanie chat completion do OpenRouter API.

**Parametry:**
- `messages: ChatMessage[]` - Tablica wiadomości czatu
- `options?: ChatOptions` - Opcjonalna konfiguracja żądania

**Zwraca:** `Promise<ChatResponse>`

**Przykład:**
```typescript
const response = await service.sendChatCompletion(
  [{ role: 'user', content: 'Hello!' }],
  {
    model: 'openai/gpt-4-turbo',
    model_params: { temperature: 0.5 }
  }
);
```

#### `setModel(modelName)`
Ustawia domyślny model dla przyszłych żądań.

```typescript
service.setModel('google/gemini-pro');
```

#### `setSystemMessage(message)`
Ustawia globalny system message.

```typescript
service.setSystemMessage('You are an expert educator.');
```

## Obsługa błędów

Serwis rzuca `OpenRouterError` z następującymi kodami:

| Kod | Opis | HTTP Status |
|-----|------|-------------|
| `MISSING_API_KEY` | Brak klucza API | - |
| `AUTHENTICATION_FAILED` | Nieprawidłowy klucz API | 401 |
| `RATE_LIMIT_EXCEEDED` | Przekroczony limit żądań | 429 |
| `NETWORK_ERROR` | Błąd sieci | - |
| `SERVER_ERROR` | Błąd serwera OpenRouter | 5xx |
| `MAX_RETRIES_EXCEEDED` | Wyczerpane próby | - |
| `SCHEMA_VALIDATION_FAILED` | Błąd walidacji schematu | - |
| `INVALID_RESPONSE_FORMAT` | Nieprawidłowy format odpowiedzi | - |

**Przykład obsługi:**
```typescript
import { OpenRouterError } from './openRouter.types';

try {
  const response = await service.sendChatCompletion(messages);
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Poczekaj i spróbuj ponownie
    }
  }
}
```

## Retry Logic

Serwis automatycznie ponawia żądania dla błędów przejściowych:
- Kody HTTP: 408, 429, 500, 502, 503, 504
- Błędy sieciowe
- Eksponencjalny backoff: `delay * 2^attempt`
- Domyślnie: 3 próby z 1s początkowym opóźnieniem

## Integracja w projekcie

### W GenerationService

```typescript
import { createFlashcardGenerationService } from './openRouter.factory';

private async callAIService(sourceText: string): Promise<AIServiceResponse> {
  const openRouterService = createFlashcardGenerationService();
  
  const response = await openRouterService.sendChatCompletion(
    messages,
    { response_format: flashcardSchema }
  );
  
  // ... przetwarzanie odpowiedzi
}
```

### W API Endpoints

```typescript
import { OpenRouterError } from '../../lib/services/openRouter.types';

try {
  // ... logika biznesowa
} catch (error) {
  if (error instanceof OpenRouterError) {
    // Dedykowana obsługa błędów OpenRouter
    return new Response(/* ... */);
  }
}
```

## Modele

Popularne modele dostępne przez OpenRouter:
- `anthropic/claude-3.5-sonnet` (domyślny)
- `openai/gpt-4-turbo`
- `openai/gpt-4o-mini`
- `google/gemini-pro`
- `meta-llama/llama-3-70b-instruct`

Zobacz pełną listę: https://openrouter.ai/models

## Bezpieczeństwo

- ✅ Klucz API przechowywany w zmiennych środowiskowych
- ✅ Brak logowania wrażliwych danych (poza trybem DEV)
- ✅ Walidacja wszystkich inputów
- ✅ Bezpieczne nagłówki HTTP

## Testowanie

Zobacz `openRouter.examples.ts` dla kompletnych przykładów użycia w różnych scenariuszach.

## Więcej informacji

- [Dokumentacja OpenRouter API](https://openrouter.ai/docs)
- [JSON Schema Specification](https://json-schema.org/)
- Przykłady: `src/lib/services/openRouter.examples.ts`
- Plan implementacji: `.ai/openrouter-service-implementation-plan.md`


