-- Migration: Create flashcards table
-- Purpose: Store user flashcards (AI-generated or manually created)
-- Created: 2025-10-26
-- Tables affected: flashcards (new)
--
-- This table stores individual flashcards with:
-- - front and back content (limited to 300 and 500 chars respectively)
-- - reference to the generation that created it (if applicable)
-- - source type (ai_full, ai_edited, or manual)

-- create flashcards table
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references generations(id) on delete set null,
  front varchar(300) not null,
  back varchar(500) not null,
  source flashcard_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on flashcards table
-- this ensures users can only access their own flashcards
alter table flashcards enable row level security;

-- create rls policy: allow authenticated users to select their own flashcards
create policy "Users can view their own flashcards"
  on flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- create rls policy: allow authenticated users to insert their own flashcards
create policy "Users can create their own flashcards"
  on flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to update their own flashcards
create policy "Users can update their own flashcards"
  on flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to delete their own flashcards
create policy "Users can delete their own flashcards"
  on flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

