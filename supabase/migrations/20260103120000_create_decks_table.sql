-- Migration: Create decks table
-- Purpose: Store flashcard decks/categories for organizing flashcards
-- Created: 2026-01-03
-- Tables affected: decks (new)
--
-- This table stores flashcard decks with:
-- - name and optional description
-- - color for visual identification
-- - reference to the user who owns the deck

-- create decks table
create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  description text,
  color varchar(7) default '#3b82f6', -- hex color code
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure unique deck names per user
  constraint unique_deck_name_per_user unique (user_id, name)
);

-- enable row level security on decks table
-- this ensures users can only access their own decks
alter table decks enable row level security;

-- create rls policy: allow authenticated users to select their own decks
create policy "Users can view their own decks"
  on decks
  for select
  to authenticated
  using (auth.uid() = user_id);

-- create rls policy: allow authenticated users to insert their own decks
create policy "Users can create their own decks"
  on decks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to update their own decks
create policy "Users can update their own decks"
  on decks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- create rls policy: allow authenticated users to delete their own decks
create policy "Users can delete their own decks"
  on decks
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- create index on user_id for faster queries
create index idx_decks_user_id on decks(user_id);

-- create index on name for search functionality
create index idx_decks_name on decks(user_id, name);

