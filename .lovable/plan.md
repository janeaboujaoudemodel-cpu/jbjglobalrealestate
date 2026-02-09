
# Fix Areas Sync, Backfill Loop, and Backfill Results Display

## Problem 1: Areas Sync Shows "0 New, 128 Already Exist"

**Root cause**: The `extract_from_projects` action in `reelly-areas-sync` only INSERTS new areas. If the slug already exists in the `areas` table, it skips completely. Since all 128+ areas already exist, it inserts 0 and skips 128. It also hardcodes `emirate: "Dubai"` for all areas instead of reading the actual emirate from projects data.

**Fix**: Change the logic to UPSERT (update existing + insert new):
- When a slug already exists, UPDATE its `property_count` and `emirate` from the projects data
- Read the `emirate` column from projects instead of hardcoding "Dubai"
- Track and report `updated` count alongside `inserted`
- Return the real emirate per area (e.g., "Ras al-Khaimah" for Al Marjan Island)

**File**: `supabase/functions/reelly-areas-sync/index.ts` (lines 388-447)

---

## Problem 2: Backfill Shows "50 Processed, 0 Remaining" and Stops

**Root cause**: I verified the edge function now works correctly (tested it and got `remaining: 1738`). The fix from the last edit IS deployed. However, the UI "Backfill All" button on `handleRunBackfill` only passes `mode: "batch"` even when called with `mode = "all"`. The loop runs with `maxBatches = 1` for "batch" mode vs 100 for "all" mode — BUT the user's single-batch call should still show the correct remaining count.

After deeper investigation: the edge function currently works. The user likely experienced the pre-fix behavior. No further edge function changes needed for this specific bug.

**However**, the backfill loop currently caps at `maxBatches = 100` batches of 50 = 5,000 projects max. For 1,795 projects, this is 36 batches which is fine. The loop logic is correct now.

**Additional improvement**: Include `slug` in the backfill results so the UI can link to project detail pages.

**File**: `supabase/functions/reelly-backfill-projects/index.ts`
- Add `slug` to the select query (line 209): `"id, reelly_id, name, slug, floor_plan_types, amenities"`
- Include `slug` in each result object (lines 283, 294, 299)

---

## Problem 3: Clicking Backfill Results Should Open Project Detail Card

**Current behavior**: Clicking "50 Processed" or "50 Updated" opens a dialog showing just project name + status badge.

**Fix**: Make each project row in the backfill results dialog clickable, linking to the project detail page (`/projects/{slug}`). This requires:
1. Edge function returns `slug` with each result (see Problem 2 above)
2. UI: wrap each row in a link/button that navigates to `/projects/{slug}` in a new tab
3. Show more detail per row: amenities count, floor plans, price range — the "full details" card feel

**File**: `src/components/listing-admin/ReellyImportPanel.tsx` (lines 1738-1758)
- Update the result type to include `slug`
- Make project name a clickable link opening `/projects/{slug}` in new tab
- Show enrichment details (amenities, floor plans, images, docs)

---

## Files to Modify

| File | Change |
|---|---|
| `supabase/functions/reelly-areas-sync/index.ts` | Change `extract_from_projects` to upsert (update existing areas with project counts + correct emirate) |
| `supabase/functions/reelly-backfill-projects/index.ts` | Add `slug` to query and results |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Make backfill result rows clickable links to project detail pages; update result type to include `slug` |

## Technical Details

### Areas Sync Fix (reelly-areas-sync/index.ts lines 388-447)

```
// Current: skips if slug exists
if (existingSlugs.has(slug)) { skipped++; continue; }

// Fixed: update existing area with latest counts + correct emirate
if (existingSlugs.has(slug)) {
  // Find existing area and update property_count + emirate
  await supabase.from("areas")
    .update({ property_count: area.count, emirate: area.emirate, updated_at: now })
    .eq("slug", slug);
  updated++;
  continue;
}
```

Also change the area extraction query to include `emirate`:
```
// Current: only extracts area_name
.select("area_name")

// Fixed: also extract emirate  
.select("area_name, emirate")
```

And use the real emirate per area instead of hardcoding "Dubai".

### Backfill Results with Slug (reelly-backfill-projects/index.ts)

```
// Add slug to select
.select("id, reelly_id, name, slug, floor_plan_types, amenities")

// Include slug in results
results.push({ name: project.name, slug: project.slug, status: "success", ... });
```

### Clickable Results (ReellyImportPanel.tsx)

```
// Make each row a link
<a href={`/projects/${p.slug}`} target="_blank" className="...">
  <div className="font-medium text-zinc-900 truncate text-sm hover:text-blue-600 hover:underline">
    {p.name}
  </div>
</a>
```
