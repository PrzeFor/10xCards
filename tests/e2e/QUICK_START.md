# E2E Tests - Quick Start Guide

Szybki przewodnik po uruchomieniu testów E2E dla 10xCards.

## ⚡ Szybki start (5 minut)

### Krok 1: Zainstaluj Playwright

```bash
npm run playwright:install
```

### Krok 2: Utwórz testowego użytkownika

1. Uruchom aplikację:
   ```bash
   npm run dev
   ```

2. Otwórz przeglądarkę: `http://localhost:3000/auth/register`

3. Zarejestruj testowego użytkownika:
   - Email: `test@example.com`
   - Hasło: `TestPassword123!`

**📖 Potrzebujesz szczegółowych instrukcji?** Zobacz [`SETUP_TEST_USER.md`](./SETUP_TEST_USER.md)

### Krok 3: Skonfiguruj zmienne środowiskowe

Utwórz plik `.env.test` w głównym katalogu projektu:

```bash
# W terminalu (Windows PowerShell)
New-Item -Path .env.test -ItemType File

# Lub (Git Bash / Linux / Mac)
touch .env.test
```

Dodaj do `.env.test`:

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# Skopiuj te wartości z pliku .env (jeśli istnieje)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
OPENROUTER_API_KEY=your-openrouter-key
```

### Krok 4: Weryfikuj setup (opcjonalnie, ale zalecane)

```bash
npm run test:e2e:verify
```

To sprawdzi czy:
- ✅ Plik `.env.test` istnieje
- ✅ Wszystkie wymagane zmienne są ustawione  
- ✅ Playwright jest zainstalowany
- ✅ Port 3000 jest dostępny

### Krok 5: Uruchom testy

```bash
# KROK 5a: Najpierw uruchom debug test (pokazuje co się dzieje krok po kroku)
npm run test:e2e:debug-setup

# KROK 5b: Jeśli debug test przechodzi, uruchom smoke tests
npm run test:e2e:smoke

# KROK 5c: Jeśli smoke tests przechodzą, uruchom wszystkie testy
npm run test:e2e

# Lub w trybie UI (zalecane przy pierwszym uruchomieniu)
npm run test:e2e:ui
```

**Uwaga**: Debug test pokaże szczegółowe logi w konsoli i utworzy screenshoty w `test-results/`

## 🎯 Pierwsze uruchomienie - Spodziewane rezultaty

### ✅ Sukces wygląda tak:

```
Running 12 tests using 1 worker

  ✓ should complete full generation and save flow (5.2s)
  ✓ should allow accepting proposals before saving (3.1s)
  ✓ should allow rejecting proposals (2.9s)
  ...

12 passed (47s)
```

### ❌ Częste błędy przy pierwszym uruchomieniu

#### Błąd 1: "Authentication required"

```
Error: locator.fill: Test timeout exceeded
  waiting for getByTestId('generation-source-text')
```

**Rozwiązanie**: 
- Sprawdź czy plik `.env.test` istnieje i zawiera poprawne dane
- Sprawdź czy testowy użytkownik istnieje w bazie danych
- Spróbuj zalogować się ręcznie tymi samymi danymi

#### Błąd 2: "ECONNREFUSED localhost:3000"

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Rozwiązanie**:
- Poczekaj ~10 sekund i spróbuj ponownie
- Lub uruchom serwer ręcznie w osobnym terminalu: `npm run dev`

#### Błąd 3: "Timed out waiting from config.webServer"

```
Error: Timed out waiting 120000ms from config.webServer
```

**Rozwiązanie**:
- Port 3000 może być zajęty - zamknij inne procesy
- Sprawdź czy `npm run dev` działa poprawnie
- Sprawdź logi serwera czy nie ma błędów

#### Błąd 4: "locator.waitFor: Timeout exceeded" na generation-source-text

```
Error: locator.waitFor: Timeout exceeded
  waiting for getByTestId('generation-source-text')
```

**Rozwiązanie**:
1. Uruchom debug test aby zobaczyć co się dzieje:
   ```bash
   npm run test:e2e:debug-setup
   ```
   
2. Sprawdź screenshoty w `test-results/`:
   - `debug-1-login-page.png` - czy login page się ładuje?
   - `debug-2-form-filled.png` - czy form jest wypełniony?
   - `debug-3-after-submit.png` - co się dzieje po submicie?
   - `debug-4-generations-page.png` - czy generations page się ładuje?
   - `debug-5-textarea-not-visible.png` - dlaczego textarea nie jest widoczny?

3. Sprawdź logi konsoli - debug test wypisuje szczegółowe informacje

4. Częste przyczyny:
   - Błędne dane logowania (sprawdź `.env.test`)
   - Użytkownik nie istnieje w bazie
   - React component nie hydratuje się (sprawdź browser console errors)
   - Problem z Supabase connection

## 📝 Weryfikacja setupu

### Test 1: Czy serwer działa?

```bash
npm run dev
```

Otwórz: `http://localhost:3000`  
Oczekiwany rezultat: Strona się ładuje bez błędów

### Test 2: Czy możesz się zalogować?

1. Przejdź do: `http://localhost:3000/auth/login`
2. Zaloguj się danymi z `.env.test`
3. Powinieneś zostać przekierowany do `/generations`

### Test 3: Czy Playwright jest zainstalowany?

```bash
npx playwright --version
```

Oczekiwany rezultat: `Version 1.xx.x`

## 🚀 Następne kroki

Po pomyślnym uruchomieniu testów:

1. **Eksploruj UI mode**:
   ```bash
   npm run test:e2e:ui
   ```
   Pozwala na uruchamianie testów interaktywnie z podglądem

2. **Uruchom konkretny test**:
   ```bash
   npx playwright test generations.spec.ts -g "should complete full generation"
   ```

3. **Debug konkretnego testu**:
   ```bash
   npx playwright test generations.spec.ts:25 --debug
   ```

4. **Zobacz raporty**:
   ```bash
   npx playwright show-report
   ```

## 📚 Dokumentacja

- **Pełna dokumentacja E2E**: `tests/e2e/README.md`
- **Page Object Model**: `tests/e2e/page-objects/README.md`
- **Fixture autoryzacji**: `tests/e2e/fixtures/auth.fixture.ts`

## 💡 Wskazówki pro-tips

1. **Używaj UI mode podczas pisania testów** - natychmiastowy feedback
2. **Nagrywaj testy z codegen**: `npm run test:e2e:codegen`
3. **Sprawdzaj trace viewer przy błędach**: `npx playwright show-trace`
4. **Uruchamiaj testy w tle**: dodaj `&` na końcu komendy (Linux/Mac)

## 🆘 Potrzebujesz pomocy?

1. Sprawdź sekcję "Częste problemy" w `tests/e2e/README.md`
2. Sprawdź logi serwera deweloperskiego
3. Uruchom test z flagą `--debug` aby zobaczyć co się dzieje
4. Sprawdź screenshoty w `test-results/` po nieudanych testach

---

**Ready to test? 🚀**

```bash
npm run test:e2e:ui
```

