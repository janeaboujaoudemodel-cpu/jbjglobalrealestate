
# Comprehensive Fix Plan: Separate Queues, Data Completeness & Floor Plans

## Issues Identified

### 1. Developer Sync - "Skip" vs "Fix"
**Problem:** You want the 12 developers with null names to be **completely fixed**, not skipped.
**Root Cause:** The Reelly API is returning developers with `null` names. We can't fix what doesn't exist in the source API.
**Solution:** Query the Reelly API for detailed developer data using individual `/developers/{id}` endpoint to retrieve complete info for these 12 developers. If names truly don't exist in the API, log them for manual review.

### 2. Separate Queues for Provident vs Reelly
**Problem:** Clicking "View Queue" in the Reelly panel navigates to the same approval queue that shows Provident projects.
**Current State:**
- Provident: 10 pending imports
- Reelly: 778 pending imports
- Both go to the same unified queue at `/listing-admin?view=sync&syncTab=approvals`

**Solution:** Create separate queue views:
- Add "source" filter tabs to `ProjectApprovalQueue.tsx` (All | Provident | Reelly)
- Update `ReellyImportPanel.tsx` to navigate with source filter: `/listing-admin?view=sync&syncTab=approvals&source=reelly`
- Add dedicated Provident queue link in the Provident panel

### 3. Provident 1,336 Target vs 788 Queue Count
**Problem:** Target is 1,336 Provident listings but only 788 are in the queue.
**Root Cause:** The "788" is actually Reelly imports! The 10 are Provident.
**Real Issue:** Provident discovery needs to run to populate the full 1,336 listings.

**Solution:**
- The "1,336 target" is for Provident, currently only 10 are queued
- Run full Provident sync to discover and extract all 1,336 listings
- Ensure discovery function populates all missing listings

### 4. Bedroom Count Extraction
**Problem:** Shows "1 bedroom" when project has "1, 2, 3 bedroom and 3 & 4 duplex penthouses"
**Root Cause:** 
- Reelly API: Does NOT provide bedroom data (no `min_bedrooms`/`max_bedrooms` fields in the API response)
- Provident extraction: Current regex only captures min/max, not property type labels

**Solution:**
- Add `bedroom_types` JSONB field to store full bedroom labels: `["1 BR", "2 BR", "3 BR", "3 BR Duplex", "4 BR Penthouse"]`
- Update extraction to capture ALL bedroom labels as they appear on source
- Display as comma-separated list or badge chips on UI
- For Reelly: Extract from `overview` markdown text using regex

### 5. Size Range Extraction
**Problem:** Size ranges not properly extracted
**Solution:** Already captured in `size_min`/`size_max` - need to display them properly in UI

### 6. Floor Plans Broken
**Problem:** Floor plan section shows broken images / not displaying
**Root Cause:** 
- `floor_plan_types` JSONB has empty arrays for Reelly imports
- PDF URLs may be invalid or require mirroring
- FloorPlanGallery component needs fallback when no valid floor plans exist

**Solution:**
- Add debug logging to identify which floor plan URLs are failing
- Check if `imageUrl` vs `pdfUrl` is properly populated
- Add graceful fallback messaging when floor plans aren't available
- For Provident: ensure floor plan PDFs are mirrored to storage

### 7. Developer Descriptions
**Problem:** Developer info card not showing full description
**Solution:** Already implemented in previous plan - ensure data flows from Reelly API (description, headquarters, founded_year)

---

## Implementation Plan

### Phase 1: Separate Queue Views

**File: `src/components/listing-admin/ProjectApprovalQueue.tsx`**
- Add `sourceFilter` state: `"all" | "provident" | "reelly"`
- Add source filter tabs in the UI header
- Modify query to filter by source_url pattern:
  ```typescript
  if (sourceFilter === "provident") {
    query = query.ilike("source_url", "%providentestate.com%");
  } else if (sourceFilter === "reelly") {
    query = query.ilike("source_url", "%reelly%");
  }
  ```
- Update stats fetching to show counts per source

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- Change `goToApprovalQueue` to include source filter:
  ```typescript
  navigate("/listing-admin?view=sync&syncTab=approvals&source=reelly");
  ```

**File: `src/components/listing-admin/SyncDashboard.tsx`** (or Provident panel)
- Add equivalent link for Provident queue:
  ```typescript
  navigate("/listing-admin?view=sync&syncTab=approvals&source=provident");
  ```

### Phase 2: Enhanced Bedroom Extraction

