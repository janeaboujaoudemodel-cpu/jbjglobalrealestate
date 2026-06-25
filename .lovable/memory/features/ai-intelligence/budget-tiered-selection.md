---
name: AI Home Finder Budget-Tiered Selection
description: AI Home Finder top-3 results must spread across the user's budget range (low / mid / high) so the client sees what each price tier buys, instead of clustering three picks within a narrow price band.
type: feature
---

# AI Home Finder — Budget-Tiered Selection

When the AI Home Finder returns its top 3 picks, those picks MUST be spread across the user's selected budget band:

- Compute anchor prices at the LOW (~15%), MID (50%), and HIGH (~85%) of the user's `[lo, hi]` budget range.
- For each anchor, select the closest in-range candidate from the already-ranked pool (location / property-type / bedroom hard filters from the strict scorer still apply).
- If fewer than 3 in-range candidates exist, fill from the broader ranked list (closest-to-range first).
- Return the 3 picks in ascending price order so the results page tells a clear "see what each tier buys" story.

**Why:** A 1 M vs 3 M client is two completely different ticket sizes. If the user asked for AED 1 M – 3 M, returning three picks all near 1.8 M wastes the spread and hides what 3 M buys. The product promise is "see what your money gets at every level of your budget".

**Edge cases:**
- For single-sided buckets (`under-1m`, `10m-plus`), still treat as a range and spread across it.
- If no `price_from` is available on a pick, it ranks below in-range priced picks.
- The strict priority order (Location > Budget > Bedrooms > Timeline > Preferences > Off-plan) is preserved at the candidate-ranking layer — only the final 3-of-N selection is diversified on price.

Implemented in `src/pages/Quiz.tsx` → `getTieredRecommendations` → `pickBudgetSpread`.
