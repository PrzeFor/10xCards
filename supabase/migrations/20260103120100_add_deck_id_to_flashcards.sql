-- Migration: Add deck_id to flashcards table
-- Purpose: Link flashcards to decks for organization
-- Created: 2026-01-03
-- Tables affected: flashcards (modified)

-- add deck_id column to flashcards table
alter table flashcards
add column deck_id uuid references decks(id) on delete set null;

-- create index on deck_id for faster queries
create index idx_flashcards_deck_id on flashcards(deck_id);

-- create composite index for user_id and deck_id
create index idx_flashcards_user_deck on flashcards(user_id, deck_id);

-- add comment
comment on column flashcards.deck_id is 'Optional reference to the deck this flashcard belongs to';

