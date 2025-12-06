# CI/CD Pipeline - Dokumentacja

## Przegląd

Pipeline CI/CD automatycznie weryfikuje jakość kodu i buduje aplikację przy każdej aktualizacji brancha `master`. Może być również uruchomiony manualnie.

## Triggery

Pipeline uruchamia się w następujących sytuacjach:

1. **Automatycznie** - po każdym push do brancha `master`
2. **Manualnie** - poprzez zakładkę "Actions" w GitHub → wybór workflow "CI/CD Pipeline" → "Run workflow"

## Etapy Pipeline

Pipeline składa się z dwóch głównych jobów:

### Job 1: Lint & Test

Weryfikacja jakości kodu i funkcjonalności:

1. **Checkout** - pobranie kodu z repozytorium
2. **Setup Node.js** - instalacja Node.js 20 z cache npm
3. **Install dependencies** - instalacja zależności (`npm ci`)
4. **Linting** - sprawdzenie jakości kodu (`npm run lint`)
5. **Unit Tests** - testy jednostkowe z Vitest (`npm run test`)
6. **Install Playwright browsers** - instalacja przeglądarek do testów E2E
7. **E2E Tests** - testy end-to-end z Playwright (`npm run test:e2e`)
8. **Upload Playwright Report** - zapisanie raportu Playwright (tylko przy błędach)

### Job 2: Build Production

Budowanie wersji produkcyjnej (uruchamia się **tylko** po pomyślnym zakończeniu testów):

1. **Checkout** - pobranie kodu z repozytorium
2. **Setup Node.js** - instalacja Node.js 20 z cache npm
3. **Install dependencies** - instalacja zależności (`npm ci`)
4. **Build Production** - budowanie wersji produkcyjnej (`npm run build`)
5. **Upload Build Artifacts** - zapisanie zbudowanej aplikacji

**Kluczowa zaleta:** Jeśli testy się nie powiodą, build nie zostanie uruchomiony, co oszczędza czas i zasoby.

## Wymagane GitHub Secrets

Aby pipeline działał poprawnie, należy skonfigurować następujące sekrety w GitHub:

### Jak dodać sekrety?

1. Przejdź do repozytorium na GitHub
2. Kliknij **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj każdy z poniższych sekretów:

### Lista wymaganych sekretów

| Nazwa | Opis | Przykład |
|-------|------|----------|
| `SUPABASE_URL` | URL instancji Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Klucz API Supabase (service_role) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_PUBLIC_KEY` | Publiczny klucz API Supabase (anon) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | `sk-or-v1-...` |

### Gdzie znaleźć klucze Supabase?

1. Przejdź do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_PUBLIC_KEY`
   - **service_role** → `SUPABASE_KEY` ⚠️ (zachowaj w tajemnicy!)

### Gdzie znaleźć klucz OpenRouter?

