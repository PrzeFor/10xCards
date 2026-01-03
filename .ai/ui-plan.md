# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Interfejs użytkownika oparty na Astro z file-based routing oraz dwoma layoutami:
- **PublicLayout**: strony autoryzacji (login, rejestracja).
- **AppLayout**: chronione widoki (dashboard, generacje, fiszki, sesje, ustawienia użytkownika).

Zarządzanie stanem w React Context (ew. z użyciem Zustand) obejmuje:
- Stan uwierzytelnienia (Supabase JWT) w Astro middleware i SDK.
- Bufor niezatwierdzonych propozycji generowanych fiszek.

UX i a11y:
- Komponent `Skip to content` i widoczny outline focus.
- Modale z focus trap i aria roles, klawisz `Escape` do zamknięcia.
- Kontrast zgodny z WCAG 2.1.
- Błędy krytyczne inline, pozostałe jako toast'y.
- Potwierdzenia destrukcyjnych akcji (usuwanie konta) wymagają double confirmation pattern.
- Formularze z walidacją real-time i aria-describedby dla błędów.
- Dostępność klawiaturowa dla wszystkich interakcji.

## 2. Lista widoków

### 2.1 Widok logowania
- Ścieżka: `/auth/login`
- Cel: uwierzytelnienie istniejącego użytkownika.
- Kluczowe informacje: formularz `email` + `hasło`, walidacja Zod + react-hook-form, komunikaty błędów inline.
- Komponenty: `AuthForm`, `InlineError`, `Toast`.
- A11y: aria-labely, focus na pierwszym polu, obsługa Enter.

### 2.2 Widok rejestracji
- Ścieżka: `/auth/register`
- Cel: utworzenie nowego konta.
- Kluczowe informacje: formularz `email` + `hasło`, walidacja siły hasła, potwierdzenie sukcesu.
- Komponenty: `AuthForm`, `InlineError`, `Toast`.
- A11y i bezpieczeństwo: blokada wielokrotnych submisji.

### 2.3 Widok generowania fiszek AI (Generowanie fiszek)
- Ścieżka: `/generations`
- Cel: automatyczne generowanie propozycji fiszek.
- Kluczowe informacje:
  - Pole textarea (500–15 000 znaków) z walidacją.
  - Przycisk „Generuj fiszki” (blokowany podczas ładowania).
  - Skeleton podczas oczekiwania.
  - Lista propozycji (`FlashcardList`) z checkboxami i akcjami pojedynczymi: zaakceptuj, edytuj, odrzuć.
  - Pasek akcji zbiorczych: „Zapisz wszystkie” / „Zapisz zatwierdzone”.
- Komponenty: `GenerationForm`, `FlashcardList`, `FlashcardItem`, `BulkActionsBar`, `FlashcardEditModal`, `InlineError`, `Toast`.
- A11y: aria-describedby dla walidacji, kontrast, focus trap w modalu.

### 2.4 Widok „Moje fiszki”
- Ścieżka: `/flashcards`
- Cel: przegląd, tworzenie, edycja i usuwanie fiszek manualnych i AI.
- Kluczowe informacje:
  - Lista fiszek w siatce / tabeli z filtrowaniem (źródło, data).
  - Przycisk „Nowa fiszka” otwierający modal z formularzem.
  - Ikony edycji i usuwania przy każdej karcie.
- Komponenty: `FlashcardList`, `FlashcardFormModal`, `DeleteConfirmationModal`, `InlineError`, `Toast`, `Skeleton`.
- A11y: focus trap w modalu, aria roles dla listy.

### 2.5 Widok dashboard (statystyki)
- Ścieżka: `/dashboard`
- Cel: wyświetlenie metryk generacji i akceptacji.
- Kluczowe informacje: karty statystyk (`StatsCard`) dla generacji i fiszek, wykresy słupkowe/kołowe.
- Komponenty: `StatsCard`, `Chart`, `Skeleton`.
- A11y: opisy alternatywne do wykresów.

### 2.6 Widok sesji powtórek SRS (Sesja nauki)
- Ścieżka: `/sessions/[sessionId]`
- Cel: pełnoekranowa sesja powtórek.
- Kluczowe informacje: przód/tył fiszki, przyciski oceny („Easy”, „Medium”, „Hard”), pasek postępu.
- Komponenty: `SessionView`, `ProgressBar`, `SessionButton`, `FullscreenContainer`.
- A11y: klawiszowe skróty oceny, aria-live dla zmiany treści.

