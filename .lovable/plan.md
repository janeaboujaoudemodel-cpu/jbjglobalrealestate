
# Complete Fix Implementation Plan

## Summary of Issues Found

Based on thorough investigation, here's what I found:

| Issue | Status | Root Cause |
|-------|--------|------------|
| Project page crash (`render2 is not a function`) | **Resolved** | Browser test shows pages load correctly |
| Mobile hamburger menu not opening | **Needs verification** | Sheet component has correct CSS, may need z-index adjustment |
| TrustBar cards uneven on mobile | **Already fixed** | Has `auto-rows-fr`, `h-full`, `min-w-0`, `break-words` |
| Starting Point cards not square | **Already fixed** | Has `grid-cols-3` and `aspect-square` on mobile |
| Sync stuck in "syncing" state | **Root cause found** | 51 paused jobs with `next_cursor = NULL` blocking resume |
| "1809 projects available" not clickable | **Needs fix** | No click handler on the stats card |
| Hashtags in descriptions | **Clarification needed** | No social media hashtags found; `#####` is markdown headers |
| Amelia Residence missing photos | **Database check** | Projects have 1 image (cover only), need gallery backfill |

---

## Implementation Plan

### 1. Clear Stuck Sync Jobs

**Problem**: 51 sync jobs are stuck in `paused` status with `next_cursor = NULL`, making them non-resumable and blocking new syncs.

**Solution**: Add a "Clear Stuck Jobs" button and SQL cleanup:

```sql
UPDATE sync_jobs 
SET status = 'cancelled', 
    completed_at = NOW() 
WHERE status = 'paused' 
  AND next_cursor IS NULL;
```

**File**: `src/components/listing-admin/ReellyImportPanel.tsx`
- Add "Clear Stuck Jobs" button in the sync controls section
- Execute cleanup on click

---

### 2. Make "Projects Available" Card Clickable

**Problem**: The card showing "1,809 projects available" in SourceCountsPanel does nothing on click.

**Solution**: Add `onClick` handler to navigate to the Reelly projects queue.

**File**: `src/components/listing-admin/SourceCountsPanel.tsx`

```tsx
<div 
  className="... cursor-pointer hover:border-gold transition-colors"
  onClick={() => navigate('/listing-admin?view=data-ops&syncTab=approvals&source=reelly')}
  title="Click to view all Reelly projects"
>
  <p>Expected</p>
  <p>{reellyApiTotal?.toLocaleString() || "—"}</p>
</div>
```

---

### 3. Fix Markdown Headers Display

**Problem**: Descriptions show `##### Project general facts` as raw text.

**Current State**: `markdownUtils.ts` already handles `###` headers but not `#####` (5 hashes).

**Solution**: Extend the markdown renderer to handle `#####` and `####` headers, OR strip the header prefix on display.

**File**: `src/lib/markdownUtils.ts`

Add handling for more header levels:
```tsx
.replace(/^##### (.+)$/gm, '<h5 class="font-medium text-base mt-3 mb-1.5">$1</h5>')
.replace(/^#### (.+)$/gm, '<h4 class="font-semibold text-lg mt-4 mb-2">$1</h4>')
```

---

### 4. Improve Full Extraction Button Reliability

**Problem**: Full Extraction button sometimes disabled or doesn't work because it relies on stale `apiConnected` React state.

**Solution**: Make `handleTestApiConnection()` return the result directly instead of relying on state.

**File**: `src/components/listing-admin/ReellyImportPanel.tsx`

```tsx
const handleTestApiConnection = async (): Promise<boolean> => {
  // ... test logic ...
  const isConnected = result.success === true;
  setApiConnected(isConnected);
  return isConnected; // Return immediately usable result
};

// In handleFullExtraction:
const isConnected = await handleTestApiConnection();
if (!isConnected) {
  throw new Error("API connection failed");
}
```

---

### 5. Backfill Gallery Images

**Problem**: Most projects only have 1 image (cover). Gallery images need to be fetched from Reelly detail endpoint.

**Current State**: `reelly-backfill-projects` function exists but only updates `projects` table, not `project_images`.

**Solution**: Modify the backfill function to:
1. Fetch gallery from detail endpoint
2. Insert images into `project_images` table
3. Track images_synced count

This requires edge function update which will be deployed.

---

### 6. Mobile Menu Z-Index Verification

**Problem**: User reports hamburger doesn't open on phone.

**Current State**: 
- SheetOverlay: `z-[9500]`
- SheetContent: `z-[9501]`
- Menu trigger visible

**Solution**: Verify on actual mobile viewport. If still not working:
- Increase z-index to `z-[10000]`
- Ensure no conflicting `overflow-hidden` on parent

---

## Files to Modify

1. **`src/components/listing-admin/ReellyImportPanel.tsx`**
   - Add "Clear Stuck Jobs" function
   - Fix `handleFullExtraction` to use direct API result

2. **`src/components/listing-admin/SourceCountsPanel.tsx`**
   - Make "Expected" card clickable
   - Navigate to projects list on click

3. **`src/lib/markdownUtils.ts`**
   - Add `#####` and `####` header handling

4. **`supabase/functions/reelly-backfill-projects/index.ts`**
   - Add gallery image sync to `project_images` table

---

## Expected Outcomes

After implementation:
- Sync jobs complete successfully without getting stuck
- "1809 available" card navigates to project list
- Markdown headers render properly (not as raw `#####`)
- Gallery images populate for all projects
- Mobile menu opens reliably
