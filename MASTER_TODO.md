# kDOUGH — Master TODO List

Compiled from a full audit of all project documentation and source code.
Last updated: 2026-03-20

---

## 1. Pre-Launch Blockers (Fix Before Any Public Release)

### ~~1A. Automated Tests~~ ✅ DONE
**Source:** ISSUES_AND_GAPS.md #9, TODO.md backlog
**Completed:** 2026-03-20
Vitest framework set up with 142 passing tests across 5 test files:
- [x] Unit tests for `parser.ts` — 64 tests (ingredient parsing, unicode fractions, unit normalization, quantity parsing/formatting, category mapping)
- [x] Unit tests for `scraper.ts` — 26 tests (JSON-LD extraction, @graph arrays, ISO 8601 duration, image URL sanitization, HTML stripping, heuristic extraction)
- [x] Unit tests for `dates.ts` — 12 tests (getMonday for every weekday via fake timers, toDateString edge cases, getCurrentWeekStart)
- [x] Unit tests for `validations.ts` — 35 tests (all Zod schemas, coercion, transforms, boundary values)
- [x] Unit tests for `rate-limit.ts` — 5 tests (under/over limit, key isolation, reset, window expiry)
- [ ] Integration tests for server actions (createRecipe, assignRecipeToDay, generateGroceryList)
- [ ] E2E test: plan a week → generate list → check items off
- [ ] E2E test: import recipe from URL → save → assign to calendar

### ~~1B. Rate Limiting on Import APIs~~ ✅ DONE
**Source:** ISSUES_AND_GAPS.md #10, TODO.md backlog
**Completed:** 2026-03-20
New `lib/rate-limit.ts` — sliding-window in-memory rate limiter with periodic cleanup.
- [x] `/api/recipes/import` — 10 requests/hour per user, 429 + Retry-After header
- [x] `/api/recipes/photo` — 5 requests/hour per user (AI calls are expensive)

### ~~1C. Error Boundary Improvements~~ ✅ DONE
**Source:** ISSUES_AND_GAPS.md #11
**Completed:** 2026-03-20
Upgraded `error.tsx`:
- [x] `console.error` logging with message, digest, stack, timestamp, URL
- [x] Error ID display (digest) for support reference
- [x] Warning illustration (SVG)
- [x] More helpful copy + "Go home" link alongside "Try again"

### 1D. Code Signing & Notarization
**Source:** TODO.md backlog
**Status:** Not started — requires Apple Developer certificate (manual step on macOS)
The `.dmg` is unsigned. macOS blocks it on first launch.
- [ ] Obtain an Apple Developer certificate
- [ ] Configure electron-builder for code signing
- [ ] Add notarization step to the build pipeline
- [ ] Update README to remove the Gatekeeper workaround section once signed

---

## ~~2. UI Polish Audit~~ ✅ ALL DONE (2026-03-20)

### ~~2A. MobileHeader Uses `<Link>` Instead of `router.push()`~~ ✅ DONE
Replaced `<Link href="/">` with a `<button>` using `router.push("/") + router.refresh()`. Removed unused `Link` import.

### ~~2B. Missing `force-dynamic` on Grocery Page~~ ✅ DONE
Added `export const dynamic = "force-dynamic"` to grocery page.

### ~~2C. Missing `force-dynamic` on Import Page~~ ✅ N/A
Client component (`"use client"`), so `force-dynamic` has no effect. Already client-rendered.

### ~~2D. RecipePicker Header Shows Raw Meal Type Key~~ ✅ DONE
Added inline capitalization: `mealType.charAt(0).toUpperCase() + mealType.slice(1)`.

### ~~2E. Keyboard Shortcut for Import Missing~~ ✅ DONE
Added `i` → `/import` in KeyboardShortcuts.tsx and ShortcutHelpModal.tsx.

### ~~2F. No "Today" Button on Calendar~~ ✅ DONE
Added "Today" button between Prev/Next, only visible when `!isCurrentWeek`.

### ~~2G. Calendar Day Card Date Format~~ ✅ DONE
DayCard now shows month abbreviation on the 1st of the month and on Mondays (e.g., "Mar 17").

### ~~2H. Empty Calendar Week — No CTA~~ ✅ DONE
Added empty state banner when `mealPlans.length === 0`: "No meals planned this week yet. Tap an empty slot below to start adding recipes."

### ~~2I. RecipeDetailModal — Missing Image~~ ✅ DONE
Added recipe image display at top of modal when `image_url` exists, with `onError` fallback to hide broken images.

### ~~2J. Grocery List — Week Navigation Placement~~ ✅ DONE (Reviewed)
WeekNav already has prev/next/this-week buttons in a clear layout. No changes needed.

### ~~2K. Login Page — No Loading Skeleton~~ ✅ DONE
Added `width`/`height` attributes and `bg-stone-100 dark:bg-stone-800` background to prevent layout shift while icon loads.

### ~~2L. Recipe Card — No Fallback for Missing Image~~ ✅ DONE
RecipeCard already had a letter-initial fallback. Added `onError` handler so broken `image_url` links gracefully fall back to the placeholder too.

### ~~2M. Ingredient List Key Uses Array Index~~ ✅ DONE
Changed key from `i` to `` `${ing.name}-${ing.quantity}-${i}` `` for stable composite keys.

### ~~2N. Accessibility: Missing `aria-label` on Several Buttons~~ ✅ DONE
Added `aria-label` to: MealSlot remove button, MealSlot expand overlay, RecipeDetailModal close, RecipePicker close, ShortcutHelpModal close.

### ~~2O. Confirmation Dialog — No Escape Key Support~~ ✅ DONE
Added `useEffect` + `useCallback` Escape key handler to WeeklyCalendar's confirmation dialog.

