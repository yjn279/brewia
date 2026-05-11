-- verify-supabase-crud.sql
-- Supabase MCP execute_sql smoke test for the bean table.
-- Run each @stage block in order via mcp__supabase__execute_sql.
--
-- NOTE: bean.user_id has a FK to auth.users(id).
-- Stage 0 inserts a test user to satisfy the FK (idempotent via ON CONFLICT).
-- Stage 99 cleans up after the test.
--
-- Supabase SQL Editor URL:
--   https://supabase.com/dashboard/project/afpqxkhioltnkcrqifnr/sql/new

-- @stage: 0-seed-auth-user (run first; satisfies bean.user_id FK)
insert into auth.users (
  id, instance_id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'e2e@brewia.test',
  now(),
  now(),
  '{}',
  '{}',
  false
) on conflict (id) do nothing;

-- @stage: insert
insert into public.bean (id, user_id, name, roaster, country, created, updated)
values (
  '00000000-0000-0000-0000-0000000000aa',
  '00000000-0000-0000-0000-000000000001',
  'verify-web-test',
  'Trinity',
  'JP',
  now(),
  now()
);

-- @stage: select (expect 1 row)
select id, name from public.bean where id = '00000000-0000-0000-0000-0000000000aa';

-- @stage: delete
delete from public.bean where id = '00000000-0000-0000-0000-0000000000aa';

-- @stage: verify-empty (expect count = 0)
select count(*) as cnt from public.bean where id = '00000000-0000-0000-0000-0000000000aa';

-- @stage: 99-cleanup-auth-user (run last; removes test user)
delete from auth.users where id = '00000000-0000-0000-0000-000000000001';
