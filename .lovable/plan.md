## Problem

User picked **Dubai Hills Estate** but got matches in **Saadiyat Island (Abu Dhabi)** — a different emirate, ~2h drive away. Root cause in `src/pages/Quiz.tsx` (`getTieredRecommendations`):

- Tier 3 (`runTier(false, …)`) drops the area filter entirely, so any project from any emirate becomes eligible.
- `scoreProject` weights location by *view type* (sea / golf / city), not by the user's actual `areas` selection or emirate.
- Area filter only checks 7 hard-coded Dubai areas in `AREA_NAME_MAP`; project `emirate` field is never used as a guard.
- No closeness ranking: within a tier, results are sorted by an unrelated score, not by how close they are to the user's budget / bedrooms.

## Fix — strict priority pipeline

Rewrite `getTieredRecommendations` so matching follows the user's priority order: **Location → Budget → Bedrooms → Timeline → Payment → Preferences**.

### 1. Location becomes a hard, layered filter (never dropped)

For each project, compute a `locationTier`:

- `0` — project's area name / community matches a user-selected area (Dubai Hills, Marina, …)
- `1` — project is in the **same emirate** as the user's selected areas (e.g. user picked Dubai areas → only Dubai projects qualify)
- `2` — user picked "Other / Flexible" with no specific area → any emirate allowed
- otherwise → **excluded entirely** (this is what stops Saadiyat showing for a Dubai Hills selection)

Derive the user's target emirate(s) by mapping every selected area chip to its emirate via a new `AREA_EMIRATE_MAP` (Dubai areas → "Dubai", Saadiyat/Yas/Reem/Al Reem/Al Maryah → "Abu Dhabi", etc.). Extend `AREA_NAME_MAP` with the missing communities already used in the chip list so area-name matches don't false-negative.

Tiers 1–3 all keep the location guard; only the *closeness within* location is relaxed. Tier 4 (last-resort fallback) is removed when the user picked specific areas — if nothing matches their emirate, return an empty result with `tier: "no-location-match"` so the results page can show the existing "let's refresh your matches" empty state instead of cross-emirate recommendations.

### 2. Budget becomes #2 priority with graded closeness

Replace the binary `matchesBudget` with `budgetDistance(project)`:

- Parse the user's budget into `[minTarget, maxTarget]` (e.g. `5m-10m` → `[5_000_000, 10_000_000]`).
- If `price_from` falls inside the range → distance `0`.
- Else → normalised distance = `min(|price − minTarget|, |price − maxTarget|) / midTarget`.

Tier thresholds: Tier 1 distance ≤ 0 (in-range), Tier 2 ≤ 0.25, Tier 3 ≤ 1.0. Projects with no price are deprioritised, not excluded.

### 3. Bedrooms becomes #3 priority with graded closeness

Replace `matchesBedrooms` with `bedroomDistance(project)` = `0` if the requested bedroom count is in `[min,max]`, else the integer gap. Tiers allow `0`, `≤1`, `≤2`.

### 4. New ranking: closeness, not unrelated score

Replace the current `b.matchScore - a.matchScore` sort with a lexicographic comparator on:

```
(locationTier, budgetDistance, bedroomDistance, timelineDistance, -preferenceMatches, -isOffPlan)
```

Lower is better; off-plan preference and the existing off-plan-first rule are preserved (only ready properties are surfaced when no off-plan candidate matches the location). Sold-out / cancelled exclusion stays.

This guarantees:
- # 1 result = closest to all requirements
- # 2 = next closest
- # 3 = third closest
- Never a different emirate when the user picked specific areas.

### 5. Map / data hygiene

- Add `AREA_EMIRATE_MAP` next to `AREA_NAME_MAP` covering every chip option offered in the quiz.
- Fall back to substring scan on `project.location` + `project.emirate` + `project.area_name` when DB rows lack a clean emirate column.

## Out of scope

- No DB schema changes, no migrations.
- No UI/styling changes — results page already renders whatever `Quiz.tsx` hands it.
- No changes to the scoring tooltip / `MatchCriteriaTable` headers (already location-first).

## Files

- `src/pages/Quiz.tsx` — extend `AREA_NAME_MAP`, add `AREA_EMIRATE_MAP`, rewrite `getTieredRecommendations` per above.

## Verification

1. Re-run the user's scenario: areas = Dubai Hills Estate, budget = 5m–10m, 3BR → expect only Dubai Hills (or other Dubai) projects; **no Saadiyat / Abu Dhabi**.
2. Areas = Saadiyat → expect only Abu Dhabi projects.
3. Areas = "Other / Flexible" → cross-emirate allowed, ranked by budget closeness.
4. Off-plan-first rule still holds (Ready only appears when no off-plan match exists in-emirate).
5. Sold-out / cancelled still excluded.
