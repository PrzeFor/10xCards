# Migracja z Node.js na Cloudflare Pages

## Przegląd zmian

Projekt został zmigrowany z deploymentu opartego na Node.js adapter na Cloudflare Pages. Poniżej znajduje się podsumowanie wszystkich zmian.

## Zmiany w Projekcie

### 1. Astro Configuration (`astro.config.mjs`)

**Przed:**
```javascript
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
});
```

**Po:**
```javascript
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    mode: 'directory',
  }),
});
```

### 2. Zależności (`package.json`)

**Dodane:**
- `@astrojs/cloudflare` (devDependencies)

**Do usunięcia (opcjonalnie):**
- `@astrojs/node` - może pozostać jeśli używasz go lokalnie, ale nie jest wymagany dla Cloudflare

### 3. GitHub Actions Workflow

#### Nowy plik: `.github/workflows/master.yml`

Zastępuje poprzedni `master.yaml` i dodaje deployment na Cloudflare Pages.

**Kluczowe zmiany:**
- Struktura jobów: `lint` → `unit-test` → `build-and-deploy`
- Usunięto testy E2E (są w PR workflow)
- Dodano deployment z `cloudflare/wrangler-action@v3`
- Dodano wymagane permissions: `contents: read`, `deployments: write`

#### Wymagane nowe sekrety GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

## Kroki Migracji

### Krok 1: Instalacja Adaptera Cloudflare

```bash
npm install --save-dev @astrojs/cloudflare
```

✅ **Wykonane**

### Krok 2: Aktualizacja Konfiguracji Astro

Zmień adapter w `astro.config.mjs` z `@astrojs/node` na `@astrojs/cloudflare`.

✅ **Wykonane**

### Krok 3: Konfiguracja GitHub Secrets

Dodaj następujące sekrety w GitHub:

1. **CLOUDFLARE_API_TOKEN**
   - Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens
   - Create Token → "Edit Cloudflare Workers" template
   - Lub custom token z uprawnieniami: Account > Cloudflare Pages > Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - Cloudflare Dashboard → Workers & Pages
   - Account ID w prawym panelu

3. **CLOUDFLARE_PROJECT_NAME**
   - Nazwa projektu (np. `10xcards`)
   - Projekt zostanie automatycznie utworzony przy pierwszym deploymencie

⚠️ **Do wykonania przez użytkownika**

### Krok 4: Utworzenie Workflow

Utworzono nowy workflow `.github/workflows/master.yml` z deploymentem na Cloudflare Pages.

✅ **Wykonane**

### Krok 5: Testowanie Lokalne

Przed pierwszym deploymentem, przetestuj build lokalnie:

```bash
npm run build
```

⚠️ **Do wykonania przez użytkownika**

### Krok 6: Pierwszy Deployment

Po skonfigurowaniu sekretów, push do master uruchomi automatyczny deployment:

```bash
git add .
git commit -m "Migrate to Cloudflare Pages"
git push origin master
```

Lub uruchom manualnie:
1. GitHub → Actions → "Deploy to Cloudflare Pages" → Run workflow

⚠️ **Do wykonania przez użytkownika**

## Weryfikacja Migracji

### Checklist

- [x] Zainstalowano `@astrojs/cloudflare`
- [x] Zaktualizowano `astro.config.mjs`
- [x] Utworzono workflow `master.yml`
- [x] Utworzono dokumentację
- [ ] Dodano GitHub Secrets dla Cloudflare
- [ ] Przetestowano build lokalnie
- [ ] Wykonano pierwszy deployment
- [ ] Zweryfikowano działanie aplikacji na Cloudflare Pages

### Testy Lokalne

```bash
# 1. Linting
npm run lint

# 2. Testy jednostkowe
npm run test

# 3. Build
npm run build

# 4. Preview (opcjonalnie)
npm run preview
```

### Weryfikacja Deploymentu

Po pierwszym deploymencie sprawdź:

1. **GitHub Actions**
   - Czy workflow zakończył się sukcesem
   - Czy wszystkie joby przeszły (lint, unit-test, build-and-deploy)

2. **Cloudflare Dashboard**
   - Workers & Pages → twój projekt
   - Sprawdź status deploymentu
   - Otwórz deployment URL

3. **Funkcjonalność Aplikacji**
   - Sprawdź czy aplikacja działa poprawnie
   - Przetestuj kluczowe funkcje (auth, generowanie flashcards)
   - Sprawdź połączenie z Supabase i OpenRouter

## Różnice: Node.js vs Cloudflare

| Aspekt | Node.js | Cloudflare Pages |
|--------|---------|------------------|
| **Runtime** | Node.js | Cloudflare Workers (V8) |
| **Deployment** | Własny serwer / DigitalOcean | Cloudflare Edge Network |
| **Skalowanie** | Manualne | Automatyczne |
| **CDN** | Wymaga konfiguracji | Wbudowane |
| **Cold Start** | Może być wolny | Bardzo szybki |
| **Koszt** | Zależny od serwera | Darmowy tier (unlimited) |
| **SSL** | Wymaga konfiguracji | Automatyczne |
| **Geograficzne Routing** | Wymaga konfiguracji | Automatyczne (Edge) |

