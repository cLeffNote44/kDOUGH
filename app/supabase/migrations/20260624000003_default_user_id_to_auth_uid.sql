-- Inserts across the app omit user_id, but it is NOT NULL with no default,
-- so every recipe / meal-plan / grocery-list insert failed (recipes was empty).
-- Default user_id to the caller's auth.uid() — the canonical Supabase pattern.
-- RLS WITH CHECK (auth.uid() = user_id) still guarantees rows are owned correctly.
alter table public.recipes       alter column user_id set default auth.uid();
alter table public.meal_plans    alter column user_id set default auth.uid();
alter table public.grocery_lists alter column user_id set default auth.uid();