### ~~2P. Dark Mode Glass Transparency~~ ✅ DONE
Increased dark mode glass opacity from 0.6→0.7 (glass) and 0.82→0.88 (glass-strong) for better readability.

### ~~2Q. PullToRefresh — setTimeout for Completion~~ ✅ DONE
Reduced refresh timeout from 1000ms to 600ms for snappier feel.

---

## ~~3. Functional Improvements (High Impact)~~ ✅ ALL DONE (2026-03-20)

### ~~3A. Recipe Scaling~~ ✅ DONE
New files: `lib/scale-recipe.ts`, `components/ServingsAdjuster.tsx`, `components/recipes/ScalableIngredients.tsx`
- [x] ServingsAdjuster (+/−) on both RecipeDetailModal and recipe detail page
- [x] Proportional ingredient scaling using `parseQuantity`/`formatQuantity`
- [x] "Scaled from X to Y" indicator when servings differ from original

### ~~3B. Favorites / Frequently Used Recipes~~ ✅ DONE
New files: `components/recipes/FavoriteButton.tsx`
DB migration: `add_is_favorite_to_recipes` (boolean column on recipes table)
- [x] Heart toggle on recipe cards (image overlay) and recipe detail page header
- [x] Optimistic UI with `useTransition` + server action `toggleFavorite`
- [x] Favorites sorted first in RecipePicker modal with heart icon indicator
- [x] Recipes page sorted favorites-first then by created_at

### ~~3C. Offline Mode / PWA Service Worker~~ ✅ DONE
New files: `public/sw.js`, `components/OfflineIndicator.tsx`, `components/ServiceWorkerRegistration.tsx`
- [x] Service worker: cache-first for static assets, network-first with cache fallback for pages
- [x] Cache fallback to home page for navigation requests when offline
- [x] Offline indicator banner ("You're offline — showing cached data")
- [x] SW registration in authenticated layout

### ~~3D. Configurable Scraper Timeout~~ ✅ DONE
- [x] Timeout now reads `process.env.SCRAPER_TIMEOUT_MS` (defaults to 15000)

### ~~3E. RecipePicker Click-Outside Behavior~~ ✅ DONE (Reviewed)
- [x] Click-outside-to-close is consistent with RecipeDetailModal and all other modals
- [x] Escape key also closes — UX is already good, no changes needed

---

## ~~4. Architecture & Code Quality~~ ✅ ALL DONE (2026-03-20)

### ~~4A. ARCHITECTURE.md — Component List Is Outdated~~ ✅ DONE
Fully rewrote the components section with all 36 components organized by directory: nav/ (4), calendar/ (8), recipes/ (7), grocery/ (5), dashboard/ (1), ui/ (2), plus 7 top-level components.

### ~~4B. ARCHITECTURE.md — Missing `public/` Assets~~ ✅ DONE
Updated public/ listing with all 8 files: favicons, PWA icons, manifest.json, sw.js.

### ~~4C. ARCHITECTURE.md — Missing `lib/validations.ts`~~ ✅ DONE
Added `validations.ts`, `rate-limit.ts`, and `scale-recipe.ts` to the lib section. Updated scraper.ts description to mention configurable timeout.

### ~~4D. ThemeProvider Uses localStorage~~ ✅ DONE (Noted)
No code change needed — just a note for future SSR work. ThemeProvider is protected as a client component.

### ~~4E. Duplicate Sign-Out Logic~~ ✅ DONE
New file: `components/nav/sign-out.ts` — shared `signOut(router)` helper. Both Sidebar and MobileHeader now import and use it, removing duplicate `createClient()` + `signOut()` + `push("/login")` code.

---

## 5. Future Features (Post-MVP Roadmap)

From `claude_scaling_plan.md` and `ROADMAP.md`, ranked by impact:

### Tier 1 — Highest Differentiation
- [ ] **Cascade Meal Planning** — Leftover-aware planning across the week
- [ ] **Pantry + Expiration Tracking** — "Use it before you lose it"
- [ ] **Batch Cooking Mode** — Unified prep timeline for meal prep day
- [ ] **Adaptive Scheduling** — Graceful handling of skipped meals

### Tier 2 — Strong Retention
- [ ] **Cooking Skill Progression** — Difficulty tags + gradual challenge increase
- [ ] **Smart Ingredient Reuse** — Prefer recipes sharing ingredients across the week
- [ ] **Household Profiles** — Multi-person taste learning

### Tier 3 — Table Stakes
- [ ] **Dietary Preferences & Allergy Filtering** — Set once, apply everywhere
- [ ] **Basic Nutritional Info** — Calories and macros per recipe
- [ ] **iPhone App** — Native or PWA for mobile distribution
- [ ] **Seasonal/Holiday Templates** — Pre-built meal plan templates

### Tier 4 — Moonshot
- [ ] **Voice-Guided Cooking** — Hands-free step-by-step
- [ ] **Grocery Delivery Integration** — Instacart / Amazon Fresh
- [ ] **Budget Tracking** — Real costs from local store prices

---

## Summary by Priority

| Priority | Done | Remaining | Categories |
|----------|------|-----------|------------|
| Pre-launch blockers | 3 | 1 | ~~Tests~~ ✅, ~~rate limiting~~ ✅, ~~error boundary~~ ✅, code signing |
| UI polish fixes | 17 | 0 | ~~All done~~ ✅ — navigation, accessibility, consistency, empty states |
| Functional improvements | 5 | 0 | ~~All done~~ ✅ — scaling, favorites, offline, scraper config, picker UX |
| Code quality | 5 | 0 | ~~All done~~ ✅ — docs updates, deduplication, architecture sync |
| Future features | 0 | 14 | Cascade planning, pantry, batch cooking, dietary, etc. |
| **Total** | **30** | **15** | |
