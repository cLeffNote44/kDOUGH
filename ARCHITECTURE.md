# Architecture

Folder structure, data flow, and key components.

---

## Folder Structure

```
kDOUGH/
├── README.md
├── ROADMAP.md
├── CHANGELOG.md
├── ARCHITECTURE.md
├── DECISIONS.md
│
└── app/                            # All application code lives here
    ├── package.json
    ├── next.config.ts               # output: "standalone" for Electron
    ├── tsconfig.json
    ├── postcss.config.mjs           # Tailwind CSS v4 via PostCSS
    ├── eslint.config.mjs
    ├── .env.local                   # Supabase keys (not committed)
    ├── .env.example                 # Template for env vars
    │
    ├── electron/
    │   └── main.js                  # Electron main process (port detection,
    │                                #   splash screen, standalone server launch,
    │                                #   process cleanup)
    │
    ├── public/
    │   ├── favicon-16.png           # 16px favicon
    │   ├── favicon-32.png           # 32px favicon
    │   ├── icon-192.png             # PWA icon (192px)
    │   ├── icon-512.png             # PWA icon (512px)
    │   ├── apple-touch-icon.png     # iOS home screen icon
    │   ├── icon.jpeg                # Source icon
    │   ├── manifest.json            # PWA manifest
    │   └── sw.js                    # Service worker (offline caching)
    │
    └── src/
        ├── middleware.ts             # Auth session refresh + redirects
        │
        ├── app/                     # Next.js App Router
        │   ├── layout.tsx           # Root layout (Geist font, viewport meta)
        │   ├── error.tsx            # Global error boundary
        │   ├── not-found.tsx        # Custom 404 page
        │   ├── globals.css          # Tailwind v4 import + font theme
        │   │
        │   ├── login/
        │   │   └── page.tsx         # Email/password auth (sign-in + sign-up)
        │   │
        │   ├── auth/
        │   │   └── callback/
        │   │       └── route.ts     # Auth code exchange
        │   │
        │   ├── (authenticated)/     # Route group — all pages require auth
        │   │   ├── layout.tsx       # Nav + main wrapper
        │   │   ├── loading.tsx      # Skeleton for home page
        │   │   ├── page.tsx         # Home → weekly meal calendar
        │   │   │
        │   │   ├── recipes/
        │   │   │   ├── page.tsx     # Recipe library (search + tag filter)
        │   │   │   ├── loading.tsx  # Skeleton for recipe grid
        │   │   │   ├── new/
        │   │   │   │   └── page.tsx # Add recipe form
        │   │   │   └── [id]/
        │   │   │       ├── page.tsx # Recipe detail view
        │   │   │       └── edit/
        │   │   │           └── page.tsx # Edit recipe form
        │   │   │
        │   │   ├── import/
        │   │   │   └── page.tsx     # Import recipe (URL or photo)
        │   │   │
        │   │   └── grocery/
        │   │       ├── page.tsx     # Grocery list (week-navigable)
        │   │       └── loading.tsx  # Skeleton for grocery list
        │   │
        │   └── api/
        │       └── recipes/
        │           ├── import/
        │           │   └── route.ts # POST: scrape recipe from URL
        │           └── photo/
        │               └── route.ts # POST: OCR recipe from photo
        │
        ├── components/
        │   ├── Nav.tsx                  # Composite: renders Sidebar + MobileHeader + BottomTabBar
        │   ├── nav/
        │   │   ├── Sidebar.tsx          # Desktop side nav (72px, icon-only)
        │   │   ├── MobileHeader.tsx     # Mobile sticky top bar with logo + actions
        │   │   ├── BottomTabBar.tsx     # Mobile bottom tab navigation
        │   │   └── NavIcons.tsx         # Shared SVG icon components
        │   ├── ThemeProvider.tsx         # Dark/light mode context (cookie + localStorage)
        │   ├── SessionGuard.tsx         # Client-side auth session management
        │   ├── KeyboardShortcuts.tsx    # Global keyboard shortcuts (w/r/g/n/i/?)
        │   ├── ShortcutHelpModal.tsx    # Keyboard shortcut help overlay
        │   ├── PullToRefresh.tsx        # Mobile pull-to-refresh gesture
        │   ├── OnboardingModal.tsx      # 3-step first-run onboarding flow
        │   ├── OfflineIndicator.tsx     # Offline status banner
        │   ├── ServiceWorkerRegistration.tsx # PWA service worker registration
        │   ├── ServingsAdjuster.tsx     # +/− servings stepper control
        │   ├── calendar/
        │   │   ├── WeeklyCalendar.tsx   # 7-day grid + week nav + drag-and-drop
        │   │   ├── DayCard.tsx          # Single day column with 5 meal slots
        │   │   ├── MealSlot.tsx         # Individual meal slot (filled/empty)
        │   │   ├── MealSlotExpanded.tsx  # Expanded slot with action buttons
        │   │   ├── RecipePicker.tsx     # Modal: search + assign recipe to day
        │   │   ├── RecipeDetailModal.tsx # Full recipe view modal with scaling
        │   │   ├── WeekSummaryBar.tsx   # Week progress bar (filled/total slots)
        │   │   └── meal-types.ts        # Meal type config (colors, labels, 5 types)
        │   ├── recipes/
        │   │   ├── RecipeForm.tsx        # Shared new/edit form
        │   │   ├── RecipeCard.tsx        # Recipe grid card with image + favorite
        │   │   ├── RecipeSearch.tsx      # Search bar + tag filter pills
        │   │   ├── DeleteRecipeButton.tsx # Two-step delete confirmation
        │   │   ├── FavoriteButton.tsx    # Heart toggle (optimistic UI)
        │   │   ├── ScalableIngredients.tsx # Client wrapper for ingredient scaling
        │   │   └── QuickAddFAB.tsx       # Floating "+" button for adding recipes
        │   ├── grocery/
        │   │   ├── GroceryListView.tsx   # Category-grouped checklist with sort modes
        │   │   ├── GenerateButton.tsx    # Generate/regenerate from meal plan
        │   │   ├── AddItemForm.tsx       # Manual item addition
        │   │   ├── WeekNav.tsx           # Prev/Next/This Week navigation
        │   │   └── SwipeableItem.tsx     # Swipe-to-delete grocery item
        │   ├── dashboard/
        │   │   └── StatsCards.tsx        # Home page stats overview
        │   └── ui/
        │       ├── Toaster.tsx           # Sonner toast wrapper
        │       └── EmptyStateIllustrations.tsx # SVG illustrations for empty states
        │
        ├── lib/
        │   ├── actions.ts           # All Server Actions (recipe CRUD, favorites,
        │   │                        #   meal plan, grocery list generation)
        │   │                        #   All actions use requireAuth() + user_id filters
        │   ├── dates.ts             # Shared week/date utilities
        │   ├── env.ts               # Startup env var validation
        │   ├── validations.ts       # Zod schemas for input validation
        │   ├── rate-limit.ts        # In-memory sliding-window rate limiter
        │   ├── scale-recipe.ts      # Proportional ingredient scaling
        │   ├── supabase/
        │   │   ├── client.ts        # Browser Supabase client
        │   │   ├── server.ts        # Server Supabase client (cookies)
        │   │   └── middleware.ts    # Session refresh middleware
        │   └── import/
        │       ├── scraper.ts       # 3-tier: JSON-LD → HTML heuristics → AI
        │       │                    #   Image URL sanitization; fetches via safeFetch
        │       │                    #   Timeout configurable via SCRAPER_TIMEOUT_MS env var
        │       ├── ssrf.ts          # SSRF guard + safeFetch: blocks private/internal
        │       │                    #   IPs, re-validating on every redirect hop.
        │       │                    #   Shared by scraper.ts and the import API route.
        │       ├── parser.ts        # Ingredient parsing, unit normalization,
        │       │                    #   category mapping (100+ ingredients)
        │       └── ai-assist.ts     # Anthropic Claude (tool-use) for URL fallback + photo OCR
        │
        └── types/
            └── index.ts             # Canonical types: Ingredient, Recipe,
                                     #   MealPlan, GroceryList, GroceryItem
```

