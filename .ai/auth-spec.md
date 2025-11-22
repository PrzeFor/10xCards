# Specyfikacja modułu uwierzytelniania - 10xCards

Poniższy dokument opisuje architekturę, logikę oraz integrację systemu rejestracji, logowania i odzyskiwania konta użytkownika zgodnie z wymaganiami US-010 i US-011.

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Strony Astro (SSR)
- **/register** (src/pages/register.astro)
  - Import ogólnego layoutu `Layout.astro`.
  - Server-side: sprawdzanie sesji (jeśli zalogowany → redirect do pulpitu).
  - Renderuje komponent React `RegistrationForm`.
- **/login** (src/pages/login.astro)
  - Analogicznie do `/register`, z użyciem `LoginForm`.
- **/forgot-password** (src/pages/forgot-password.astro)
  - Formularz podania adresu e-mail do odzyskania hasła (`ForgotPasswordForm`).
- **/reset-password/[token].astro**
  - Strona dostępna po kliknięciu linku z maila.
  - Parametr `token` z URL przekazywany do `ResetPasswordForm`.
- **/settings** (src/pages/settings.astro)
  - Server-side: sprawdzanie sesji (jeśli brak sesji → redirect na `/login`).
  - Renderuje komponent React `AccountSettings` umożliwiający zarządzanie kontem.

### 1.2 Layout i nawigacja
- `src/layouts/Layout.astro`
  - Rozszerzyć nagłówek: jeśli brak sesji → przyciski **Zaloguj** i **Zarejestruj**.
  - Jeśli sesja istnieje → menu użytkownika z przyciskiem **Wyloguj**, odnośnik do **Moje fiszki**.
  - Wykorzystać komponent `sonner` do globalnych powiadomień.

### 1.3 Komponenty React (Client-side)
- **RegistrationForm.tsx**
  - Pola: `email`, `password`, `confirmPassword` (min. 8 znaków).
  - Walidacja lokalna z Zod i `react-hook-form`.
  - Obsługa stanu ładowania (disable submit podczas requestu).
  - Fetch → `POST /api/register`, parsowanie odpowiedzi, obsługa błędów.
  - Po sukcesie: redirect do `/generations`.
- **LoginForm.tsx**
  - Pola: `email`, `password`.
  - Zasady walidacji analogiczne.
  - Fetch → `POST /api/login`.
  - Po sukcesie: redirect do pulpitu.
- **ForgotPasswordForm.tsx**
  - Pole `email` z walidacją.
  - Fetch → `POST /api/forgot-password`.
  - Powiadomienie o wysłaniu maila.
- **ResetPasswordForm.tsx**
  - Pola: `newPassword`, `confirmPassword`.
  - Token w props.
  - Fetch → `POST /api/reset-password` z `{ token, newPassword }`.
  - Obsługa błędów: nieprawidłowy/wyeksiprd token.
- **AccountSettings.tsx**
  - Wyświetla przycisk "Usuń konto" i otwiera modal potwierdzenia.
  - Po potwierdzeniu wywołuje `POST /api/delete-account`.
  - Po sukcesie: wyświetla powiadomienie i przekierowuje na stronę główną.

### 1.4 Walidacja i komunikaty błędów
- Walidacja client-side i server-side zgodna (te same schematy Zod).
- Komunikaty błędów pod polami formularza + toasty globalne dla alertów.
- Scenariusze:
  - Błędny format e-mail.
  - Hasło za krótkie lub brak zgodności confirmPassword.
  - Istniejący użytkownik (rejestracja).
  - Nieprawidłowe dane logowania.
  - Błąd sieci lub serwera.
  - Token resetu wygasł lub jest nieprawidłowy.

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API (src/pages/api)
- **register.ts** (POST):
  - Body: `{ email: string, password: string }`.
  - Walidacja Zod (`RegisterSchema`).
  - `await context.locals.supabase.auth.signUp({ email, password })`.
  - Obsługa błędów Supabase → kod 400/409.
- **login.ts** (POST):
  - Body: `{ email: string, password: string }`.
  - `auth.signInWithPassword(...)`, zwraca `session`.
  - Ustawienie HttpOnly cookie: `sb-access-token`, `sb-refresh-token`.
  - Po nieudanej próbie zwiększ licznik nieudanych logowań; po 5 nieudanych próbach zwracaj HTTP 423 (Locked) z informacją o konieczności CAPTCHA.
- **logout.ts** (POST):
  - `auth.signOut()`, usunięcie ciasteczek.
- **forgot-password.ts** (POST):
  - Body: `{ email: string }`.
  - `auth.resetPasswordForEmail(email, { redirectTo: URL_RESET })`.
- **reset-password.ts** (POST):
  - Body: `{ token: string, newPassword: string }`.
  - `auth.updateUser({ password: newPassword }, { refreshToken: token })`.
- **delete-account.ts** (POST):
  - Wymaga uwierzytelnienia użytkownika z `context.locals.supabase`.
  - Pobiera `user.id` z sesji i wywołuje `supabase.auth.admin.deleteUser(user.id)`.
  - Usuwa wszystkie powiązane dane użytkownika (fiszki, generacje, logi) w bazie danych.
  - Zwraca HTTP 200 na sukces, 401 gdy niezalogowany, 500 przy błędzie serwera.

### 2.2 Modele danych
- Korzystamy z wbudowanej tabeli `auth.users` w Supabase.

### 2.3 Walidacja i obsługa wyjątków
- Schematy Zod w `src/lib/schemas/auth.ts`:
  - `RegisterSchema`, `LoginSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`.
- Standard output JSON:
  ```json
  { success: boolean, message?: string, errors?: Record<string,string> }
  ```
- Kody HTTP: 200 (OK), 400 (walidacja), 401 (auth), 409 (konflikt), 500 (serwer).

### 2.4 Renderowanie i middleware
- Middleware (`src/middleware/index.ts`) przekazuje `supabaseClient`.
- Chronione strony: w SSR sprawdzać `await supabase.auth.getSession()` i redirect.
- Użyć `redirect` w funkcjach `get` w Astro.

## 3. SYSTEM AUTENTYKACJI

### 3.1 Wykorzystanie Supabase Auth
- **Rejestracja**: `supabase.auth.signUp({ email, password })`.
- **Logowanie**: `supabase.auth.signInWithPassword({ email, password })`.
- **Wylogowanie**: `supabase.auth.signOut()` + clear cookies.
- **Reset hasła**:
  - `resetPasswordForEmail` wysyła mail z linkiem.
  - `updateUser` z tokenem ustawia nowe hasło.

### 3.2 Zarządzanie sesją
- Po logowaniu zapisać `accessToken` i `refreshToken` w ciasteczkach HttpOnly, Secure.
- W SSR używać `supabase.auth.getSession()` do odczytu ciasteczek i stanu zalogowania.
- Czas życia sesji: domyślne Supabase.

### 3.3 Ochrona tras
- Middleware globalne (`astro.config.mjs` + `src/middleware/index.ts`).
- Listy stron chronionych (np. `/generations`, `/my-cards`) → redirect na `/login`.
- Dodaj `/settings` i `/collections` do listy tras chronionych.

---

_Powyższa specyfikacja zapewnia spójną integrację nowego modułu auth w ramach istniejącej aplikacji Astro + React + Supabase._
