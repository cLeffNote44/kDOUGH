# Changelog

Running log of what got done and when. Most recent entries first.

---

## 2026-03-14 — Security & Hardening Pass

### Added
- **SSRF protection on recipe import** — DNS-based private IP blocking in `/api/recipes/import`. Resolves hostnames before fetching and rejects requests to private/internal networks (127.x, 10.x, 169.254.x, cloud metadata endpoints, etc.).
- **Security headers** — `next.config.ts` now returns `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` on all routes.
- **Environment variable validation** — New `lib/env.ts` validates required env vars at startup with helpful error messages.
- **Image URL sanitization** — `sanitizeImageUrl()` in `scraper.ts` blocks `javascript:`, `data:`, and other non-HTTP schemes from scraped recipe images.
- **`requireAuth()` helper** — Centralized auth check in `actions.ts` for consistent authentication across all server actions.

### Fixed
- **User ownership checks on all server actions** — Every mutation now verifies the authenticated user owns the resource via `user_id` filters (defense-in-depth beyond RLS).
- **Grocery item ownership verification** — `toggleGroceryItem` and `removeGroceryItem` now verify the item's list belongs to the current user.
- **Error message sanitization** — All raw `error.message` returns replaced with generic user-facing messages. Debug info logged to `console.error`.
- **Unsafe type cast in generateGroceryList** — Replaced `as unknown as` double cast with safe runtime property checking.
- **Silent dinner fallback** — Invalid meal types now return an error instead of silently defaulting to "dinner".
- **Date validation** — `assignRecipeToDay` validates with `Date` object, catching invalid dates like "2025-13-45".
- **WeeklyCalendar null safety** — `plan.recipes?.title` with "Untitled" fallback prevents crashes on null recipe joins.
- **RecipePicker & WeeklyCalendar error handling** — Fetch, assign, and remove operations now have try/catch with error toasts.
- **Electron standalone path mismatch** — `outputFileTracingRoot: process.cwd()` flattens standalone build. Rewrote `electron/main.js` with resilient path resolution.
- **Photo import error message** — Removed `.env.local` file reference, replaced with generic guidance.

### Files changed
- `app/src/lib/actions.ts` — Major security rewrite
- `app/src/lib/env.ts` — New file
- `app/src/app/api/recipes/import/route.ts` — SSRF protection
- `app/src/app/api/recipes/photo/route.ts` — Error message fix
- `app/src/lib/import/scraper.ts` — Image URL sanitization
- `app/src/components/calendar/WeeklyCalendar.tsx` — Null safety, error handling
- `app/src/components/calendar/RecipePicker.tsx` — Error handling
- `app/src/app/layout.tsx` — Imports env validation
- `app/next.config.ts` — Security headers, outputFileTracingRoot
- `app/electron/main.js` — Resilient path resolution

---

## 2026-03-12 — UI Upgrades (25 items)

### Added
- **Glassmorphism design system** — Frosted-glass cards with `backdrop-blur`
- **Dark mode** — Full dark mode toggle with smooth transitions and cookie persistence
- **Display font** — Outfit for headings, Geist for body
- **Bottom tab bar (mobile)** — Persistent bottom navigation
- **Sidebar navigation (desktop)** — Slim icon sidebar
- **Bento grid dashboard** — Stats blocks alongside weekly calendar
- **Drag & drop meals** — Between days and meal slots
- **Visual meal indicators** — Prep time badges
- **Week summary bar** — Meals planned progress indicator
- **Animated toast notifications** — Sonner-powered feedback
- **Shimmer skeleton loading** — Improved loading animations
- **Recipe card images** — Image support on cards and calendar
- **Quick-add FAB** — Floating action button for recipe creation
- **Swipe-to-check (mobile)** — Swipe gestures for grocery items
- **Aisle grouping icons** — Category icons on grocery sections
- **Smart sort toggle** — Category/alphabetical/recipe grouping
- **Onboarding flow** — 3-step guided tour
- **Empty state illustrations** — Custom illustrations
- **Pull-to-refresh** — Native gesture for mobile/PWA
- **Keyboard shortcuts** — Power-user shortcuts

