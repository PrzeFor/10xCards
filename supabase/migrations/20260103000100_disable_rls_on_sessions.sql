-- Migration: Disable RLS on sessions table
-- Purpose: Disable Row Level Security on sessions table to allow access through API with auth
-- Created: 2025-01-03
-- Tables affected: sessions
--
-- The application handles authorization through API middleware,
-- so RLS is not needed and was preventing queries from returning results.

-- Disable RLS on sessions table
alter table sessions disable row level security;

