# E2E Tests - Playwright

Testy end-to-end dla aplikacji 10xCards używające Playwright.

## 📋 Wymagania wstępne

1. **Node.js** - wersja 18 lub nowsza
2. **Chromium browser** - instalowany automatycznie przez Playwright
3. **Działający serwer deweloperski** - na porcie 3000
4. **Testowy użytkownik w bazie danych** - do testów wymagających autoryzacji

## 🚀 Instalacja

```bash
# Zainstaluj zależności
npm install

# Zainstaluj przeglądarki Playwright
npm run playwright:install
```

## ⚙️ Konfiguracja

### 1. Utworzenie testowego użytkownika

Przed uruchomieniem testów musisz mieć testowego użytkownika w bazie danych:

1. Uruchom aplikację lokalnie: `npm run dev`
2. Przejdź do `/auth/register`
3. Zarejestruj testowego użytkownika, np.:
   - Email: `test@example.com`
   - Password: `TestPassword123!`

### 2. Zmienne środowiskowe

Utwórz plik `.env.test` w głównym katalogu projektu:

```env
# Dane testowego użytkownika
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# UUID testowego użytkownika (WYMAGANE dla czyszczenia bazy!)
E2E_USER_ID=4d803b8f-2add-4610-9af3-2103e9b6714b

# Supabase (powinien wskazywać na testową instancję)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon public key

# OpenRouter API (opcjonalne dla testów z mockami)
OPENROUTER_API_KEY=your-test-api-key
```

**⚠️ WAŻNE**: Użyj osobnej bazy danych testowej! Nie testuj na produkcyjnej bazie danych.

## 🧹 Automatyczne czyszczenie bazy danych

Testy E2E automatycznie czyszczą bazę danych po zakończeniu wszystkich testów dzięki `global-teardown.ts`:

- Po zakończeniu wszystkich testów usuwane są:
  - Wszystkie fiszki należące do użytkownika testowego
  - Wszystkie generacje należące do użytkownika testowego
  - Wszystkie logi błędów powiązane z generacjami

To zapewnia, że każde uruchomienie testów zaczyna z czystą bazą danych.

**Implementacja**: Zobacz `tests/e2e/global-teardown.ts` i konfigurację w `playwright.config.ts`.

## 🧪 Uruchamianie testów

```bash
# Najpierw uruchom smoke tests (szybka weryfikacja)
npm run test:e2e:smoke

# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom konkretny plik testowy
npx playwright test generations.spec.ts

# Uruchom z UI mode (interaktywny)
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug

# Uruchom konkretny test z debuggerem
npx playwright test generations.spec.ts --debug

# Uruchom w trybie headed (widoczna przeglądarka)
npx playwright test --headed

# Uruchom tylko jeden test
npx playwright test -g "should complete full generation and save flow"
```

## 📂 Struktura testów

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts           # Fixture do autoryzacji
├── page-objects/
│   ├── GenerationsPage.ts        # POM dla strony generacji
│   ├── components/               # Komponenty Page Objects
│   └── README.md                 # Dokumentacja POM
├── accessibility.spec.ts         # Testy dostępności
├── auth.spec.ts                  # Testy autoryzacji
├── generations.spec.ts           # Testy generowania fiszek
├── global-teardown.ts            # Czyszczenie bazy po testach
├── ENV_SETUP.md                  # Konfiguracja zmiennych środowiskowych
├── TEARDOWN.md                   # Dokumentacja global teardown
├── QUICK_START.md                # Szybki start
└── README.md                     # Ten plik
```

## 🎯 Dostępne testy

### `smoke.spec.ts` ⚡
- Szybkie testy sanitarne (< 30s)
- Weryfikacja podstawowej funkcjonalności
- **Uruchom to najpierw** przed pełnymi testami
- Pomaga szybko zidentyfikować problemy z setupem

### `auth.spec.ts`
- Testy logowania i rejestracji
- Walidacja formularzy
- Przekierowania dla chronionych stron
- Dostępność przez klawiaturę

### `generations.spec.ts`
- Kompletny przepływ generowania fiszek
- Zaznaczanie i zapisywanie propozycji
- Akceptowanie/odrzucanie propozycji
- Edycja propozycji
- Operacje grupowe
- Walidacja formularzy

### `accessibility.spec.ts`
- Testy zgodności z WCAG
- Testy kontrastu kolorów
- Nawigacja klawiaturą

## 🔧 Fixtures

### `auth.fixture.ts`

Fixture zapewniający zalogowaną sesję dla testów wymagających autoryzacji.

**Użycie:**

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('my authenticated test', async ({ authenticatedPage }) => {
  // authenticatedPage jest już zalogowany
  await authenticatedPage.goto('/generations');
  // ... reszta testu
});
```