### 2.7 Widok ustawień użytkownika (Profil)
- Ścieżka: `/settings`
- Cel: zarządzanie kontem, bezpieczeństwem i danymi osobowymi (RODO).
- Layout: podzielony na sekcje z kartami (Shadcn Card)

#### 2.7.1 Sekcja: Informacje o profilu
- Wyświetlane dane (read-only):
  - Adres email użytkownika
  - Data utworzenia konta
  - Data ostatniej aktualizacji
- Komponenty: `ProfileInfoCard`, `Skeleton`
- Źródło danych: GET /auth/account

#### 2.7.2 Sekcja: Statystyki konta
- Wyświetlane metryki (read-only):
  - Całkowita liczba fiszek
  - Całkowita liczba sesji powtórek
  - Całkowita liczba generacji AI
- Komponenty: `AccountStatsCard`, `StatsCard`, `Skeleton`
- Źródło danych: GET /stats/user
- UI: karty statystyk w grid layout (3 kolumny na desktop, 1 na mobile)

#### 2.7.3 Sekcja: Zmiana hasła
- Formularz z polami:
  - Aktualne hasło (type="password", required)
  - Nowe hasło (type="password", required, min 8 znaków)
  - Potwierdzenie nowego hasła (type="password", required)
- Walidacja:
  - Aktualne hasło: niepuste
  - Nowe hasło: min 8 znaków, różne od aktualnego
  - Potwierdzenie: musi pasować do nowego hasła
- Komponenty: `ChangePasswordForm`, `InlineError`, `Toast`
- API: PUT /auth/password
- Scenariusze błędów:
  - Nieprawidłowe aktualne hasło → InlineError przy polu
  - Nowe hasło za słabe → InlineError z wymaganiami
  - Hasła się nie zgadzają → InlineError przy potwierdzeniu
  - Nowe hasło takie samo jak obecne → InlineError
- Sukces: Toast "Hasło zostało zmienione" + reset formularza
- A11y: aria-describedby dla błędów, focus management

#### 2.7.4 Sekcja: Zarządzanie danymi (RODO)
- Przyciski akcji:
  - **"Usuń konto"** (danger variant, red)
    - Otwiera `DeleteAccountModal` z ostrzeżeniem
    - Modal wymaga:
      - Wpisanie hasła (password input)
      - Checkbox "Rozumiem, że ta akcja jest nieodwracalna"
      - Lista danych do usunięcia (fiszki, sesje, generacje, konto)
      - Przycisk "Potwierdź usunięcie" (disabled do czasu spełnienia warunków)
    - API: DELETE /auth/account
    - Po sukcesie: wylogowanie + redirect na `/` z komunikatem
- Komponenty: `DataManagementCard`, `DeleteAccountModal`, `Toast`
- Bezpieczeństwo:
  - Wymagane potwierdzenie hasłem
  - Wymagane zaznaczenie checkboxa potwierdzającego
  - Double confirmation pattern (modal + hasło)
- A11y:
  - Focus trap w modalu
  - ESC zamyka modal
  - ARIA role="alertdialog" dla modala
  - Wyraźne ostrzeżenie dla czytników ekranu

## 3. Mapa podróży użytkownika

1. **Nieznajomy**: `/auth/login` lub `/auth/register` → sukces → `/generations`.
2. **Generowanie AI**: wprowadzenie tekstu → „Generuj fiszki" → skeleton → recenzja propozycji → akcja zbiorcza → zapis → redirect do `/flashcards` lub pozostanie.
3. **Przegląd fiszek**: `/flashcards` → opcje edycji/modal → zapis → toast.
4. **Dashboard**: `/dashboard` → przeglądanie metryk generacji i akceptacji.
5. **Sesja SRS**: kliknięcie „Rozpocznij sesję" → `/sessions/:id` → oceny trudności → podsumowanie.
6. **Ustawienia konta**: `/settings` →
   - 6.1. Przeglądanie profilu i statystyk (read-only)
   - 6.2. Zmiana hasła → wypełnienie formularza → walidacja → sukces/błąd → toast
   - 6.3. Usunięcie konta → modal ostrzeżenia → wpisanie hasła + checkbox → potwierdzenie → usunięcie → wylogowanie → redirect `/`
7. **Wylogowanie**: kliknięcie w menu Avatar → "Wyloguj" → redirect `/auth/login`.

## 4. Układ i struktura nawigacji

- **Topbar** z `NavigationMenu` (Shadcn/ui) w `AppLayout`:
  - Logo po lewej.
  - Linki warunkowe:
    - Niezweryfikowany: „Login”, „Rejestracja”.
    - Zalogowany: „Generowanie AI”, „Moje fiszki”, „Dashboard”, „Sesja powtórek”, Avatar → dropdown [„Ustawienia”, „Wyloguj”].
