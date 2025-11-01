# REST API Plan

## 1. Resources
- **Users** (`auth.users`)
- **Flashcards** (`flashcards`)
- **Generations** (`generations`)
- **Generation Error Logs** (`generation_error_logs`)

## 2. Endpoints

### Flashcard Generation (AI)

#### POST /generations
- Description: Create a new flashcard generation request based on user-provided text or using AI generation
- Authentication: Bearer token
- Request Body:
  ```json
  { "source_text": "string (500–15000 chars)" }
  ```
- Validations:
  - `source_text`: length between 500 and 15000 characters
- Response 201 Created (CreateGenerationResponse):
  ```json
  {
    "id": "uuid",
    "model": "string",
    "status": "completed",
    "generated_count": 10,
    "flashcards_proposals": [
      { "id": "uuid", "front": "string", "back": "string", "source": "ai_full" },
      { "id": "uuid", "front": "string", "back": "string", "source": "ai_full" }
    ]
  }
  ```
- Errors:
  - 400 Bad Request (InvalidSourceText):
    ```json
    { "code": "InvalidSourceText", "message": "source_text must be between 500 and 15000 characters." }
    ```
  - 429 Too Many Requests (RateLimitExceeded):
    ```json
    { "code": "RateLimitExceeded", "message": "Too many requests. Please try again later." }
    ```
  - 500 AIServiceError (logs recorded in generation_error_logs):
    ```json
    { "code": "AIServiceError", "message": "An error occurred while processing the AI generation request. Details have been logged." }
    ```
  - Business Logic:
    - Insert a new record into `generations` with status `pending`.
    - Invoke the AI service with provided `source_text`.
    - On success, insert proposed flashcards into `flashcards` (with `source=ai_full` and `generation_id`).
    - Update `generations` record: set `status=completed`, `generated_count`, `source_text_length`, timestamps.
    - On failure, insert error into `generation_error_logs`, update `generations.status=failed`.
    - Store metadata about genration and return flashcard proposals 
#### GET /generations
- Description: List all flashcard generation requests for the authenticated user
- Authentication: Bearer token
- Query Params:
  - `limit` (int, optional, default=10)
  - `offset` (int, optional, default=0)
  - `filter[status]` (pending|completed|failed, optional)
  - `sort[created_at]` (asc|desc, optional, default=desc)
- Response 200 OK (ListGenerationsResponse): array of:
  ```json
  [
    {
      "id": "uuid",
      "model": "string",
      "status": "pending|completed|failed",
      "generated_count": 10,
      "accepted_unedited_count": 5,
      "accepted_edited_count": 3,
      "source_text_length": 1200,
      "created_at": "2025-10-26T12:34:56Z"
    }
    // ... more items ...
  ]
  ```
- Errors:
  - 401 Unauthorized:
    ```json
    { "code": "Unauthorized", "message": "Authentication token is missing or invalid." }
    ```
  - 500 InternalServerError:
    ```json
    { "code": "InternalServerError", "message": "An unexpected error occurred. Please try again." }
    ```

#### GET /generations/{generationId}
- Description: Fetch generation metadata (status, counts)
- Authentication: Bearer token
- Response 200 OK (GetGenerationResponse):
  ```json
  {
    "id": "uuid",
    "status": "pending|completed|failed",
    "generated_count": "integer",
    "accepted_unedited_count": "integer|null",
    "accepted_edited_count": "integer|null"
  }
  ```
- Errors:
  - 401 Unauthorized (missing or invalid token)
  - 403 Forbidden (accessing another user’s generation)
  - 404 Not Found (generationId does not exist)
  - 500 Internal Server Error

#### GET /generations/{generationId}/flashcards
- Description: List flashcards produced by a generation
- Authentication: Bearer token
- Query Params: `limit` (int), `offset` (int)
- Response 200 OK (ListGenerationFlashcardsResponse): Array of:
  ```json
  [{ "id": "uuid", "front": "string", "back": "string", "source": "ai_full|ai_edited" }, ...]
  ```
- Errors:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 500 Internal Server Error

#### POST /generations/{generationId}/flashcards/actions
- Description: Batch accept or reject all generated cards
- Authentication: Bearer token
- Request Body:
  ```json
  { "action": "accept_all" | "reject_all" }
  ```
- Validations:
  - `action`: must be either `accept_all` or `reject_all`
