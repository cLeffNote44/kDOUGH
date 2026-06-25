-- Cook tracking: a log of every time a recipe was actually made (cook_events),
-- plus per-recipe star rating + free-form notes on the recipes table itself.

-- Cook events: one row per "I made this" tap. 1:many so we can compute
-- times-cooked, last-cooked, and streaks; mirrors the pantry RLS/anon pattern.
create table if not exists public.cook_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  cooked_at  timestamptz not null default now(),
  source     text not null default 'manual'
             check (source = any (array['manual', 'calendar'])),
  created_at timestamptz not null default now()
);

-- (user_id, recipe_id): per-recipe stats (times cooked, last cooked on detail page).
create index if not exists idx_cook_events_user_recipe
  on public.cook_events (user_id, recipe_id);
-- (user_id, cooked_at desc): history feed + streak/stale scans over a user's log.
create index if not exists idx_cook_events_user_cooked_at
  on public.cook_events (user_id, cooked_at desc);

alter table public.cook_events enable row level security;

create policy "Users can manage their own cook events" on public.cook_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.cook_events from anon;

-- Per-recipe rating (1-5 stars, nullable = unrated) and free-form notes.
alter table public.recipes
  add column if not exists rating smallint
    check (rating is null or (rating >= 1 and rating <= 5)),
  add column if not exists notes text;
