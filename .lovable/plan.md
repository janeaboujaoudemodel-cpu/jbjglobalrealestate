
# Critical Listing Queue Fix - Exact 1,336 Mirror

## Issues Identified

### 1. Queue Count Mismatch
| Issue | Current State | Target |
|-------|--------------|--------|
| Total Queue Items | 1,332 | 1,336 |
| Missing Listings | 4 URLs not discovered | 0 |
| Duplicate Entry | 1 (`the-heights-country-club-and-wellness-townhouses`) | 0 |
| Distinct Slugs | 1,331 | 1,336 |

**Root Cause:** The discovery function (`discover-all-projects`) missed 4 listings during the Firecrawl MAP/scrape process. There's also 1 duplicate entry that shouldn't exist.

### 2. UI Showing Wrong Numbers (1,480 / 1,961)
The user sees 1,480 in one view and 1,961 in another. The database shows only 1,332. This is likely:
- Browser cache or session storage persisting old state (the dashboard uses `sessionStorage` to persist stats)
- Old sync job statistics being displayed
- The `totalCount` from database query vs `imports.length` showing different values

**Root Cause:** `SyncDashboard.tsx` stores `sync_page_statuses` and `sync_total_stats` in `sessionStorage` which may contain stale data.

### 3. "...more" Link on Cards
**Current Status:** Both `PendingImportCard.tsx` (admin queue) and `ProjectCard.tsx` (public) already have the "...more" gold gradient link implemented:
- `PendingImportCard.tsx`: Lines 253-265 - Shows `...more` when description > 120 chars
- `ProjectCard.tsx`: Lines 273-281 - Always shows `...more` link

**Issue:** The "...more" only appears when there IS a description and it's longer than 120 characters. For cards without descriptions, it doesn't show.

---

## Solution

### Phase 1: Database Cleanup
1. **Delete duplicate entry** - Remove the duplicate `the-heights-country-club-and-wellness-townhouses`
2. **Clear sessionStorage** - The UI needs to clear cached stats

### Phase 2: Fresh Discovery for Exact 1,336 Count
1. **Update canonical targets** in `discover-all-projects/index.ts`:
   - Change `CANONICAL_TOTAL_LISTINGS` from 1335 to 1336
2. **Force fresh discovery** with complete inventory reconciliation:
   - Call `discover-all-projects` with `freshStart: true` and `forceFullDiscovery: true`
   - This clears non-approved queue items and re-discovers all 1,336 URLs
3. **Enhanced discovery fallback** - Ensure all 89 listing pages are scraped via Firecrawl if MAP returns less than expected

### Phase 3: UI Fixes
1. **Clear stale session data** - Add a "Clear Cache" button or auto-clear when counts don't match
2. **Force database refresh** on dashboard load instead of using cached values
3. **Always show "...more"** on cards even without full description text

---

## Technical Changes

### File 1: `supabase/functions/discover-all-projects/index.ts`
- Update line 14: `CANONICAL_TOTAL_LISTINGS = 1336` (was 1335)
- The discovery function will now target the correct count

### File 2: `src/components/listing-admin/SyncDashboard.tsx`
- Clear `sessionStorage` items `sync_page_statuses` and `sync_total_stats` on component mount when counts mismatch
- Add a "Refresh Stats" button that clears cache and reloads from database

### File 3: `src/components/listing-admin/ProjectApprovalQueue.tsx`
- Update hardcoded "Target: 1,335" text to dynamically use 1,336
- Force fresh count query on mount (no caching)

### File 4: Database Cleanup (via SQL)
```sql
-- Delete duplicate entry
DELETE FROM pending_project_imports 
WHERE slug = 'the-heights-country-club-and-wellness-townhouses' 
AND id != (
  SELECT id FROM pending_project_imports 
  WHERE slug = 'the-heights-country-club-and-wellness-townhouses' 
  ORDER BY created_at ASC 
  LIMIT 1
);
```

### File 5: `src/components/ProjectCard.tsx` (Public Cards)
- Already shows "...more" always (line 275-280) - No change needed

### File 6: `src/components/listing-admin/PendingImportCard.tsx` (Admin Cards)  
- Modify to always show "...more" regardless of description length
- Currently only shows when `item.description.length > 120`

---

## Action Sequence

1. **Database Migration** - Delete duplicate entry
2. **Update discover function** - Change canonical count to 1,336
3. **Update UI components** - Fix cache issues and "...more" visibility
4. **Trigger fresh discovery** - Run `discover-all-projects` with `freshStart: true`
5. **Verify** - Confirm queue shows exactly 1,336 items

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/discover-all-projects/index.ts` | Update `CANONICAL_TOTAL_LISTINGS` to 1336 |
| `src/components/listing-admin/SyncDashboard.tsx` | Clear stale sessionStorage, add cache reset |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Update target label from 1,335 to 1,336 |
| `src/components/listing-admin/PendingImportCard.tsx` | Always show "...more" link |
| Database Migration | Delete duplicate slug entry |