See `UI Upgrades.md` for the full 25-item checklist.

---

## 2026-03-07 — Issues & Gaps Pass

### Added
- **ISSUES_AND_GAPS.md** — Comprehensive list of known issues, prioritized for single-user → App Store path.
- **Zod validation** — `lib/validations.ts` with schemas for recipe form, imported recipe, UUIDs, meal types.
- **Input validation on all server actions** — createRecipe, updateRecipe, deleteRecipe, saveImportedRecipe, assignRecipeToDay, removeRecipeFromDay, toggleGroceryItem, addManualGroceryItem, removeGroceryItem now validate inputs and return clear errors.

### Fixed
- **AI response parsing** — `ai-assist.ts` now strips markdown code blocks and extracts JSON robustly; handles Claude returning ```json...``` or extra text.
- **Object URL memory leak** — Import page revokes `URL.createObjectURL` in resetState, handleSave, and a cleanup effect.
- **RecipeForm key handling** — Replaced module-level `nextKey` with `crypto.randomUUID()` for stable React list keys.
- **Grocery optimistic updates** — Toggle and remove now revert on server error and show error message.
- **assignRecipeToDay** — Explicitly passes `user_id` from session; validates recipeId, mealType, date; fallback delete uses user_id.
- **README** — Updated Supabase auth section for email/password (removed magic link wording).

### Files changed
- `ISSUES_AND_GAPS.md` — New file.
- `app/src/lib/validations.ts` — New file.
- `app/src/lib/actions.ts` — Zod validation, UUID/mealType validation, user_id in meal plan.
- `app/src/lib/import/ai-assist.ts` — `parseAiRecipeJson` helper, safe type coercion.
- `app/src/app/(authenticated)/import/page.tsx` — Object URL revocation.
- `app/src/components/recipes/RecipeForm.tsx` — UUID keys instead of nextKey.
- `app/src/components/grocery/GroceryListView.tsx` — Error handling and revert for optimistic updates.
- `README.md` — Auth setup section.

---

## 2026-03-07 — Auth Overhaul

### Changed
- **Login switched from magic link to email/password** — Login page now has Email and Password fields with a "Sign in" button. No more waiting for email magic links.
- **Sign-up flow added** — "Don't have an account? Sign up" toggle on the login page lets new users create an account with email/password. After sign-up, user is prompted to confirm email then sign in.

### Files changed
- `app/src/app/login/page.tsx` — Rewrote: `signInWithOtp()` replaced with `signInWithPassword()` and `signUp()`. Added password field, sign-up toggle, and success state.

---

## 2026-03-07 — Navigation & Caching Fixes

### Fixed
- **Recipes tab required double-click to load** — First click showed "No recipes yet" due to Next.js client-side router cache serving stale server component data. Fixed by replacing `<Link>` nav components with programmatic `router.push()` + `router.refresh()` to force fresh server renders on every navigation.
- **Recipe title changes not propagating to calendar** — `updateRecipe` server action now calls `revalidatePath("/")` so the home page picks up title changes immediately.
- **All authenticated pages could serve stale data** — Added `export const dynamic = "force-dynamic"` to home page, recipes list, and recipe detail page.

### Files changed
- `app/src/components/Nav.tsx` — Nav links changed from `<Link>` to `<button>` with `router.push()` + `router.refresh()`.
- `app/src/lib/actions.ts` — Added `revalidatePath("/")` to `updateRecipe`.
- `app/src/app/(authenticated)/page.tsx` — Added `force-dynamic`.
- `app/src/app/(authenticated)/recipes/page.tsx` — Added `force-dynamic`.
- `app/src/app/(authenticated)/recipes/[id]/page.tsx` — Added `force-dynamic`.

---

## 2026-03-07 — Weekly Calendar: All Meal Types

