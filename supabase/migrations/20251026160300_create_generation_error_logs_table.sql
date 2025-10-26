-- Migration: Create generation_error_logs table
-- Purpose: Store error messages from failed generation attempts
-- Created: 2025-10-26
-- Tables affected: generation_error_logs (new)
--
-- This table captures error details when AI generation fails
-- Multiple errors can be logged for a single generation (e.g., retries)

-- create generation_error_logs table
create table generation_error_logs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations(id) on delete cascade,
  error_message varchar(1000) not null,
  created_at timestamptz not null default now()
);

-- enable row level security on generation_error_logs table
-- users can only access error logs for their own generations
alter table generation_error_logs enable row level security;

-- create rls policy: allow authenticated users to select error logs for their own generations
-- this policy joins to the generations table to verify ownership
create policy "Users can view error logs for their own generations"
  on generation_error_logs
  for select
  to authenticated
  using (
    auth.uid() = (
      select user_id 
      from generations 
      where id = generation_error_logs.generation_id
    )
  );

-- create rls policy: allow authenticated users to insert error logs for their own generations
create policy "Users can create error logs for their own generations"
  on generation_error_logs
  for insert
  to authenticated
  with check (
    auth.uid() = (
      select user_id 
      from generations 
      where id = generation_error_logs.generation_id
    )
  );

-- create rls policy: allow authenticated users to update error logs for their own generations
create policy "Users can update error logs for their own generations"
  on generation_error_logs
  for update
  to authenticated
  using (
    auth.uid() = (
      select user_id 
      from generations 
      where id = generation_error_logs.generation_id
    )
  )
  with check (
    auth.uid() = (
      select user_id 
      from generations 
      where id = generation_error_logs.generation_id
    )
  );

-- create rls policy: allow authenticated users to delete error logs for their own generations
create policy "Users can delete error logs for their own generations"
  on generation_error_logs
  for delete
  to authenticated
  using (
    auth.uid() = (
      select user_id 
      from generations 
      where id = generation_error_logs.generation_id
    )
  );

