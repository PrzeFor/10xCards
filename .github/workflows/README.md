# GitHub Actions Workflows

## Pull Request CI (`pull-request.yml`)

Automatyczny workflow CI/CD uruchamiany przy każdym Pull Request do brancha `master`.

### Przepływ pracy

1. **Lint** - Lintowanie kodu
2. **Unit Tests & E2E Tests** (równolegle po pomyślnym lincie)
   - Unit Tests - testy jednostkowe z coverage
   - E2E Tests - testy end-to-end z Playwright
3. **Status Comment** - komentarz na PR ze statusem wszystkich kroków

### Wymagane sekrety GitHub

Workflow wymaga skonfigurowania następujących sekretów w repozytorium GitHub:

#### Secrets dla środowiska `integration`

Przejdź do: `Settings` → `Environments` → `integration` → `Environment secrets`

- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_PUBLIC_KEY` - Publiczny klucz API Supabase (dla testów E2E)
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

#### Repository Secrets

Przejdź do: `Settings` → `Secrets and variables` → `Actions` → `Repository secrets`

- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_KEY` - Klucz API Supabase (dla testów jednostkowych)
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

### Artefakty

Workflow generuje następujące artefakty (dostępne przez 30 dni):

- `unit-test-coverage` - Raporty pokrycia kodu testami jednostkowymi
- `playwright-report` - Raport HTML z testów Playwright
- `e2e-test-results` - Wyniki testów E2E

### Uprawnienia

Workflow wymaga następujących uprawnień:

- `pull-requests: write` - do dodawania komentarzy na PR

### Konfiguracja środowiska

- **Node.js**: Wersja z pliku `.nvmrc` (22.14.0)
- **Package Manager**: npm (używa `npm ci` dla deterministycznych instalacji)
- **Przeglądarki Playwright**: Tylko Chromium (zgodnie z `playwright.config.ts`)

### Status Comment

Po zakończeniu wszystkich testów, workflow automatycznie dodaje komentarz do PR z:

- Ogólnym statusem (✅ sukces / ❌ błąd)
- Tabelą ze statusami poszczególnych jobów
- Linkiem do pełnego raportu workflow

### Troubleshooting

#### Testy E2E nie działają

1. Sprawdź czy środowisko `integration` jest poprawnie skonfigurowane
2. Zweryfikuj czy wszystkie sekrety są ustawione
3. Sprawdź logi Playwright w artefaktach

#### Brak komentarza na PR

1. Sprawdź czy repozytorium ma włączone uprawnienie `pull-requests: write`
2. Zweryfikuj czy wszystkie poprzednie joby zakończyły się (sukces lub błąd)

#### Problemy z cache

GitHub Actions automatycznie cachuje `node_modules` bazując na `package-lock.json`. 
Jeśli występują problemy, można wyczyścić cache w ustawieniach repozytorium.

