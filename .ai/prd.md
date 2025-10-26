# Dokument wymagań produktu (PRD) - 10xCards
## 1. Przegląd produktu
Nazwa: 10xCards
Cel: umożliwić szybkie i wygodne tworzenie wysokiej jakości fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji oraz integrację z gotowym algorytmem powtórek.
Kluczowe elementy:
- import tekstu (wklej) 500–15 000 znaków
- generowanie wsadowe fiszek przez LLM w formacie JSON w partiach (np. 10 kart)
- manualne tworzenie, edycja i usuwanie fiszek (Front/Back)
- system rejestracji i logowania e-mail/hasło
- integracja z open-source’owym algorytmem SRS
- podstawowe mechanizmy RODO i bezpieczeństwa

## 2. Problem użytkownika
Użytkownik traci dużo czasu na ręczne tworzenie fiszek edukacyjnych, co obniża motywację do nauki przez spaced repetition. Brak automatyzacji generowania fiszek sprawia, że proces jest monotonny i mało efektywny.

## 3. Wymagania funkcjonalne

3.1 Automatyczne generowanie fiszek przez AI
- użytkownik wkleja dowolny tekst (500–15 000 znaków), system waliduje długość
- aplikacja wysyła tekst do modelu LLM przez API z ustalonymi parametrami
- model zwraca propozycję fiszek w formacie JSON: lista obiektów {Front, Back}
- UI wyświetla listę fiszek z opcjami: zaakceptuj, edytuj, odrzuć każdą kartę

3.2 Ręczne tworzenie i zarządzanie fiszkami
- formularz „Nowa fiszka” z polami Front i Back (każde pole 500–1500 znaków), walidacja pustych pól i długości
- widok „Moje fiszki” prezentuje wszystkie karty z opcjami edycji i usuwania
- zapis nowych i zmodyfikowanych fiszek w bazie danych

3.3 Uwierzytelnianie i zarządzanie kontami użytkowników
- rejestracja i logowanie e-mail/hasło
- autoryzacja żądań za pomocą JWT lub sesji
- możliwość usunięcia konta i wszystkich powiązanych danych (fiszki, logi)

3.4 Integracja z algorytmem powtórek (SRS)
- adapter do open-source’owego algorytmu
- przypisywanie zaakceptowanych fiszek do harmonogramu powtórek
- w MVP brak dodatkowych informacji o fiszkach, aktualne tylko pole front i back

3.5 Przechowywanie danych i skalowalność
- bezpieczne przechowywanie danych o użytkownikach i fiszkach

3.6 Statystyki generowania i akceptacji fiszek
- zbieranie zdarzeń: Zaakecptowane, Edytowane, Odrzucone dla wygenerowaych fiszek przez AI

3.7 Zgodność prawna i ochrona danych
- magazynowanie danych osobowych zgodnie z RODO
- prawo do wglądu i usunięcia konta z wszystkimi danymi

## 4. Granice produktu
W MVP nie obejmujemy:
- własnego, zaawansowanego algorytmu SRS (używamy gotowe rozwiązanie open-source) 
- importu formatów PDF, DOCX, itp.
- współdzielenia zestawów fiszek między użytkownikami
- integracji z innymi platformami edukacyjnymi
- aplikacji mobilnych
- rozbudowanych tagów/metadanych i systemu folderów
- weryfikacji e-mail

Ograniczenia:
- limit znaków per pole fiszki (Front/Back) do 1500 znaków
- wielkość partii generowanych kart: 10
- format wyjściowy LLM: JSON lista max 10 kart

## 5. Historyjki użytkowników

US-001
Tytuł: Generowanie fiszek przez AI przy pomocy modelu LLM
Opis: jako użytkownik chcę wkleić tekst, aby model LLM automatycznie wygenerował pierwszą partię fiszek i umożliwił ich przegląd
Scenariusz podstawowy:
  1. Użytkownik otwiera widok generowania i wkleja tekst (500–15 000 znaków)
  2. Użytkownik klika przycisk "Generuj fiszki"
  3. System wyświetla loader i wysyła zapytanie do API LLM z parametrami
  4. Model zwraca listę do 10 fiszek w formacie JSON
  5. UI prezentuje partię fiszek z opcjami zaakceptuj, edytuj, odrzuć
