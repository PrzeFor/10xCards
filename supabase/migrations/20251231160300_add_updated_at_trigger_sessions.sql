-- Migration: Add updated_at trigger for sessions table
-- Purpose: Automatically update the updated_at timestamp on sessions
-- Created: 2025-12-31
-- Tables affected: sessions
--
-- This uses the existing set_updated_at() function
-- to automatically update updated_at whenever a session is modified

-- create trigger to update updated_at column on sessions table
create trigger trg_sessions_updated_at
  before update on sessions
  for each row
  execute function set_updated_at();