- Response 200 OK (BulkFlashcardActionResponse):
  ```json
  { "accepted": "integer", "rejected": "integer" }
  ```
- Errors:
  - 400 Bad Request (InvalidAction):
    ```json
    { "code": "InvalidAction", "message": "action must be 'accept_all' or 'reject_all'." }
    ```
  - 401 Unauthorized (missing or invalid token)
  - 403 Forbidden (accessing another user’s generation)
  - 404 Not Found (generationId does not exist)
  - 500 InternalServerError:
    ```json
    { "code": "InternalServerError", "message": "An unexpected error occurred. Please try again." }
    ```
  - Business Logic:
    - Load all flashcards where `generation_id` matches and `source='ai_full'`.
    - If `action=accept_all`, mark each as accepted (persist unchanged) and increment `accepted_unedited_count` in `generations`.
    - If `action=reject_all`, delete these proposals and leave `generations` counters unchanged.
    - Wrap operations in a single DB transaction to ensure consistency.

### Generation Error Logs

#### GET /generations/{generationId}/errors
- Description: List error logs for a failed generation
- Authentication: Bearer token
- Response 200 OK (ListGenerationErrorsResponse): Array of:
  ```json
  [{ "id": "uuid", "error_message": "string" }, ...]
  ```
- Errors:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 500 Internal Server Error

### Flashcards CRUD

#### GET /flashcards
- Description: List user’s flashcards
- Authentication: Bearer token
- Query Params: `limit`, `offset`, `filter[source]`, `sort[created_at]`
- Response 200 OK (ListFlashcardsResponse): Array of flashcard objects
- Errors:
  - 401 Unauthorized
  - 500 Internal Server Error

#### POST /flashcards
- Description: Create one or more flashcards (manual or AI-generated)
- Authentication: Bearer token
- Request Body:
  ```json
  {
    "flashcards": [
      {
        "front": "string (max 300 chars)",
        "back": "string (max 500 chars)",
        "source": "manual|ai_full|ai_edited",
        "generation_id": "uuid (optional, required for ai_full and ai_edited)"
      }
    ]
  }
  ```
- Validations:
  - `front`: non-empty, maximum 300 characters
  - `back`: non-empty, maximum 500 characters
  - `source`: must be "manual", "ai_full", or "ai_edited"
  - `generation_id`: required when source is "ai_full" or "ai_edited", must be a valid UUID referencing user's generation
- Response 201 Created (CreateFlashcardsResponse): Array of created flashcard objects
- Example Response 201 Created:
  ```json
  [
    {
      "id": "b1a7f8e2-1234-5678-90ab-cdef12345678",
      "user_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "generation_id": null,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual",
      "created_at": "2025-10-26T12:34:56Z",
      "updated_at": "2025-10-26T12:34:56Z"
    },
    {
      "id": "c2b8f9e3-2345-6789-01bc-defa23456789",
      "user_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "generation_id": "d3c4e5f6-3456-7890-12cd-efab34567890",
      "front": "Define photosynthesis.",
      "back": "Photosynthesis is the process by which green plants convert light energy into chemical energy.",
      "source": "ai_full",
      "created_at": "2025-10-26T12:35:00Z",
      "updated_at": "2025-10-26T12:35:00Z"
    }
  ]
  ```
- Errors:
  - 400 Bad Request (ValidationError):
    ```json
    { "code": "ValidationError", "message": "One or more flashcards failed validation." }
    ```
  - 401 Unauthorized (missing or invalid token)
  - 500 InternalServerError:
    ```json
    { "code": "InternalServerError", "message": "An unexpected error occurred. Please try again." }
    ```
  - Business Logic:
    - Validate each flashcard payload and assign `user_id`.
    - Insert into `flashcards` table with appropriate `source` and optional `generation_id`.
    - Set `created_at` and `updated_at` timestamps via triggers.

#### GET /flashcards/{cardId}
- Description: Retrieve a single flashcard
- Authentication: Bearer token
- Response 200 OK (GetFlashcardResponse): Flashcard object
- Errors:
  - 401 Unauthorized
  - 403 Forbidden (accessing another user’s card)
  - 404 Not Found
  - 500 Internal Server Error

#### PUT /flashcards/{cardId}
- Description: Update flashcard content
- Authentication: Bearer token
- Request Body: same as POST /flashcards
- Validations: same as POST /flashcards
- Response 200 OK (UpdateFlashcardResponse): Updated flashcard
- Errors:
  - 400 Bad Request (validation failure)
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 500 Internal Server Error

