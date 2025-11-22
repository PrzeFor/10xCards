# Testing Documentation

Kompleksowa dokumentacja środowiska testowego dla projektu **10xCards**.

## 📋 Spis treści

- [Technologie testowe](#technologie-testowe)
- [Struktura katalogów](#struktura-katalogów)
- [Uruchamianie testów](#uruchamianie-testów)
- [Pisanie testów](#pisanie-testów)
- [Konfiguracja](#konfiguracja)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🛠 Technologie testowe

### Testy jednostkowe i integracyjne
- **Vitest** - szybki framework testowy z natywnym wsparciem ESM i TypeScript
- **React Testing Library** - testowanie komponentów React z perspektywy użytkownika
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **Happy DOM** - lekkie środowisko DOM dla testów
- **MSW (Mock Service Worker)** - mockowanie requestów HTTP

### Testy E2E
- **Playwright** - framework do testów end-to-end (multi-browser support)
- **@axe-core/playwright** - automatyczne testy dostępności (WCAG 2.1)

## 📁 Struktura katalogów

```
tests/
├── unit/                    # Testy jednostkowe
│   ├── schemas/            # Testy schematów Zod
│   │   ├── generation.test.ts
│   │   ├── auth.test.ts
│   │   └── flashcards.test.ts
│   ├── services/           # Testy serwisów
│   ├── components/         # Testy komponentów React
│   │   └── Button.test.tsx
│   └── utils/              # Testy funkcji pomocniczych
│       └── utils.test.ts
│
├── integration/            # Testy integracyjne
│   ├── api/               # Testy API endpoints
│   └── middleware/        # Testy middleware
│
├── e2e/                   # Testy E2E (Playwright)
│   ├── auth.spec.ts       # Flow uwierzytelniania
│   └── accessibility.spec.ts  # Testy dostępności
│
├── fixtures/              # Dane testowe i mocki
│   └── openrouter-responses.ts
│
├── helpers/               # Funkcje pomocnicze
│   ├── factories.ts       # Factory functions dla danych testowych
│   └── test-utils.tsx     # Custom render dla RTL
│
└── setup/                 # Konfiguracja testów
    ├── vitest.setup.ts    # Setup dla Vitest
    └── msw.setup.ts       # Setup dla MSW
```

## 🚀 Uruchamianie testów

### Testy jednostkowe i integracyjne (Vitest)

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy z interfejsem UI
npm run test:ui

# Wygeneruj raport pokrycia kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Najpierw zainstaluj przeglądarki (tylko przy pierwszym uruchomieniu)
npm run playwright:install

# Uruchom testy E2E
npm run test:e2e

# Uruchom testy E2E z interfejsem UI
npm run test:e2e:ui

# Uruchom testy E2E w trybie debugowania
npm run test:e2e:debug

# Wygeneruj testy automatycznie (codegen)
npm run test:e2e:codegen
```

### Uruchom wszystkie testy

```bash
# Jednostkowe + E2E
npm run test && npm run test:e2e
```

## ✍️ Pisanie testów

### Testy jednostkowe (Vitest)

#### Przykład testu schematu Zod

```typescript
import { describe, it, expect } from 'vitest';
import { createGenerationRequestSchema } from '@/lib/schemas/generation';

describe('createGenerationRequestSchema', () => {
  it('should validate correct source_text', () => {
    const validData = { source_text: 'a'.repeat(500) };
    
    const result = createGenerationRequestSchema.safeParse(validData);
    
    expect(result.success).toBe(true);
  });

  it('should reject source_text < 500 characters', () => {
    const invalidData = { source_text: 'short' };
    
    const result = createGenerationRequestSchema.safeParse(invalidData);
    
    expect(result.success).toBe(false);
  });
});
```

#### Przykład testu komponentu React

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../helpers/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should call onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testy E2E (Playwright)

#### Przykład testu flow użytkownika

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/auth/login');
  
  await page.getByLabel(/e-mail/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  
  await expect(page).toHaveURL('/generations');
});
```

#### Przykład testu dostępności

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have a11y violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## ⚙️ Konfiguracja

### Vitest (`vitest.config.ts`)

- **Environment**: Happy DOM dla szybkich testów DOM
- **Coverage**: v8 provider z progiem 80%
- **Setup files**: Automatyczne ładowanie `tests/setup/vitest.setup.ts`
- **Aliases**: Wsparcie dla `@/` import paths

### Playwright (`playwright.config.ts`)

- **Base URL**: `http://localhost:4321`
- **Browsers**: Domyślnie Chromium (Firefox i WebKit zakomentowane)
- **Retry**: 2x na CI, 0x lokalnie
- **Screenshots**: Tylko przy błędach
- **Video**: Tylko przy błędach
- **Web Server**: Automatyczne uruchomienie `npm run dev`

### MSW (Mock Service Worker)

MSW mockuje requesty HTTP, **eliminując koszty prawdziwego API** w testach:

```typescript
// tests/setup/msw.setup.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json(mockOpenRouterResponse);
  }),
];

export const server = setupServer(...handlers);
```

## 📝 Best Practices

### Testy jednostkowe

1. **Arrange-Act-Assert**: Struktura testów w 3 krokach
2. **Izolacja**: Każdy test niezależny (używaj `beforeEach`/`afterEach`)
3. **Factory functions**: Używaj `createTestFlashcard()` zamiast hardcoded data
4. **Meaningful names**: `should validate correct email format` zamiast `test1`
5. **Test behavior, not implementation**: Testuj co robi, nie jak

### Testy komponentów React

1. **User-centric**: Używaj `getByRole`, `getByLabelText` zamiast `getByTestId`
2. **Async handling**: Zawsze `await` przy `userEvent` i `waitFor`
3. **Mock functions**: Używaj `vi.fn()` do weryfikacji wywołań
4. **Accessibility**: Testuj także dostępność (ARIA, keyboard navigation)

### Testy E2E

1. **Page Object Model**: Wydziel logikę page'ów do osobnych klas (opcjonalnie)
2. **Stable selectors**: Używaj `getByRole`, `getByLabel` zamiast CSS selectors
3. **Wait strategies**: Playwright auto-waits, ale używaj `waitForLoadState` gdy potrzeba
4. **Test isolation**: Każdy test powinien działać niezależnie
5. **Visual regression**: Używaj `toHaveScreenshot()` dla krytycznych UI

### MSW (Mock Service Worker)

1. **NIGDY nie używaj prawdziwego API** w testach (koszty!)
2. **Fixtures**: Trzymaj mock responses w `tests/fixtures/`
3. **Reset handlers**: Po każdym teście (`afterEach(() => server.resetHandlers())`)
4. **Test error scenarios**: Mockuj też błędy (429, 500, timeout)

## 🐛 Troubleshooting

### Problem: "Cannot find module '@/...'"

**Rozwiązanie**: Sprawdź `resolve.alias` w `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
}
```

### Problem: "Happy DOM doesn't support X"

**Rozwiązanie**: Dla zaawansowanych API przeglądarki, użyj `jsdom`:

```typescript
// vitest.config.ts
test: {
  environment: 'jsdom', // zmień z 'happy-dom'
}
```

### Problem: "Playwright can't find browser"

**Rozwiązanie**: Zainstaluj przeglądarki:

```bash
npm run playwright:install
```

### Problem: "MSW is not intercepting requests"

**Rozwiązanie**: Upewnij się, że:
1. `tests/setup/msw.setup.ts` jest załadowany w `setupFiles`
2. Handler URL **dokładnie** pasuje do requestu
3. Używasz `http.post` dla POST, `http.get` dla GET, etc.

### Problem: "Tests are flaky (niestabilne)"

**Rozwiązanie**:
1. Użyj `waitFor` zamiast `setTimeout`
2. Unikaj `sleep()` - Playwright ma auto-wait
3. Mock czasomierze (`vi.useFakeTimers()`)
4. Izoluj testy (czyszczenie danych w `beforeEach`)

### Problem: "Coverage is too low"

**Rozwiązanie**:
1. Sprawdź `coverage.exclude` w `vitest.config.ts`
2. Dodaj testy dla niepokrytych plików
3. Uruchom `npm run test:coverage` i otwórz `coverage/index.html`

## 📊 Progi pokrycia (Coverage Thresholds)

Aktualne progi w `vitest.config.ts`:

| Metryka      | Próg  |
|--------------|-------|
| Lines        | 80%   |
| Functions    | 80%   |
| Branches     | 80%   |
| Statements   | 80%   |

**Wyjątki** (excluded):
- `node_modules/`
- `dist/`
- `tests/`
- `*.d.ts`
- `*.config.*`
- `src/components/ui/` (shadcn components)

## 🔗 Przydatne linki

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

## 📦 CI/CD Integration

Przykładowa konfiguracja GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run playwright:install
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 🎯 Następne kroki

1. ✅ Napisz testy dla API endpoints (`tests/integration/api/`)
2. ✅ Dodaj testy dla middleware (`tests/integration/middleware/`)
3. ✅ Napisz testy dla services (`tests/unit/services/`)
4. ✅ Dodaj więcej testów E2E dla flow generowania fiszek
5. ✅ Skonfiguruj CI/CD pipeline

---

**Ostatnia aktualizacja**: 2025-11-22  
**Wersja**: 1.0  
**Autorzy**: Dev Team

