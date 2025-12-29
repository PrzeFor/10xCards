# Deployment na Cloudflare Pages - Dokumentacja

## Przegląd

Aplikacja 10xCards jest automatycznie wdrażana na Cloudflare Pages przy każdym pushu do brancha `master`. Workflow można również uruchomić manualnie.

## Architektura Deploymentu

### Adapter Astro
Projekt używa `@astrojs/cloudflare` adapter, który kompiluje aplikację Astro do formatu kompatybilnego z Cloudflare Pages.

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
  }),
});
```

### Workflow CI/CD

Pipeline składa się z trzech jobów uruchamianych sekwencyjnie:

1. **Lint** - Weryfikacja jakości kodu
2. **Unit Tests** - Testy jednostkowe z coverage
3. **Build & Deploy** - Budowanie i wdrożenie na Cloudflare Pages

## Konfiguracja GitHub Secrets

Aby deployment działał poprawnie, skonfiguruj następujące sekrety w GitHub:

### Jak dodać sekrety?

1. Przejdź do repozytorium na GitHub
2. Kliknij **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj każdy z poniższych sekretów

### Wymagane Sekrety

#### Cloudflare

| Nazwa | Opis | Jak uzyskać |
|-------|------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token API z uprawnieniami do Cloudflare Pages | [Zobacz instrukcję](#cloudflare_api_token) |
| `CLOUDFLARE_ACCOUNT_ID` | ID konta Cloudflare | [Zobacz instrukcję](#cloudflare_account_id) |
| `CLOUDFLARE_PROJECT_NAME` | Nazwa projektu w Cloudflare Pages | Nazwa twojego projektu (np. `10xcards`) |

#### Aplikacja

| Nazwa | Opis | Przykład |
|-------|------|----------|
| `SUPABASE_URL` | URL instancji Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Klucz API Supabase (service_role) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | `sk-or-v1-...` |

### Szczegółowe Instrukcje

#### CLOUDFLARE_API_TOKEN

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **My Profile** → **API Tokens**
3. Kliknij **Create Token**
4. Wybierz template **"Edit Cloudflare Workers"** lub utwórz custom token z uprawnieniami:
   - **Account** → **Cloudflare Pages** → **Edit**
5. Opcjonalnie: ogranicz token do konkretnego konta
6. Kliknij **Continue to summary** → **Create Token**
7. **WAŻNE**: Skopiuj token (będzie widoczny tylko raz!)
8. Dodaj jako `CLOUDFLARE_API_TOKEN` w GitHub Secrets

#### CLOUDFLARE_ACCOUNT_ID

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **Workers & Pages**
3. W prawym panelu znajdziesz **Account ID**
4. Skopiuj i dodaj jako `CLOUDFLARE_ACCOUNT_ID` w GitHub Secrets

#### CLOUDFLARE_PROJECT_NAME

Możesz użyć istniejącego projektu lub utworzyć nowy:

**Opcja 1: Istniejący projekt**
1. Przejdź do **Workers & Pages**
2. Znajdź nazwę swojego projektu
3. Użyj tej nazwy jako `CLOUDFLARE_PROJECT_NAME`

**Opcja 2: Nowy projekt**
1. Wybierz dowolną nazwę (np. `10xcards`)
2. Projekt zostanie automatycznie utworzony przy pierwszym deploymencie
3. Dodaj nazwę jako `CLOUDFLARE_PROJECT_NAME`

#### Supabase Secrets

1. Przejdź do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_KEY` ⚠️ (zachowaj w tajemnicy!)

#### OpenRouter API Key

