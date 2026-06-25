-- Fix cross-tenant data leak on grocery_items.
--
-- The original policy was `for all using (auth.role() = 'authenticated')` with
-- no ownership scoping, so ANY authenticated user could read/modify/delete EVERY
-- other user's grocery items via a direct PostgREST call with the public anon
-- key — bypassing every app-layer check in actions.ts. Every sibling table
-- (recipes, meal_plans, grocery_lists) is correctly owner-scoped; this was an
-- oversight. Scope grocery_items to the owner of its parent grocery_list.

drop policy if exists "Authenticated users can manage grocery items" on public.grocery_items;

create policy "Users can manage items in their own grocery lists" on public.grocery_items
  for all
  using (
    exists (
      select 1 from public.grocery_lists gl
      where gl.id = public.grocery_items.list_id
        and gl.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.grocery_lists gl
      where gl.id = public.grocery_items.list_id
        and gl.user_id = auth.uid()
    )
  );
