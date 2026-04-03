# TODO

Active work tracking. Updated at the start and end of every working session.

---

## Done (Phases 1–5: Core Build) ✅

All core features are implemented and working:

- Infrastructure (Next.js + TypeScript + Tailwind + Supabase + Electron)
- Email/password auth (sign-in + sign-up)
- Recipe CRUD with search and tag filtering
- Weekly calendar with 5 meal slots per day (breakfast, snack, lunch, dinner, dessert)
- Recipe import (URL scraping + photo OCR via Anthropic Claude)
- Grocery list generation with category sorting
- Interactive shopping checklist with optimistic UI
- `.dmg` packaging via electron-builder

See `CHANGELOG.md` for full phase-by-phase history.

---

## Done (Code Quality Pass) ✅

- [x] Fix README setup instructions (app/ subdirectory path)
- [x] Fix `.gitignore` pattern (was catching `.env.example`)
- [x] Fix error boundary (don't expose raw error messages)
- [x] Fix electron-builder (remove duplicate file bundling)
- [x] Add URL protocol validation (restrict to http/https)
- [x] Clean up `electron/main.js` comments (remove Fix #N references)
- [x] Fix WeeklyCalendar.tsx (import types from `@/types` instead of redefining)
- [x] Extract shared `getMonday()` to `lib/dates.ts` (was duplicated in 3 files)
- [x] Fix RecipeForm ingredient list keys (stable keys instead of array index)
- [x] Fix import page (use server action instead of client-side Supabase insert)
- [x] Fix `assignRecipeToDay` race condition (upsert with fallback)
- [x] Consolidate `normalizeUnit` / `parseQuantity` (moved to `parser.ts`)
- [x] Add grocery list week navigation (was locked to current week)
- [x] Add loading.tsx skeletons for all authenticated routes
- [x] Add favicon (SVG) and remove create-next-app boilerplate SVGs
- [x] Rewrite ARCHITECTURE.md to match actual codebase
- [x] Update DECISIONS.md, TODO.md

---

## Done (UI Upgrades — 25 items) ✅

All 25 UI upgrades completed. See `UI Upgrades.md` for the full checklist.

---

## Done (Security & Hardening Pass) ✅

- [x] Add `requireAuth()` helper and user ownership checks to all server actions
- [x] Add SSRF protection (private IP blocking) to recipe import endpoint
- [x] Sanitize all error messages returned to clients
- [x] Add security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] Add image URL sanitization in scraper (block javascript:/data: schemes)
- [x] Add env var validation at startup (`lib/env.ts`)
- [x] Fix unsafe type cast in `generateGroceryList`
- [x] Fix silent "dinner" fallback on invalid meal type
- [x] Fix date validation (reject invalid dates like "2025-13-45")
- [x] Fix null safety on `plan.recipes` in WeeklyCalendar
- [x] Add error handling to RecipePicker fetch and assign
- [x] Fix Electron standalone path mismatch (`outputFileTracingRoot`)
- [x] Rewrite `electron/main.js` with resilient path resolution

---

## Done (Pre-Launch Hardening) ✅

- [x] Automated tests — Vitest setup with 142 tests across 5 files (parser, scraper, dates, validations, rate-limit)
- [x] Rate limiting on import API endpoints (10/hr URL, 5/hr photo, per user)
- [x] Error boundary improvements (logging, error ID, navigation, illustration)

---

## Backlog (Post-MVP)

- [ ] Recipe scaling (adjust servings → recalculate ingredients)
- [ ] Favorite/frequently-used recipes surfaced on calendar
- [ ] iPhone app (native or PWA)
- [ ] Leftover tracking (mark meals that produce leftovers for next-day lunch)
- [ ] Code signing and notarization for macOS distribution
- [ ] Offline mode / PWA service worker for grocery list

---

## Notes

- 5 meal slots per day: breakfast, snack, lunch, dinner, dessert (color-coded).
- Keep the UI dead simple. The user is not technical.
- Single user, single household. No multi-tenancy needed.
- All scripts run from the `app/` directory.
