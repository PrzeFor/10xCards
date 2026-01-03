# API Endpoint Implementation Plan: User Account & Settings

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację trzech endpointów REST API do zarządzania kontem użytkownika:

1. **GET /auth/account** - Pobranie informacji o profilu zalogowanego użytkownika
2. **PUT /auth/password** - Zmiana hasła użytkownika
3. **DELETE /auth/account** - Trwałe usunięcie konta użytkownika i wszystkich powiązanych danych (zgodność z GDPR)

Wszystkie endpointy wymagają autentykacji Bearer token i operują na danych użytkownika zarządzanych przez Supabase Auth.

## 2. Szczegóły żądań

### GET /auth/account

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/auth/account`
- **Parametry**:
  - Wymagane: Bearer token w nagłówku Authorization
  - Opcjonalne: brak
- **Request Body**: brak

### PUT /auth/password

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/auth/password`
- **Parametry**:
  - Wymagane: Bearer token w nagłówku Authorization
  - Opcjonalne: brak
- **Request Body**:
```json
{
  "current_password": "string",
  "new_password": "string", 
  "new_password_confirmation": "string"
}
```

**Walidacje**:
- `current_password`: required, non-empty string
- `new_password`: required, minimum 8 znaków, musi być różne od current_password
- `new_password_confirmation`: required, musi być identyczne z new_password

### DELETE /auth/account

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/auth/account`
- **Parametry**:
  - Wymagane: Bearer token w nagłówku Authorization
  - Opcjonalne: brak
- **Request Body**:
```json
{
  "password": "string",
  "confirmation": true
}
```

**Walidacje**:
- `password`: required, non-empty string, musi być zgodne z obecnym hasłem
- `confirmation`: required, musi być wartością `true`

## 3. Wykorzystywane typy

### DTO Types (src/types.ts)

```typescript
/**
 * Response dla GET /auth/account
 */
export interface GetUserAccountResponseDto {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request body dla PUT /auth/password
 */
export interface ChangePasswordRequestDto {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

/**
 * Response dla PUT /auth/password
 */
export interface ChangePasswordResponseDto {
  message: string;
}

/**
 * Request body dla DELETE /auth/account
 */
export interface DeleteAccountRequestDto {
  password: string;
  confirmation: boolean;
}
```

### Zod Schemas (src/lib/schemas/userSchemas.ts - nowy plik)

```typescript
import { z } from 'zod';

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  new_password_confirmation: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'New password and confirmation do not match',
  path: ['new_password_confirmation'],
}).refine((data) => data.new_password !== data.current_password, {
  message: 'New password must be different from the current password',
  path: ['new_password'],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation must be true to delete account' }),
  }),
});
```

### Error Response Types

```typescript
export interface ApiErrorResponse {
  code: string;
  message: string;
}

export type ErrorCode = 
  | 'ValidationError'
  | 'InvalidCurrentPassword'
  | 'PasswordMismatch'
  | 'SamePassword'
  | 'InvalidPassword'
  | 'ConfirmationRequired'
  | 'InternalServerError';
