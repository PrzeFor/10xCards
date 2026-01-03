-- Migration: Add updated_at trigger for decks table
-- Purpose: Automatically update updated_at timestamp on deck modifications
-- Created: 2026-01-03
-- Tables affected: decks (trigger added)

-- create trigger to automatically update updated_at on decks
create trigger trg_decks_updated_at
  before update on decks
  for each row
  execute function set_updated_at();

