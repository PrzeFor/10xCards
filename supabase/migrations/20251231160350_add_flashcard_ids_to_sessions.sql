-- Migration: Add flashcard_ids column to sessions table
-- Purpose: Store the list of flashcard IDs that were in this session
-- Created: 2025-12-31
-- Tables affected: sessions

-- Add flashcard_ids column to store the ordered list of flashcard IDs
alter table sessions 
  add column flashcard_ids uuid[] not null default '{}';

-- Add comment explaining the column
comment on column sessions.flashcard_ids is 'Ordered array of flashcard IDs that were included in this session';

-- Create index for searching by flashcard IDs (if needed for analytics)
create index idx_sessions_flashcard_ids on sessions using gin(flashcard_ids);