Scenariusze alternatywne:
  - A1: Tekst poza zakresem długości → komunikat o błędzie walidacji
  - A2: Błąd API LLM → wyświetlenie komunikatu i przycisk "Ponów próbę"
Kryteria akceptacji:
  - po wklejeniu i zatwierdzeniu tekstu wywołane jest API LLM
  - wyświetlona została maksymalnie 10-elementowa lista fiszek
  - przyciśnięcie "Generuj fiszki" w trakcie poprzedniego wywołania blokowane jest do zakończenia

US-002
Tytuł: Przegląd wsadowy i masowe operacje na fiszkach
Opis: jako użytkownik chcę masowo zarządzać wygenerowanymi fiszkami, aby szybko zaakceptować lub odrzucić całą partię
Scenariusz podstawowy:
  1. Po wygenerowaniu fiszek użytkownik widzi listę 10 kart i checkboxy przy każdej karcie
  2. Użytkownik zaznacza wszystkie i klika "Akceptuj wszystkie"
  3. System zapisuje zaakceptowane karty i usuwa je z widoku partii
  4. Użytkownik może kliknąć "Generuj kolejna partia"
Scenariusze alternatywne:
  - A1: Użytkownik chce odrzucić wszystkie kart → wybiera "Odrzuć wszystkie"
  - A2: Użytkownik usuwa lub edytuje pojedyncze karty przed akcją grupową
Kryteria akceptacji:
  - dostępne są przyciski "Akceptuj wszystkie" i "Odrzuć wszystkie"
  - zapisywane są tylko karty zaakceptowane lub edytowane

US-003
Tytuł: Ręczne tworzenie fiszki
Opis: jako użytkownik chcę ręcznie utworzyć własną fiszkę, by dodać specyficzną kartę
Scenariusz podstawowy:
  1. Użytkownik przechodzi do widoku "Moje fiszki" i klika "Nowa fiszka"
  2. Użytkownik wypełnia pola Front i Back (każde do 1500 znaków)
  3. Użytkownik klika "Zapisz"
  4. Nowa fiszka pojawia się na liście
Scenariusze alternatywne:
  - A1: Puste pola lub przekroczenie limitu znaków → komunikat błędu
Kryteria akceptacji:
  - formularz waliduje puste pola i limit 1500 znaków
  - po zapisaniu karta jest widoczna w liście użytkownika

US-004
Tytuł: Edycja istniejącej fiszki
Opis: jako użytkownik chcę modyfikować zawartość fiszki, żeby poprawić lub dostosować treść
Scenariusz podstawowy:
  1. Użytkownik klika przycisk "Edytuj" przy wybranej karcie
  2. System otwiera formularz z aktualnymi polami Front i Back
  3. Użytkownik wprowadza zmiany i klika "Zapisz"
  4. Widok aktualizuje kartę w liście
Scenariusze alternatywne:
  - A1: Edycja powoduje walidację błędu (np. zbyt długi tekst)
Kryteria akceptacji:
  - pola formularza są wypełnione obecną treścią
  - zmiany są zapisywane i widoczne w liście

US-005
Tytuł: Usuwanie fiszki
Opis: jako użytkownik chcę trwale usunąć niechciane fiszki
Scenariusz podstawowy:
  1. Użytkownik klika ikonę "Usuń" przy karcie
  2. System wyświetla okno potwierdzenia usunięcia
  3. Użytkownik potwierdza, karta zostaje usunięta z bazy i listy
Scenariusze alternatywne:
  - A1: Użytkownik rezygnuje w oknie potwierdzenia → brak zmian
