-- Migration: Add source_text_length column to generations table
-- Purpose: Store the character length of source text for analytics and validation
-- Created: 2025-10-26
-- Tables affected: generations (alter)
--
-- This migration adds the missing source_text_length column that was specified
-- in the database plan but not implemented in the original table creation.

-- Add source_text_length column to generations table
ALTER TABLE generations 
ADD COLUMN source_text_length INTEGER NOT NULL DEFAULT 0;

-- Update existing records to calculate source_text_length from source_text
UPDATE generations 
SET source_text_length = char_length(source_text)
WHERE source_text_length = 0;

-- Add constraint to ensure source_text_length matches actual source_text length
-- This constraint ensures data consistency between source_text and source_text_length
ALTER TABLE generations 
ADD CONSTRAINT check_source_text_length_consistency 
CHECK (source_text_length = char_length(source_text));

-- Add constraint to ensure source_text_length is within valid range (500-15000)
-- This duplicates the existing constraint on source_text but for the length field
ALTER TABLE generations 
ADD CONSTRAINT check_source_text_length_range 
CHECK (source_text_length BETWEEN 500 AND 15000);
