

# Fix Enrichment Pipeline, Footer Mode, Description Rendering, and Progress Persistence

## Issues Identified

### Issue 1: Enrichment Test Shows All Zeros
**Root cause confirmed by live API test:** The `enrich-project-test` function IS working correctly -- but the Reelly API itself returns very sparse data for most projects (only 1 gallery image, 0 amenities, 0 floor plans, 0 documents, 0 FAQs). The zeros are REAL -- Reelly simply does not have rich data for the majority of its 1,802 projects.

**The solution:** The enrichment test must also check Provident as a second source. Currently `enrich-project-test` only queries Reelly. The `provident-enrich-projects` function exists but is not integrated into the enrichment test UI. By combining both sources, projects that are empty from Reelly can be filled from Provident.

### Issue 2: Bulk Enrichment (Reelly API) Not Extracting Data
**Root cause:** The `reelly-bulk-enrich` function filters for projects without documents -- but many have already been processed (even if the API returned nothing). The backfill function works with `force_refresh: true` but the bulk enrichment button does NOT pass that flag. Also, the Reelly API genuinely returns sparse data for most projects.

### Issue 3: Progress Lost on Page Refresh
**Root cause:** While backfill progress IS persisted to `sync_jobs`, the enrichment test result, bulk enrichment progress, AI content generation progress, and Provident extraction progress are only stored in React state -- all lost on refresh. The `loadPersistedBackfillResults` function only loads backfill data, not the other operations.

### Issue 4: Footer Mode Switcher Not Selectable
**Root cause:** The `ModeSwitcher` component returns `null` if `hasSelectedRole` is false. In the footer context, an unauthenticated user or a user who hasn't selected a role won't see any mode options at all. The label "Your Mode" is shown but the switcher is invisible.

### Issue 5: Description Rendering as Block Text
**Root cause:** The `formatReellyDescription` function converts known section labels to markdown headings, but many Reelly descriptions use different patterns not covered by the map. The `renderMarkdownToHtml` function does convert markdown to HTML with proper headings and lists, but the input often lacks any markdown structure -- it's just a raw text block.

---

## Fix Plan

### Fix 1: Add Provident Source to Enrichment Test

**File: `supabase/functions/enrich-project-test/index.ts`**
- After fetching Reelly data, also attempt to match the project against Provident's page-data endpoint using slug variants
- Import `fetchProvidentPageDataDetail` from the shared provident module
- For each enrichment field that Reelly returned empty, check if Provident has data and include it in the "after" snapshot
- Add a `provident` entry to the `sources` response alongside `reelly`
- This gives the before/after cards actual non-zero values

### Fix 2: Fix Bulk Enrichment to Combine Reelly + Provident

**File: `supabase/functions/reelly-bulk-enrich/index.ts`**
- After fetching from Reelly API, if key fields (amenities, floor plans, documents) are still empty, attempt Provident slug-match enrichment
- Import `fetchProvidentPageDataDetail` from the shared provident module
- Only fill fields where Reelly returned nothing (non-destructive)
- Tag data_source as "provident_via_bulk_enrich"

### Fix 3: Persist All Operation Progress to sync_jobs

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- On mount, load last results for ALL operation types from `sync_jobs` (not just `reelly_backfill`)
- Add job_type entries: `bulk_enrich`, `ai_content`, `provident_extract`
- When each operation runs, create/update a `sync_jobs` row with stats
- On mount, restore the last result for each operation type into its respective state variable
- This ensures progress survives page refresh

### Fix 4: Fix Footer Mode Switcher

**File: `src/components/Footer.tsx`**
- The ModeSwitcher already works when `hasSelectedRole` is true, but the footer shows "Your Mode" label unconditionally
- Wrap the entire mode section (label + switcher) in a condition that checks authentication status
- For unauthenticated users, show a "Sign in to select your mode" link instead
- For authenticated users who haven't selected, show all three mode options directly as clickable buttons (not the dropdown that requires `hasSelectedRole`)

**File: `src/components/ModeSwitcher.tsx`**
- Add a `showForUnselected` prop that bypasses the `if (!hasSelectedRole) return null` check
- When `showForUnselected` is true, show all 3 mode buttons inline so the user can select from the footer

### Fix 5: Improve Description Rendering

**File: `src/lib/markdownUtils.ts`**
- Expand `formatReellyDescription` with more section label patterns from Reelly data (e.g., "Features", "Facilities", "Unit Types", "Investment Highlights", "Developer", "Property Details")
- Add a fallback: if no section headings are detected in the text and it exceeds 500 chars, auto-split into paragraphs at sentence boundaries (every 3-4 sentences) and add visual breaks
- Add a function to detect numbered lists in plain text (e.g., "1. Feature one 2. Feature two") and convert to proper markdown lists

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- The description section already uses `prose` classes, so improved markdown output will automatically render with proper typography
- Add section dividers between auto-detected sections for better visual separation
- Add subtle gold accent lines between major description sections

### Fix 6: Add Provident News/Areas/Projects Extraction Button

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- Add a "Sync from Provident" card that calls `provident-enrich-projects` in batch mode
- Show matching stats: how many of our projects match Provident listings
- Show results per project: images added, documents added, fields updated
- This gives the user a one-click way to fill all the gaps that Reelly left empty

---

## Technical Details

### Files to modify:
1. `supabase/functions/enrich-project-test/index.ts` -- Add Provident source lookup
2. `supabase/functions/reelly-bulk-enrich/index.ts` -- Add Provident fallback for empty fields
3. `src/components/listing-admin/ReellyImportPanel.tsx` -- Persist all progress types, add Provident sync card
4. `src/components/Footer.tsx` -- Fix mode switcher visibility for unauthenticated users
5. `src/components/ModeSwitcher.tsx` -- Add `showForUnselected` prop
6. `src/lib/markdownUtils.ts` -- Expand description formatting patterns

### Edge functions to deploy:
- `enrich-project-test`
- `reelly-bulk-enrich`

### No database migrations needed
All changes are UI and edge function logic updates.

