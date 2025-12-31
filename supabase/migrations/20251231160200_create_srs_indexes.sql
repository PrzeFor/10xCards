-- Migration: Create indexes for SRS-related queries
-- Purpose: Add indexes to optimize SRS and session queries
-- Created: 2025-12-31
-- Tables affected: flashcards, sessions
--
-- These indexes improve query performance for:
-- - finding flashcards due for review
-- - querying sessions by user and status
-- - filtering flashcards by SRS state

-- index for querying flashcards due for review
-- improves performance when fetching flashcards where next_review <= now()
-- composite index on user_id and next_review for efficient filtering
create index idx_flashcards_user_next_review on flashcards(user_id, next_review);

-- index for querying flashcards by SRS state
-- improves performance when filtering by srs_state (e.g., 'new', 'learning')
create index idx_flashcards_srs_state on flashcards(srs_state);

-- index for querying sessions by user
-- improves performance when fetching all sessions for a user
create index idx_sessions_user_id on sessions(user_id);

-- index for querying sessions by status
-- improves performance when filtering sessions by status (e.g., 'active', 'completed')
create index idx_sessions_status on sessions(status);

-- composite index for querying user's sessions by status
-- improves performance for common query pattern
create index idx_sessions_user_status on sessions(user_id, status);


