-- Guard the recipes.ingredients shape at the database level so a direct
-- PostgREST write (outside the server actions) can't store a non-array value,
-- matching the app's Ingredient[] contract. Existing rows default to '[]'::jsonb,
-- so this is satisfied by all current data.
alter table public.recipes
  add constraint recipes_ingredients_is_array
  check (jsonb_typeof(ingredients) = 'array');