## Korzyści Migracji

### Wydajność
- ⚡ **Edge Computing** - Aplikacja działa na edge network Cloudflare (>300 lokalizacji)
- ⚡ **Szybki Cold Start** - Cloudflare Workers startują w <1ms
- ⚡ **Wbudowany CDN** - Automatyczne cachowanie statycznych assetów

### Skalowalność
- 📈 **Auto-scaling** - Automatyczne skalowanie bez konfiguracji
- 📈 **Unlimited Requests** - Brak limitów requestów na darmowym tieru
- 📈 **Global Distribution** - Aplikacja dostępna globalnie

### Koszty
- 💰 **Darmowy Tier** - Unlimited requests i bandwidth
- 💰 **Brak Kosztów Serwera** - Nie potrzebujesz własnego serwera
- 💰 **Brak Kosztów CDN** - Wbudowane w Cloudflare Pages

### Bezpieczeństwo
- 🔒 **Automatyczne SSL** - Certyfikaty SSL bez konfiguracji
- 🔒 **DDoS Protection** - Wbudowana ochrona Cloudflare
- 🔒 **Edge Security** - Firewall i security na poziomie edge

### Developer Experience
- 🛠️ **Preview Deployments** - Automatyczne preview dla każdego brancha
- 🛠️ **Instant Rollback** - Łatwy rollback do poprzednich wersji
- 🛠️ **Real-time Logs** - Logi w czasie rzeczywistym
- 🛠️ **Analytics** - Wbudowane analytics

## Potencjalne Problemy i Rozwiązania

### Problem 1: Node.js APIs

**Problem**: Cloudflare Workers nie wspierają wszystkich Node.js APIs.

**Rozwiązanie**: 
- Astro automatycznie polyfilluje większość APIs
- Sprawdź [Cloudflare Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)
- Użyj `nodejs_compat` flag jeśli potrzebujesz dodatkowych APIs

### Problem 2: File System Access

**Problem**: Cloudflare Workers nie mają dostępu do file system.

**Rozwiązanie**:
- Używaj Cloudflare KV, R2, lub D1 dla storage
- Dla tego projektu nie jest to problem (używamy Supabase)

### Problem 3: Environment Variables

**Problem**: Zmienne środowiskowe build-time vs runtime.

**Rozwiązanie**:
- Build-time variables: GitHub Secrets (w workflow)
- Runtime variables: Cloudflare Pages Environment Variables
- Dla tego projektu wszystkie zmienne są build-time

### Problem 4: Cold Starts

**Problem**: W Node.js mogą być cold starts.

**Rozwiązanie**:
- Cloudflare Workers mają bardzo szybkie cold starts (<1ms)
- To jest improvement, nie problem!

## Rollback Plan

Jeśli migracja nie powiedzie się, możesz wrócić do Node.js:

### 1. Przywróć Node.js Adapter

```javascript
// astro.config.mjs
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
});
```

### 2. Przywróć Poprzedni Workflow

Możesz użyć poprzedniej wersji `master.yaml` z git history.

### 3. Deploy na DigitalOcean

Kontynuuj deployment na DigitalOcean zgodnie z poprzednią konfiguracją.

## Następne Kroki

Po pomyślnej migracji rozważ:

1. **Custom Domain**
   - Skonfiguruj własną domenę w Cloudflare Pages
   - Automatyczne SSL dla custom domain

2. **Environment Variables**
   - Przenieś niektóre zmienne do Cloudflare Pages (runtime)
   - Zachowaj build-time variables w GitHub Secrets

3. **Preview Deployments**
   - Skonfiguruj preview deployments dla feature branches
   - Automatyczne preview URLs dla każdego PR

4. **Analytics i Monitoring**
   - Włącz Cloudflare Web Analytics
   - Konfiguruj alerty dla błędów

5. **Optymalizacje**
   - Skonfiguruj custom cache rules
   - Dodaj Edge Functions jeśli potrzebne

## Dokumentacja

- [README-CLOUDFLARE-DEPLOYMENT.md](./README-CLOUDFLARE-DEPLOYMENT.md) - Szczegółowa dokumentacja deploymentu
- [workflows/README.md](./workflows/README.md) - Dokumentacja workflows
- [github-action.mdc](../.ai/github-action.mdc) - Best practices dla GitHub Actions

## Wsparcie

W razie problemów:
- Sprawdź logi w GitHub Actions
- Sprawdź logi w Cloudflare Dashboard
- Zobacz [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- Zobacz [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

## Podsumowanie

Migracja z Node.js na Cloudflare Pages przynosi znaczące korzyści w zakresie wydajności, skalowalności i kosztów, przy minimalnych zmianach w kodzie. Główne zmiany to:

1. ✅ Zmiana adaptera w `astro.config.mjs`
2. ✅ Aktualizacja workflow GitHub Actions
3. ⚠️ Konfiguracja GitHub Secrets (do wykonania)
4. ⚠️ Pierwszy deployment (do wykonania)

Po skonfigurowaniu sekretów i pierwszym deploymencie, aplikacja będzie automatycznie wdrażana na Cloudflare Pages przy każdym pushu do master.

