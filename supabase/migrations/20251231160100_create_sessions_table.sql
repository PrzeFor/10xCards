-- Migration: Create sessions table for SRS review sessions
-- Purpose: Track user review sessions and their statistics
-- Created: 2025-12-31
-- Tables affected: sessions (new)
--
-- This table stores review sessions with:
-- - status tracking (active, completed, abandoned)
-- - card counts and progress
-- - session statistics in JSONB format
-- - timestamps for start and completion

-- create enum type for session status
-- values indicate the current state of a review session:
--   - 'active': session is currently in progress
--   - 'completed': session was completed successfully
--   - 'abandoned': session was started but not completed
create type session_status as enum ('active', 'completed', 'abandoned');

-- create sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status session_status not null default 'active',
  total_cards integer not null default 0,
  completed_cards integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  stats jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comments to columns for documentation
comment on column sessions.status is 'Current status of the session';
comment on column sessions.total_cards is 'Total number of flashcards in this session';
comment on column sessions.completed_cards is 'Number of flashcards reviewed so far';
comment on column sessions.started_at is 'Timestamp when the session started';
comment on column sessions.completed_at is 'Timestamp when the session was completed (null if not completed)';
comment on column sessions.stats is 'Session statistics stored as JSON (easy_count, medium_count, hard_count, duration)';

-- enable row level security on sessions table
-- this ensures users can only access their own sessions
alter table sessions enable row level security;

-- create rls policy: allow authenticated users to select their own sessions
create policy "Users can view their own sessions"
  on sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- create rls policy: allow authenticated users to insert their own sessions
create policy "Users can create their own sessions"
  on sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to update their own sessions
create policy "Users can update their own sessions"
  on sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to delete their own sessions
create policy "Users can delete their own sessions"
  on sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);


