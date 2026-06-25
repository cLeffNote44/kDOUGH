-- Pantry staples: ingredients the user always keeps on hand, so grocery-list
-- generation can flag/exclude them from what actually needs buying.

create table if not exists public.pantry_items (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  constraint pantry_items_user_name_unique unique (user_id, name)
);
create index if not exists idx_pantry_items_user on public.pantry_items (user_id);

alter table public.pantry_items enable row level security;

create policy "Users can manage their own pantry items" on public.pantry_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.pantry_items from anon;

-- Flag generated grocery items that match a pantry staple. These are shown in a
-- collapsed "you likely have these" section instead of the main buy list.
alter table public.grocery_items
  add column if not exists is_pantry boolean not null default false;