- **Skip to content** nad topbarem.
- File-based routing Astro w `src/pages`:
  - `auth/login.astro`, `auth/register.astro`, `auth/forgot-password.astro`, `auth/reset-password.astro`
  - `generations.astro`, `flashcards.astro`, `dashboard.astro`, `sessions/[sessionId].astro`, `settings.astro`

## 5. Wzorce walidacji i obsługi błędów

### Walidacja formularzy (react-hook-form + Zod)
- **Walidacja real-time**: błędy wyświetlane po opuszczeniu pola (onBlur)
- **Walidacja on submit**: wszystkie pola sprawdzane przed wysłaniem
- **InlineError**: komunikaty błędów pod polami z aria-describedby
- **Toast**: powiadomienia o sukcesie/błędzie po akcjach API

### Wzorce walidacji dla ustawień
- **Zmiana hasła**:
  - Aktualne hasło: wymagane, sprawdzane przez API
  - Nowe hasło: min 8 znaków, regex dla siły hasła (opcjonalnie)
  - Potwierdzenie: musi być identyczne z nowym hasłem
  - Błędy: InvalidCurrentPassword, PasswordMismatch, SamePassword, ValidationError
- **Usunięcie konta**:
  - Hasło: wymagane, sprawdzane przez API
  - Checkbox: musi być zaznaczony
  - Przycisk: disabled do czasu spełnienia warunków
  - Błędy: InvalidPassword, ConfirmationRequired

### Feedback użytkownika
- **Loading states**: Skeleton dla danych ładowanych z API
- **Disabled states**: przyciski disabled podczas submit/loading
- **Success feedback**: Toast z zieloną ikoną + komunikat
- **Error feedback**: Toast z czerwoną ikoną lub InlineError
- **Confirmation dialogs**: dla destrukcyjnych akcji (role="alertdialog")

### Bezpieczeństwo UX
- **Double confirmation**: hasło + checkbox dla usunięcia konta
- **Clear warnings**: wyraźne komunikaty o konsekwencjach akcji
- **Undo prevention**: brak możliwości cofnięcia usunięcia konta
- **Password masking**: type="password" z opcjonalnym show/hide toggle

## 6. Kluczowe komponenty

### Nawigacja i Layout
- `NavigationMenu`, `Topbar`, `PublicLayout`, `AppLayout`
- `Skeleton` - loading states dla wszystkich widoków

### Generowanie fiszek AI
- `GenerationForm` - formularz z textarea i przyciskiem generowania
- `BulkActionsBar` - pasek z akcjami masowymi (Zapisz wszystkie, Odrzuć wszystkie)
- `FlashcardList` - lista fiszek z checkboxami
- `FlashcardItem` - pojedyncza karta fiszki
- `FlashcardEditModal` - modal do edycji treści fiszki

### Zarządzanie fiszkami
- `FlashcardFormModal` - modal do tworzenia nowej fiszki
- `DeleteConfirmationModal` - modal potwierdzenia usunięcia fiszki

### Sesje powtórek SRS
- `SessionView` - główny widok sesji
- `ProgressBar` - pasek postępu sesji
- `SessionButton` - przyciski oceny trudności
- `FullscreenContainer` - wrapper dla pełnoekranowej sesji

### Statystyki
- `StatsCard` - karta z pojedynczą metryką
- `Chart` - wykresy (opcjonalnie: chart.js lub recharts)

### Autoryzacja
- `AuthForm` - formularz logowania/rejestracji
- `LoginForm` - dedykowany formularz logowania
- `RegistrationForm` - dedykowany formularz rejestracji
- `ForgotPasswordForm` - formularz odzyskiwania hasła
- `ResetPasswordForm` - formularz resetowania hasła

### Ustawienia użytkownika
- `ProfileInfoCard` - karta z danymi profilu (email, daty)
- `AccountStatsCard` - karta ze statystykami konta
- `ChangePasswordForm` - formularz zmiany hasła z walidacją
- `DataManagementCard` - karta z opcjami zarządzania danymi
- `DeleteAccountModal` - modal usunięcia konta z:
  - Polem hasła
  - Checkboxem potwierdzenia
  - Listą usuwalanych danych
  - Ostrzeżeniem o nieodwracalności

