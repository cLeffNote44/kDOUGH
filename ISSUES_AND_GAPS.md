# Issues and Gaps

Comprehensive list of known issues, ordered by priority. Context: **single-user to start**, with **App Store launch** planned later. Items marked **Pre-launch** should be addressed before public release.

---

## Critical (Fix Now)

### 1. No input validation on server actions
**Location:** `app/src/lib/actions.ts`  
**Risk:** Invalid/malicious data can reach the database. Critical for App Store (data integrity + security).  
**Fix:** Add Zod schemas to validate `FormData` and object inputs before DB operations.

### 2. AI response parsing can fail silently
**Location:** `app/src/lib/import/ai-assist.ts`  
**Risk:** Claude may return JSON wrapped in markdown code blocks or with extra text; `JSON.parse(text)` throws and returns `null`. Import fails without helpful error.  
**Fix:** Strip markdown fences, extract JSON block, add try/catch with retry or user-facing fallback.

### 3. Object URL memory leak in import page
**Location:** `app/src/app/(authenticated)/import/page.tsx`  
**Risk:** `URL.createObjectURL(file)` is never revoked. Repeated photo uploads leak memory.  
**Fix:** Call `URL.revokeObjectURL(photoPreviewUrl)` in `resetState`, `handleSave`, and cleanup effect.

### 4. RecipeForm uses module-level key counter
**Location:** `app/src/components/recipes/RecipeForm.tsx`  
**Risk:** `nextKey` persists across mounts/HMR; can cause key collisions or stale keys.  
**Fix:** Use `useId()` or `crypto.randomUUID()` for stable, unique keys.

### 5. Grocery list optimistic updates don't revert on error
**Location:** `app/src/components/grocery/GroceryListView.tsx`  
**Risk:** If `toggleGroceryItem` or `removeGroceryItem` fails, UI stays updated but DB is out of sync.  
**Fix:** Check action result and revert optimistic state on error; show error message.

---

## Important (Fix Soon)

### 6. README references magic link auth
**Location:** `README.md`  
**Risk:** Confusion — auth was switched to email/password.  
**Fix:** Update Supabase redirect URL section to reflect email/password; remove magic-link-specific instructions.

### 7. assignRecipeToDay relies on DB for user_id
**Location:** `app/src/lib/actions.ts`  
**Risk:** Upsert doesn't pass `user_id`; depends on trigger/default. Works today but fragile for multi-user future.  
**Fix:** Explicitly pass `user_id` from session for clarity and future-proofing.

### 8. deleteRecipe / removeRecipeFromDay have no ID validation
**Location:** `app/src/lib/actions.ts`  
**Risk:** Malformed UUIDs or empty strings could cause odd behavior.  
**Fix:** Validate IDs (Zod `z.string().uuid()`) before DB calls.

---

## Pre-Launch (Before App Store)

### 9. No automated tests
**Risk:** Regressions go unnoticed. App Store review and users expect stability.  
**Fix:** Add unit tests for parser, scraper; integration tests for server actions; E2E for critical flows (plan → generate → shop).

### 10. No rate limiting on import APIs
**Location:** `app/src/app/api/recipes/import/route.ts`, `app/src/app/api/recipes/photo/route.ts`  
**Risk:** Single user now, but once public, endpoints are exposed to abuse and AI cost spikes.  
**Fix:** Add rate limiting (e.g., per-user or per-IP) before launch.

### 11. Error boundary could be more helpful
**Location:** `app/src/app/error.tsx`  
**Risk:** Generic "Something went wrong" is unhelpful for support.  
**Fix:** Log errors (e.g., to console or error service); consider optional error reporting for App Store builds.

### 12. No offline handling
**Risk:** Grocery list on phone in-store needs network. Single user on home Wi‑Fi is fine; App Store users may shop in low-connectivity areas.  
**Fix:** Consider PWA/service worker for grocery list caching (lower priority).

---

## Nice to Have

### 13. Scraper timeout is hardcoded
**Location:** `app/src/lib/import/scraper.ts`  
**Fix:** Make 15s timeout configurable via env var.

### 14. saveImportedRecipe doesn't validate recipe shape
**Location:** `app/src/lib/actions.ts`  
**Fix:** Add Zod schema for imported recipe object.

### 15. RecipePicker click-outside closes on backdrop
**Location:** `app/src/components/calendar/RecipePicker.tsx`  
**Note:** Clicking the dark overlay closes the modal; some users expect "Cancel" only. Consider UX review.

---

## Summary Checklist

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1 | Input validation (Zod) | Critical | ✅ |
| 2 | AI response parsing robustness | Critical | ✅ |
| 3 | Object URL memory leak | Critical | ✅ |
| 4 | RecipeForm key handling | Critical | ✅ |
| 5 | Grocery optimistic update errors | Critical | ✅ |
| 6 | README auth docs | Important | ✅ |
| 7 | assignRecipeToDay user_id | Important | ✅ |
| 8 | ID validation for delete actions | Important | ✅ |
| 9 | Automated tests | Pre-launch | ✅ |
| 10 | Rate limiting on import APIs | Pre-launch | ✅ |
| 11 | Error boundary improvements | Pre-launch | ✅ |
| 12 | Offline handling | Nice | ⬜ |
| 13 | Configurable scraper timeout | Nice | ⬜ |
| 14 | saveImportedRecipe validation | Nice | ✅ |
| 15 | RecipePicker UX | Nice | ⬜ |
| 16 | SSRF protection on import endpoint | Critical | ✅ |
| 17 | Security headers (CSP, XFO, etc.) | Important | ✅ |
| 18 | User ownership checks (defense-in-depth) | Critical | ✅ |
| 19 | Error message sanitization | Important | ✅ |
| 20 | Image URL sanitization in scraper | Important | ✅ |
| 21 | Env var validation at startup | Important | ✅ |
