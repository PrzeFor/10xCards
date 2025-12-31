-- Migration: Fix ease_factor column precision
-- Purpose: Increase precision of ease_factor to accommodate ts-fsrs stability values
-- Created: 2025-01-03
-- Tables affected: flashcards (modified)
--
-- This migration changes the ease_factor column from decimal(3,2) to decimal(6,2)
-- to accommodate larger stability values from the ts-fsrs library.
-- The ts-fsrs library can return stability values greater than 9.99,
-- which causes database constraint violations with the old decimal(3,2) type.

-- alter the ease_factor column to support larger values
alter table flashcards
  alter column ease_factor type decimal(6,2);

-- update comment for the column
comment on column flashcards.ease_factor is 'Stability/difficulty multiplier for the card (typically 0.00 to 100.00, from ts-fsrs)';

