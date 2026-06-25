-- Remove the global UNIQUE (date, meal_type) constraint on meal_plans.
-- It blocked two different users from planning the same meal_type on the same
-- date. The per-user UNIQUE (user_id, date, meal_type) is the correct one and
-- remains in place.
alter table public.meal_plans drop constraint if exists meal_plans_date_meal_type_key;
