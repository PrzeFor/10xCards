# Plan implementacji widoku ustawień użytkownika (Profil)

## 1. Przegląd
Widok ustawień użytkownika (/settings) umożliwia przegląd i zarządzanie kontem: dane profilu, statystyki, zmiana hasła i usuwanie konta zgodnie z RODO. Użytkownik tylko uwierzytelniony ma do niego dostęp.

## 2. Routing widoku
Ścieżka: `/settings` (zachowana ochrona przed nieautoryzowanym dostępem w middleware).

## 3. Struktura komponentów
- SettingsPage (strona główna)
  - ProfileInfoSection
    - ProfileInfoCard
    - Skeleton (loading)
  - AccountStatsSection
    - AccountStatsCard
      - StatsCard × 3
    - Skeleton (loading)
  - ChangePasswordSection
    - ChangePasswordForm
    - InlineError
  - DataManagementSection
    - DataManagementCard
    - DeleteAccountModal
    - InlineError
  - ToastContainer (globalny)

## 4. Szczegóły komponentów
### ProfileInfoCard
- Opis: wyświetla email, created_at, updated_at (read-only)
- Elementy: tytuł, lista pól, wartości
- Zdarzenia: brak
- Walidacja: brak (tylko odczyt)
- Typy: `ProfileInfo` (email: string; createdAt: string; updatedAt: string)
- Propsy: `data: ProfileInfo`

### AccountStatsCard
- Opis: kontener na trzy karty statystyk
- Elementy: nagłówek, grid
- Dzieci: 3×StatsCard
- Zdarzenia: kliknięcie karty "Do powtórki dziś" → przejście do `/sessions` lub uruchomienie sesji
- Walidacja: brak
- Typy: `UserStats` (totalFlashcards, totalSessions, totalGenerations)
- Propsy: `stats: UserStats`

### StatsCard
- Opis: pojedyncza karta statystyki
- Elementy: liczba, opis, opcjonalny link/action
- Zdarzenia: opcjonalne (kliknięcie linku)
- Typy: `{ value: number; label: string; onClick?: () => void }`
- Propsy: `value`, `label`, `variant?`, `onClick?`

### ChangePasswordForm
- Opis: formularz zmiany hasła
- Elementy: 3×Input[type=password], 1×Button submit
- Zdarzenia: onChange każdego pola, onSubmit
- Walidacja:
  - current_password: non-empty
  - new_password: min 8, != current
  - confirmation: === new_password
- Typy:
  - `ChangePasswordRequestDto` z arkusza: current_password, new_password, new_password_confirmation
- Propsy: brak (samodzielny)

### DataManagementCard
- Opis: sekcja RODO
- Elementy: przycisk "Usuń konto"
- Zdarzenia: onClick → otwórz modal
- Typy: brak
- Propsy: `onDeleteClick: () => void`

### DeleteAccountModal
- Opis: modal potwierdzenia usunięcia konta
- Elementy:
  - Input password
  - Checkbox confirmation
  - Lista usuwanych danych
  - Button confirm (disabled dopóki warunki niespełnione)
- Zdarzenia: onChange pola i checkboxu, onConfirm, onCancel
- Walidacja:
  - password: non-empty
  - confirmation: true
- Typy: `DeleteAccountRequestDto` (password: string; confirmation: boolean)
- Propsy: `isOpen`, `onConfirm(dto)`, `onClose`

### Skeleton
- Opis: placeholder podczas ładowania
- Elementy: bloki do profil/stats
- Zdarzenia: brak
- Propsy: `size`, `variant`

### ToastContainer / Toast
- Opis: komunikaty sukcesu/błędów
- Elementy: tekst, ikona
- Zdarzenia: automatyczne zamknięcie
- Typy: `ToastOptions`
- Propsy: `message`, `type`;

## 5. Typy
### ProfileInfo
```ts
interface ProfileInfo {
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

### UserStats
```ts
interface UserStats {
  totalFlashcards: number;
  totalSessions: number;
  totalGenerations: number;
}
```

### ChangePasswordRequestDto
```ts
interface ChangePasswordRequestDto {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}
```

### DeleteAccountRequestDto
```ts
interface DeleteAccountRequestDto {
  password: string;
  confirmation: boolean;
}
```

## 6. Zarządzanie stanem
- Hook `useUserSettings`:
  - `profile`, `stats`, `isLoadingProfile`, `isLoadingStats`, `error`.
  - Fetch profile i stats równolegle przy mount.
- Formularze:
  - `useForm` lub `useState` do pól i błędów.
  - `isSubmitting` dla password i delete.
- Modal: stan `isModalOpen`.

## 7. Integracja API
- GET `/api/auth/account` → zwraca `GetUserAccountResponseDto` → mapowanie do `ProfileInfo`
- GET `/api/stats/user` → zwraca `UserStats` → mapowanie
- PUT `/api/auth/password` ↔ `ChangePasswordRequestDto` → obsługa success/error (inline/toast)
- DELETE `/api/auth/account` ↔ `DeleteAccountRequestDto` → po 204: wyloguj, redirect `/`, toast

## 8. Interakcje użytkownika
1. Wczytanie widoku → pobierz profile+stats → skeleton → render Cards
2. Zmiana hasła:
   - wypełnienie pól → walidacja realtime
   - kliknij Zmień → wywołanie API → sukces: toast, wyczyszczenie formularza
3. Usunięcie konta:
   - kliknij Usuń konto → otwórz modal
   - wprowadź hasło + zaznacz checkbox → aktywacja przycisku
   - potwierdź → wywołanie DELETE → sukces: wyloguj+redirect+toast

## 9. Warunki i walidacja
- enforce front-end:
  - pola wymagane,
  - długość nowego hasła,
  - porównanie haseł,
  - wymaganie confirmation
- błędy API mapować na InlineError lub toast

## 10. Obsługa błędów
- 400 ValidationError: wyświetl inline przy polu
- 401 Unauthorized: redirect do login
- 500 InternalServerError: toast globalny
- ZodError (confirmation) w DELETE → inline w modal

## 11. Kroki implementacji
1. Utworzyć plik `src/pages/settings.astro` lub TSX z Layout
2. Zaimplementować hook `useUserSettings`
3. Stworzyć `ProfileInfoCard` + skeleton
4. Stworzyć `AccountStatsCard` i `StatsCard`
5. Stworzyć `ChangePasswordForm` z walidacją i API call
6. Stworzyć `DataManagementCard` i `DeleteAccountModal`
7. Dodać globalny `ToastContainer`
8. Dodać ochronę routingu w middleware
9. Przetestować scenariusze success+error
10. Zaimplementować a11y: aria-describedby, focus trap, role alertdialog

