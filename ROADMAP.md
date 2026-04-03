# Roadmap

High-level phases and milestones. Done items stay visible, marked with ✅.

---

## Phase 1 — Core Infrastructure ✅
**Goal:** Get the project skeleton running with auth and database.

- [x] Initialize Next.js project with TypeScript and Tailwind CSS
- [x] Set up Supabase project (database, auth, API keys)
- [x] Design and apply database schema (recipes, meal_plans, grocery_items)
- [x] Configure Supabase client in Next.js
- [x] Auth flow (email/password sign-in and sign-up)
- [x] Verify end-to-end: app loads, connects to Supabase, auth works

**Milestone:** ✅ App runs locally, user can log in, database is seeded and accessible.

---

## Phase 2 — Meal Planning ✅
**Goal:** The weekly calendar is the home screen. Recipes can be assigned to days.

- [x] Weekly calendar view (Mon–Sun, dinner-focused)
- [x] Recipe assignment: pick a recipe → assign to a day/meal in 1–2 clicks
- [x] Basic recipe CRUD (create, read, update, delete)
- [x] Recipe detail view (title, ingredients, instructions, tags, times)
- [x] Calendar is the default landing page on app launch
- [x] Week navigation (prev/next/today)
- [x] All meal slots: Breakfast, Snack, Lunch, Dinner, Dessert — color-coded per type

**Milestone:** ✅ User opens app → sees the week → assigns dinners from saved recipes.

---

## Phase 3 — Recipe Import ✅
**Goal:** Getting recipes into the app is fast and flexible.

- [x] URL import: paste a link → extract title, ingredients, instructions, photo
- [x] Manual entry: simple form for typing in a recipe *(completed in Phase 2)*
- [x] Recipe library: browse, search, and filter saved recipes
- [x] Handle common recipe site formats (structured data, JSON-LD, microdata)
- [x] Graceful fallback when URL parsing fails (offer manual entry)

**Milestone:** ✅ User pastes a recipe URL → recipe appears in library ready to plan.

---

## Phase 4 — Grocery List ✅
**Goal:** Planning meals produces a useful, organized shopping list.

- [x] One-tap list generation from all planned meals
- [x] Ingredient consolidation (combine duplicates with unit math)
- [x] Auto-sort by grocery store category (produce, dairy, meat, pantry, etc.)
- [x] Manual item additions (non-recipe items like paper towels)
- [x] Interactive checklist with checkboxes
- [x] Checked items move to bottom / fade out
- [x] Mobile-friendly layout (usable on phone screen via web view)

**Milestone:** ✅ User plans the week → taps "Generate List" → walks into store with organized, checkable list.

---

## Phase 5 — Polish & Advanced ✅
**Goal:** Smooth out rough edges, add nice-to-haves, package for desktop.

- [x] Photo OCR: snap a recipe card/cookbook page → extract structured recipe
- [x] AI-assisted URL import (Anthropic API for messy/non-standard pages)
- [x] Mobile optimization for shopping list view
- [x] `.dmg` packaging for MacBook Air install
- [x] Performance and UX polish pass
- [x] Error handling and edge case cleanup

**Milestone:** ✅ App is feature-complete. Run `npm run electron:build` on macOS to produce the `.dmg`.

---

## Future (Post-MVP)

- [ ] iPhone app (native or PWA)
- [ ] Recipe scaling (adjust servings → recalculate ingredients)
- [ ] Favorite/frequently-used recipes surfaced on calendar
- [ ] Leftover tracking (mark meals that produce leftovers for next-day lunch)
- [ ] Seasonal/holiday meal planning templates