1. Przejdź do [OpenRouter Dashboard](https://openrouter.ai/keys)
2. Stwórz nowy klucz API lub użyj istniejącego
3. Skopiuj klucz → `OPENROUTER_API_KEY`

## Artefakty

Pipeline zapisuje następujące artefakty (dostępne w zakładce Actions → wybrany workflow run):

### Playwright Report (tylko przy błędach)
- **Nazwa**: `playwright-report`
- **Zawartość**: Szczegółowy raport z testów E2E, screenshoty, wideo
- **Retencja**: 7 dni
- **Dostępność**: Tylko gdy testy E2E się nie powiodą

### Build Artifacts
- **Nazwa**: `dist`
- **Zawartość**: Zbudowana wersja produkcyjna aplikacji
- **Retencja**: 7 dni
- **Dostępność**: Zawsze, gdy build się powiedzie

## Debugging

### Pipeline się nie powiódł - co robić?

1. **Przejdź do zakładki Actions** w repozytorium GitHub
2. **Kliknij na nieudany workflow run** - oznaczony czerwonym X
3. **Rozwiń kroki** - kliknij na krok, który się nie powiódł
4. **Przeanalizuj logi** - sprawdź komunikaty błędów

### Najczęstsze problemy

#### 1. Brak sekretów
```
Error: Environment variable SUPABASE_URL is not set
```
**Rozwiązanie**: Dodaj brakujące sekrety (patrz sekcja "Wymagane GitHub Secrets")

#### 2. Testy E2E się nie powiodły
```
Error: Test failed with error...
```
**Rozwiązanie**: 
- Pobierz artefakt `playwright-report` z zakładki Actions
- Otwórz `index.html` w przeglądarce
- Sprawdź screenshoty i wideo z nieudanych testów

#### 3. Build się nie powiódł
```
Error: Build failed with exit code 1
```
**Rozwiązanie**:
- Sprawdź logi buildu w szczegółach kroku "Build production"
- Upewnij się, że build działa lokalnie: `npm run build`
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione
- **Uwaga**: Job "build" jest pominięty jeśli job "test" się nie powiódł

#### 4. Linting errors
```
Error: ESLint found problems
```
**Rozwiązanie**:
- Uruchom lokalnie: `npm run lint`
- Napraw błędy: `npm run lint:fix`
- Commituj poprawki

#### 5. Job "build" nie został uruchomiony
**Przyczyna**: Job "build" wymaga pomyślnego zakończenia jobu "test" (needs: test)
**Rozwiązanie**: Napraw błędy w jobie "test" najpierw

## Lokalne testowanie

Przed wysłaniem kodu do repozytorium, upewnij się że wszystkie kroki pipeline przechodzą lokalnie:

```bash
# 1. Linting
npm run lint

# 2. Testy jednostkowe
npm run test

# 3. Testy E2E (wymaga uruchomionego dev servera)
npm run test:e2e

# 4. Build produkcyjny
npm run build
```

## Optymalizacje

Obecna konfiguracja jest **minimalna** i skupia się na weryfikacji. W przyszłości można rozważyć:

- **Coverage reports** - przesyłanie raportów pokrycia kodu do Codecov
- **Lighthouse CI** - audyty wydajności
- **Deployment** - automatyczne wdrażanie do DigitalOcean
- **Notifications** - powiadomienia o statusie pipeline (Slack, Discord)
- **Matrix strategy** - testowanie na różnych przeglądarkach
- **Dependency caching** - cache Playwright browsers dla szybszych buildów
- **Parallel jobs** - uruchamianie testów jednostkowych i E2E równolegle (wymaga osobnych jobów)
- **Conditional deployment** - deploy tylko z master, skip na PR

## Czas wykonania

### Job: Lint & Test
- ✅ Checkout + Setup: ~30s
- ✅ Install dependencies: ~1-2min (z cache: ~30s)
- ✅ Linting: ~10-30s
- ✅ Unit tests: ~30s-1min
- ✅ Install Playwright browsers: ~1-2min
- ✅ E2E tests: ~2-5min (zależnie od liczby testów)

**Czas jobu "test": ~5-10 minut**

### Job: Build Production
- ✅ Checkout + Setup: ~30s
- ✅ Install dependencies: ~1-2min (z cache: ~30s)
- ✅ Build: ~1-2min
- ✅ Upload artifacts: ~30s

**Czas jobu "build": ~3-5 minut**

### Całkowity czas pipeline
**~8-15 minut** (joby uruchamiają się sekwencyjnie)

**Oszczędność czasu:** Jeśli testy się nie powiodą, job "build" nie zostanie uruchomiony, co oszczędza ~3-5 minut.

## Status Badge

Możesz dodać badge statusu pipeline do README.md:

```markdown
![CI/CD Pipeline](https://github.com/TWOJA_ORGANIZACJA/10xCards/actions/workflows/master.yaml/badge.svg)
```

Zamień `TWOJA_ORGANIZACJA` na swoją nazwę użytkownika/organizacji GitHub.