---

## Database Schema

### `recipes`

| Column       | Type        | Notes                                   |
|-------------|-------------|-----------------------------------------|
| id          | uuid (PK)   | Auto-generated                          |
| user_id     | uuid (FK)   | References auth.users, set by RLS       |
| title       | text        | Required                                |
| description | text        | Optional short summary                  |
| ingredients | jsonb       | Array of {name, quantity, unit} objects  |
| instructions| text        | Free-form cooking instructions          |
| image_url   | text        | URL for recipe photo                    |
| source_url  | text        | Original URL if imported                |
| servings    | integer     | Default number of servings              |
| prep_time   | integer     | Minutes (optional)                      |
| cook_time   | integer     | Minutes (optional)                      |
| tags        | text[]      | Optional tags for filtering             |
| is_favorite | boolean     | Default false, user-toggleable          |
| created_at  | timestamptz | Auto-set                                |
| updated_at  | timestamptz | Auto-updated                            |

### `meal_plans`

| Column     | Type        | Notes                                    |
|-----------|-------------|------------------------------------------|
| id        | uuid (PK)   | Auto-generated                           |
| user_id   | uuid (FK)   | References auth.users, set by RLS        |
| recipe_id | uuid (FK)   | References recipes.id                    |
| date      | date        | The calendar day                         |
| meal_type | text        | 'breakfast', 'snack', 'lunch', 'dinner', 'dessert' |
| created_at| timestamptz | Auto-set                                 |

