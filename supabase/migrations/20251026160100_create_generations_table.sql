-- Migration: Create generations table
-- Purpose: Store AI generation requests and their metadata
-- Created: 2025-10-26
-- Tables affected: generations (new)
--
-- This table tracks each AI generation session, including:
-- - the model used
-- - source text and its length
-- - generation status and duration
-- - counts of accepted flashcards (edited vs unedited)

-- create generations table
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer null,
  accepted_edited_count integer null,
  source_text text not null,
  status generation_status not null,
  generation_duration integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure source text is between 500 and 15000 characters
  constraint check_source_text_length check (char_length(source_text) between 500 and 15000)
);

-- enable row level security on generations table
-- this ensures users can only access their own generation records
alter table generations enable row level security;

-- create rls policy: allow authenticated users to select their own generations
create policy "Users can view their own generations"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- create rls policy: allow authenticated users to insert their own generations
create policy "Users can create their own generations"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to update their own generations
create policy "Users can update their own generations"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to delete their own generations
create policy "Users can delete their own generations"
  on generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