Kryteria akceptacji:
  - pojawia się modal z potwierdzeniem
  - po potwierdzeniu karta znika z widoku i bazy

US-006
Tytuł: Rozpoczęcie sesji powtórek SRS
Opis: jako użytkownik chcę uruchomić sesję powtórek, by uczyć się według harmonogramu
Scenariusz podstawowy:
  1. Użytkownik klika "Rozpocznij sesję powtórek"
  2. System pobiera fiszki i wyświetla pierszwą, gdzie pokazuje przód fiszki a następnie tył
  3. Użytkownik ocenia każdą fiszkę na ile była trudna i czy przyswoił wiedzę
  4. System aktualizuje stan karty i przechodzi do następnej
  5. Po zakończeniu wyświetla podsumowanie sesji
Kryteria akceptacji:
  - dostępne są przyciski oceny dla każdej karty
  - stan karty aktualizuje się w bazie zgodnie z wybranym rezultatem

US-007
Tytuł: Rejestracja użytkownika
Opis: jako nowy użytkownik chcę założyć konto, podać e-mail i hasło, aby mieć dostęp do aplikacji
Scenariusz podstawowy:
   1. Użytkownik przechodzi do strony rejestracji
   2. Wprowadza e-mail i hasło, klika "Zarejestruj"
   3. System tworzy konto, zapisuje dane i automatycznie loguje użytkownika, przekierowując go do pulpitu
   4. System wyświetla powiadomienie "Rejestracja przebiegła pomyślnie"
Scenariusze alternatywne:
  - A1: E-mail w złym formacie → komunikat walidacji i blokada rejestracji
  - A2: Hasło za słabe → komunikat o minimalnej sile hasła
Kryteria akceptacji:
  - format e-mail i siła hasła są walidowane
  - po rejestracji użytkownik jest automatycznie zalogowany
  - użytkownik widzi chroniony widok po rejestracji
  - użytkownik otrzymuje powiadomienie o pomyślnej rejestracji

US-008
Tytuł: Logowanie użytkownika
Opis: jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich fiszek
Scenariusz podstawowy:
   1. Użytkownik przechodzi do strony logowania
   2. Wprowadza e-mail i hasło, klika "Zaloguj"
   3. System weryfikuje dane, uwierzytelnia użytkownika i przekierowuje do pulpitu
   4. System wyświetla powiadomienie "Logowanie przebiegło pomyślnie"
Scenariusze alternatywne:
  - A1: Błędny e-mail lub hasło → komunikat "Nieprawidłowe dane logowania"
  - A2: Konto zablokowane po 5 nieudanych próbach → CAPTCHA i komunikat o blokadzie
Kryteria akceptacji:
  - weryfikacja poprawności danych logowania
  - po poprawnym logowaniu użytkownik widzi chroniony widok
  - nieudane próby wyświetlają odpowiedni komunikat błędu
  - użytkownik otrzymuje powiadomienie o pomyślnym zalogowaniu

US-009
Tytuł: Usunięcie konta i danych (RODO)
Opis: jako użytkownik chcę usunąć konto i wszystkie dane zgodnie z RODO
Scenariusz podstawowy:
  1. Użytkownik przechodzi do ustawień konta
  2. Użytkownik wybiera "Usuń konto"
  3. System wyświetla ostrzeżenie o usunięciu danych
  4. Użytkownik potwierdza, a system usuwa konto, fiszki i logi
Kryteria akceptacji:
  - dane są trwale usunięte z bazy
  - użytkownik jest wylogowany i przekierowany na stronę główną


## 6. Metryki sukcesu
- Metryka 1 – Efektywność automatycznego generowania: odsetek zaakceptowanych fiszek spośród wszystkich wygenerowanych przez AI ≥ 75%
- Metryka 2 – Zaangażowanie użytkownika: odsetek zaakceptowanych fiszek spośród wszystkich przedstawionych użytkownikowi (AI i manualnych) ≥ 75%
- Telemetria: zbieranie zdarzeń Generated, Accepted, Edited