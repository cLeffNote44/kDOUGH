-- Indexes and constraints matching the app's actual access patterns.

-- recipes are always filtered by user_id (RLS predicate + explicit filters) and
-- the library list orders by is_favorite then created_at. The only existing
-- index is on (title), which none of those queries use.
create index if not exists idx_recipes_user_favorite_created
  on public.recipes (user_id, is_favorite desc, created_at desc);

-- The app treats (user_id, week_start) as a singleton grocery list and reads it
-- with .single()/.maybeSingle(); enforce that invariant (also indexes the lookup)
-- so a race or stray insert can't create duplicates that break the read.
-- First remove any pre-existing duplicates (keep the newest; grocery_items
-- cascade) so adding the constraint can't fail on real data.
delete from public.grocery_lists gl
using public.grocery_lists keep
where gl.user_id = keep.user_id
  and gl.week_start = keep.week_start
  and (
    gl.created_at < keep.created_at
    or (gl.created_at = keep.created_at and gl.id < keep.id)
  );

alter table public.grocery_lists
  add constraint grocery_lists_user_week_unique unique (user_id, week_start);

-- The per-user UNIQUE(user_id, date, meal_type) on meal_plans already covers
-- every per-user date-range query via its leading (user_id, date) prefix. The
-- standalone (date) index is never selected (no query filters date without a
-- user) and only adds write/storage overhead.
drop index if exists public.idx_meal_plans_date;
