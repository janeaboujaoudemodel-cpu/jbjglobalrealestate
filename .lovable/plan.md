
# Fix: Listing Admin Data Operations -- Approval Queue, Counts, and Extraction

## Problem Summary

The admin dashboard is broken in several ways, all traceable to data source filtering and stale extraction logic:

1. **Approval Queue shows 0 projects**: The queue is hardcoded to filter `source_url ILIKE '%reelly%'` but all 1,157 pending items are from Provident. Zero Reelly items are pending.
2. **Count mismatches**: "API Total 1803" is the Reelly API count, while the website shows 2,010 (actual DB count). These are measuring different things.
3. **Backfill says "no projects found"**: All 1,802 Reelly projects already have `detail_fetched_at` set. There are genuinely 0 left to backfill.
4. **External Sources "Run Now" returns 0**: The `scheduled-extraction` function scrapes a generic URL with Firecrawl and AI regex -- this approach is unreliable and returns nothing meaningful.
5. **Enrichment test shows "Source Firecrawl"**: This is just a label badge, not an error.

## Plan

### 1. Remove Reelly-Only Filter from ProjectApprovalQueue

**File:** `src/components/listing-admin/ProjectApprovalQueue.tsx`

The queue currently filters all queries with `.ilike("source_url", "%reelly%")`. This must be removed so ALL pending items (Reelly + Provident + any source) are visible.

Changes at lines 149-150, 191, and in the `fetchInventoryStats` function:
- Remove `.ilike("source_url", "%reelly%")` from all queries
- Remove the hardcoded `sourceFilter` default of `"reelly"` -- default to `"all"`
- Add a source filter dropdown so the admin can optionally filter by source

### 2. Fix Count Display in ReellyImportPanel

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

- Change "Reelly API Total" label to "API Total" and show the actual DB project count alongside it
- Add a "Live DB Total" stat card showing the actual `projects` table count (2,010) so the admin sees both numbers and understands the difference
- Remove the "Provident Queue" card from the Live Database Counts section (line 679) since it confuses the display

### 3. Fix Backfill "No Projects Found" Messaging

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

When backfill returns 0 remaining, the current message is "All projects already have complete data" which is correct but confusing. Change the UI to:
- Show a green checkmark with "All projects are fully backfilled" when `missing_any === 0`
- Only show the Backfill buttons when there are actually items to backfill
- Load stats automatically on mount so the admin immediately sees the status

### 4. Fix External Sources Extraction

**File:** `supabase/functions/scheduled-extraction/index.ts`

The current extraction flow is:
1. Scrape URL with Firecrawl
2. Extract projects with AI/regex from markdown
3. Match against existing DB

This approach fails because:
- Generic REST API pages don't contain structured listing data in markdown
- AI extraction returns 0 projects from API documentation pages

**Fix:** Instead of scraping generic URLs, the function should:
- Check if the source is a known API endpoint (like Dubai REST API) and use direct API calls instead of Firecrawl
- For web-based sources, improve the AI prompt to handle the specific source format
- If no projects are found, return a clear error message instead of "completed with 0"

### 5. Show Actual Card Listings in Approval Queue (Not "Proposed Value")

**File:** `src/components/listing-admin/ProjectApprovalQueue.tsx`

The queue already uses `PendingImportCard` which renders full card listings with images, prices, developer, etc. The issue is that the Reelly filter causes 0 items to load, so the admin sees nothing. Once the filter is removed (step 1), the cards will appear correctly.

Verify that the `PendingImportCard` component is used (not a raw data table) -- confirmed it IS used at the rendering level.

### 6. Fix Daily Auto-Sync to Add Items to Pending Queue

**Files:** `supabase/functions/daily-reelly-auto-sync/index.ts`, `supabase/functions/daily-provident-auto-sync/index.ts`

These are already correctly configured. The issue is that the approval queue wasn't showing items because of the source filter. No changes needed here, but verify the cron schedules are active.

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Remove `ilike("source_url", "%reelly%")` filter from all queries; default `sourceFilter` to `"all"`; add optional source filter dropdown |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Fix count labels; add live DB count; improve backfill messaging |
| `supabase/functions/scheduled-extraction/index.ts` | Improve extraction to handle API-based sources; return clear error when 0 found |

## Technical Details

### Database State (current)
- `projects` table: 2,010 rows (1,802 from Reelly, rest manual/Provident)
- `pending_project_imports` where status='pending': 1,157 rows (ALL from Provident)
- `pending_project_imports` where status='approved': 2,010 rows
- Reelly projects needing backfill: 0 (all complete)

### Why the Reelly-Only Filter Existed
It was added when Provident extraction was "disabled" per a previous mandate. But the daily auto-sync still adds Provident items to the queue. The filter should be removed to show ALL pending items regardless of source.
