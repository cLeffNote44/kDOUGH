# Technical Decisions

Non-obvious choices and the reasoning behind them. Updated as decisions are made.

---

## 001 — Next.js with App Router (not Pages Router)

**Decision:** Use the App Router (`src/app/`) introduced in Next.js 13+.

**Why:** App Router is the current recommended approach from the Next.js team. It supports React Server Components out of the box, which simplifies data fetching from Supabase. Layout nesting keeps the weekly calendar persistent while navigating to recipe details. For a new project with no legacy code, there's no reason to use the older Pages Router.

**Trade-off:** Some community examples and tutorials still reference Pages Router, so we may occasionally need to adapt code snippets.

---

## 002 — Supabase over Firebase or a custom backend

**Decision:** Use Supabase for auth, database, and real-time.

**Why:** Supabase provides a Postgres database (relational, great for recipe-ingredient relationships), built-in auth, and a generous free tier. The JS client is lightweight and works well with Next.js. For a single-user app, Supabase's free tier will never be outgrown. Firebase would work too, but Firestore's document model is a worse fit for relational recipe data.

**Trade-off:** Less flexibility than a fully custom backend, but we don't need that flexibility. The goal is speed of development.

---

## 003 — Ingredients stored as JSONB, not a separate table

**Decision:** Store ingredients as a JSONB array on the `recipes` table rather than normalizing into a separate `ingredients` table.

**Why:** Recipes are the unit of authoring — when you add a recipe, you write all the ingredients at once. JSONB keeps the recipe as a single document, which simplifies CRUD and avoids N+1 queries when loading recipe details. Grocery list generation can still iterate over the JSONB array in application code.

**Trade-off:** Querying across ingredients (e.g., "show me all recipes that use chicken") requires JSONB operators instead of simple JOINs. This is acceptable because cross-recipe ingredient search is not a core workflow feature.

---

## 004 — Single-user auth (not multi-tenant)

**Decision:** Build for exactly one user account. No teams, no sharing, no roles.

**Why:** This app is for one household. Adding multi-tenancy would complicate the schema, auth flow, and every query with user scoping. Supabase auth is still used (for security and because it's easy), but there's no need for user management beyond a single login.

**Trade-off:** If the app ever needs to support multiple users, significant refactoring will be required. That's an acceptable future cost — build for the actual use case today.

---

## 005 — Five meal slots per day, all visible

**Decision:** The weekly calendar shows 5 meal slots per day: Breakfast, Snack, Lunch, Dinner, and Dessert — all visible and color-coded.

**Why:** (Updated from the original dinner-first design.) After UI upgrades, showing all 5 slots provides a complete picture of the week. Color coding (sky=breakfast, violet=snack, emerald=lunch, amber=dinner, rose=dessert) keeps slots visually distinct without clutter. The inline expansion pattern keeps each slot compact until tapped.

**Trade-off:** More visual density on the home screen, but color coding and compact defaults keep it manageable.

---

## 006 — Category-based grocery list sorting

**Decision:** Auto-sort grocery items by store section (produce, dairy, meat, pantry, frozen, bakery, etc.) rather than alphabetically or by recipe.

**Why:** The grocery list exists to make shopping faster. Sorting by store section means you walk through the store once without backtracking. Alphabetical sorting looks tidy but doesn't match how a store is laid out.

**How:** Each ingredient gets a `category` field assigned during import/parsing. A lookup table maps common ingredients to categories. Unknown ingredients default to "Other."

**Trade-off:** The category mapping won't be perfect for every store layout. A future enhancement could let the user customize category order.

---

## 007 — AI is server-side and import-only

**Decision:** The Anthropic API is used only on the server during recipe import. It is not a user-facing feature.

**Why:** AI adds real value when a recipe URL has messy HTML that basic scraping can't parse. But adding a chatbot, AI meal suggestions, or AI-generated recipes would bloat the app and distract from the core workflow. The user doesn't need to know AI is involved — it should just mean recipe imports work more often.

**Trade-off:** This limits AI's impact, but keeps the app focused. AI features can be expanded later if there's a clear use case.

---

## 008 — TypeScript from day one

**Decision:** Use TypeScript throughout the project.

**Why:** Type safety catches bugs early, especially around recipe data structures (ingredients with quantity/unit/name), meal plan assignments, and grocery list generation. The small upfront cost of writing types pays off immediately in a project with structured data flowing between multiple components.

**Trade-off:** Slightly more verbose than plain JavaScript. Worth it.

---

## 009 — Claude Sonnet for AI-Assisted Import (not Haiku, not Opus)

**Decision:** Use `claude-sonnet-4-20250514` for both URL fallback and photo OCR.

**Why:** Sonnet is the sweet spot — fast enough for a near-real-time import flow (~5-10 seconds), smart enough to parse messy HTML and read handwritten recipe cards. Haiku would be cheaper but less reliable on complex pages. Opus would be overkill and slower for this structured extraction task.

**Trade-off:** ~$0.003-0.01 per import. Acceptable for a meal planning app that imports a handful of recipes per week.

---

## 010 — Electron for Desktop Packaging (not Tauri, not PWA)

**Decision:** Use Electron with electron-builder for the `.dmg` installer.

**Why:** Electron is battle-tested for wrapping web apps as desktop apps. The app already runs as a Next.js web server; Electron just wraps it in a native window with the standalone output. electron-builder handles `.dmg` creation with drag-to-Applications layout out of the box.

**Trade-off:** Electron bundles Chromium (~150MB), making the app larger than a Tauri alternative. For a single-user app on a MacBook Air with plenty of storage, this is fine. Tauri would be smaller but adds Rust compilation complexity.

---

## 011 — Next.js Standalone Output for Electron Bundling

**Decision:** Set `output: "standalone"` in `next.config.ts`.

**Why:** Standalone output produces a self-contained `server.js` that can run without the full `node_modules`. This is critical for Electron packaging — we bundle the standalone folder into the app resources and run it as a subprocess. Without standalone mode, we'd need to bundle the entire `node_modules` directory.

---

## 012 — Server Actions instead of REST API Routes

**Decision:** Use Next.js Server Actions (`"use server"`) for all data mutations instead of building REST API route handlers.

**Why:** Server Actions eliminate the boilerplate of defining routes, parsing request bodies, and returning JSON responses. They provide end-to-end type safety with TypeScript — the client component calls a function with typed arguments and gets a typed return value. For a single-user app with simple CRUD operations, REST endpoints would add complexity with no benefit.

**What remains as API routes:** Only two endpoints use traditional route handlers: `/api/recipes/import` (needs request body streaming for URL scraping) and `/api/recipes/photo` (needs `FormData` parsing for file upload). These are read-only extraction endpoints — they don't write to the database.

**Trade-off:** Server Actions are tightly coupled to Next.js. If the app ever migrated away from Next.js, the mutation layer would need rewriting. This is acceptable because the entire app is built around Next.js conventions.

---

## 013 — Tailwind-only Styling (no component library)

**Decision:** Use Tailwind CSS utility classes directly on HTML elements. No component library (shadcn/ui, Radix, Headless UI, etc.).

**Why:** The app has a small number of UI patterns (cards, buttons, inputs, modals). Extracting these into a component library would add dependency weight and abstraction overhead without reducing total code. Tailwind's utility classes keep styles co-located with markup, making the visual output immediately readable from the source code.

**Trade-off:** Some visual consistency relies on developer discipline (e.g., always using `rounded-lg`, `border-stone-200`, `text-amber-700`). A component library would enforce consistency through shared components. For a single-developer project, this trade-off is fine.

---

_More decisions will be added as the project progresses._