### Added
- **5 meal slots per day** — Every day now supports Breakfast, Snack, Lunch, Dinner, and Dessert (in that order).
- **Color-coded meal types** — Each type has a distinct color family: Breakfast (sky/blue), Snack (violet), Lunch (emerald/green), Dinner (amber), Dessert (rose/pink).
- **Recipe detail modal** — Clicking a filled meal slot shows the full recipe (ingredients, instructions, tags, times, source link) in a modal overlay instead of opening the recipe picker.
- **"Change recipe" flow** — From the recipe detail modal, a "Change recipe" button transitions to the recipe picker.
- **Remove confirmation dialog** — Clicking the x button on a meal slot now asks "Remove [recipe] from [day] [meal]?" with Cancel and Remove buttons instead of deleting immediately.

### Fixed
- **x button not responding on filled meal slots** — The transparent "change recipe" overlay (`absolute inset-0`) was sitting on top of the x button and intercepting clicks. Fixed by adding `z-10` to the x button.

### Files changed
- `app/src/types/index.ts` — `MealPlan.meal_type` union expanded: added `"snack"` and `"dessert"`.
- `app/src/components/calendar/WeeklyCalendar.tsx` — Major rewrite: `MEAL_TYPES` constant defines all 5 types with labels and Tailwind color classes. Each day card renders all 5 slots. Added state for `pickerMealType`, `confirmRemove`, and `detailPlan`. Three modals: confirm remove, recipe detail, recipe picker.
- `app/src/components/calendar/RecipePicker.tsx` — New `mealType` prop passed to `assignRecipeToDay()`. Modal header shows meal type name.
- `app/src/components/calendar/RecipeDetailModal.tsx` — New file. Full recipe detail overlay with "Change recipe" button.

---

## 2026-03-07 — Branding & Electron Fixes

### Changed
- **Renamed app from KaitohDough to kDOUGH** — Updated all branding: page titles, Nav header, login page, Electron window title, and manifest files.
- **New app icon** — Replaced placeholder icon with custom kDOUGH bread-heart icon across all sizes (favicon, PWA icons, Electron).

### Fixed
- **Login error not displayed** — `signInWithOtp` was not wrapped in try/catch; network errors crashed silently. Added error handling with user-visible error message.
- **Electron splash screen icon broken** — `<img>` tag used `file://` protocol which Chromium blocks from `data:` URLs. Fixed by embedding the icon as a base64 data URI.

### Files changed
- `app/src/app/layout.tsx` — Title updated to "kDOUGH".
- `app/src/components/Nav.tsx` — Brand name updated.
- `app/electron/main.js` — Splash screen icon fixed with base64 data URI. Window title updated.
- `app/public/` — New icon files at all sizes.

---

## 2026-03-06 — Phase 5 Complete: Polish & Advanced

- **AI-assisted URL import**: When basic scraping (JSON-LD, HTML heuristics) fails, the scraper now falls back to Claude Sonnet via the Anthropic API. Sends cleaned page HTML to the model, which returns structured recipe JSON.
- **Photo OCR recipe import**: New "From Photo" tab on the import page. Upload a photo of a recipe card, cookbook page, or screenshot → Claude Vision reads and extracts structured recipe data. API route at `/api/recipes/photo`.
- **`ai-assist.ts` module**: Shared AI logic — `aiExtractFromHtml()` for URL fallback, `aiExtractFromImage()` for photo OCR, `isAiAvailable()` to check for API key.
- **Import page redesign**: Tabbed UI (URL / Photo) with shared preview and save flow. Photo tab has drag-and-drop style file picker with camera icon. Loading states show spinner and explain AI processing time.
- **Mobile-responsive navigation**: Hamburger menu on small screens (`sm:` breakpoint). Links stack vertically with larger tap targets (py-2.5). Sign out moves into mobile menu.
- **Mobile-responsive calendar**: Grid changes from 7-col → 4-col → 2-col on smaller screens. Remove buttons always visible on mobile (no hover). Slightly reduced min-height.
- **Mobile-optimized grocery list**: Entire row is tappable (not just checkbox). Larger checkboxes (w-6 h-6). Bigger text (15px). Remove button uses SVG icon. Always visible on mobile, hover-reveal on desktop. Added bottom padding for thumb reach.
- **Sticky nav**: Nav is now `sticky top-0 z-50` so it stays visible while scrolling.
- **Global error boundary** (`error.tsx`): Catches render errors with "Try again" button.
- **Not-found page** (`not-found.tsx`): Custom 404 with "Go home" link.
- **Viewport meta**: Proper mobile viewport config, Apple web app capable meta tags.
- **Electron packaging setup**:
  - `electron/main.js`: Main process that starts Next.js standalone server and opens a BrowserWindow. macOS-native title bar with traffic lights. External links open in default browser.
  - `package.json`: Added `electron:dev` (dev mode), `electron:build` (`.dmg`), `electron:build:dir` (unpacked).
  - `electron-builder` config: arm64 + x64 universal, `.dmg` with drag-to-Applications layout, extraResources bundles the Next.js standalone output.
  - `next.config.ts`: Set `output: "standalone"` for Electron bundling.
