

# Fix Backfill: Fake Progress and Infinite Loop

## Problem

The backfill function queries for projects where `floor_plan_types IS NULL OR amenities IS NULL`. The Reelly API returns **zero amenities and zero floor plans** for nearly all projects. So the function:

1. Fetches 50 projects missing amenities/floor_plans
2. Calls the Reelly API for each one
3. Successfully updates other fields (prices, descriptions, cover images)
4. But amenities and floor_plans stay NULL because the API returns empty arrays
5. Next batch: the SAME projects get selected again (they still have null amenities)
6. Result: 250 "updated" but remaining stays at 1,795 forever

## Solution

### 1. Add a `detail_fetched_at` column to `projects` table

This timestamp marks that the Reelly API detail endpoint has been called for this project, regardless of whether it returned amenities/floor plans. This prevents infinite re-selection.

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS detail_fetched_at timestamptz;
```

### 2. Fix the edge function query logic

**File:** `supabase/functions/reelly-backfill-projects/index.ts`

- Change the batch query from filtering by `floor_plan_types.is.null OR amenities.is.null` to filtering by `detail_fetched_at.is.null`
- After processing each project (success or not), set `detail_fetched_at = now()`
- This ensures each project is only processed ONCE
- The "remaining" count uses the same `detail_fetched_at IS NULL` filter, so it correctly decreases

Changes to the query (around line 205-213):
```
// OLD: .or("floor_plan_types.is.null,amenities.is.null")
// NEW: .is("detail_fetched_at", null)
```

Changes to `updateProjectWithDetails` (around line 470):
```
// Always set detail_fetched_at regardless of what data was found
updateData.detail_fetched_at = new Date().toISOString();
```

Changes to remaining count query (around line 236-240):
```
// OLD: .or("floor_plan_types.is.null,amenities.is.null")
// NEW: .is("detail_fetched_at", null)
```

Changes to stats mode (around line 130-134):
```
// missing_any should use detail_fetched_at IS NULL
```

### 3. Fix the frontend remaining calculation

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

The frontend aggregation at line 669-674 correctly takes `remaining` from the edge function response. Once the edge function returns accurate remaining counts, no frontend change is needed. However, update the stats display to show "Not yet fetched" instead of "Missing amenities" since the real issue is unfetched details, not missing amenities.

### 4. Set empty arrays instead of leaving NULL

In `updateProjectWithDetails`, when the API returns no amenities/floor plans, set empty arrays `[]` instead of leaving the fields null. This provides honest data -- "we checked and there are none" vs "we never checked":

```typescript
// Always set these, even if empty, to indicate we checked
updateData.floor_plan_types = floorPlans; // could be []
updateData.amenities = amenities.length > 0 ? amenities : [];
```

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `detail_fetched_at` column |
| `supabase/functions/reelly-backfill-projects/index.ts` | Use `detail_fetched_at` for queries; always set it after processing; set empty arrays for missing data |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Update stats labels to reflect "unfetched" vs "missing" |

## Expected Result

- Backfill processes each project exactly once
- "Remaining" decreases by batch size after each batch
- After full backfill: remaining = 0
- Numbers add up: processed + remaining = total
- Projects with genuinely no amenities get `amenities = []` (empty array, not null)

