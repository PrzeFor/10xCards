-- Migration: Create trigger function and triggers for updated_at timestamps
-- Purpose: Automatically update the updated_at column when records are modified
-- Created: 2025-10-26
-- Tables affected: flashcards, generations
--
-- This ensures updated_at is always accurate without requiring application code
-- to explicitly set it on every update

-- create reusable trigger function for setting updated_at timestamp
-- this function is called automatically before any update operation
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create trigger on flashcards table
-- automatically updates updated_at timestamp whenever a flashcard is modified
create trigger trg_flashcards_updated_at
  before update on flashcards
  for each row execute function set_updated_at();

-- create trigger on generations table
-- automatically updates updated_at timestamp whenever a generation record is modified
create trigger trg_generations_updated_at
  before update on generations
  for each row execute function set_updated_at();

