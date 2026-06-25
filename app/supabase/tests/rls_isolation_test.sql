-- RLS cross-tenant isolation regression test (pgTAP).
--
-- Run with the Supabase CLI against a local stack:
--   supabase start
--   supabase test db
--
-- It seeds two users and asserts that user B can neither read nor modify user
-- A's recipes, meal_plans, grocery_lists, or grocery_items. The grocery_items
-- assertions specifically guard the fix in
-- 20260625000000_fix_grocery_items_rls.sql — before that migration the policy
-- only checked auth.role()='authenticated', so these would FAIL (cross-tenant leak).

begin;
select plan(9);

-- Authenticate as a given user for subsequent statements in this transaction.
create or replace function _login_as(uid uuid) returns void as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    true
  );
end;
$$ language plpgsql;

create or replace function _logout() returns void as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', null, true);
end;
$$ language plpgsql;

-- Seed two auth users (service context).
select _logout();
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@example.test')
on conflict (id) do nothing;

-- ── User A creates data ──────────────────────────────────────────────
select _login_as('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.recipes (id, user_id, title, ingredients)
values ('11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A''s Recipe', '[]'::jsonb);

insert into public.meal_plans (id, user_id, recipe_id, date, meal_type)
values ('22222222-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111', '2026-06-25', 'dinner');

insert into public.grocery_lists (id, user_id, week_start)
values ('33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-06-22');

insert into public.grocery_items (id, list_id, name)
values ('44444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333', 'A''s secret item');

-- Sanity: A can see A's own grocery item.
select is(
  (select count(*)::int from public.grocery_items where id = '44444444-4444-4444-4444-444444444444'),
  1, 'owner A can read their own grocery_items'
);

-- ── User B must be fully isolated from A's data ──────────────────────
select _login_as('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

select is(
  (select count(*)::int from public.recipes where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'B cannot read A''s recipes'
);

select is(
  (select count(*)::int from public.meal_plans where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'B cannot read A''s meal_plans'
);

select is(
  (select count(*)::int from public.grocery_lists where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0, 'B cannot read A''s grocery_lists'
);

-- The critical assertion (C1): grocery_items must be scoped to the parent list owner.
select is(
  (select count(*)::int from public.grocery_items where id = '44444444-4444-4444-4444-444444444444'),
  0, 'B cannot read A''s grocery_items (cross-tenant leak fixed)'
);

-- Writes by B against A's rows must affect zero rows (RLS WITH CHECK / USING).
update public.grocery_items set name = 'hacked' where id = '44444444-4444-4444-4444-444444444444';
select is(row_count(), 0, 'B cannot UPDATE A''s grocery_items');

delete from public.grocery_items where id = '44444444-4444-4444-4444-444444444444';
select is(row_count(), 0, 'B cannot DELETE A''s grocery_items');

delete from public.recipes where id = '11111111-1111-1111-1111-111111111111';
select is(row_count(), 0, 'B cannot DELETE A''s recipes');

-- ── Confirm A's data is still intact after B's attempts ──────────────
select _login_as('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is(
  (select name from public.grocery_items where id = '44444444-4444-4444-4444-444444444444'),
  'A''s secret item', 'A''s grocery_item is unmodified after B''s attempts'
);

select * from finish();
rollback;
