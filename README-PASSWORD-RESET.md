# Password Reset - Instrukcja Konfiguracji i Użycia

## 📋 Spis Treści
1. [Opis Procesu](#opis-procesu)
2. [Konfiguracja Lokalna](#konfiguracja-lokalna)
3. [Konfiguracja Produkcyjna](#konfiguracja-produkcyjna)
4. [Testowanie](#testowanie)
5. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## Opis Procesu

### Przepływ Resetowania Hasła (Krok po Kroku)

```
1. Użytkownik → /auth/forgot-password
   ↓
2. Wpisuje email i wysyła formularz
   ↓
3. Frontend → POST /api/auth/forgot-password
   ↓
4. Backend wywołuje Supabase resetPasswordForEmail()
   ↓
5. Supabase wysyła email z linkiem
   Link: https://twoja-domena.com/auth/reset-password#token_hash=XXX&type=recovery
   ↓
6. Użytkownik klika link w emailu
   ↓
7. Strona /auth/reset-password.astro
   - Ekstraktuje token_hash z URL
   - Przekierowuje do /auth/reset-password/[token]
   ↓
8. Użytkownik wpisuje nowe hasło
   ↓
9. Frontend → POST /api/auth/reset-password
   Body: { token, newPassword }
   ↓
10. Backend:
    - Weryfikuje token przez verifyOtp()
    - Aktualizuje hasło przez updateUser()
    ↓
11. Sukces! Użytkownik może się zalogować
```

### Struktura Plików

```
src/
├── pages/
│   ├── auth/
│   │   ├── forgot-password.astro          # Strona z formularzem zapomnienia hasła
│   │   ├── reset-password.astro           # Landing page - ekstraktuje token
│   │   └── reset-password/
│   │       └── [token].astro              # Formularz ustawiania nowego hasła
│   └── api/
│       └── auth/
│           ├── forgot-password.ts         # Endpoint wysyłający email
│           └── reset-password.ts          # Endpoint resetujący hasło
├── components/
│   ├── ForgotPasswordForm.tsx             # Komponent formularza zapomnienia hasła
│   └── ResetPasswordForm.tsx              # Komponent formularza nowego hasła
└── lib/
    └── schemas/
        └── auth.ts                        # Schematy walidacji Zod
```

---

## Konfiguracja Lokalna

### 1. Konfiguracja Supabase (Development)

Edytuj plik `supabase/config.toml`:

```toml
[auth]
# URL twojej aplikacji (domyślnie Astro używa portu 4321)
site_url = "http://127.0.0.1:4321"

# Dodaj URL-e do których Supabase może przekierować
additional_redirect_urls = [
  "http://127.0.0.1:4321/auth/reset-password",
  "http://localhost:4321/auth/reset-password"
]
```

### 2. Restart Supabase

Po zmianie konfiguracji, zrestartuj Supabase:

```bash
npx supabase stop
npx supabase start
```

### 3. Testowanie Email (Inbucket)

W trybie lokalnym, emaile nie są wysyłane na prawdę. Zamiast tego możesz je zobaczyć w Inbucket:

1. Otwórz: http://localhost:54324
2. Wyślij request o reset hasła
3. Sprawdź Inbucket - znajdziesz tam email z linkiem

---

## Konfiguracja Produkcyjna

### 1. Konfiguracja w Supabase Dashboard

Zaloguj się do [Supabase Dashboard](https://app.supabase.com) i:

1. Wybierz swój projekt
2. Idź do: **Authentication** → **URL Configuration**
3. Dodaj **Redirect URLs**:
   ```
   https://twoja-domena.com/auth/reset-password
   https://www.twoja-domena.com/auth/reset-password
   ```
4. Ustaw **Site URL**:
   ```
   https://twoja-domena.com
   ```

### 2. Konfiguracja Email Provider (SMTP)

⚠️ **WAŻNE**: Supabase w produkcji ma limit emaili. Skonfiguruj własny SMTP!

#### Opcja A: SendGrid (Zalecane)

1. Zarejestruj się na [SendGrid](https://sendgrid.com)
2. Wygeneruj API Key
3. W Supabase Dashboard → **Authentication** → **Email Templates** → **SMTP Settings**:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Password: [Twój SendGrid API Key]
   Sender email: noreply@twoja-domena.com
   Sender name: 10xCards
   ```

#### Opcja B: AWS SES

```
Host: email-smtp.[region].amazonaws.com
Port: 587
User: [AWS SMTP Username]
Password: [AWS SMTP Password]
```

#### Opcja C: Inne SMTP

Możesz użyć dowolnego dostawcy SMTP (Gmail, Mailgun, Postmark, etc.)

### 3. Dostosowanie Szablonu Email

W Supabase Dashboard → **Authentication** → **Email Templates** → **Reset Password**:

```html
<h2>Resetuj swoje hasło</h2>
<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta 10xCards.</p>
<p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
<p><a href="{{ .ConfirmationURL }}">Resetuj hasło</a></p>
<p>Link będzie ważny przez 60 minut.</p>
<p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
```

### 4. Zmienne Środowiskowe

Upewnij się, że masz ustawione w produkcji:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-key
```

---

## Testowanie

### Test Lokalny

1. **Uruchom aplikację**:
   ```bash
   npm run dev
   ```

2. **Uruchom Supabase**:
   ```bash
   npx supabase start
   ```

3. **Zarejestruj testowego użytkownika**:
   - Idź do: http://localhost:4321/auth/register
   - Zarejestruj się z emailem: test@example.com

4. **Test reset hasła**:
   - Idź do: http://localhost:4321/auth/forgot-password
   - Wpisz: test@example.com
   - Sprawdź email w Inbucket: http://localhost:54324
   - Kliknij link w emailu
   - Ustaw nowe hasło

5. **Weryfikacja**:
   - Zaloguj się z nowym hasłem: http://localhost:4321/auth/login

### Test Produkcyjny

1. **Deploy aplikacji**
2. **Skonfiguruj Redirect URLs w Supabase Dashboard**
3. **Przetestuj pełny flow na produkcji**

### Narzędzia Debug

W Chrome DevTools możesz sprawdzić:

1. **Network Tab** - Zobacz requesty do `/api/auth/forgot-password` i `/api/auth/reset-password`
2. **Console Tab** - Sprawdź logi błędów
3. **Application Tab** → **Cookies** - Zobacz czy session cookies są ustawione

---

## Rozwiązywanie Problemów

### Problem 1: Link w emailu prowadzi do Supabase, nie do mojej aplikacji

**Przyczyna**: Brak konfiguracji Redirect URLs

**Rozwiązanie**:
1. W Supabase Dashboard → Authentication → URL Configuration
2. Dodaj pełny URL: `https://twoja-domena.com/auth/reset-password`
3. Upewnij się, że używasz **https://** w produkcji

---

### Problem 2: "Token is invalid or expired"

**Możliwe przyczyny**:

1. **Token wygasł** (ważny 60 min)
   - Rozwiązanie: Wyślij nowy request o reset

2. **Token już został użyty**
   - Token jest jednorazowy
   - Rozwiązanie: Wyślij nowy request o reset

3. **Nieprawidłowa ekstrakcja tokena**
   - Sprawdź czy w URL jest `token_hash` parametr
   - Zobacz console.log w `/auth/reset-password.astro`

---

### Problem 3: Email się nie wysyła

**Development (lokalnie)**:
- Sprawdź Inbucket: http://localhost:54324
- Emaile nie wychodzą "na prawdę" lokalnie

**Production**:
1. Sprawdź limity Supabase (domyślnie bardzo niskie!)
2. Skonfiguruj własny SMTP provider (SendGrid, AWS SES, etc.)
3. Sprawdź logi w Supabase Dashboard → Logs

---

### Problem 4: CORS errors

**Przyczyna**: Frontend i backend na różnych domenach

**Rozwiązanie**:
1. Upewnij się, że `site_url` w Supabase odpowiada domenie frontendu
2. Dodaj domenę do `additional_redirect_urls`

---

### Problem 5: "Redirect URL not allowed"

**Przyczyna**: URL nie jest na liście dozwolonych

**Rozwiązanie**:
1. W Supabase Dashboard → Authentication → URL Configuration
2. Dodaj **dokładny** URL do listy Redirect URLs
3. Zwróć uwagę na:
   - http vs https
   - www vs bez www
   - trailing slash (/) vs bez

---

## Bezpieczeństwo

### Dobre praktyki:

1. ✅ **Nie ujawniaj czy email istnieje**
   - Zawsze zwracaj ten sam komunikat sukcesu
   - Implementacja: `forgot-password.ts` linia 59-62

2. ✅ **Token jednorazowy**
   - Supabase automatycznie invaliduje token po użyciu

3. ✅ **Limit czasu**
   - Token ważny tylko 60 minut

4. ✅ **Rate limiting**
   - Supabase ma wbudowany rate limiting
   - Config: `supabase/config.toml` → `[auth.rate_limit]`

5. ✅ **Silne hasła**
   - Walidacja w schemacie Zod
   - Minimum 8 znaków

---

## Konfiguracja Rate Limiting

W `supabase/config.toml`:

```toml
[auth.rate_limit]
# Ile emaili może być wysłanych na godzinę (na IP)
email_sent = 2

# Ile prób weryfikacji tokenów na 5 minut (na IP)
token_verifications = 30
```

**Uwaga**: Te limity są **PER IP ADDRESS**

---

## FAQ

### Q: Jak długo ważny jest link resetujący?
**A**: 60 minut (3600 sekund). Konfigurowane w `supabase/config.toml`:
```toml
[auth.email]
otp_expiry = 3600
```

### Q: Czy mogę zmienić tekst emaila?
**A**: Tak! W Supabase Dashboard → Authentication → Email Templates

### Q: Czy mogę użyć własnej domeny do wysyłki emaili?
**A**: Tak, skonfiguruj SMTP z własną domeną w ustawieniach email

### Q: Co się stanie jeśli user kliknie stary link resetujący?
**A**: Dostanie błąd "Token is invalid or expired"

### Q: Czy mogę zmienić czas ważności tokenu?
**A**: Tak, w `supabase/config.toml` → `[auth.email]` → `otp_expiry`

---

## Checklist Pre-Production

Przed wdrożeniem na produkcję, upewnij się że:

- [ ] Skonfigurowałeś Redirect URLs w Supabase Dashboard
- [ ] Ustawiłeś Site URL na domenę produkcyjną
- [ ] Skonfigurowałeś własny SMTP provider
- [ ] Dostosowałeś szablon emaila
- [ ] Przetestowałeś pełny flow na produkcji
- [ ] Sprawdziłeś rate limiting
- [ ] Zweryfikowałeś że linki w emailach prowadzą do Twojej aplikacji

---

## Support

Jeśli masz problemy:

1. Sprawdź logi w Supabase Dashboard → Logs
2. Zobacz Chrome DevTools → Network & Console
3. Sprawdź dokumentację Supabase: https://supabase.com/docs/guides/auth/passwords
4. Sprawdź ustawienia w Supabase Dashboard → Authentication

---

**Ostatnia aktualizacja**: 2025-11-22

