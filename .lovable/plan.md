
# Fix Three Issues: Merged Developer, Map Zoom, and Backfill

## Issue 1: Delete Fake Merged Developer "Adventz and East and West International Group"

This is the same problem as before — two separate developers merged into one fake record.

- **Fake record**: "Adventz and East and West International Group" (id: `4425c3eb`)
- **Real developer**: "East and West International Group" (id: `78d6d963`) already exists
- **Affected project**: "The St. Regis Residences" (id: `526e9967`) — reassign to the real developer

**Database fix (SQL):**
```sql
UPDATE projects 
SET developer_name = 'East and West International Group'
WHERE id = '526e9967-56c8-4289-89e3-767db9eeda71';

DELETE FROM developers 
WHERE id = '4425c3eb-9cf2-481a-8627-6fbb980a695b';
```

---

## Issue 2: Enable Two-Finger Pinch Zoom on Maps

Currently all maps have `scrollWheelZoom={false}`. The user wants:
- Drag with one finger / mouse = pan (already works)
- Pinch with two fingers = zoom in/out

Fix: Change `scrollWheelZoom` to `true` in all three map components:

| File | Line |
|---|---|
| `src/components/project-detail/ProjectLocationMap.tsx` | 198 |
| `src/pages/PropertyMap.tsx` | 453 |
| `src/components/developer/DeveloperProjectsMap.tsx` | 128 |

---

## Issue 3: Fix Backfill — "remaining" Always Returns 0

**Root cause**: In the edge function `reelly-backfill-projects/index.ts`, lines 236-240, the `remainingCount` query always filters by `detail_fetched_at IS NULL` even when `force_refresh` is true. Since all 1,795 projects already have `detail_fetched_at` set, remaining = 0, and the UI loop stops after one batch.

**Fix**: When `force_refresh` is true, count ALL projects with a reelly_id (not just those with null `detail_fetched_at`).

```
// Lines 236-240 — current (broken for force_refresh)
.not("reelly_id", "is", null)
.is("detail_fetched_at", null);

// Fixed: skip the null filter when force_refresh is true
.not("reelly_id", "is", null)
// only add .is("detail_fetched_at", null) when !forceRefresh
```

Also need to subtract already-processed projects from the remaining count. The edge function should track an offset or use `detail_fetched_at` ordering to avoid re-processing the same batch. Add `.order("detail_fetched_at", { ascending: true, nullsFirst: true })` to the main query so it processes least-recently-fetched projects first, and use the batch's last `detail_fetched_at` as a cursor.

**Simpler approach**: Since `force_refresh` re-sets `detail_fetched_at` on each processed project, the remaining count will naturally decrease if we count projects with `detail_fetched_at < job_start_time`. This way each batch moves forward.

Edge function changes:
1. Accept a `started_at` timestamp parameter
2. When `force_refresh`, filter projects where `detail_fetched_at < started_at` (not yet refreshed in this run)
3. Count remaining with the same filter

UI change in `ReellyImportPanel.tsx`:
- Pass `started_at: new Date().toISOString()` when starting backfill
- This timestamp stays constant for the entire run, ensuring proper progress tracking

## Files to Modify

| File | Change |
|---|---|
| Database (SQL) | Delete fake merged developer, reassign project |
| `src/components/project-detail/ProjectLocationMap.tsx` | `scrollWheelZoom={true}` |
| `src/pages/PropertyMap.tsx` | `scrollWheelZoom={true}` |
| `src/components/developer/DeveloperProjectsMap.tsx` | `scrollWheelZoom: true` |
| `supabase/functions/reelly-backfill-projects/index.ts` | Fix remaining count for force_refresh using `started_at` cursor |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Pass `started_at` timestamp to backfill calls |