### `grocery_lists`

| Column      | Type        | Notes                                  |
|------------|-------------|----------------------------------------|
| id         | uuid (PK)   | Auto-generated                         |
| user_id    | uuid (FK)   | References auth.users, set by RLS      |
| week_start | date        | Monday of the planned week             |
| created_at | timestamptz | Auto-set                               |
| updated_at | timestamptz | Auto-updated                           |

### `grocery_items`

| Column      | Type        | Notes                                   |
|------------|-------------|-----------------------------------------|
| id         | uuid (PK)   | Auto-generated                          |
| list_id    | uuid (FK)   | References grocery_lists.id             |
| name       | text        | Ingredient name (normalized)            |
| quantity   | numeric     | Combined quantity                       |
| unit       | text        | Measurement unit                        |
| category   | text        | Store section (produce, dairy, etc.)    |
| checked    | boolean     | Default false                           |
| recipe_ids | uuid[]      | Which recipes need this item            |
| is_manual  | boolean     | True if user-added (not from recipe)    |
| created_at | timestamptz | Auto-set                                |

---

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│  Recipe      │     │  Meal Plan   │     │  Grocery List  │     │  Shopping   │
│  Library     │────▶│  Calendar    │────▶│  Generator     │────▶│  Checklist  │
│              │     │              │     │                │     │             │
│ - URL import │     │ - Weekly view│     │ - Consolidate  │     │ - Checkboxes│
│ - Photo OCR  │     │ - Click to   │     │ - Categorize   │     │ - Progress  │
│ - Manual add │     │   assign     │     │ - Manual adds  │     │ - Week nav  │
└─────────────┘     └──────────────┘     └────────────────┘     └─────────────┘
```

### Key Flows

1. **Recipe Import:** URL → `scraper.ts` (JSON-LD / HTML / AI fallback) → preview → `saveImportedRecipe` server action → Supabase `recipes` table
2. **Photo Import:** Photo upload → `/api/recipes/photo` → Claude Vision OCR → preview → `saveImportedRecipe` server action
3. **Meal Planning:** Click empty day → RecipePicker modal → select recipe → `assignRecipeToDay` server action → `meal_plans` table
4. **List Generation:** `generateGroceryList` server action → query `meal_plans` for week → join `recipes` → aggregate ingredients → categorize → write to `grocery_items`
5. **Shopping:** Load `grocery_items` → render category-grouped checklist → `toggleGroceryItem` server action on tap

---

## Server Actions (not REST APIs)

All mutations use Next.js Server Actions (`"use server"` in `lib/actions.ts`) instead of REST API route handlers. The only API routes are the two import endpoints that require request body processing (URL scraping, file upload).

| Action                  | Purpose                              |
|------------------------|--------------------------------------|
| `createRecipe`         | Create recipe from form              |
| `updateRecipe`         | Update recipe from form              |
| `deleteRecipe`         | Delete recipe by ID                  |
| `saveImportedRecipe`   | Save imported recipe (URL or photo)  |
| `toggleFavorite`       | Toggle recipe favorite status        |
| `assignRecipeToDay`    | Assign recipe to calendar slot       |
| `removeRecipeFromDay`  | Remove recipe from calendar          |
| `moveRecipeToSlot`     | Drag-and-drop move meal to new slot  |
| `generateGroceryList`  | Generate grocery list from meal plan |
| `toggleGroceryItem`    | Check/uncheck grocery item           |
| `addManualGroceryItem` | Add non-recipe item to list          |
| `removeGroceryItem`    | Delete grocery item                  |

---

## Electron Packaging

The app is packaged as a macOS `.dmg` using electron-builder:

1. `next build` produces a standalone server in `.next/standalone/`
2. electron-builder copies `electron/main.js` into the app and the standalone output into `extraResources`
3. At runtime, `main.js` finds a free port, spawns the standalone server using Electron's bundled Node.js (`ELECTRON_RUN_AS_NODE=1`), shows a splash screen, then loads `http://localhost:{port}` in a BrowserWindow
4. Process cleanup handlers ensure the Next.js subprocess is killed on all exit paths
