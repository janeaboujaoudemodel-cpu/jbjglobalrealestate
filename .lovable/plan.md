

# Fix "Backfill All" — Force Re-fetch for All Projects

## Root Cause

All 1,795 projects already have `detail_fetched_at` set (not NULL). The backfill edge function (`reelly-backfill-projects`) filters by `detail_fetched_at IS NULL` on line 212, so it always finds 0 projects to process.

The edge function already has a `force_refresh` parameter (line 94, 210-213) that skips this filter, but the UI never sends it.

## Fix

### File: `src/components/listing-admin/ReellyImportPanel.tsx`

**Change 1** (line ~715): When calling the edge function, pass `force_refresh: true` when mode is "all":

```
// Current (broken)
body: { mode: "batch", batch_size: 50 }

// Fixed
body: { mode: "batch", batch_size: 50, force_refresh: mode === "all" }
```

This single change makes "Backfill All" re-fetch detail data for every project, while the regular "Backfill" button still only processes projects that were never fetched.

## Technical Details

- The edge function already supports `force_refresh` — it removes the `detail_fetched_at IS NULL` filter when true (lines 210-213)
- All update logic already handles overwriting existing data
- No edge function changes needed — only the UI call needs updating
- One line change in one file
