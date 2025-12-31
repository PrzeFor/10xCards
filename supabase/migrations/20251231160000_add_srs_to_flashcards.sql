-- Migration: Add SRS (Spaced Repetition System) columns to flashcards table
-- Purpose: Enable spaced repetition functionality for flashcards
-- Created: 2025-12-31
-- Tables affected: flashcards (modified)
--
-- This migration adds columns needed for SRS algorithm:
-- - next_review: timestamp when the card should be reviewed next
-- - interval: number of days until next review
-- - ease_factor: difficulty multiplier for the card
-- - repetitions: number of times the card has been reviewed
-- - srs_state: current state in the SRS system
-- - last_reviewed_at: timestamp of the last review

-- create enum type for SRS card state
-- values indicate the current state of a flashcard in SRS:
--   - 'new': card has never been reviewed
--   - 'learning': card is in initial learning phase
--   - 'review': card is in regular review phase
--   - 'relearning': card was forgotten and needs relearning
create type srs_card_state as enum ('new', 'learning', 'review', 'relearning');

-- add SRS columns to flashcards table
alter table flashcards
  add column next_review timestamptz not null default now(),
  add column interval integer not null default 1,
  add column ease_factor decimal(3,2) not null default 2.50,
  add column repetitions integer not null default 0,
  add column srs_state srs_card_state not null default 'new',
  add column last_reviewed_at timestamptz;

-- add comment to columns for documentation
comment on column flashcards.next_review is 'Timestamp when the card should be reviewed next';
comment on column flashcards.interval is 'Number of days until next review';
comment on column flashcards.ease_factor is 'Difficulty multiplier for the card (typically 1.3 to 2.5)';
comment on column flashcards.repetitions is 'Number of times the card has been successfully reviewed';
comment on column flashcards.srs_state is 'Current state of the card in the SRS system';
comment on column flashcards.last_reviewed_at is 'Timestamp of the last review session';