#### DELETE /flashcards/{cardId}
- Description: Delete a flashcard
- Authentication: Bearer token
- Response 204 No Content (DeleteFlashcardResponse)
- Errors:
  - 401 Unauthorized (missing or invalid token)
  - 403 Forbidden (accessing another user’s card)
  - 404 Not Found (cardId does not exist)
  - 500 InternalServerError:
    ```json
    { "code": "InternalServerError", "message": "An unexpected error occurred. Please try again." }
    ```

### Statistics

#### GET /stats/generations
- Description: User’s generation metrics (total, accepted, edited, rejected)
- Authentication: Bearer token
- Response 200 OK (GenerationStatsResponse): Metrics object
- Errors:
  - 401 Unauthorized
  - 500 Internal Server Error

#### GET /stats/flashcards
- Description: Flashcard acceptance/edit statistics
- Authentication: Bearer token
- Response 200 OK (FlashcardStatsResponse): Statistics object
- Errors:
  - 401 Unauthorized
  - 500 Internal Server Error

## 3. Authentication & Authorization
- Mechanism: JWT in `Authorization: Bearer <token>` header
- Public: `/auth/register`, `/auth/login`
- Protected: all other endpoints
- RLS policies enforced: `auth.uid() = user_id` for tables and joins

## 4. Validation
_Field and payload validation rules enforced by API:_
 - **source_text** (POST /generations): required, 500–15000 characters
 - **front** (POST/PUT /flashcards): required, non-empty, ≤300 characters
 - **back** (POST/PUT /flashcards): required, non-empty, ≤500 characters
 - **flashcards[]** (POST /flashcards): array length 1–50, each item must satisfy above field rules
 - **error_message** (POST /generations/{id}/errors): required, non-empty, ≤1000 characters
 - **action** (POST /generations/{id}/flashcards/actions): must be `accept_all` or `reject_all`
 - **difficulty** (POST /sessions/{sessionId}/responses): one of `easy`, `medium`, `hard`
 - **Enums**: validate against defined sets
   - `flashcard_source`: `manual`, `ai_full`, `ai_edited`
   - `generation_status`: `pending`, `completed`, `failed`
 - **Query parameters**:
   - `limit`, `offset` on list endpoints: must be non-negative integers
   - `filter[status]`: must match generation statuses
   - `sort[...]`: must be `asc` or `desc`

## 5. Business Logic
_Operational flows and database interactions:_
 - **User account deletion** (DELETE /auth/account): cascade delete user record and all related flashcards, generations, and error logs; invalidate sessions
 - **Flashcard generation** (POST /generations):
    1. Create `generations` record with `status=pending`
    2. Invoke AI engine with `source_text`
    3. As soon as AI service responds, record metadata:
       - `generation_duration`: time (ms) taken by AI service (store in `generations.generation_duration`)
       - `model` identifier used
       - `generated_count`: number of flashcards returned by AI (store in `generations.generated_count`)
    4. On success:
       - Bulk insert proposals into `flashcards` with `source='ai_full'`, set `generation_id`
       - Update `generations` status to `completed`, record `generated_count`, `source_text_length`
    5. On failure:
       - Insert error into `generation_error_logs`
       - Update `generations.status` to `failed`
       - Record `generation_duration` and error count
 - **Listing generations** (GET /generations): fetch paginated records using indexed columns, apply filtering and sorting
 - **Flashcard proposals review**:
   - **Batch accept/reject** (POST /generations/{id}/flashcards/actions):
     - Load proposals by `generation_id`
     - Accept: mark records as `ai_full` accepted, increment counters in `generations`
     - Reject: delete proposals
     - Use DB transaction for atomicity
 - **Manual flashcard CRUD**:
   - Validate input, assign `user_id`, insert/update `flashcards` table
   - Timestamps maintained by triggers
 - **Error logging** (POST /generations/{id}/errors): record error messages; optionally update generation status
 - **Review sessions** (POST /sessions & responses): integrate with SRS engine, fetch next card, record difficulty
 - **Statistics** (GET /stats/*): aggregate counts from `generations` and `flashcards` tables
 - **Rate limiting**: enforce on heavy endpoints (e.g., /generations) to prevent abuse
 - **Error responses**: standard JSON payloads with `code` and `message` across all endpoints
