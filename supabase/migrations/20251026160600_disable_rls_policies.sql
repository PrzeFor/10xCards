-- Migration: Disable RLS policies
-- Purpose: Disable Row Level Security policies on flashcards, generations, and generation_error_logs tables
-- Created: 2025-10-26
-- Tables affected: flashcards, generations, generation_error_logs

-- Drop policies from generations table
drop policy if exists "Users can view their own generations" on generations;
drop policy if exists "Users can create their own generations" on generations;
drop policy if exists "Users can update their own generations" on generations;
drop policy if exists "Users can delete their own generations" on generations;

-- Disable RLS on generations table
alter table generations disable row level security;

-- Drop policies from flashcards table
drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can create their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

-- Disable RLS on flashcards table
alter table flashcards disable row level security;

-- Drop policies from generation_error_logs table
drop policy if exists "Users can view error logs for their own generations" on generation_error_logs;
drop policy if exists "Users can create error logs for their own generations" on generation_error_logs;
drop policy if exists "Users can update error logs for their own generations" on generation_error_logs;
drop policy if exists "Users can delete error logs for their own generations" on generation_error_logs;

-- Disable RLS on generation_error_logs table
alter table generation_error_logs disable row level security;