**Database Migration:**
```sql
ALTER TABLE pending_project_imports 
ADD COLUMN IF NOT EXISTS bedroom_types JSONB DEFAULT '[]';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS bedroom_types JSONB DEFAULT '[]';
```

**File: `supabase/functions/full-project-extract/index.ts`**
- Update bedroom extraction to capture ALL types:
  ```typescript
  // Current: just captures min/max numbers
  // New: capture full labels
  const bedroomLabels: string[] = [];
  const bedroomMatches = cleanMd.matchAll(/(Studio|(?:\d+)\s*(?:BR|Bedroom|Bed)(?:\s*(?:Duplex|Penthouse|Sky\s*Villa))?)/gi);
  for (const match of bedroomMatches) {
    const label = match[1].trim();
    if (!bedroomLabels.includes(label)) bedroomLabels.push(label);
  }
  ```

**File: `supabase/functions/reelly-api-sync/index.ts`**
- Parse bedroom info from `overview` markdown text:
  ```typescript
  function extractBedroomTypes(overview: string | null): string[] {
    if (!overview) return [];
    const types: string[] = [];
    // Match patterns like "1-3 bedroom", "Studio to 4BR", etc.
    const matches = overview.matchAll(/(Studio|(?:\d+)[-–]?(?:\d+)?\s*(?:BR|Bedroom|Bed))/gi);
    for (const m of matches) {
      if (!types.includes(m[1])) types.push(m[1]);
    }
    return types;
  }
  ```

### Phase 3: Fix Floor Plan Display

**File: `src/components/project-detail/FloorPlanGallery.tsx`**
- Add better error handling and fallback UI
- Check if URLs are accessible before displaying
- Show clear message when no floor plans available:
  ```tsx
  if (floorPlans.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-xl">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Floor plans for this project are available upon request.
        </p>
        <Button variant="outline" size="sm" onClick={onRequestFloorPlans}>
          Request Floor Plans
        </Button>
      </div>
    );
  }
  ```

**File: `supabase/functions/full-project-extract/index.ts`**
- Ensure floor plan extraction captures both PDF and image URLs
- Validate URLs before storing
- Add logging to identify extraction failures

### Phase 4: Developer Sync Complete Fix

**File: `supabase/functions/reelly-developers-sync/index.ts`**
- For developers with null names, try to fetch from individual endpoint
- Add detailed error logging
- Store the 12 problematic developer IDs for manual review
- Update response to include list of unresolved developers

### Phase 5: UI Updates for Bedroom/Size Display

**File: `src/components/project-detail/ProjectHeroCard.tsx`** (or equivalent)
- Display bedroom types as badges or comma-separated list
- Show size range as "XXX - YYY sq ft" format
- Example:
  ```tsx
  {project.bedroom_types?.length > 0 && (
    <div className="flex flex-wrap gap-1">
      {project.bedroom_types.map((type) => (
        <Badge key={type} variant="outline">{type}</Badge>
      ))}
    </div>
  )}
  ```

---

## Technical Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `ProjectApprovalQueue.tsx` | Edit | Add source filter tabs (All/Provident/Reelly) |
| `ReellyImportPanel.tsx` | Edit | Navigate with `source=reelly` parameter |
| `SyncDashboard.tsx` | Edit | Add Provident queue link with `source=provident` |
| `FloorPlanGallery.tsx` | Edit | Add fallback UI and error handling |
| `reelly-api-sync/index.ts` | Edit | Extract bedroom types from overview |
| `full-project-extract/index.ts` | Edit | Capture all bedroom labels |
| `reelly-developers-sync/index.ts` | Edit | Detailed logging for null-name developers |
| Database Migration | Create | Add `bedroom_types` JSONB column |

---

## Expected Outcome

1. **Separate Queues:**
   - Reelly tab → Reelly-only queue (778 items)
   - Provident panel → Provident-only queue (10+ items)
   - Combined view still available as "All"

2. **Bedroom Data:**
   - Full bedroom labels displayed: "1 BR, 2 BR, 3 BR Duplex, 4 BR Penthouse"
   - Not just "1 bedroom" but complete list

3. **Floor Plans:**
   - Graceful fallback when floor plans unavailable
   - Clear messaging to request floor plans
   - Fixed image loading for valid floor plan URLs

4. **Developer Sync:**
   - 12 problematic developers logged with IDs for manual review
   - API limitation documented (some developers truly have no name in source)

5. **Provident Discovery:**
   - Run full sync to populate 1,336 Provident listings
   - All listings extracted with complete data
