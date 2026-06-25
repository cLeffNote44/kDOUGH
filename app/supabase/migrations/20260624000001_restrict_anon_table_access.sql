-- Harden: the anon role has no business touching post-login user-data tables.
-- RLS already gated rows; this removes table-level grants so the tables are
-- not discoverable via the GraphQL/PostgREST schema to unauthenticated clients.
-- Clears Supabase advisor 0026 (pg_graphql_anon_table_exposed).
revoke all on public.recipes       from anon;
revoke all on public.grocery_lists from anon;
revoke all on public.meal_plans    from anon;
revoke all on public.grocery_items from anon;
