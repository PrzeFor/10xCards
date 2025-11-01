# Implementacja pola source_text_length

## Problem
Pole `source_text_length` było zdefiniowane w `db-plan.md` ale nie zostało zaimplementowane w:
- Migracji bazy danych
- Typach TypeScript
- Serwisie generacji
- Schematach walidacji

## Wprowadzone zmiany

### 1. Migracja bazy danych
**Plik:** `supabase/migrations/20251026160700_add_source_text_length_to_generations.sql`

- Dodano kolumnę `source_text_length INTEGER NOT NULL DEFAULT 0`
- Zaktualizowano istniejące rekordy obliczając długość z `source_text`
- Dodano constraint sprawdzający spójność między `source_text` a `source_text_length`
- Dodano constraint sprawdzający zakres 500-15000 znaków

### 2. Typy bazy danych
**Plik:** `src/db/database.types.ts`

Zaktualizowano interfejsy dla tabeli `generations`:
- `Row`: dodano `source_text_length: number`
- `Insert`: dodano `source_text_length: number` (wymagane)
- `Update`: dodano `source_text_length?: number` (opcjonalne)

### 3. Typy aplikacji
**Plik:** `src/types.ts`

- `CreateGenerationResponseDto`: dodano `source_text_length: number`
- `GetGenerationResponseDto`: dodano `source_text_length` do Pick type

### 4. Serwis generacji
**Plik:** `src/lib/services/generation.service.ts`

- Obliczanie `sourceTextLength = sourceText.length` przed zapisem
- Dodanie pola do INSERT query
- Dodanie pola do SELECT query
- Zwracanie pola w response

### 5. Schematy walidacji
**Plik:** `src/lib/schemas/generation.ts`

- Dodano walidację `source_text_length: z.number().int().min(500).max(15000)` do `createGenerationResponseSchema`

## Korzyści

1. **Spójność danych**: Constraint zapewnia, że `source_text_length` zawsze odpowiada rzeczywistej długości tekstu
2. **Wydajność**: Nie trzeba obliczać długości tekstu przy każdym zapytaniu
3. **Analityka**: Łatwiejsze tworzenie statystyk i raportów
4. **Walidacja**: Dodatkowa warstwa walidacji na poziomie bazy danych
5. **API**: Klienci otrzymują informację o długości tekstu bez konieczności obliczania

## Zgodność z planami

Implementacja jest zgodna z:
- `db-plan.md` - pole zostało dodane zgodnie ze specyfikacją
- `api-plan.md` - pole jest zwracane w odpowiednich endpointach
- `generations-endpoint-implementation-plan.md` - pole jest obsługiwane w procesie generacji

## Migracja danych

Migracja automatycznie:
1. Dodaje kolumnę z wartością domyślną 0
2. Oblicza i ustawia prawidłowe wartości dla istniejących rekordów
3. Dodaje constraints zapewniające spójność danych

Istniejące dane nie zostaną utracone i będą automatycznie zaktualizowane.
