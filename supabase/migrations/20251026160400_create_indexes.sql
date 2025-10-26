-- Migration: Create indexes for performance optimization
-- Purpose: Add indexes on foreign keys and frequently queried columns
-- Created: 2025-10-26
-- Tables affected: flashcards, generations, generation_error_logs
--
-- These indexes improve query performance for:
-- - looking up flashcards by user or generation
-- - filtering generations by user or status
-- - accessing error logs for a specific generation

-- index for querying flashcards by user
-- improves performance when fetching all flashcards for a user
create index idx_flashcards_user_id on flashcards(user_id);

-- index for querying flashcards by generation
-- improves performance when fetching all flashcards from a specific generation
create index idx_flashcards_generation_id on flashcards(generation_id);

-- index for querying generations by user
-- improves performance when fetching generation history for a user
create index idx_generations_user_id on generations(user_id);

-- index for querying generations by status
-- improves performance when filtering generations by status (e.g., pending, failed)
create index idx_generations_status on generations(status);

-- index for querying error logs by generation
-- improves performance when fetching all errors for a specific generation
create index idx_error_logs_generation_id on generation_error_logs(generation_id);