- Installed `@anthropic-ai/sdk`, `electron`, `electron-builder`.
- All TypeScript compiles clean (zero errors).

**The app is feature-complete for MVP.** Ready to build `.dmg` on a macOS machine with `npm run electron:build`.

---

## 2026-03-06 — Phase 4 Complete: Grocery List

- Built grocery list generation server action (`lib/actions.ts`):
  - `generateGroceryList(weekStart)` — queries meal_plans for a week, joins recipe ingredients, aggregates duplicates by name+unit, categorizes by store section, writes to grocery_lists/grocery_items
  - Ingredient consolidation: normalizes units (e.g. "cups" → "cup", "tablespoons" → "tbsp"), parses mixed fractions (1 1/2), sums quantities across recipes
  - Deletes and regenerates if list already exists for the week
  - Tracks which recipe_ids contributed each item
- Built `toggleGroceryItem`, `addManualGroceryItem`, `removeGroceryItem` server actions
- Built `GroceryListView` component:
  - Items grouped by store category (produce → meat → dairy → bakery → frozen → pantry → spices → other)
  - Interactive checkboxes with optimistic UI updates
  - Checked items move to a faded "Done" section at the bottom
  - Progress bar showing items checked vs remaining
  - Remove button (×) on hover for manual items
- Built `AddItemForm` component:
  - Text input for adding non-recipe items (paper towels, snacks, etc.)
  - Auto-categorizes using existing CATEGORY_MAP
  - Optimistic UI — item appears immediately
- Built `GenerateButton` component:
  - Shows "Generate from Plan" or "Regenerate List" based on existing list state
  - Loading state while generating
  - Error display (e.g. "No meals planned for this week")
- Rewrote grocery page (`/grocery`) as server component:
  - Fetches current week's grocery list from Supabase
  - Shows week date range header
  - Renders GroceryListView with all items
  - Empty state with instructions when no list exists
  - Mobile-friendly layout (max-w-lg centered)
- All TypeScript files compile clean (zero errors)

**Next session:** Phase 5 — Polish & Advanced (Photo OCR, AI-assisted import, .dmg packaging).

---

## 2026-03-06 — Phase 3 Complete: Recipe Import

- Built recipe scraper (`lib/import/scraper.ts`):
  - **JSON-LD extraction** (primary strategy) — parses schema.org/Recipe structured data
  - **HTML heuristic fallback** — tries common CSS selectors from popular recipe sites (WPRM, microdata, generic patterns)
  - Handles images, servings, prep/cook time, and ISO 8601 duration parsing
  - 15-second fetch timeout, proper User-Agent header for compatibility
- Built ingredient parser (`lib/import/parser.ts`):
  - Parses raw strings like "2 cups flour" → `{ quantity: "2", unit: "cups", name: "flour" }`
  - Handles unicode fractions (½, ¼, ⅓), mixed numbers (1 1/2), decimals
  - Recognizes 50+ common units (volume, weight, count)
  - Strips bullet points, parenthetical notes, leading numbers
  - Includes **grocery category mapping** (100+ ingredients → produce/dairy/meat/pantry/spices/frozen/bakery)
- Built URL import API route (`/api/recipes/import`):
  - POST endpoint, auth-protected
  - Returns scraped recipe data as JSON for preview
