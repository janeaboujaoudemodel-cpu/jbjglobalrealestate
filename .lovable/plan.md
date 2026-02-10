
# Fix Listing Admin: Backfill and Enrichment Pipeline

## Root Cause

The buttons appear "not working" because:

1. **Backfill Missing Details** shows 0 projects to process -- all 1,802 projects already have `detail_fetched_at` set from a previous run. The Reelly API returned empty amenities/floor plans for most projects, but the system marked them as "done." The UI button calls `mode: "batch"` which filters by `detail_fetched_at IS NULL`, finding nothing.

2. **Batch Extract Pending** returns "No imports need extraction" -- there are 0 pending items in the queue (all 1,809 are approved). This is correct behavior since everything was already processed.

3. **Enrich Project Test** works fine but the slug format must match the database exactly (e.g., `binghatti-crescent-binghatti-44`, not `binghatti-crescent`).

4. **Sarah Test Extraction** actually works (tested and confirmed -- it extracted Sobha Seahaven with 50+ images and documents).

## Fixes

### Fix 1: Backfill button -- add Force Refresh mode

The "Backfill Missing Details" button currently only processes un-fetched projects. Since all are marked fetched (even with empty data), it does nothing.

**Changes in `ReellyImportPanel.tsx`:**
- Add a "Force Re-fetch" toggle/button next to the existing backfill buttons
- When enabled, call the backfill function with `force_refresh: true` and current timestamp as `started_at`
- This re-downloads detail data from Reelly API for ALL projects, overwriting the empty arrays

### Fix 2: Backfill stats -- show actual missing data counts

The stats endpoint already returns `missing_amenities: 1802` and `missing_floor_plans: 1802`, but the UI only shows `missing_any: 0` (which checks `detail_fetched_at IS NULL`).

**Changes in `ReellyImportPanel.tsx`:**
- Display `missing_amenities`, `missing_floor_plans`, and `missing_documents` individually in the stats card
- Show a warning when `missing_any` is 0 but individual field counts are high, with a message like "All projects were fetched but many have empty data. Use Force Re-fetch to retry."

### Fix 3: Fix the "no work to do" messaging

When buttons return "nothing to process," show clear explanations instead of appearing broken:
- "Batch Extract": Show "Queue is empty (all 1,809 items approved). Use 'Rebuild Queue' to add new items."  
- "Backfill": Show "All projects already fetched. Use 'Force Re-fetch' to re-download missing amenities/floor plans."

### Fix 4: Enrich test slug auto-complete

The enrichment test input currently accepts free text slugs. The "Random" button picks correct slugs, but manual entry often uses partial slugs that don't match.

**Changes:**
- Show a hint below the input: "Use full slug format (e.g., binghatti-crescent-binghatti-44)"
- Add a search-as-you-type dropdown that queries `projects` table by partial slug match

## Technical Details

### Files to modify:
1. **`src/components/listing-admin/ReellyImportPanel.tsx`**
   - Add `force_refresh` toggle state
   - Update backfill button handler to pass `force_refresh: true` when toggled
   - Update stats display to show individual field counts
   - Add slug hint and partial search for enrich test input

2. **`src/components/listing-admin/SyncDashboard.tsx`**
   - Update empty-state messaging for batch extract and fix-all buttons
   - Show clear status when queue is empty vs when extraction is truly broken

### No edge function changes needed
All backend functions are working correctly. The issue is purely in the UI layer -- the buttons pass parameters that result in "nothing to do" because the data state has moved past what the default parameters target.
