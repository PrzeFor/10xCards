<plan_testów>

# Plan Testów dla projektu 10xCards

## 1. Wprowadzenie i cele testowania  
Celem testów jest zapewnienie stabilności, niezawodności i wysokiej jakości aplikacji 10xCards poprzez weryfikację kluczowych funkcjonalności, interfejsu użytkownika, integracji z backendem (Supabase) oraz zewnętrznym serwisem AI (OpenRouter).

## 2. Zakres testów  
- **Warstwa frontend:** komponenty Astro (statyczne) + React (dynamiczne):  
  - Komponenty uwierzytelniania (LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm)  
  - Komponenty fiszek (FlashcardList, FlashcardItem, FlashcardEditModal, BulkActionsBar)  
  - Komponenty generowania (GenerationForm, GenerationsView)  
  - Komponenty UI (shadcn/ui: Button, Card, Dialog, Input, Label, Textarea, Sonner)  
  - Ustawienia konta (AccountSettings)  
- **Warstwa backend:** API REST endpoints  
  - Auth: /api/auth/* (login, register, logout, forgot-password, reset-password, delete-account)  
  - Flashcards: /api/flashcards  
  - Generations: /api/generations  
- **Middleware:** autoryzacja, sesje, przekierowania (src/middleware/index.ts)  
- **Usługi i walidacja:**  
  - flashcard.service, generation.service, openRouter.service  
  - Schematy Zod (auth, flashcards, generation)  
  - Hooki React (useGenerateFlashcards, useSaveFlashcards)  
- **Integracje zewnętrzne:**  
  - Supabase (auth, database, RLS)  
  - OpenRouter API (generowanie AI)  
- **Przepływy end-to-end:** pełne ścieżki użytkownika  
- **Testy bezpieczeństwa, wydajności i dostępności (a11y)**

## 3. Typy testów do przeprowadzenia  

### 3.1. Testy jednostkowe (Unit Tests) - **Vitest**
- Schematy Zod (walidacja danych)
- Funkcje pomocnicze (utils)
- Komponenty React (React Testing Library)
- Serwisy (flashcard.service, generation.service)

### 3.2. Testy integracyjne (Integration Tests) - **Vitest**
- API endpoints (testy HTTP)
- Middleware (autoryzacja, sesje)
- Integracja z Supabase (CRUD operations)
- OpenRouter service z MSW

### 3.3. Testy end-to-end (E2E Tests) - **Playwright**
- Pełne przepływy użytkownika
- Interakcje UI w przeglądarce
- Multi-step workflows
- Cross-browser testing

### 3.4. Testy wydajnościowe (Performance Tests)
- Czas odpowiedzi API (< 500 ms)
- Lighthouse CI (Core Web Vitals)
- Renderowanie UI (React components)

### 3.5. Testy bezpieczeństwa (Security Tests)
- Uwierzytelnianie i autoryzacja
- Walidacja inputów (XSS, SQL injection)
- RLS policies w Supabase
- CSRF protection

### 3.6. Testy dostępności (Accessibility Tests) - **axe-core**
- Nawigacja klawiaturą
- Screen reader compatibility
- ARIA labels i role
- Kontrast kolorów (WCAG 2.1)

### 3.7. Priorytetyzacja testów  
1. **Krytyczne (P0):** Uwierzytelnianie, middleware, zapis fiszek do bazy  
2. **Wysokie (P1):** Generowanie AI, edycja fiszek, walidacje Zod schemas  
3. **Średnie (P2):** Bulk actions, filtrowanie, paginacja, ustawienia konta  
4. **Niskie (P3):** UI edge cases, accessibility enhancements

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie  
- Rejestracja nowego użytkownika: poprawne dane → konto utworzone, błąd na duplikat  
- Logowanie: poprawne/niepoprawne dane  
- Zapomniane hasło: wysłanie maila, reset hasła po tokenie

### 4.2. Generowanie fiszek  
- Formularz generacji: walidacja pustych pól  
- Integracja z OpenRouter: poprawna odpowiedź AI, obsługa błędów sieci  
- Wyświetlanie wygenerowanych fiszek

### 4.3. Zarządzanie fiszkami  
- Dodanie/usunięcie/edycja fiszki  
- Lista fiszek: paginacja, filtrowanie, zaznaczanie wielu elementów (BulkActionsBar)  
- Zapisywanie i pobieranie z Supabase

### 4.4. Ustawienia konta i bezpieczeństwo bazy  
- Zmiana hasła, usunięcie konta  
- Walidacja uprawnień (middleware)  
- Testy RLS policies (Row Level Security):  
  - Izolacja danych między użytkownikami  
  - Brak dostępu do cudzych fiszek/generacji  
  - Weryfikacja permissions na poziomie bazy

### 4.5. Middleware i autoryzacja  
- Sprawdzenie ścieżek publicznych vs. chronionych (PUBLIC_PATHS)  
- Weryfikacja przekierowań dla niezalogowanych użytkowników  
- Testy sesji użytkownika (cookies, headers)  
- Walidacja tokenów reset hasła  
- Test dynamicznych route'ów (/auth/reset-password/[token])

### 4.6. Walidacja schematów Zod  
- Testy schematów auth.ts, flashcards.ts, generation.ts  
- Walidacja granic (min/max długości):  
  - source_text: 500-15000 znaków  
  - front: max 1000 znaków  
  - back: max 2000 znaków  
- Obsługa nieprawidłowych danych (błędne typy, brakujące pola)  
- Walidacja UUID, emaili, enumów

### 4.7. Ścieżki krytyczne E2E  
- Rejestracja → logowanie → generowanie fiszek → zapis → wyświetlenie listy  
- Forgot password → otrzymanie maila → reset hasła → logowanie  
- Bulk actions: zaznaczenie wielu fiszek → usunięcie  
- Edycja fiszki → zapis → weryfikacja zmian  
- Test dostępności (a11y): nawigacja klawiaturą przez cały flow

## 5. Środowisko testowe  
- Lokalna instancja Supabase (docker-compose)  
- **MSW (Mock Service Worker)** do mockowania OpenRouter API:  
  - Fixtures z przykładowymi odpowiedziami AI  
  - Symulacja błędów (timeout, rate limit, błędny format JSON)  
  - Testowanie różnych modeli AI (meta-llama, mistral, etc.)  
  - **NIGDY nie używać prawdziwego API w testach automatycznych** (koszty!)  
- Przeglądarka headless (Chromium w Playwright)  
- CI: GitHub Actions z kontenerami testowymi (Supabase + Node.js)

## 5.1. Zarządzanie danymi testowymi  
- **Seed data** w Supabase: użytkownicy testowi, przykładowe fiszki, generacje  
- **Izolacja testów:** każdy test operuje na czystych danych (beforeEach/afterEach)  
- **Factory functions** dla tworzenia obiektów testowych (createTestUser, createTestFlashcard)  
- **Test fixtures** dla odpowiedzi OpenRouter (różne scenariusze AI)  
- Strategie czyszczenia danych: truncate tables vs. rollback transactions

## 6. Narzędzia do testowania  

### 6.1. Testy jednostkowe i integracyjne
- **Vitest** - framework testowy (zamiennik Jest)
  - Natywne wsparcie dla ESM i TypeScript
  - Szybki hot-reload testów (HMR)
  - Kompatybilne API z Jest
  - Wbudowany coverage (c8/istanbul)
- **React Testing Library** - testowanie komponentów React
  - User-centric testing approach
  - Testowanie GenerationsView, FlashcardList, FormularzyAuth
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **MSW (Mock Service Worker)** - mockowanie HTTP requestów
  - Fixtures dla OpenRouter API
  - Symulacja błędów sieci

### 6.2. Testy E2E
- **Playwright** - framework do testów end-to-end
  - Multi-browser (Chromium, Firefox, WebKit)
  - Auto-wait, retry-ability
  - Screenshots, videos, traces
  - Lepsze wsparcie dla Astro SSR niż Cypress
- **@axe-core/playwright** - testy dostępności (a11y)
  - Automatyczne wykrywanie problemów a11y
  - Zgodność z WCAG 2.1

### 6.3. Testy wydajności i jakości kodu
- **Lighthouse CI** - automatyzacja audytów wydajności
  - Performance, Accessibility, Best Practices, SEO
  - Integracja z CI/CD pipeline
- **ESLint + TypeScript** - statyczna analiza (już skonfigurowane)

### 6.4. Infrastruktura testowa
- **Docker + Supabase CLI** - lokalna instancja Supabase do testów
- **GitHub Actions** - CI/CD pipeline z automatycznymi testami

## 6.5. Instalacja i konfiguracja  

### Instalacja zależności testowych:
```bash
# Vitest + React Testing Library
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Playwright + a11y
npm install -D @playwright/test @axe-core/playwright

# MSW (Mock Service Worker)
npm install -D msw

# Happy DOM (środowisko DOM dla Vitest)
npm install -D happy-dom
```

### Komendy testowe w package.json:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Przykładowa struktura katalogów testowych:
```
tests/
├── unit/              # Testy jednostkowe (Vitest)
│   ├── schemas/       # Testy schematów Zod
│   ├── services/      # Testy services
│   └── utils/         # Testy funkcji pomocniczych
├── integration/       # Testy integracyjne
│   ├── api/           # Testy API endpoints
│   └── middleware/    # Testy middleware
├── e2e/               # Testy E2E (Playwright)
│   ├── auth.spec.ts
│   ├── flashcards.spec.ts
│   └── generations.spec.ts
├── fixtures/          # Dane testowe, mocki
│   ├── openrouter-responses.json
│   └── test-users.json
└── helpers/           # Factory functions, test utilities
    ├── factories.ts
    └── test-setup.ts
```

## 7. Strategia testowania

### 7.1. Podejście do testowania
- **Test-Driven Development (TDD)** dla kluczowych funkcjonalności (P0, P1)
- **Bottom-up approach:** najpierw unit, potem integration, na końcu E2E
- **Izolacja testów:** każdy test jest niezależny (no shared state)
- **Fail-fast:** testy krytyczne (P0) wykonywane jako pierwsze w CI

### 7.2. Pokrycie testowe (Test Coverage)
| Warstwa | Min. Coverage | Priorytet |
|---------|---------------|-----------|
| Middleware | 100% | P0 |
| Schematy Zod | 100% | P0 |
| Services | 90% | P1 |
| API Endpoints | 85% | P0 |
| Components React | 80% | P2 |
| Utils | 85% | P1 |

### 7.3. Strategia mockowania
- **OpenRouter API:** zawsze mockowane (MSW) - NIGDY prawdziwe API
- **Supabase:** lokalna instancja w testach integracyjnych, mocki w unit
- **Browser APIs:** mockowane w Vitest (localStorage, fetch, etc.)
- **Zewnętrzne serwisy:** zawsze stubowane/mockowane

## 8. Harmonogram testów  

| Faza | Zakres | Czas trwania | Priorytet |
|------|--------|--------------|-----------|
| **Faza 0: Setup** | Vitest, Playwright, MSW, fixtures, seed data, CI/CD | 3–4 dni | - |
| **Faza 1: Unit** | Schemas Zod, utils, services | 1 tydzień | P0, P1 |
| **Faza 1.5: Integration** | API endpoints, middleware, Supabase | 1 tydzień | P0, P1 |
| **Faza 2: E2E** | Krytyczne ścieżki użytkownika | 1–2 tygodnie | P0, P1 |
| **Faza 3: Performance & a11y** | Lighthouse CI, axe-core | 1 tydzień | P2 |
| **Faza 4: Raportowanie** | Analiza, bugfixy, dokumentacja | 1 tydzień | - |

**Szacowany czas całkowity:** 5–6 tygodni

### 8.1. Milestones
- ✅ **M1 (koniec Fazy 1):** Wszystkie testy P0 unit przechodzą
- ✅ **M2 (koniec Fazy 1.5):** Wszystkie testy P0/P1 integration przechodzą
- ✅ **M3 (koniec Fazy 2):** Krytyczne flow E2E działają
- ✅ **M4 (koniec Fazy 4):** Coverage > 80%, wszystkie P0/P1 green

## 9. Kryteria akceptacji testów  

### 9.1. Kryteria ilościowe
- ✅ Pokrycie kodu **> 80%** w testach unit/integracyjnych (całościowo)
- ✅ Pokrycie **100%** dla middleware (bezpieczeństwo!)
- ✅ Pokrycie **100%** dla schematów Zod (walidacja!)
- ✅ Wszystkie testy **P0 = 100% passing**
- ✅ Wszystkie testy **P1 ≥ 95% passing**

### 9.2. Kryteria wydajnościowe
- ⚡ Czas odpowiedzi API **< 500 ms** (95 percentyl)
- ⚡ Testy unit: **< 10s** całkowity czas wykonania
- ⚡ Testy E2E: **< 5 min** całkowity czas wykonania
- ⚡ Lighthouse Score **> 90** we wszystkich kategoriach:
  - Performance > 90
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90

### 9.3. Kryteria jakościowe
- 🔒 **Brak krytycznych** luk bezpieczeństwa (auth, RLS, XSS, CSRF)
- ♿ **Brak błędów critical/serious** w axe-core (a11y)
- 🚫 **Zero flaky tests** - stabilność 100%
- ✅ Wszystkie testy przechodzą w **3 przeglądarkach** (Chromium, Firefox, WebKit)

### 9.4. Kryteria CI/CD
- 🟢 CI pipeline **musi być green** przed merge do main
- 🟢 Automatyczne uruchamianie testów przy każdym PR
- 🟢 Blokada merge jeśli testy P0/P1 nie przechodzą
- 📊 Raport coverage publikowany automatycznie

## 10. Role i odpowiedzialności  

| Rola | Odpowiedzialności | Właściciel |
|------|-------------------|------------|
| **QA Engineer** | Projekt, implementacja i utrzymanie testów | QA Team |
| **Developer** | Pisanie kodu zgodnie z testami, bugfixy | Dev Team |
| **DevOps** | Konfiguracja CI/CD, infrastruktura testowa | DevOps Team |
| **Tech Lead** | Code review, decyzje architektoniczne | Tech Lead |
| **Product Owner** | Akceptacja kryteriów, priorytetyzacja | PO |

## 11. Procedury raportowania błędów  

### 11.1. Szablon raportu błędu (GitHub Issues)
```markdown
## 🐛 Opis błędu
[Krótki opis problemu]

## 📋 Kroki odtworzenia
1. Krok 1
2. Krok 2
3. Krok 3

## ✅ Oczekiwane zachowanie
[Co powinno się stać]

## ❌ Rzeczywiste zachowanie
[Co się stało]

## 📸 Załączniki
- Screenshot/Video
- Logi z konsoli
- Network traces (Playwright)

## 🔧 Środowisko
- OS: Windows 11 / macOS / Linux
- Browser: Chromium 120 / Firefox 121 / WebKit
- Test type: Unit / Integration / E2E

## 🎯 Priorytet
- [ ] P0 - Krytyczny (blokuje release)
- [ ] P1 - Wysoki (ważna funkcjonalność)
- [ ] P2 - Średni (można obejść)
- [ ] P3 - Niski (kosmetyczny)
```

### 11.2. Proces obsługi błędów
1. **Zgłoszenie:** Issue w GitHub z pełnym opisem i załącznikami
2. **Triage:** Tech Lead/QA Engineer przypisuje priorytet (P0-P3)
3. **Assignment:** Przypisanie do dewelopera na podstawie priorytetu
4. **Fix:** Developer implementuje poprawkę + dodaje test regresyjny
5. **Verification:** QA weryfikuje poprawkę w środowisku testowym
6. **Closure:** Issue zamykany po pomyślnej weryfikacji

### 11.3. SLA dla błędów
| Priorytet | Czas reakcji | Czas rozwiązania |
|-----------|--------------|------------------|
| P0 (Critical) | < 2h | < 1 dzień |
| P1 (High) | < 1 dzień | < 3 dni |
| P2 (Medium) | < 3 dni | < 1 tydzień |
| P3 (Low) | < 1 tydzień | Best effort |

## 12. Przykładowe testy (referencyjna implementacja)

### 12.1. Test jednostkowy (Vitest) - Schema Zod
```typescript
// tests/unit/schemas/generation.test.ts
import { describe, it, expect } from 'vitest';
import { createGenerationRequestSchema } from '@/lib/schemas/generation';

describe('createGenerationRequestSchema', () => {
  it('should validate correct source_text', () => {
    const validData = { source_text: 'a'.repeat(500) };
    expect(() => createGenerationRequestSchema.parse(validData)).not.toThrow();
  });

  it('should reject source_text < 500 characters', () => {
    const invalidData = { source_text: 'short' };
    expect(() => createGenerationRequestSchema.parse(invalidData)).toThrow();
  });
});
```

### 12.2. Test integracyjny (Vitest) - API Endpoint
```typescript
// tests/integration/api/auth/login.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/pages/api/auth/login';

describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
    });
    
    const response = await POST({ request });
    expect(response.status).toBe(200);
  });
});
```

### 12.3. Test E2E (Playwright)
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Navigate to registration
  await page.goto('/auth/register');
  
  // Fill registration form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/generations');
  await expect(page.locator('h1')).toContainText('Generate Flashcards');
});
```

### 12.4. Test dostępności (Playwright + axe-core)
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have a11y violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## 13. Metryki i monitoring testów

### 13.1. Dashboard testowy (CI/CD)
- **Test Results:** Liczba passed/failed/skipped
- **Coverage Report:** Procentowe pokrycie kodu
- **Performance Metrics:** Czas wykonania testów
- **Flaky Tests:** Lista niestabilnych testów
- **Trend Analysis:** Historia wyników testów

### 13.2. Kluczowe metryki KPI
| Metryka | Target | Current | Status |
|---------|--------|---------|--------|
| Test Coverage | > 80% | TBD | 🟡 |
| P0 Tests Passing | 100% | TBD | 🟡 |
| E2E Success Rate | > 95% | TBD | 🟡 |
| CI Pipeline Time | < 10 min | TBD | 🟡 |
| Flaky Tests | 0 | TBD | 🟡 |

## 14. Podsumowanie i next steps

### 14.1. Główne założenia
Plan testów dla projektu **10xCards** zapewnia kompleksowe pokrycie wszystkich warstw aplikacji:
- ✅ **Vitest** - testy jednostkowe i integracyjne (szybkie, nowoczesne)
- ✅ **Playwright** - testy E2E (stabilne, multi-browser)
- ✅ **MSW** - mockowanie OpenRouter API (bezkosztowe testowanie)
- ✅ **axe-core** - testy dostępności (WCAG 2.1)
- ✅ **Lighthouse CI** - testy wydajności (Core Web Vitals)

### 14.2. Kluczowe korzyści
1. 🚀 **Szybszy development:** Catch bugs early
2. 🔒 **Większe bezpieczeństwo:** 100% coverage dla middleware i auth
3. ♿ **Lepsza dostępność:** Automatyczne testy a11y
4. ⚡ **Wyższa wydajność:** Monitoring Core Web Vitals
5. 💰 **Niższe koszty:** Brak kosztów OpenRouter API w testach

### 14.3. Następne kroki
1. ✅ **Akceptacja planu** przez Product Ownera i Tech Leada
2. 🛠️ **Faza 0:** Setup infrastruktury (Vitest, Playwright, MSW)
3. 🧪 **Faza 1:** Implementacja testów jednostkowych (P0)
4. 🔗 **Faza 1.5:** Implementacja testów integracyjnych
5. 🌐 **Faza 2:** Implementacja testów E2E
6. 📊 **Fazy 3-4:** Performance, a11y, raportowanie

**Szacowany start:** Po akceptacji planu  
**Szacowany czas realizacji:** 5-6 tygodni  
**Właściciel planu:** QA Engineer + Tech Lead

---

**Wersja dokumentu:** 1.0  
**Data aktualizacji:** 2025-11-22  
**Status:** ✅ Ready for Review

</plan_testów>
