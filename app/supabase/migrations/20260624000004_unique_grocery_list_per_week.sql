-- One grocery list per user per week. The app regenerates per week and the UI
-- looks up a single list per week; a duplicate would make the page show "no
-- list" even when items exist.
alter table public.grocery_lists
  add constraint grocery_lists_user_week_unique unique (user_id, week_start);
