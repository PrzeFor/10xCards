# API Endpoint Implementation Plan: DELETE /flashcards/{cardId}

## 1. Endpoint Overview

This endpoint allows authenticated users to permanently delete one of their flashcards from the database. The deletion is irreversible and will also update any related generation statistics if the flashcard was associated with a generation.

**Key Characteristics:**
- Idempotent operation (multiple identical requests produce the same result)
- Cascading effects on generation statistics
- Ownership validation required
- No response body on success (204 No Content)

## 2. Request Details

### HTTP Method
`DELETE`

### URL Structure
```
DELETE /api/flashcards/{cardId}
```

### URL Parameters
- **cardId** (required)
  - Type: UUID
  - Location: Path parameter
  - Description: Unique identifier of the flashcard to delete
  - Validation: Must be a valid UUID format

### Headers
- **Authorization** (required)
  - Format: `Bearer <token>`
  - Description: JWT token for user authentication

### Request Body
None (DELETE requests typically don't have a body)

### Query Parameters
None

## 3. Utilized Types

### From types.ts

```typescript
// Response type
export type DeleteFlashcardResponseDto = void;

// Database types (for internal use)
type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];
```

### Validation Schema (to create)

```typescript
// src/lib/schemas/flashcards.ts
import { z } from 'zod';

export const deleteFlashcardParamsSchema = z.object({
  cardId: z.string().uuid('Invalid flashcard ID format'),
});

export type DeleteFlashcardParams = z.infer<typeof deleteFlashcardParamsSchema>;
```

### Service Method Signature (to implement)

```typescript
// src/lib/services/flashcard.service.ts
async function deleteFlashcard(
  supabase: SupabaseClient,
  userId: string,
  cardId: string
): Promise<void>
```

## 4. Response Details

### Success Response (204 No Content)

```
HTTP/1.1 204 No Content
```

- No response body
- Indicates successful deletion
- Returns same response even if flashcard was already deleted (idempotent)

### Error Responses

#### 401 Unauthorized
```json
{
  "code": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "code": "Forbidden",
  "message": "You don't have permission to delete this flashcard"
}
```

#### 404 Not Found
```json
{
  "code": "NotFound",
  "message": "Flashcard not found"
}
```

#### 500 Internal Server Error
```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred. Please try again."
}
```

## 5. Data Flow

### Step-by-Step Flow

```
1. Client Request
   └─> DELETE /api/flashcards/{cardId} with Bearer token

2. Astro Middleware (src/middleware/index.ts)
   ├─> Validate Bearer token
   ├─> Extract user from token
   └─> Attach user & supabase to context.locals
       ├─> ✗ Invalid/missing token → 401 Unauthorized
       └─> ✓ Valid token → Continue

3. API Route Handler (src/pages/api/flashcards/[cardId].ts)
   ├─> Extract cardId from URL params
   ├─> Validate cardId format (UUID)
   │   └─> ✗ Invalid format → 400 Bad Request
   └─> ✓ Valid format → Continue

4. Flashcard Service (src/lib/services/flashcard.service.ts)
   ├─> Query flashcard by ID and user_id
   │   ├─> ✗ Not found → 404 Not Found
   │   └─> ✓ Found → Continue
   │
   ├─> Check if flashcard has generation_id
   │   ├─> Yes → Need to update generation stats
   │   └─> No → Skip stats update
   │
   ├─> Begin transaction (if stats update needed)
   │   ├─> Get flashcard source type
   │   ├─> Delete flashcard
   │   └─> Update generation statistics
   │       ├─> Decrement generated_count by 1
   │       └─> Decrement accepted_unedited_count or accepted_edited_count
   │           based on source ('ai_full' or 'ai_edited')
   │
   └─> Delete flashcard (if no stats update needed)
       └─> Return success

5. Response
   └─> 204 No Content
```

### Database Operations

#### Query to Check Ownership and Retrieve Flashcard
```sql
SELECT id, generation_id, source 
FROM flashcards 
WHERE id = $1 AND user_id = $2
LIMIT 1;
```

#### Delete Operation
```sql
DELETE FROM flashcards 
WHERE id = $1 AND user_id = $2;
```

#### Update Generation Statistics (if applicable)
```sql
UPDATE generations 
SET 
  generated_count = generated_count - 1,
  accepted_unedited_count = CASE 
    WHEN $source = 'ai_full' THEN GREATEST(0, accepted_unedited_count - 1)
    ELSE accepted_unedited_count 
  END,
  accepted_edited_count = CASE 
    WHEN $source = 'ai_edited' THEN GREATEST(0, accepted_edited_count - 1)
    ELSE accepted_edited_count 
  END,
  updated_at = now()
WHERE id = $generation_id;
```

### Cascade Effects

- **ON DELETE CASCADE**: Database automatically handles deletion of related records
- **Generation statistics**: Must be manually updated to maintain data integrity
- **generation_id**: Will be set to NULL if generation is deleted (ON DELETE SET NULL)

## 6. Security Considerations

### Authentication
- **Bearer Token Validation**: Handled by Astro middleware
- Token must be present in Authorization header
- Token must be valid and not expired
- User must exist in the system

### Authorization
- **Ownership Verification**: Critical security check
- Query must include both `id = $cardId AND user_id = $userId`
- This ensures users can only delete their own flashcards
- Even if a user guesses another user's cardId, the query will fail

### Input Validation
- **UUID Format**: cardId must be a valid UUID
- Prevents injection attacks
- Zod schema provides type safety and validation

### SQL Injection Prevention
- **Parameterized Queries**: Supabase SDK uses parameterized queries
- Never concatenate user input into SQL strings
- All values passed as parameters, not string literals

### Rate Limiting Considerations
- Consider implementing rate limiting to prevent abuse
- Suggested: 100 deletes per minute per user
- Implementation can be added in middleware or at API gateway level

## 7. Error Handling

### Error Types and Responses

#### 1. Authentication Errors (401)

**Scenarios:**
- Missing Authorization header
- Invalid token format
- Expired token
- Token signature invalid

**Handler Location:** Middleware (`src/middleware/index.ts`)

**Response:**
```json
{
  "code": "Unauthorized",
  "message": "Authentication required"
}
```

#### 2. Authorization Errors (403)

**Scenarios:**
- User attempts to delete another user's flashcard
- Valid token but insufficient permissions

**Handler Location:** Service layer

**Detection:** Query returns no rows when filtering by both cardId and userId

**Response:**
```json
{
  "code": "Forbidden",
  "message": "You don't have permission to delete this flashcard"
}
```

**Implementation Note:** 
- Should distinguish between "not found" and "forbidden"
- First check if flashcard exists (query without user_id filter)
- If exists but user_id doesn't match → 403
- If doesn't exist → 404

#### 3. Resource Not Found (404)

**Scenarios:**
- Flashcard with given ID doesn't exist
- Flashcard was already deleted

**Handler Location:** Service layer

**Response:**
```json
{
  "code": "NotFound",
  "message": "Flashcard not found"
}
```

**Implementation Note:**
- For idempotency, consider returning 204 instead of 404 if flashcard doesn't exist
- This prevents information leakage about which IDs exist
- Decision: Return 404 per specification (explicit about resource existence)

#### 4. Validation Errors (400)

**Scenarios:**
- Invalid UUID format for cardId
- Malformed request

**Handler Location:** Route handler (validation layer)

**Response:**
```json
{
  "code": "ValidationError",
  "message": "Invalid flashcard ID format"
}
```

#### 5. Database Errors (500)

**Scenarios:**
- Database connection failure
- Transaction failure
- Constraint violations (unexpected)
- Timeout errors

**Handler Location:** Service layer with try-catch

**Response:**
```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred. Please try again."
}
```

**Logging:**
- Log full error details server-side
- Include: userId, cardId, error message, stack trace
- Don't expose internal details to client

### Error Handling Pattern

```typescript
// In route handler
try {
  // Validate params
  const { cardId } = deleteFlashcardParamsSchema.parse(params);
  
  // Call service
  await deleteFlashcard(supabase, userId, cardId);
  
  // Return success
  return new Response(null, { status: 204 });
  
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        code: 'ValidationError',
        message: error.errors[0].message
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (error.code === 'NOT_FOUND') {
    return new Response(
      JSON.stringify({
        code: 'NotFound',
        message: 'Flashcard not found'
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (error.code === 'FORBIDDEN') {
    return new Response(
      JSON.stringify({
        code: 'Forbidden',
        message: "You don't have permission to delete this flashcard"
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Log unexpected errors
  console.error('Delete flashcard error:', error);
  
  return new Response(
    JSON.stringify({
      code: 'InternalServerError',
      message: 'An unexpected error occurred. Please try again.'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## 8. Performance Considerations

### Database Optimization

#### 1. Index Usage
```sql
-- Existing index (from schema)
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
```

**Query Performance:**
- Lookup query uses index on (user_id, id)
- Consider composite index for optimal performance:
```sql
CREATE INDEX idx_flashcards_user_id_id ON flashcards(user_id, id);
```

#### 2. Query Efficiency
- Single query to check ownership and retrieve data
- Avoid N+1 queries
- Use `LIMIT 1` to stop scanning after first match

### Response Time Targets
- **Target:** < 100ms for typical case
- **Maximum acceptable:** < 500ms
- **Factors:**
  - Database query: ~10-50ms
  - Network latency: ~20-100ms
  - Transaction overhead (if stats update): +50ms

### Caching Considerations
- **Not applicable** for DELETE operations
- Ensure any frontend/client-side cache is invalidated after deletion
- If using Redis or similar, invalidate cached flashcard lists

### Connection Pooling
- Supabase handles connection pooling automatically
- Ensure proper cleanup of connections (close clients if needed)

### Transaction Overhead
- Use transactions only when updating generation statistics
- Keep transaction scope minimal
- Avoid long-running transactions

### Batch Deletion Consideration
- Current endpoint deletes single flashcard
- For bulk deletion, consider separate endpoint: `DELETE /api/flashcards` with body containing array of IDs
- Bulk deletion can use single transaction for better performance

## 9. Implementation Steps

### Step 1: Update Validation Schema

**File:** `src/lib/schemas/flashcards.ts`

**Action:** Add validation schema for delete operation

```typescript
import { z } from 'zod';

// ... existing schemas ...

export const deleteFlashcardParamsSchema = z.object({
  cardId: z.string().uuid('Invalid flashcard ID format'),
});

export type DeleteFlashcardParams = z.infer<typeof deleteFlashcardParamsSchema>;
```

### Step 2: Implement Service Method

**File:** `src/lib/services/flashcard.service.ts`

**Action:** Add `deleteFlashcard` method

```typescript
import type { SupabaseClient } from '../db/supabase.client';

/**
 * Deletes a flashcard and updates related generation statistics.
 * 
 * @throws {Error} with code 'NOT_FOUND' if flashcard doesn't exist
 * @throws {Error} with code 'FORBIDDEN' if user doesn't own the flashcard
 * @throws {Error} for database errors
 */
export async function deleteFlashcard(
  supabase: SupabaseClient,
  userId: string,
  cardId: string
): Promise<void> {
  // Step 1: Verify flashcard exists and get its data
  const { data: flashcard, error: fetchError } = await supabase
    .from('flashcards')
    .select('id, generation_id, source, user_id')
    .eq('id', cardId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // Not found
      const error = new Error('Flashcard not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }
    throw fetchError;
  }

  // Step 2: Verify ownership
  if (flashcard.user_id !== userId) {
    const error = new Error("You don't have permission to delete this flashcard");
    (error as any).code = 'FORBIDDEN';
    throw error;
  }

  // Step 3: Delete the flashcard
  const { error: deleteError } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId); // Double-check ownership

  if (deleteError) {
    throw deleteError;
  }

  // Step 4: Update generation statistics if applicable
  if (flashcard.generation_id) {
    await updateGenerationStatsAfterDeletion(
      supabase,
      flashcard.generation_id,
      flashcard.source
    );
  }
}

/**
 * Updates generation statistics after a flashcard is deleted.
 * Decrements counters based on flashcard source.
 */
async function updateGenerationStatsAfterDeletion(
  supabase: SupabaseClient,
  generationId: string,
  source: string
): Promise<void> {
  // Fetch current generation data
  const { data: generation, error: fetchError } = await supabase
    .from('generations')
    .select('generated_count, accepted_unedited_count, accepted_edited_count')
    .eq('id', generationId)
    .single();

  if (fetchError || !generation) {
    // Generation might have been deleted (ON DELETE SET NULL)
    // This is not an error condition, just return
    return;
  }

  // Calculate new values
  const updates: any = {
    generated_count: Math.max(0, generation.generated_count - 1),
  };

  if (source === 'ai_full') {
    updates.accepted_unedited_count = Math.max(
      0,
      (generation.accepted_unedited_count || 0) - 1
    );
  } else if (source === 'ai_edited') {
    updates.accepted_edited_count = Math.max(
      0,
      (generation.accepted_edited_count || 0) - 1
    );
  }

  // Update generation
  const { error: updateError } = await supabase
    .from('generations')
    .update(updates)
    .eq('id', generationId);

  if (updateError) {
    // Log error but don't throw - flashcard is already deleted
    console.error('Failed to update generation stats:', updateError);
  }
}
```

### Step 3: Create API Route Handler

**File:** `src/pages/api/flashcards/[cardId].ts`

**Action:** Create new file with DELETE handler

```typescript
import type { APIRoute } from 'astro';
import { deleteFlashcardParamsSchema } from '../../../lib/schemas/flashcards';
import { deleteFlashcard } from '../../../lib/services/flashcard.service';

export const prerender = false;

/**
 * DELETE /api/flashcards/{cardId}
 * Deletes a flashcard for the authenticated user
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        code: 'Unauthorized',
        message: 'Authentication required',
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Validate cardId parameter
    const { cardId } = deleteFlashcardParamsSchema.parse({
      cardId: params.cardId,
    });

    // Get Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Delete flashcard
    await deleteFlashcard(supabase, user.id, cardId);

    // Return 204 No Content
    return new Response(null, { status: 204 });

  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: error.errors[0]?.message || 'Invalid flashcard ID format',
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle not found
    if (error.code === 'NOT_FOUND') {
      return new Response(
        JSON.stringify({
          code: 'NotFound',
          message: 'Flashcard not found',
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle forbidden
    if (error.code === 'FORBIDDEN') {
      return new Response(
        JSON.stringify({
          code: 'Forbidden',
          message: "You don't have permission to delete this flashcard",
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle unexpected errors
    console.error('Error deleting flashcard:', {
      userId: user.id,
      cardId: params.cardId,
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again.',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
```

### Step 4: Update Existing Route Handler (If Exists)

**File:** `src/pages/api/flashcards/[cardId].ts`

**Action:** If the file already exists with GET/PUT handlers, add the DELETE handler to the same file

```typescript
// Add to existing file
export const DELETE: APIRoute = async ({ params, locals }) => {
  // ... implementation from Step 3 ...
};
```

### Step 5: Verify Middleware Configuration

**File:** `src/middleware/index.ts`

**Action:** Ensure authentication middleware is properly configured

- Verify Bearer token extraction
- Verify user is attached to `locals.user`
- Verify Supabase client is attached to `locals.supabase`

### Step 6: Testing

#### Unit Tests

**File:** `tests/unit/services/flashcard.service.test.ts`

**Add tests for:**
1. Successful deletion
2. Deletion with generation stats update (ai_full source)
3. Deletion with generation stats update (ai_edited source)
4. Deletion without generation (manual source)
5. Not found error
6. Forbidden error (wrong user_id)
7. Database error handling

**Example test:**
```typescript
describe('deleteFlashcard', () => {
  it('should delete flashcard and update generation stats', async () => {
    // Arrange
    const mockSupabase = createMockSupabase();
    const userId = 'user-123';
    const cardId = 'card-456';
    const generationId = 'gen-789';

    mockSupabase.from('flashcards').select.mockResolvedValueOnce({
      data: {
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_full',
      },
      error: null,
    });

    mockSupabase.from('flashcards').delete.mockResolvedValueOnce({
      error: null,
    });

    mockSupabase.from('generations').select.mockResolvedValueOnce({
      data: {
        generated_count: 5,
        accepted_unedited_count: 3,
        accepted_edited_count: 1,
      },
      error: null,
    });

    mockSupabase.from('generations').update.mockResolvedValueOnce({
      error: null,
    });

    // Act
    await deleteFlashcard(mockSupabase, userId, cardId);

    // Assert
    expect(mockSupabase.from('flashcards').delete).toHaveBeenCalledWith();
    expect(mockSupabase.from('generations').update).toHaveBeenCalledWith({
      generated_count: 4,
      accepted_unedited_count: 2,
    });
  });

  it('should throw NOT_FOUND error when flashcard does not exist', async () => {
    // Arrange
    const mockSupabase = createMockSupabase();
    mockSupabase.from('flashcards').select.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // Act & Assert
    await expect(
      deleteFlashcard(mockSupabase, 'user-123', 'card-456')
    ).rejects.toThrow('Flashcard not found');
  });

  it('should throw FORBIDDEN error when user does not own flashcard', async () => {
    // Arrange
    const mockSupabase = createMockSupabase();
    mockSupabase.from('flashcards').select.mockResolvedValueOnce({
      data: {
        id: 'card-456',
        user_id: 'other-user',
        generation_id: null,
        source: 'manual',
      },
      error: null,
    });

    // Act & Assert
    await expect(
      deleteFlashcard(mockSupabase, 'user-123', 'card-456')
    ).rejects.toThrow("You don't have permission to delete this flashcard");
  });
});
```

#### Integration Tests

**File:** `tests/integration/api/flashcards-delete.test.ts`

**Test scenarios:**
1. Successful deletion (204)
2. Unauthorized access (401)
3. Forbidden access (403)
4. Not found (404)
5. Invalid UUID format (400)
6. Generation stats are correctly updated

#### E2E Tests

**File:** `tests/e2e/flashcards.spec.ts`

**Test scenarios:**
1. User can delete their own flashcard
2. Flashcard disappears from UI after deletion
3. User cannot delete another user's flashcard
4. Error message shown when deletion fails

### Step 7: Documentation

**File:** Update API documentation

**Action:** Document the DELETE endpoint

- Request format
- Response codes
- Error responses
- Example curl commands

**Example:**
```bash
# Delete a flashcard
curl -X DELETE \
  https://api.example.com/api/flashcards/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 8: Frontend Integration

**Files to update:**
- `src/components/FlashcardItem.tsx` - Add delete button/handler
- `src/components/FlashcardList.tsx` - Update list after deletion
- `src/lib/hooks/useDeleteFlashcard.ts` - Create custom hook (if needed)

**Implementation considerations:**
- Optimistic UI update
- Confirmation dialog before deletion
- Error handling and user feedback
- Refresh list or remove item from state

### Step 9: Deployment Checklist

Before deploying to production:

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] Performance tested (response times < 500ms)
- [ ] Error handling tested
- [ ] Security review completed
- [ ] Database indexes verified
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Monitoring and alerting configured

## 10. Additional Considerations

### Soft Delete Alternative

Consider implementing soft delete instead of hard delete:

**Pros:**
- Data recovery possible
- Audit trail maintained
- Safer for production

**Cons:**
- Increased storage
- More complex queries
- Privacy concerns (GDPR compliance)

**Implementation:**
- Add `deleted_at` column to flashcards table
- Update queries to filter `WHERE deleted_at IS NULL`
- Implement cleanup job for old soft-deleted records

### Undo Functionality

Consider adding undo capability:

**Implementation:**
- Return deleted flashcard data in response (change to 200 OK)
- Frontend stores deleted data temporarily
- Provide "Undo" button with time limit (30 seconds)
- Implement `POST /api/flashcards/restore` endpoint

### Audit Log

For enterprise features, consider logging deletions:

**Implementation:**
- Create `flashcard_audit_log` table
- Log: userId, cardId, action, timestamp, ip_address
- Useful for compliance and debugging

### Cascade Prevention

Consider preventing deletion if flashcard is part of an active study session:

**Implementation:**
- Add `in_study_session` flag or reference
- Check flag before deletion
- Return appropriate error if deletion not allowed

## 11. Rollback Plan

If issues arise after deployment:

1. **Immediate Rollback:**
   - Revert to previous deployment
   - Disable endpoint via feature flag

2. **Database Rollback:**
   - No schema changes, so no database rollback needed
   - If soft delete implemented, restore deleted records

3. **Communication:**
   - Notify users if data loss occurred
   - Provide timeline for fix

4. **Post-Mortem:**
   - Document what went wrong
   - Identify missing tests
   - Update implementation plan

## 12. Success Metrics

Track these metrics after deployment:

- **Response time:** Average, P95, P99
- **Error rate:** Percentage of 4xx and 5xx responses
- **Usage:** Number of deletions per day/week
- **User satisfaction:** Feedback on deletion experience
- **Data integrity:** No orphaned generation stats
- **Performance:** Database query times

**Alerting thresholds:**
- Error rate > 1%
- P95 response time > 500ms
- Failed stat updates > 0.1%

---

## Summary

This implementation plan provides a comprehensive guide for implementing the DELETE /flashcards/{cardId} endpoint. The endpoint follows RESTful principles, implements proper security measures, and handles all specified error cases. The service layer properly manages generation statistics updates, ensuring data integrity across the system.

Key implementation priorities:
1. Security (authentication and authorization)
2. Data integrity (generation statistics)
3. Error handling (proper status codes and messages)
4. Performance (optimized queries and indexes)
5. Testing (comprehensive test coverage)

Follow the implementation steps in order, and ensure all tests pass before deploying to production.

