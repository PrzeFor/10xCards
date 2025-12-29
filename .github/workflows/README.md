# GitHub Actions Workflows

## Przegląd

Projekt używa dwóch głównych workflow'ów:

1. **Pull Request CI** (`pull-request.yml`) - Weryfikacja jakości kodu przed merge
2. **Deploy to Cloudflare Pages** (`master.yml`) - Deployment do produkcji

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

**Supabase:**
- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_PUBLIC_KEY` - Publiczny klucz API Supabase (dla testów E2E)

**OpenRouter:**
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

**Dane testowego użytkownika (wymagane dla E2E):**
- `E2E_USER_ID` - UUID testowego użytkownika (np. `4d803b8f-2add-4610-9af3-2103e9b6714b`)
- `E2E_USERNAME` - Email testowego użytkownika (np. `test@example.com`)
- `E2E_PASSWORD` - Hasło testowego użytkownika (np. `TestPassword123!`)

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

---

## Deploy to Cloudflare Pages (`master.yml`)

Automatyczny workflow deploymentu uruchamiany przy każdym pushu do brancha `master`. Może być również uruchomiony manualnie.

### Przepływ pracy

1. **Lint** - Lintowanie kodu
2. **Unit Tests** - Testy jednostkowe z coverage (po lincie)
3. **Build & Deploy** - Budowanie i deployment na Cloudflare Pages (po testach)

**Uwaga**: Ten workflow NIE zawiera testów E2E dla oszczędności czasu (E2E są wykonywane w PR workflow).

### Wymagane sekrety GitHub

#### Cloudflare Secrets

Przejdź do: `Settings` → `Secrets and variables` → `Actions` → `Repository secrets`

- `CLOUDFLARE_API_TOKEN` - Token API z uprawnieniami do Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu w Cloudflare Pages

#### Application Secrets

- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_KEY` - Klucz API Supabase (service_role)
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

### Jak uzyskać Cloudflare Secrets?

#### CLOUDFLARE_API_TOKEN
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **My Profile** → **API Tokens**
3. Kliknij **Create Token**
4. Użyj template "Edit Cloudflare Workers" lub utwórz custom token z uprawnieniami:
   - Account > Cloudflare Pages > Edit
5. Skopiuj wygenerowany token (będzie widoczny tylko raz!)

#### CLOUDFLARE_ACCOUNT_ID
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **Workers & Pages**
3. Account ID znajdziesz w prawym panelu

#### CLOUDFLARE_PROJECT_NAME
- Nazwa twojego projektu w Cloudflare Pages (np. `10xcards`)
- Jeśli projekt nie istnieje, zostanie automatycznie utworzony

### Artefakty

Workflow generuje następujące artefakty:

- `unit-test-coverage` - Raporty pokrycia kodu (30 dni)
- `dist` - Zbudowana aplikacja (7 dni)

### Uprawnienia

Workflow wymaga następujących uprawnień:

- `contents: read` - do odczytu kodu
- `deployments: write` - do deploymentu na Cloudflare

### Konfiguracja środowiska

- **Node.js**: Wersja z pliku `.nvmrc` (22.14.0)
- **Package Manager**: npm (używa `npm ci`)
- **Build Output**: `dist/` directory
- **Deployment Target**: Cloudflare Pages

### Triggery

**Automatyczny deployment**:
```bash
git push origin master
```

**Manualny deployment**:
1. Przejdź do zakładki **Actions**
2. Wybierz workflow "Deploy to Cloudflare Pages"
3. Kliknij **Run workflow**

### Troubleshooting

#### Deployment się nie powiódł

1. Sprawdź czy wszystkie Cloudflare secrets są poprawnie skonfigurowane
2. Zweryfikuj uprawnienia API tokena
3. Sprawdź logi deploymentu w Cloudflare Dashboard

#### Build się nie powiódł

1. Sprawdź czy build działa lokalnie: `npm run build`
2. Zweryfikuj czy wszystkie zmienne środowiskowe są ustawione
3. Sprawdź logi buildu w szczegółach workflow

#### Testy się nie powiodły

Job "Build & Deploy" nie uruchomi się jeśli testy się nie powiodą. Napraw błędy testów i push ponownie.

### Dodatkowe Zasoby

Szczegółowa dokumentacja deploymentu: [README-CLOUDFLARE-DEPLOYMENT.md](./README-CLOUDFLARE-DEPLOYMENT.md)

---

## Różnice między Workflow'ami

| Aspekt | Pull Request CI | Deploy to Cloudflare |
|--------|----------------|---------------------|
| **Trigger** | Pull Request do master | Push do master |
| **Cel** | Weryfikacja kodu | Deployment do produkcji |
| **Lint** | ✅ | ✅ |
| **Unit Tests** | ✅ | ✅ |
| **E2E Tests** | ✅ | ❌ (oszczędność czasu) |
| **Build** | ❌ | ✅ |
| **Deploy** | ❌ | ✅ Cloudflare Pages |
| **Status Comment** | ✅ | ❌ |
| **Czas wykonania** | ~8-15 min | ~6-10 min |

---

## Lokalne Testowanie

Przed pushem kodu, upewnij się że wszystko działa lokalnie:

```bash
# Linting
npm run lint

# Testy jednostkowe
npm run test

# Testy E2E (wymaga uruchomionego dev servera)
npm run test:e2e

# Build produkcyjny
npm run build
```

