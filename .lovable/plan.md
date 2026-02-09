
# Fix: Persistent, Resumable Extraction with Automatic Backfill

## Problem Summary

The extraction system has three critical issues:

1. **Stuck sync jobs**: There are sync jobs marked as "running" but with no `next_cursor`, making them non-resumable. When you reload the page, the sync restarts from scratch.

2. **State loss on refresh**: Progress is stored in `sessionStorage` which is lost when you refresh or close the tab. The sync job should persist entirely in the database.

3. **No automatic backfill**: 1,795 approved projects are missing floor plans, amenities, and documents. There's no automatic way to run a full backfill.

## Root Cause

- The `reelly-api-sync` function saves `next_cursor` to `sync_jobs` table, but if the frontend call fails mid-batch, the cursor never gets saved.
- The `ReellyImportPanel` relies partially on `sessionStorage` for UI state, causing mismatches between frontend and database.
- The check for resumable jobs filters by `next_cursor`, so jobs with `null` cursor appear non-resumable even if they have progress.

---

## Solution: 5 Changes

### 1. Database: Clear Stuck Jobs

Clear the two stuck "running" jobs that have no cursor, so the system can start fresh.

```sql
-- Mark stuck jobs as completed so they don't block new syncs
UPDATE sync_jobs 
SET status = 'completed', 
    completed_at = NOW()
WHERE status = 'running' 
  AND next_cursor IS NULL 
  AND updated_at < NOW() - INTERVAL '1 hour';
```

### 2. Edge Function: Save Progress More Frequently

Modify `reelly-api-sync` to:
- Save `next_cursor` BEFORE processing each batch (not after)
- Add a "force_resume" mode that resumes from `current_page` if no cursor exists

### 3. Edge Function: Create Auto-Backfill Mode

Modify `reelly-backfill-projects` to add an `"auto"` mode that:
- Runs continuously until all projects are backfilled
- Saves progress to `sync_jobs` table
- Can be resumed after page refresh

### 4. Frontend: Use Database for All State

Modify `ReellyImportPanel` to:
- Remove `sessionStorage` dependency
- Poll `sync_jobs` table for current progress
- Auto-detect and resume active jobs on mount
- Add "Full Extraction + Backfill" one-click button

### 5. Frontend: Add Auto-Resume on Mount

When the ReellyImportPanel loads:
1. Check for any active job in the database
2. If found, automatically display its progress
3. Allow user to resume or cancel
4. If no active job, show clean state

---

## Detailed Changes

### File: `supabase/functions/reelly-api-sync/index.ts`

**Changes:**
- Add `force_resume` action that ignores missing cursor
- Save progress to DB at the START of each batch (not end)
- Add better error handling for network failures

### File: `supabase/functions/reelly-backfill-projects/index.ts`

**Changes:**
- Add `"auto"` mode that runs continuous backfill
- Create/resume a sync job for tracking
- Return progress after each batch
- Support pause/resume via database status

### File: `src/components/listing-admin/ReellyImportPanel.tsx`

**Changes:**
- Remove `sessionStorage` for sync state
- Subscribe to `sync_jobs` table updates via Supabase realtime
- Add "Full Auto-Extraction" button that:
  1. Syncs all projects from API
  2. Backfills all missing details
  3. Persists progress in database
  4. Survives page refresh
- Show resume prompt when active job exists
- Add "Clear Stuck Jobs" utility button

### File: `src/hooks/useSyncJobs.ts`

**Changes:**
- Add realtime subscription to sync_jobs table
- Improve job detection to find jobs by source + status (not just cursor)
- Add method to clear stuck jobs

---

## Expected Behavior After Fix

1. **Start extraction** - Progress is immediately saved to database
2. **Refresh page** - You see "Resume from page X" prompt
3. **Click resume** - Extraction continues from where it left off
4. **Full Auto-Extraction** - One button runs sync + backfill automatically
5. **Backfill progress** - Shows "1,795 projects need backfill, X remaining"

---

## Technical Implementation

### Database Schema (no changes needed)

The `sync_jobs` table already has all required columns:
- `current_page` for tracking progress
- `next_cursor` for API pagination
- `stats_*` for metrics
- `status` for state machine

### Auto-Backfill Flow

```
1. User clicks "Full Extraction"
2. Create sync_job with job_type="reelly_full_extraction"
3. Phase 1: Sync projects (save cursor after each batch)
4. Phase 2: Backfill details (save progress after each batch)
5. Mark job complete when all done
6. On page refresh: detect active job, show resume UI
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/reelly-api-sync/index.ts` | Add force_resume action, save progress before batch |
| `supabase/functions/reelly-backfill-projects/index.ts` | Add auto mode with job tracking |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Remove sessionStorage, add realtime sync, auto-resume |
| `src/hooks/useSyncJobs.ts` | Add realtime subscription, better job detection |

---

## User Impact

**Before:**
- Page refresh = restart from scratch
- Manual intervention needed
- Progress lost

**After:**
- Page refresh = "Resume from page 39?" prompt
- One-click full extraction + backfill
- All progress persisted in database