## 📝 Wzorce testowe (Page Object Model)

Wszystkie testy używają wzorca Page Object Model dla lepszej maintainability. 

**Przykład:**

```typescript
import { test, expect } from './fixtures/auth.fixture';
import { GenerationsPage } from './page-objects';

test('generate flashcards', async ({ authenticatedPage }) => {
  const generationsPage = new GenerationsPage(authenticatedPage);
  await generationsPage.goto();
  
  // Wysokopoziomowa metoda
  await generationsPage.generateFlashcards(sampleText);
  
  // Lub kroki szczegółowe
  await generationsPage.generationForm.fillSourceText(sampleText);
  await generationsPage.generationForm.submit();
});
```

Zobacz `page-objects/README.md` dla pełnej dokumentacji POM.

## 📊 Raporty

Po uruchomieniu testów, raport HTML jest automatycznie generowany:

```bash
# Zobacz ostatni raport
npx playwright show-report
```

Raporty zawierają:
- Status każdego testu
- Screenshoty z błędów
- Nagrania wideo z nieudanych testów
- Trace viewer do debugowania

## 🐛 Debugging

### Trace Viewer

Playwright automatycznie zbiera trace dla pierwszego retry nieudanego testu:

```bash
# Uruchom testy
npm run test:e2e

# Zobacz trace
npx playwright show-trace
```

### Debug Mode

```bash
# Uruchom z inspektorem
npx playwright test --debug

# Uruchom konkretny test z debuggerem
npx playwright test generations.spec.ts:25 --debug
```

### UI Mode

```bash
# Interaktywny tryb z podglądem na żywo
npm run test:e2e:ui
```

## 🎬 Nagrywanie nowych testów

Użyj codegen do nagrywania działań w przeglądarce:

```bash
npm run test:e2e:codegen
```

To otworzy przeglądarkę i będzie generować kod testów na podstawie Twoich działań.

## ⚡ Optymalizacja wydajności

### Parallel execution

Testy domyślnie działają równolegle. W CI można to kontrolować:

```typescript
// playwright.config.ts
workers: process.env.CI ? 1 : undefined
```

### Reuse server

Serwer deweloperski jest reużywany między testami:

```typescript
// playwright.config.ts
webServer: {
  reuseExistingServer: !process.env.CI
}
```

## 🔐 Bezpieczeństwo

**Nigdy nie commituj:**
- Pliku `.env.test` z rzeczywistymi danymi
- Rzeczywistych haseł w testach
- Tokenów API w kodzie

**Używaj:**
- Oddzielnej bazy danych testowej
- Testowych użytkowników z ograniczonymi uprawnieniami
- Environment variables dla wrażliwych danych

## 📚 Dodatkowe zasoby

### Dokumentacja projektu
- [Szybki start](./QUICK_START.md) - Przewodnik krok po kroku
- [Konfiguracja ENV](./ENV_SETUP.md) - Zmienne środowiskowe
- [Global Teardown](./TEARDOWN.md) - System czyszczenia bazy danych
- [Page Object Model](./page-objects/README.md) - Wzorce testowe

### Dokumentacja zewnętrzna
- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🆘 Częste problemy

### Problem: "Timed out waiting 120000ms from config.webServer"

**Rozwiązanie**: Serwer nie uruchomił się poprawnie. Sprawdź:
- Czy port 3000 jest wolny
- Czy `npm run dev` działa poprawnie
- Czy nie ma błędów w konsoli serwera

### Problem: "locator.fill: Test timeout exceeded"

**Rozwiązanie**: Element nie został znaleziony. Sprawdź:
- Czy używasz `authenticatedPage` fixture dla chronionych stron
- Czy `data-testid` są poprawnie ustawione w komponentach
- Czy strona się w pełni załadowała

### Problem: "Authentication required"

**Rozwiązanie**: Test wymaga autoryzacji:
1. Użyj `authenticatedPage` fixture zamiast `page`
2. Upewnij się że `.env.test` zawiera poprawne dane
3. Sprawdź czy testowy użytkownik istnieje w bazie

### Problem: "ECONNREFUSED localhost:3000"

**Rozwiązanie**: 
- Uruchom najpierw serwer ręcznie: `npm run dev`
- Poczekaj aż serwer się uruchomi (sprawdź konsolę)
- Lub ustaw `reuseExistingServer: true` w konfiguracji

## 💡 Wskazówki

1. **Używaj Page Objects** - łatwiejsza konserwacja testów
2. **Dodawaj data-testid** - bardziej stabilne selektory
3. **Testuj scenariusze użytkownika** - nie implementację
4. **Izoluj testy** - każdy test powinien być niezależny
5. **Używaj fixtures** - dla wspólnego setupu
6. **Sprawdzaj raporty** - szczególnie screenshoty i video przy błędach

