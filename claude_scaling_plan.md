# kDOUGH Scaling Plan

## Current Uncompleted Roadmap Items (Post-MVP)

From the ROADMAP.md "Future" section:

| Item | Status |
|------|--------|
| iPhone app (native or PWA) | Not started |
| Recipe scaling (adjust servings, recalculate ingredients) | Not started |
| Favorite/frequently-used recipes surfaced on calendar | Not started |
| Leftover tracking (mark meals that produce leftovers for next-day lunch) | Not started |
| Seasonal/holiday meal planning templates | Not started |

---

## Competitive Landscape Summary

Researched 15+ competitors (Mealime, Paprika, Eat This Much, Plan to Eat, SideChef, Samsung Food, Cooklist, BigOven, MealPrepPro, AnyList, Prepear, Ollie, eMeals, Fitia, MealBoard). Here's what matters:

### What kDOUGH already does well that competitors charge for:
- URL import with AI fallback (most apps have unreliable clipping)
- Photo OCR for cookbook pages (almost no one does this)
- 5 meal slots per day with color coding (most only do 3-4)
- Clean, fast grocery list generation with category sorting
- One-click recipe-to-calendar assignment
- No subscription — you own it

### What's missing that users expect (table stakes gaps):
- No dietary preference / allergy filtering
- No nutritional information on recipes
- No recipe scaling
- No shared/collaborative lists
- No built-in recipe database (users start from zero)

---

## Feature Recommendations — Ranked by Impact

### Tier 1 — "Nobody Does This Well" (Highest differentiation)

**1. Cascade Meal Planning (Leftover Intelligence)**
Sunday's roast chicken becomes Monday's chicken tacos becomes Tuesday's chicken soup. The app understands that cooking 6 servings when you need 4 creates 2 servings of leftovers, and it plans the week around these transformations. No app does this. Every competitor treats each day as independent.

**2. "Use It Before You Lose It" — Pantry + Expiration-Aware Planning**
Track what's in your fridge/pantry with expiration dates. The app prioritizes recipes that use ingredients about to expire. "Your spinach expires in 2 days — here's a spinach and chicken stir-fry for Tuesday." Cooklist, NoWaste, and Samsung Food each do a piece of this, but nobody combines pantry tracking + expiration awareness + meal plan generation in one flow.

**3. Batch Cooking Mode with Prep Timeline**
A dedicated "Meal Prep Sunday" mode that generates a unified cooking schedule: "10:00 — Start rice. 10:05 — While rice cooks, chop vegetables for meals 1, 3, and 4. 10:15 — Start chicken in oven." Plus container/portion guidance and storage labels. MealPrepPro targets this audience but doesn't generate the timeline. This is a huge underserved community.

**4. Adaptive Scheduling ("Life Happens" Mode)**
When you skip a planned meal, the app asks what happened (eating out? too tired? leftovers?) and automatically reschedules the skipped recipe to later in the week, adjusts the grocery list for items you've already bought, and suggests a quick alternative for tonight. No app handles real-life disruptions gracefully.

### Tier 2 — "Would Make Users Stay Forever" (Strong retention)

**5. Recipe Scaling**
Already on your roadmap. This is expected by every user. Adjust servings, ingredients recalculate automatically. Table stakes.

**6. Cooking Skill Progression**
Tag recipes by difficulty. Track what techniques the user has cooked. Gradually suggest slightly harder recipes. "You've mastered sauteing — this week, try braising." Turns kDOUGH from a utility into a personal cooking coach. Nobody does this.

**7. Smart Ingredient Reuse Across the Week**
When planning the week, prefer recipes that share ingredients. If Tuesday needs cilantro, Wednesday's recipe should also use cilantro. This reduces waste and lowers the grocery bill. Ollie does a basic version of this, but it could be much smarter with AI.

**8. Household Profiles with Taste Learning**
Different family members have different preferences. Track what each person liked/disliked. Find meals at the intersection. "Everyone liked the last 3 pasta dishes but the stir-fry was rejected by 2 of 4 members — here's a new pasta recipe." Nobody solves multi-person optimization well.

### Tier 3 — "Table Stakes to Compete" (Expected features)

**9. Dietary Preferences & Allergy Filtering**
Set once during onboarding, apply everywhere. Keto, vegetarian, gluten-free, nut-free, etc. Every competitor has this.

**10. Basic Nutritional Info**
Calories and macros per recipe. Users expect this. Can be estimated from ingredients using a nutrition API or AI.

**11. Favorites / Frequently Used Recipes**
Already on your roadmap. Surface recipes you cook most often at the top of the picker. Simple but high-impact.

**12. Offline Mode**
Paprika's biggest advantage. Recipes stored locally so they work in kitchens with weak WiFi and stores with no reception. Your Electron app already works offline-ish, but the web/PWA version should too.

### Tier 4 — "Future Vision" (Moonshot features)

**13. Voice-Guided Cooking Mode**
Hands-free step-by-step cooking. Only SideChef does this. Extremely useful when your hands are covered in flour.

**14. Grocery Delivery Integration**
Connect to Instacart/Amazon Fresh. Go from meal plan to delivered groceries without leaving the app.

**15. Real Budget Tracking with Local Store Prices**
Show the actual cost of this week's meal plan at your local store. Nobody does this accurately.

---

## Recommended Next Phase Priority

If building the next version of kDOUGH with the goal of millions of downloads, prioritize:

1. **Recipe scaling** — Quick win, users expect it, already on your roadmap
2. **Cascade meal planning** — Nobody does this, it's genuinely innovative, and it solves a real daily problem
3. **Dietary preferences & allergy filtering** — Table stakes, needed to compete
4. **Batch cooking mode with prep timeline** — Massive underserved audience (meal prep community)
5. **PWA/iPhone support** — Already on your roadmap, needed for app store distribution

The combo of cascade meal planning + batch cooking mode would give kDOUGH a positioning that no competitor has: **"The app that actually understands how real people cook."** Every other app treats meals as independent events. kDOUGH would be the first to treat the week as a connected cooking system.
