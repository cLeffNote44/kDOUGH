-- Initial schema for kDOUGH (KaitohDough)
-- Captured from live Supabase project `svsjtphoigtqoewgtcjf` on 2026-06-24.
-- Faithfully reproduces tables, indexes, constraints, RLS policies, triggers,
-- and the updated_at helper as they exist in production.

-- Extensions ----------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;

-- updated_at trigger helper -------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables --------------------------------------------------------------------
create table if not exists public.recipes (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions text,
  image_url   text,
  source_url  text,
  servings    integer default 4,
  prep_time   integer,
  cook_time   integer,
  tags        text[] default '{}'::text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  is_favorite boolean not null default false,
  user_id     uuid not null references auth.users(id)
);
create index if not exists idx_recipes_title on public.recipes using btree (title);

create table if not exists public.grocery_lists (
  id         uuid primary key default uuid_generate_v4(),
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid not null references auth.users(id)
);

create table if not exists public.meal_plans (
  id         uuid primary key default uuid_generate_v4(),
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  date       date not null,
  meal_type  text not null default 'dinner'
             check (meal_type = any (array['breakfast','snack','lunch','dinner','dessert'])),
  created_at timestamptz not null default now(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  constraint meal_plans_user_date_meal_unique unique (user_id, date, meal_type),
  -- WARNING: this constraint is global across ALL users — two different users
  -- cannot plan the same meal_type on the same date. Almost certainly a bug;
  -- kept here to mirror production. Drop it once verified safe to do so.
  constraint meal_plans_date_meal_type_key unique (date, meal_type)
);
create index if not exists idx_meal_plans_date   on public.meal_plans using btree (date);
create index if not exists idx_meal_plans_recipe on public.meal_plans using btree (recipe_id);

create table if not exists public.grocery_items (
  id         uuid primary key default uuid_generate_v4(),
  list_id    uuid not null references public.grocery_lists(id) on delete cascade,
  name       text not null,
  quantity   numeric,
  unit       text,
  category   text not null default 'other',
  checked    boolean not null default false,
  recipe_ids uuid[] default '{}'::uuid[],
  is_manual  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_grocery_items_list    on public.grocery_items using btree (list_id);
create index if not exists idx_grocery_items_checked on public.grocery_items using btree (list_id, checked);

-- Triggers ------------------------------------------------------------------
create trigger recipes_updated_at before update on public.recipes
  for each row execute function public.update_updated_at_column();
create trigger grocery_lists_updated_at before update on public.grocery_lists
  for each row execute function public.update_updated_at_column();

-- Row Level Security --------------------------------------------------------
alter table public.recipes       enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.meal_plans    enable row level security;
alter table public.grocery_items enable row level security;

create policy "Users can manage their own recipes" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own grocery lists" on public.grocery_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can view own meal plans" on public.meal_plans
  for select using (auth.uid() = user_id);
create policy "Users can insert own meal plans" on public.meal_plans
  for insert with check (auth.uid() = user_id);
create policy "Users can update own meal plans" on public.meal_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own meal plans" on public.meal_plans
  for delete using (auth.uid() = user_id);

create policy "Authenticated users can manage grocery items" on public.grocery_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
