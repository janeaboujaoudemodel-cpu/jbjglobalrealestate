
# Fix: Wrong Project Data Mapping (floors, total_units, bedrooms)

## Problems Found

### 1. `floors` is actually `building_count` (WRONG)
In `reelly-api-sync/index.ts` line 89 and `reelly-backfill-projects/index.ts` line 400:
```
floors: p.building_count > 0 ? p.building_count : null
```
The Reelly API field `building_count` is the number of buildings in a development, NOT the number of floors. A 50-story tower with 1 building shows "1 Floor" on the listing, which is incorrect.

**Current data:** Almost every project shows `floors: 1` because most developments have 1 building.

### 2. `total_units` mapped from `units_count` shows wrong values
In `reelly-api-sync/index.ts` line 93 and `reelly-backfill-projects/index.ts` line 394:
```
total_units: p.units_count > 0 ? p.units_count : null
```
For many projects, `units_count` appears to be "available/remaining units" rather than the total development size. Examples: LIV Residence = 1, 1WOOD = 2. These are obviously not the total unit count for those developments.

**Fix approach:** The Reelly API does not have a separate "total units" field. `units_count` is what they provide. We should keep the mapping BUT stop displaying it when the value is suspiciously low (e.g., below 5) as it likely represents available units, not total. We should also use `building_count` for the correct column.

### 3. `bedrooms_min` / `bedrooms_max` are NULL everywhere
The sync functions never extract bedroom ranges from the `unit_types` data. Even when `unit_types` contains entries with `bedrooms: 0, 1, 2, 3`, the min/max are never calculated and stored.

## Fix Plan

### File 1: `supabase/functions/reelly-api-sync/index.ts`

**Change A:** Stop mapping `building_count` to `floors` -- map it only to `building_count`
- Line 89: Change `floors: p.building_count > 0 ? p.building_count : null` to remove `floors` entirely (it should not come from building_count)
- Keep `building_count: p.building_count > 0 ? p.building_count : null`

**Change B:** Calculate `bedrooms_min` and `bedrooms_max` from unit_types
- After extracting unit types, loop through them to find min/max bedroom values and include them in the mapped data

### File 2: `supabase/functions/reelly-backfill-projects/index.ts`

**Change A:** Stop writing `building_count` to `floors` column (line 399-402)
- Remove `updateData.floors = detail.building_count` 
- Keep `updateData.building_count = detail.building_count`

**Change B:** Calculate and save `bedrooms_min`/`bedrooms_max` from unit_types

### File 3: `supabase/functions/enrich-project-test/index.ts`

- Add `total_units`, `building_count`, `bedrooms_min`, `bedrooms_max` to the before/after snapshot so the test card shows these fields

### File 4: `src/components/project-detail/QuickFactsBar.tsx`

- Only display "Total Units" if the value is above a reasonable threshold (e.g., > 4), since very low values from Reelly likely represent available units, not total

### File 5: `src/components/project-detail/HouseDetailsSection.tsx`

- Same threshold guard for total units display

### Database Cleanup (one-time fix)

Run a data correction to:
1. **NULL out `floors`** for all Reelly-sourced projects where `floors` equals `building_count` (since the value is wrong)
2. **NULL out `total_units`** where the value is suspiciously low (1-3 units) for projects that clearly have more

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/reelly-api-sync/index.ts` | Remove `floors: building_count` mapping; add bedroom min/max calculation from unit_types |
| `supabase/functions/reelly-backfill-projects/index.ts` | Same: stop writing building_count to floors; add bedroom extraction |
| `supabase/functions/enrich-project-test/index.ts` | Add total_units/bedrooms to before/after snapshot |
| `src/components/project-detail/QuickFactsBar.tsx` | Hide "Total Units" when value is below 5 |
| `src/components/project-detail/HouseDetailsSection.tsx` | Same threshold guard |
| Database migration | NULL out incorrect `floors` values; NULL out `total_units` where value is 1-3 |

All edge functions will be redeployed after changes.