```

## 4. Szczegóły odpowiedzi

### GET /auth/account

**Success Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2025-10-26T12:34:56Z",
  "updated_at": "2025-10-26T12:34:56Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Brak tokenu lub nieprawidłowy token
- `500 Internal Server Error`: Błąd serwera

### PUT /auth/password

**Success Response (200 OK)**:
```json
{
  "message": "Password changed successfully."
}
```

**Error Responses**:
- `400 Bad Request (ValidationError)`: Błędy walidacji (hasło za krótkie, brak potwierdzenia, etc.)
- `400 Bad Request (PasswordMismatch)`: Nowe hasło i potwierdzenie nie zgadzają się
- `400 Bad Request (SamePassword)`: Nowe hasło takie samo jak obecne
- `401 Unauthorized (InvalidCurrentPassword)`: Obecne hasło jest nieprawidłowe
- `500 Internal Server Error`: Błąd serwera

### DELETE /auth/account

**Success Response (204 No Content)**: Brak treści odpowiedzi

**Error Responses**:
- `400 Bad Request (ConfirmationRequired)`: Pole confirmation nie jest ustawione na true
- `401 Unauthorized (InvalidPassword)`: Hasło jest nieprawidłowe
- `500 Internal Server Error`: Błąd serwera

## 5. Przepływ danych

### GET /auth/account

```
1. Client → API Endpoint (GET /api/auth/account)
2. API Endpoint → Middleware (weryfikacja tokenu JWT)
3. Middleware → API Endpoint (userId z tokenu)
4. API Endpoint → userService.getUserAccount(userId)
5. userService → Supabase Auth API (getUser)
6. Supabase Auth API → userService (user data)
7. userService → API Endpoint (mapped DTO)
8. API Endpoint → Client (200 OK + GetUserAccountResponseDto)
```

### PUT /auth/password

```
1. Client → API Endpoint (PUT /api/auth/password + body)
2. API Endpoint → Zod Schema (walidacja request body)
3. API Endpoint → Middleware (weryfikacja tokenu JWT)
4. Middleware → API Endpoint (userId z tokenu)
5. API Endpoint → userService.changePassword(userId, currentPassword, newPassword)
6. userService → Supabase Auth API (verifyPassword)
7. userService → Supabase Auth API (updatePassword)
8. userService → API Endpoint (success message)
9. API Endpoint → Client (200 OK + ChangePasswordResponseDto)
```

**Opcjonalnie**: Wysłanie emaila potwierdzającego zmianę hasła

### DELETE /auth/account

```
1. Client → API Endpoint (DELETE /api/auth/account + body)
2. API Endpoint → Zod Schema (walidacja request body)
3. API Endpoint → Middleware (weryfikacja tokenu JWT)
4. Middleware → API Endpoint (userId z tokenu)
5. API Endpoint → userService.deleteUserAccount(userId, password)
6. userService → Supabase Auth API (verifyPassword)
7. userService → Supabase Database (BEGIN TRANSACTION)
8. userService → Supabase Database (delete flashcards for user)
9. userService → Supabase Database (delete sessions for user)
10. userService → Supabase Database (delete generations for user)
11. userService → Supabase Database (delete error logs for user)
12. userService → Supabase Auth API (deleteUser)
13. userService → Supabase Database (COMMIT TRANSACTION)
14. userService → Audit Log (log deletion)
15. userService → API Endpoint (success)
16. API Endpoint → Client (204 No Content)
```

**Rollback**: Jeśli którykolwiek krok w transakcji się nie powiedzie, wykonaj ROLLBACK

**Opcjonalnie**: Wysłanie emaila potwierdzającego usunięcie konta (przed faktycznym usunięciem)

## 6. Względy bezpieczeństwa

### Autentykacja i Autoryzacja

1. **Token JWT**: Wszystkie endpointy wymagają Bearer token w nagłówku Authorization
2. **Middleware**: Użycie middleware Astro do weryfikacji tokenu przed dostępem do endpointa
3. **User Context**: Token JWT zawiera userId, który jest używany do autoryzacji operacji
4. **Supabase Auth**: Wykorzystanie Supabase Auth API do weryfikacji haseł (bcrypt)

### Walidacja danych wejściowych

1. **Zod Schemas**: Silna walidacja wszystkich danych wejściowych przed przetworzeniem
2. **Sanityzacja**: Supabase automatycznie sanityzuje dane wejściowe (ochrona przed SQL injection)
3. **Type Safety**: TypeScript zapewnia type safety na poziomie kompilacji

### Ochrona haseł

1. **Nie loguj haseł**: NIGDY nie loguj haseł (ani obecnych, ani nowych) w logach
2. **Hashowanie**: Supabase Auth automatycznie hashuje hasła używając bcrypt
3. **Weryfikacja siły hasła**: Minimum 8 znaków (można rozszerzyć o dodatkowe wymagania)
4. **Rate Limiting**: Rozważ implementację rate limiting dla PUT /auth/password (przeciw brute force)

### Usuwanie konta (GDPR)

1. **Potwierdzenie hasła**: Wymagane hasło do usunięcia konta
2. **Explicit Confirmation**: Wymagane pole confirmation=true
3. **Transakcja**: Wszystkie operacje usuwania w jednej transakcji (atomowość)
4. **Audit Log**: Logowanie operacji usunięcia konta (data, userId, IP address)
5. **Cascade Delete**: Usunięcie wszystkich powiązanych danych użytkownika

### Session Management

1. **Invalidacja sesji**: Po zmianie hasła lub usunięciu konta, wszystkie tokeny JWT powinny zostać unieważnione
2. **Supabase Auth**: Supabase Auth automatycznie invaliduje sesje przy updatePassword() i deleteUser()

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

**ValidationError**:
- Hasło za krótkie (< 8 znaków)
- Puste pola wymagane
- Format: `{ "code": "ValidationError", "message": "Validation failed: [szczegóły]" }`

**PasswordMismatch**:
- new_password !== new_password_confirmation
- Format: `{ "code": "PasswordMismatch", "message": "New password and confirmation do not match." }`

**SamePassword**:
- new_password === current_password
- Format: `{ "code": "SamePassword", "message": "New password must be different from the current password." }`

**ConfirmationRequired**:
- confirmation !== true (w DELETE /auth/account)
- Format: `{ "code": "ConfirmationRequired", "message": "Confirmation must be true to delete account." }`

### Błędy autentykacji (401 Unauthorized)

**Unauthorized**:
- Brak tokenu JWT w nagłówku
- Nieprawidłowy/wygasły token JWT
- Format: `{ "code": "Unauthorized", "message": "Authentication required." }`

**InvalidCurrentPassword**:
- current_password nie zgadza się z hasłem w bazie
- Format: `{ "code": "InvalidCurrentPassword", "message": "Current password is incorrect." }`

**InvalidPassword**:
- password nie zgadza się z hasłem w bazie (w DELETE /auth/account)
- Format: `{ "code": "InvalidPassword", "message": "Password is incorrect." }`

### Błędy serwera (500 Internal Server Error)

**InternalServerError**:
- Błędy bazy danych
- Błędy Supabase Auth API
- Nieprzewidziane błędy
- Format: `{ "code": "InternalServerError", "message": "An unexpected error occurred. Please try again." }`
- **Ważne**: Loguj szczegóły błędu server-side, ale nie ujawniaj ich klientowi

### Error Handling Pattern

```typescript
try {
  // Operacja
} catch (error) {
  console.error('[EndpointName] Error:', error);
  
  if (error instanceof ZodError) {
    return new Response(JSON.stringify({
      code: 'ValidationError',
      message: `Validation failed: ${error.errors[0].message}`
    }), { status: 400 });
  }
  
  if (error instanceof AuthError) {
    return new Response(JSON.stringify({
      code: 'InvalidCurrentPassword',
      message: 'Current password is incorrect.'
    }), { status: 401 });
  }
  
  return new Response(JSON.stringify({
    code: 'InternalServerError',
    message: 'An unexpected error occurred. Please try again.'
  }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### GET /auth/account

- **Wydajność**: Bardzo szybka operacja (single query do Supabase Auth)
- **Cache**: Można rozważyć cache'owanie danych profilu (ważność: 5-10 minut)
- **Rate Limiting**: Nie jest krytyczne, ale można dodać (np. 100 req/min)

### PUT /auth/password

- **Wydajność**: Średnia (weryfikacja starego hasła + hashowanie nowego)
- **Hashowanie**: bcrypt jest kosztowne obliczeniowo (to dobrze dla bezpieczeństwa)
- **Rate Limiting**: KRYTYCZNE - maksymalnie 5 prób/15 minut (ochrona przed brute force)
- **Timeout**: Ustawić timeout na 10 sekund dla całej operacji

### DELETE /auth/account

- **Wydajność**: Może być wolna (cascade delete wielu tabel)
- **Transakcja**: Używać transakcji bazy danych dla spójności
- **Background Job**: Dla dużych kont (tysiące flashcards) rozważyć async job
- **Timeout**: Ustawić timeout na 30 sekund
- **Monitoring**: Logować czas trwania operacji dla monitoringu

### Optymalizacje

1. **Connection Pooling**: Supabase automatycznie zarządza connection pooling
2. **Indexes**: Upewnić się, że tabele mają odpowiednie indeksy na `user_id` (już powinny być)
3. **Batch Operations**: Przy usuwaniu konta, używać batch delete zamiast pojedynczych operacji
4. **Error Recovery**: Implementować retry logic dla transient errors (np. network timeout)

## 9. Etapy wdrożenia

### Krok 1: Dodanie typów DTO do src/types.ts

```typescript
// User Account & Settings Types
export interface GetUserAccountResponseDto {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ChangePasswordRequestDto {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponseDto {
  message: string;
}

export interface DeleteAccountRequestDto {
  password: string;
  confirmation: boolean;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}
```

### Krok 2: Utworzenie Zod schemas (src/lib/schemas/userSchemas.ts)

```typescript
import { z } from 'zod';

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  new_password_confirmation: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'New password and confirmation do not match',
  path: ['new_password_confirmation'],
}).refine((data) => data.new_password !== data.current_password, {
  message: 'New password must be different from the current password',
  path: ['new_password'],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation must be true to delete account' }),
  }),
});
```

### Krok 3: Utworzenie serwisu użytkownika (src/lib/services/userService.ts)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { 
  GetUserAccountResponseDto,
  ChangePasswordResponseDto
} from '../types';

export class UserService {
  constructor(private supabase: SupabaseClient) {}

  async getUserAccount(userId: string): Promise<GetUserAccountResponseDto> {
    const { data, error } = await this.supabase.auth.getUser();
    
    if (error || !data.user) {
      throw new Error('Failed to fetch user account');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at,
    };
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponseDto> {
    // Supabase Auth automatycznie weryfikuje stare hasło
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes('Invalid password')) {
        throw new Error('INVALID_CURRENT_PASSWORD');
      }
      throw error;
    }

    return {
      message: 'Password changed successfully.',
    };
  }

  async deleteUserAccount(userId: string, password: string): Promise<void> {
    // Weryfikacja hasła poprzez re-authentication
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user?.email) {
      throw new Error('User not found');
    }

    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: user.user.email,
      password: password,
    });

    if (signInError) {
      throw new Error('INVALID_PASSWORD');
    }

    // Rozpoczęcie transakcji - usunięcie wszystkich danych użytkownika
    const { error: flashcardsError } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId);

    if (flashcardsError) throw flashcardsError;

    const { error: sessionsError } = await this.supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) throw sessionsError;

    const { error: generationsError } = await this.supabase
      .from('generations')
      .delete()
      .eq('user_id', userId);

    if (generationsError) throw generationsError;

    const { error: errorLogsError } = await this.supabase
      .from('generation_error_logs')
      .delete()
      .eq('user_id', userId);

    if (errorLogsError) throw errorLogsError;

    // Usunięcie konta użytkownika (Supabase Admin API)
    const { error: deleteError } = await this.supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) throw deleteError;

    // Log deletion for audit
    console.info(`[UserService] Account deleted for user: ${userId}`);
  }
}
```

### Krok 4: Implementacja endpointu GET /api/auth/account.ts

```typescript
import type { APIRoute } from 'astro';
import { UserService } from '../../lib/services/userService';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return new Response(JSON.stringify({
        code: 'Unauthorized',
        message: 'Authentication required.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userService = new UserService(supabase);
    const userAccount = await userService.getUserAccount(session.data.session.user.id);

    return new Response(JSON.stringify(userAccount), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GET /api/auth/account] Error:', error);
    
    return new Response(JSON.stringify({
      code: 'InternalServerError',
      message: 'An unexpected error occurred. Please try again.'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 5: Implementacja endpointu PUT /api/auth/password.ts

```typescript
import type { APIRoute } from 'astro';
import { changePasswordSchema } from '../../lib/schemas/userSchemas';
import { UserService } from '../../lib/services/userService';
import { ZodError } from 'zod';

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return new Response(JSON.stringify({
        code: 'Unauthorized',
        message: 'Authentication required.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    const userService = new UserService(supabase);
    const result = await userService.changePassword(
      validatedData.current_password,
      validatedData.new_password
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PUT /api/auth/password] Error:', error);

    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      
      if (firstError.path.includes('new_password_confirmation')) {
        return new Response(JSON.stringify({
          code: 'PasswordMismatch',
          message: firstError.message
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (firstError.path.includes('new_password') && 
          firstError.message.includes('different')) {
        return new Response(JSON.stringify({
          code: 'SamePassword',
          message: firstError.message
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        code: 'ValidationError',
        message: `Validation failed: ${firstError.message}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof Error && error.message === 'INVALID_CURRENT_PASSWORD') {
      return new Response(JSON.stringify({
        code: 'InvalidCurrentPassword',
        message: 'Current password is incorrect.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      code: 'InternalServerError',
      message: 'An unexpected error occurred. Please try again.'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 6: Implementacja endpointu DELETE /api/auth/account.ts

```typescript
import type { APIRoute } from 'astro';
import { deleteAccountSchema } from '../../lib/schemas/userSchemas';
import { UserService } from '../../lib/services/userService';
import { ZodError } from 'zod';

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return new Response(JSON.stringify({
        code: 'Unauthorized',
        message: 'Authentication required.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    const userService = new UserService(supabase);
    await userService.deleteUserAccount(
      session.data.session.user.id,
      validatedData.password
    );

    return new Response(null, {
      status: 204
    });

  } catch (error) {
    console.error('[DELETE /api/auth/account] Error:', error);

    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      
      if (firstError.path.includes('confirmation')) {
        return new Response(JSON.stringify({
          code: 'ConfirmationRequired',
          message: 'Confirmation must be true to delete account.'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        code: 'ValidationError',
        message: `Validation failed: ${firstError.message}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
      return new Response(JSON.stringify({
        code: 'InvalidPassword',
        message: 'Password is incorrect.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      code: 'InternalServerError',
      message: 'An unexpected error occurred. Please try again.'
    }), { 
        status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 7: Testowanie endpointów

**Testy jednostkowe (Vitest)**:
- Test walidacji schemas (changePasswordSchema, deleteAccountSchema)
- Test UserService methods (mock Supabase client)
- Test error handling

**Testy E2E (Playwright)**:
- Test GET /api/auth/account (authenticated user)
- Test PUT /api/auth/password (happy path)
- Test PUT /api/auth/password (wrong current password)
- Test PUT /api/auth/password (password mismatch)
- Test DELETE /api/auth/account (happy path)
- Test DELETE /api/auth/account (wrong password)
- Test DELETE /api/auth/account (confirmation not true)
- Test wszystkich endpointów bez autentykacji (401)

**Testy manualne**:
- Weryfikacja emaili potwierdzających (jeśli zaimplementowane)
- Weryfikacja usunięcia wszystkich danych użytkownika
- Weryfikacja invalidacji sesji

### Krok 8: Aktualizacja middleware (jeśli potrzebne)

Sprawdzić czy middleware w `src/middleware/index.ts` poprawnie:
- Ekstraktuje token JWT z nagłówka Authorization
- Weryfikuje token
- Dodaje supabase client do locals
- Dodaje userId do locals (jeśli już tego nie robi)

### Krok 9: Dokumentacja i monitoring

1. **Dokumentacja API**: Zaktualizować dokumentację API (jeśli istnieje)
2. **Logging**: Dodać odpowiednie logi dla monitoringu:
   - Każda zmiana hasła
   - Każde usunięcie konta
   - Wszystkie błędy serwera
3. **Metryki**: Monitorować:
   - Liczba zmian hasła (dziennie/miesięcznie)
   - Liczba usuniętych kont (dziennie/miesięcznie)
   - Czas trwania operacji DELETE (dla optymalizacji)
4. **Alerty**: Ustawić alerty dla:
   - Wysoka liczba błędów 500
   - Nienaturalnie wysoka liczba usuniętych kont (możliwy atak)

### Krok 10: Code review i deployment

1. **Code Review**: Przegląd kodu z zespołem
2. **Security Review**: Specjalny przegląd bezpieczeństwa dla tych endpointów
3. **Staging Deployment**: Wdrożenie na środowisko testowe
4. **Smoke Tests**: Wykonanie testów smoke na staging
5. **Production Deployment**: Wdrożenie na produkcję
6. **Post-deployment Monitoring**: Monitorowanie przez pierwsze 24h

## 10. Uwagi dodatkowe

### Rate Limiting (zalecane)

Rozważyć implementację rate limiting dla:
- **PUT /auth/password**: 5 prób na 15 minut (ochrona przed brute force)
- **DELETE /auth/account**: 3 próby na 30 minut (ochrona przed przypadkowym usunięciem)

### Email Notifications (opcjonalne)

Rozważyć wysyłanie emaili:
- Po zmianie hasła (powiadomienie o zmianie)
- Przed usunięciem konta (link do anulowania w ciągu 24h)
- Po usunięciu konta (potwierdzenie)

### Audit Trail (zalecane dla GDPR)

Logować wszystkie operacje związane z kontem:
- Timestamp
- User ID
- IP Address
- User Agent
- Akcja (password_change, account_deletion)
- Status (success/failure)

### Backup Strategy

Przed usunięciem konta, rozważyć:
- Archiwizację danych użytkownika (30 dni)
- Możliwość przywrócenia konta (grace period)

### Compliance (GDPR)

Upewnić się, że:
- Użytkownik może pobrać swoje dane (export feature)
- Dane są rzeczywiście usuwane (nie tylko oznaczane jako usunięte)
- Logowane są wszystkie operacje związane z danymi osobowymi

