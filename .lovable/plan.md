
# Fix Developer Logo White Borders + Backfill Resume Continuity

## Issue 1: Developer Logo White Borders on Directory Cards (DeveloperCard.tsx)

The DeveloperCard (directory/listing view) still uses `object-contain p-1` on line 90, which creates visible white padding around logos. The internal pages (DeveloperDetail.tsx line 160, DeveloperInfoCard.tsx line 68) correctly use `object-fill` with no padding.

**Rule (locked):**
- Developer logos ALWAYS use `object-fill` in square containers with NO padding
- This applies to ALL views: directory cards, internal detail pages, project detail developer section
- Rectangular logos get stretched edge-to-edge -- no cropping, no white borders
- Container: white background, gold border, square shape
- Project hero section does NOT show developer logo (it only appears in the developer info section below)

**Change in `src/components/DeveloperCard.tsx` (line 85-98):**
- Remove `p-1` padding from the logo image
- Change `object-contain` to `object-fill`
- Remove `bg-white` from the container wrapper (the logo fills edge-to-edge, no white shows)

```typescript
// Before (line 85):
<div className="w-24 h-24 rounded-lg overflow-hidden shadow-lg bg-white">
  <img ... className="w-full h-full object-contain p-1" />

// After:
<div className="w-24 h-24 rounded-lg overflow-hidden shadow-lg">
  <img ... className="w-full h-full object-fill" />
```

No changes needed for DeveloperDetail.tsx or DeveloperInfoCard.tsx -- they already use `object-fill` correctly.

---

## Issue 2: Backfill Should Continue From Where It Stopped

The backend edge function already handles this correctly -- it queries projects where `detail_fetched_at IS NULL` (or `< started_at` for force refresh), so re-running naturally skips already-processed projects.

The problem is the UI in `ReellyImportPanel.tsx`:
- Line 690-691: `setBackfillResult(null)` and `setBackfillProjectList([])` reset all progress counters to zero
- Line 703-714: Creates a brand new `sync_jobs` row every time, losing the previous count

**Fix in `src/components/listing-admin/ReellyImportPanel.tsx`:**

1. When "Backfill All" is clicked, load the previous run's totals from `sync_jobs` first
2. Initialize `aggregated` with the previous run's counts instead of zeros
3. Append new results to existing `backfillProjectList` instead of clearing it
4. Reuse or update the existing sync_jobs row instead of creating a new one

```typescript
// Before (line 689-697):
setIsBackfilling(true);
setBackfillResult(null);
setBackfillProjectList([]);
...
let aggregated = { processed: 0, updated: 0, failed: 0, remaining: 999 };
let allResults = [];

// After:
setIsBackfilling(true);

// Load previous progress
const { data: prevJob } = await supabase
  .from("sync_jobs")
  .select("*")
  .eq("job_type", "reelly_backfill")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

const prevUpdated = prevJob?.stats_updated || 0;
const prevFailed = prevJob?.stats_errors || 0;
const prevResults = (prevJob?.error_log || []) as Array<...>;

let aggregated = {
  processed: prevUpdated + prevFailed,
  updated: prevUpdated,
  failed: prevFailed,
  remaining: 999,
};
let allResults = [...prevResults];
setBackfillProjectList(allResults);
```

Then reuse the existing job row if it exists (update instead of insert), or create a new one only if none exists.

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/DeveloperCard.tsx` | Remove `p-1` padding, change `object-contain` to `object-fill` on logo |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Resume backfill from previous progress instead of resetting to zero |
