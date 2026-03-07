

# Fix: AI Rating Logic — Amra-Only Override

## Problem
The current code (line 198-200 in `ProjectAIAnalyzer.tsx`) applies a 9.0 rating floor to ALL tier-1 developers. The user only wants Amra to have a hardcoded 9.0 score. All other projects should get genuine AI-evaluated ratings based on amenities, payment plan, location, price/sqft comparisons, appreciation potential, and developer brand.

## Changes

### File: `src/components/project-detail/ProjectAIAnalyzer.tsx` (lines 198-200)
- Remove the `TIER1_DEVELOPERS` array and `isTier1` check entirely
- Replace with a single project-name check: if the project name contains "amra" (case-insensitive), clamp rating to minimum 9.0
- All other projects get the raw AI-generated rating unchanged

**Before:**
```ts
const TIER1_DEVELOPERS = ["damac", "emaar", ...];
const isTier1 = developer && TIER1_DEVELOPERS.some(...);
const ratingScore = rawRating !== null ? (isTier1 && rawRating < 9.0 ? 9.0 : rawRating) : null;
```

**After:**
```ts
const isAmra = projectName?.toLowerCase().includes("amra");
const ratingScore = rawRating !== null ? (isAmra && rawRating < 9.0 ? 9.0 : rawRating) : null;
```

### File: Edge function prompt (no change needed)
The AI prompt in the edge function should already evaluate based on merit (amenities, payment plan, location, price/sqft vs competitors, appreciation, brand). The current prompt is fine — the problem was purely the client-side override.

## Files to Modify
1. `src/components/project-detail/ProjectAIAnalyzer.tsx` — 3 lines changed