1. Przejdź do [OpenRouter Dashboard](https://openrouter.ai/keys)
2. Stwórz nowy klucz API lub użyj istniejącego
3. Skopiuj klucz → `OPENROUTER_API_KEY`

## Triggery Workflow

### Automatyczny Deployment

Workflow uruchamia się automatycznie przy każdym pushu do brancha `master`:

```bash
git push origin master
```

### Manualny Deployment

Możesz uruchomić deployment ręcznie:

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **"Deploy to Cloudflare Pages"**
3. Kliknij **Run workflow**
4. Wybierz branch `master`
5. Kliknij **Run workflow**

## Etapy Pipeline

### Job 1: Lint Code

Weryfikacja jakości kodu:
- Checkout kodu
- Setup Node.js (wersja z `.nvmrc`)
- Instalacja zależności (`npm ci`)
- Uruchomienie lintera (`npm run lint`)

**Czas wykonania**: ~1-2 minuty

### Job 2: Unit Tests

Testy jednostkowe z coverage:
- Checkout kodu
- Setup Node.js
- Instalacja zależności
- Uruchomienie testów z coverage (`npm run test:coverage`)
- Upload raportu coverage (dostępny przez 30 dni)

**Czas wykonania**: ~2-3 minuty

### Job 3: Build & Deploy

Budowanie i deployment:
- Checkout kodu
- Setup Node.js
- Instalacja zależności
- Budowanie produkcyjne (`npm run build`)
- Deployment na Cloudflare Pages
- Upload artefaktów buildu (dostępny przez 7 dni)

**Czas wykonania**: ~3-5 minut

**Całkowity czas pipeline**: ~6-10 minut

## Artefakty

Pipeline zapisuje następujące artefakty:

### Unit Test Coverage
- **Nazwa**: `unit-test-coverage`
- **Zawartość**: Raporty pokrycia kodu testami
- **Retencja**: 30 dni
- **Dostępność**: Zawsze (nawet przy błędach)

### Build Artifacts
- **Nazwa**: `dist`
- **Zawartość**: Zbudowana wersja produkcyjna aplikacji
- **Retencja**: 7 dni
- **Dostępność**: Zawsze (nawet przy błędach deploymentu)

## Monitoring i Debugging

### Sprawdzanie Statusu Deploymentu

1. **GitHub Actions**:
   - Przejdź do zakładki **Actions**
   - Sprawdź status workflow "Deploy to Cloudflare Pages"
   - Zielony checkmark = sukces, czerwony X = błąd

2. **Cloudflare Dashboard**:
   - Przejdź do **Workers & Pages** → twój projekt
   - Zakładka **Deployments** pokazuje historię wdrożeń
   - Możesz zobaczyć logi buildu i deployment URL

### Najczęstsze Problemy

#### 1. Brak Cloudflare Secrets

```
Error: Missing required secret: CLOUDFLARE_API_TOKEN
```

**Rozwiązanie**: Dodaj wszystkie wymagane sekrety Cloudflare (patrz sekcja [Konfiguracja](#konfiguracja-github-secrets))

#### 2. Nieprawidłowy API Token

```
Error: Authentication error
```

**Rozwiązanie**: 
- Sprawdź czy token ma odpowiednie uprawnienia (Cloudflare Pages: Edit)
- Wygeneruj nowy token jeśli stary wygasł

#### 3. Projekt nie istnieje

```
Error: Project not found
```

**Rozwiązanie**: 
- Sprawdź czy `CLOUDFLARE_PROJECT_NAME` jest poprawne
- Lub pozwól workflow utworzyć nowy projekt automatycznie

#### 4. Build się nie powiódł

```
Error: Build failed with exit code 1
```

**Rozwiązanie**:
- Sprawdź logi buildu w szczegółach kroku "Build production"
- Upewnij się, że build działa lokalnie: `npm run build`
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione

#### 5. Testy się nie powiodły

```
Error: Tests failed
```

**Rozwiązanie**:
- Job "Build & Deploy" nie uruchomi się jeśli testy się nie powiodą
- Napraw błędy testów lokalnie: `npm run test`
- Push poprawki i workflow uruchomi się ponownie

### Pobieranie Artefaktów

1. Przejdź do zakładki **Actions**
2. Kliknij na konkretny workflow run
3. Przewiń w dół do sekcji **Artifacts**
4. Kliknij na artefakt aby go pobrać

## Lokalne Testowanie przed Deploymentem

Przed pushem do master, upewnij się że wszystko działa lokalnie:

```bash
# 1. Linting
npm run lint

# 2. Testy jednostkowe
npm run test:coverage

# 3. Build produkcyjny
npm run build

# 4. Preview buildu (opcjonalnie)
npm run preview
```

## Różnice: Pull Request vs Master Workflow

### Pull Request Workflow (`pull-request.yml`)
- **Cel**: Weryfikacja jakości kodu
- **Zawiera**: Lint + Unit Tests + E2E Tests + Status Comment
- **Nie zawiera**: Deployment
- **Trigger**: Pull Request do master

### Master Workflow (`master.yml`)
- **Cel**: Deployment do produkcji
- **Zawiera**: Lint + Unit Tests + Build + Deploy
- **Nie zawiera**: E2E Tests (oszczędność czasu)
- **Trigger**: Push do master + manual

**Dlaczego brak E2E w master?**
- E2E testy są już wykonane w PR workflow
- Oszczędność czasu (~5-10 minut)
- Szybszy deployment do produkcji

## Cloudflare Pages - Dodatkowe Funkcje

### Custom Domains

1. W Cloudflare Dashboard → twój projekt → **Custom domains**
2. Kliknij **Set up a custom domain**
3. Wprowadź swoją domenę
4. Skonfiguruj DNS zgodnie z instrukcjami

### Environment Variables

Możesz dodać zmienne środowiskowe bezpośrednio w Cloudflare:

1. Workers & Pages → twój projekt → **Settings** → **Environment variables**
2. Dodaj zmienne dla Production i/lub Preview
3. Zmienne będą dostępne w runtime aplikacji

**Uwaga**: Zmienne dodane w Cloudflare są dostępne tylko w runtime, nie w build time. Zmienne build-time muszą być w GitHub Secrets.

### Preview Deployments

Cloudflare automatycznie tworzy preview deployments dla każdego brancha:
- URL: `https://<branch>.<project>.pages.dev`
- Możesz to skonfigurować w ustawieniach projektu

### Rollback

Jeśli deployment się nie powiedzie lub wprowadzi błędy:

1. Przejdź do **Deployments** w Cloudflare Dashboard
2. Znajdź poprzedni działający deployment
3. Kliknij **...** → **Rollback to this deployment**

## Monitoring Produkcji

### Cloudflare Analytics

- **Workers & Pages** → twój projekt → **Analytics**
- Metryki: Requests, Bandwidth, Errors
- Real-time monitoring

### Logi

- **Workers & Pages** → twój projekt → **Logs**
- Real-time logs z aplikacji
- Filtry po statusie, metodzie, URL

## Optymalizacje

### Cache

Cloudflare automatycznie cachuje statyczne assety:
- JavaScript, CSS, obrazy
- Konfiguracja w `_headers` lub `_redirects` (opcjonalnie)

### Edge Functions

Cloudflare Pages wspiera Edge Functions (Cloudflare Workers):
- Umieść funkcje w `/functions` directory
- Automatycznie deploy'owane razem z aplikacją

## Bezpieczeństwo

### API Token Best Practices

- ✅ Używaj tokenów z minimalnymi wymaganymi uprawnieniami
- ✅ Ogranicz token do konkretnego konta
- ✅ Regularnie rotuj tokeny
- ❌ Nigdy nie commituj tokenów do repozytorium
- ❌ Nie udostępniaj tokenów

### Secrets Management

- Wszystkie sekrety w GitHub Secrets (nie w kodzie)
- Osobne sekrety dla różnych środowisk
- Regularny audyt używanych sekretów

## Wsparcie i Zasoby

### Dokumentacja
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)

### Troubleshooting
- [Cloudflare Community](https://community.cloudflare.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

### Status
- [Cloudflare Status](https://www.cloudflarestatus.com/)

## Checklist Deployment

Przed pierwszym deploymentem upewnij się że:

- [ ] Zainstalowano `@astrojs/cloudflare` adapter
- [ ] Zaktualizowano `astro.config.mjs` z adapterem Cloudflare
- [ ] Dodano wszystkie wymagane GitHub Secrets
- [ ] Utworzono projekt w Cloudflare Pages (lub pozwól na auto-create)
- [ ] Workflow `master.yml` jest w `.github/workflows/`
- [ ] Testy przechodzą lokalnie
- [ ] Build działa lokalnie
- [ ] Sprawdzono logi pierwszego deploymentu

## FAQ

**Q: Czy mogę używać Node.js adapter lokalnie a Cloudflare na produkcji?**
A: Tak, ale lepiej używać tego samego adaptera wszędzie dla spójności. Możesz użyć `wrangler pages dev` lokalnie.

**Q: Jak długo trwa pierwszy deployment?**
A: Pierwszy deployment może trwać 10-15 minut (instalacja zależności, build). Kolejne będą szybsze dzięki cache.

**Q: Czy mogę mieć osobne projekty dla staging i production?**
A: Tak, utwórz osobne workflow dla różnych branchy i użyj różnych `CLOUDFLARE_PROJECT_NAME`.

**Q: Co się stanie jeśli deployment się nie powiedzie?**
A: Poprzednia wersja aplikacji pozostanie aktywna. Możesz naprawić błąd i spróbować ponownie.

**Q: Czy Cloudflare Pages jest darmowy?**
A: Tak, Cloudflare Pages ma darmowy tier z unlimited requests i bandwidth. [Zobacz pricing](https://pages.cloudflare.com/#pricing).