### Współdzielone komponenty UI
- `InlineError` - wyświetlanie błędów walidacji inline
- `Toast` - powiadomienia toast (Sonner)
- `Button` - przycisk Shadcn/ui
- `Input` - pole input Shadcn/ui
- `Label` - etykieta Shadcn/ui
- `Card` - karta Shadcn/ui
- `Dialog` - dialog/modal Shadcn/ui
- `Checkbox` - checkbox Shadcn/ui

## 7. Responsive Design dla widoku ustawień

### Desktop (≥1024px)
- Layout: 2-kolumnowy grid
  - Lewa kolumna: Informacje o profilu + Statystyki konta
  - Prawa kolumna: Zmiana hasła + Zarządzanie danymi
- Statystyki: 3 karty w jednym rzędzie
- Formularze: pełna szerokość kolumny

### Tablet (768px - 1023px)
- Layout: 1-kolumnowy, karty full-width
- Kolejność:
  1. Informacje o profilu
  2. Statystyki konta (3 karty w rzędzie)
  3. Zmiana hasła
  4. Zarządzanie danymi
- Margines: padding 24px

### Mobile (<768px)
- Layout: 1-kolumnowy, karty full-width
- Statystyki: 1 karta na rząd (stacked)
- Formularze: uproszczone labele, większe touch targets
- Modal usuwania konta: full-screen overlay na małych ekranach
- Margines: padding 16px
- Fonty: nieco większe dla czytelności

### Kluczowe breakpointy Tailwind
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

## 8. Integracja API dla widoku ustawień

### Pobieranie danych (GET)

**ProfileInfoCard**
- Endpoint: `GET /auth/account`
- Hook: `useUserProfile()` lub `useQuery(['userProfile'])`
- Loading state: Skeleton w miejscu danych
- Error state: Toast z komunikatem błędu
- Refresh: automatyczny po zmianie hasła/logowaniu

**AccountStatsCard**
- Endpoint: `GET /stats/user`
- Hook: `useUserStats()` lub `useQuery(['userStats'])`
- Loading state: Skeleton w miejscu liczb
- Error state: pokazanie poprzednich danych lub komunikatu błędu
- Cache: 5 minut (stale-while-revalidate)

### Mutacje (POST/PUT/DELETE)

**ChangePasswordForm**
- Endpoint: `PUT /auth/password`
- Hook: `useChangePassword()` lub `useMutation()`
- Request body:
  ```typescript
  {
    current_password: string,
    new_password: string,
    new_password_confirmation: string
  }
  ```
- Loading state: disabled button + spinner
- Success:
  - Toast: "Hasło zostało zmienione"
  - Reset formularza
  - Opcjonalnie: invalidate user session (re-login)
- Errors:
  - 401 InvalidCurrentPassword → InlineError przy current_password
  - 400 PasswordMismatch → InlineError przy confirmation
  - 400 SamePassword → InlineError przy new_password
  - 400 ValidationError → InlineError przy new_password

**DeleteAccountModal**
- Endpoint: `DELETE /auth/account`
- Hook: `useDeleteAccount()` lub `useMutation()`
- Request body:
  ```typescript
  {
    password: string,
    confirmation: true
  }
  ```
- Loading state: disabled button + spinner na modal
- Success:
  - Toast: "Konto zostało usunięte"
  - Clear localStorage/sessionStorage
  - Invalidate all queries
  - Redirect: `/` lub `/auth/login`
- Errors:
  - 401 InvalidPassword → InlineError przy password field
  - 400 ConfirmationRequired → alert/toast
  - 500 InternalServerError → toast z możliwością retry

### State Management

**React Query configuration**
```typescript
// queries/useUserProfile.ts
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => fetch('/api/auth/account'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// mutations/useChangePassword.ts
export const useChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetch('/api/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Hasło zostało zmienione');
    },
  });
};

// mutations/useDeleteAccount.ts
export const useDeleteAccount = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data) => fetch('/api/auth/account', { method: 'DELETE', body: JSON.stringify(data) }),
    onSuccess: () => {
      localStorage.clear();
      toast.success('Konto zostało usunięte');
      navigate('/');
    },
  });
};
```

### Error Handling Pattern
```typescript
// Centralized error handler for settings
const handleSettingsError = (error: ApiError) => {
  switch (error.code) {
    case 'InvalidCurrentPassword':
    case 'InvalidPassword':
      return { field: 'password', message: 'Nieprawidłowe hasło' };
    case 'PasswordMismatch':
      return { field: 'confirmation', message: 'Hasła nie są identyczne' };
    case 'SamePassword':
      return { field: 'new_password', message: 'Nowe hasło musi się różnić od obecnego' };
    case 'ValidationError':
      return { field: 'new_password', message: error.message };
    default:
      toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
};
```
