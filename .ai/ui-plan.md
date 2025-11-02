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
- Błędy krytyczne inline, pozostałe jako toast’y.

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
- Cel: zarządzanie kontem i RODO.
- Kluczowe informacje: dane profilu, przycisk „Usuń konto” z confirm modal.
- Komponenty: `UserSettingsForm`, `DeleteAccountModal`, `Toast`.
- Bezpieczeństwo: potwierdzenie hasłem lub CAPTCHA przy usuwaniu.

## 3. Mapa podróży użytkownika

1. Nieznajomy: `/auth/login` lub `/auth/register` → sukces → `/generations`.
2. Generowanie AI: wprowadzenie tekstu → „Generuj fiszki” → skeleton → recenzja propozycji → akcja zbiorcza → zapis → redirect do `/flashcards` lub pozostanie.
3. Przegląd fiszek: opcje edycji/modal → zapis → toast.
4. Dashboard: `/dashboard` dla metryk.
5. Sesja SRS: kliknięcie „Rozpocznij sesję” → `/sessions/:id` → oceny → podsumowanie.
6. Ustawienia konta: `/settings` → edycja danych / usunięcie konta.
7. Wylogowanie.

## 4. Układ i struktura nawigacji

- **Topbar** z `NavigationMenu` (Shadcn/ui) w `AppLayout`:
  - Logo po lewej.
  - Linki warunkowe:
    - Niezweryfikowany: „Login”, „Rejestracja”.
    - Zalogowany: „Generowanie AI”, „Moje fiszki”, „Dashboard”, „Sesja powtórek”, Avatar → dropdown [„Ustawienia”, „Wyloguj”].
- **Skip to content** nad topbarem.
- File-based routing Astro w `src/pages`:
  - `auth/login.astro`, `auth/register.astro`
  - `generations.astro`, `flashcards.astro`, `dashboard.astro`, `sessions/[sessionId].astro`, `settings.astro`

## 5. Kluczowe komponenty

- `NavigationMenu`, `Topbar`, `PublicLayout`, `AppLayout`
- `GenerationForm`, `BulkActionsBar`, `FlashcardList`, `FlashcardItem`, `FlashcardEditModal`
- `FlashcardFormModal`, `DeleteConfirmationModal`
- `SessionView`, `ProgressBar`, `SessionButton`, `FullscreenContainer`
- `StatsCard`, `Chart`, `Skeleton`
- `AuthForm`, `InlineError`, `Toast`
- `UserSettingsForm`, `DeleteAccountModal`