- Built import page (`/import`):
  - Paste URL → click Import → see preview with title, ingredients, instructions, image
  - "Save to Library" button saves directly to Supabase
  - Error state links to manual entry as fallback
  - Accessible from nav bar and recipes page
- Updated recipes page with **search and filter**:
  - Text search by recipe title (server-side `ilike` query)
  - Tag filter pills (click to toggle)
  - Result count and "clear filters" link
  - "Import URL" button alongside "Add Recipe"
- Added `RecipeSearch` component for client-side search form
- Nav bar updated: added "Import" link between Recipes and Grocery List
- All 26 TypeScript source files compile clean (zero errors)

**Next session:** Phase 4 — Grocery list generation.

---

## 2026-03-06 — Phase 2 Complete: Meal Planning

- Built full recipe CRUD:
  - **RecipeForm** component shared between create and edit (ingredients managed as dynamic list)
  - New recipe page (`/recipes/new`) with form → saves to Supabase → redirects to detail
  - Recipe detail view (`/recipes/[id]`) showing all fields, tags, times, source link
  - Edit recipe page (`/recipes/[id]/edit`) pre-populated with existing data
  - Delete with inline confirmation (two-step: "Delete" → "Yes, delete" / "Cancel")
- Built server actions (`lib/actions.ts`):
  - `createRecipe`, `updateRecipe`, `deleteRecipe` — full recipe lifecycle
  - `assignRecipeToDay` — assigns a recipe to a date+meal slot (replaces existing)
  - `removeRecipeFromDay` — removes a meal plan entry
- Built calendar interaction:
  - Click empty day → opens **RecipePicker** modal with searchable recipe list
  - Click planned day → opens picker to change the recipe
  - Hover over planned meal → shows × button to remove
  - Recipe assignment happens in 2 clicks: click day → click recipe
- Added **week navigation**:
  - Previous / Next week buttons
  - "Today" button appears when viewing a non-current week
  - URL-driven via `?week=YYYY-MM-DD` search param
- Created shared TypeScript types (`types/index.ts`) for Recipe, MealPlan, GroceryList, GroceryItem
- All files pass TypeScript type check (zero errors)

**Next session:** Phase 3 — Recipe import from URL.

---

## 2026-03-06 — Phase 1 Complete: Core Infrastructure

- Initialized Next.js project (TypeScript, Tailwind CSS, App Router, ESLint)
- Created Supabase project **kDOUGH** (org: cLeffNote Productions, region: us-east-1)
- Designed and applied database schema via migrations:
  - `recipes` — title, ingredients (JSONB), instructions, image, source URL, servings, times, tags
  - `meal_plans` — recipe assignment to date + meal type, unique constraint per slot
  - `grocery_lists` — week-based list container
  - `grocery_items` — name, quantity, unit, category, checked state, manual flag
  - Row Level Security enabled on all tables (authenticated users only)
  - Auto-updating `updated_at` trigger with secure search path
- Built Supabase client integration:
  - Browser client (`lib/supabase/client.ts`)
  - Server client (`lib/supabase/server.ts`)
  - Middleware for session refresh and route protection (`middleware.ts`)
- Implemented magic link auth:
  - Login page with email input and "check your email" confirmation
  - Auth callback route (`/auth/callback`) for code exchange
  - Middleware redirects: unauthenticated → login, authenticated → home
- Created app shell:
  - Authenticated layout with navigation bar (This Week, Recipes, Grocery List)
  - Weekly calendar home page — fetches meal plans from Supabase, 7-day grid, today highlight
  - Recipes listing page — grid of recipe cards with empty state
  - Grocery list placeholder page
- TypeScript compiles clean (zero errors)
- Fixed security advisory: set search_path on trigger function (migration 002)

---

## 2026-03-06 — Project Kickoff

- Created project folder (`kDOUGH/`) on Desktop
- Authored all six living documentation files
- Defined database schema: `recipes`, `meal_plans`, `grocery_lists`, `grocery_items`
- Documented core data flow: recipe import → calendar planning → list generation → shopping
