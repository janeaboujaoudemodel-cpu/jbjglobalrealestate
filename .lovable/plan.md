
# Fix Reelly Sync: Remove Auto-Approval & Speed Improvements

## Problems Identified

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Auto-approval happening** | `autoApprove: true` is default in edge function | Remove auto-approval entirely |
| **Sync is slow (stuck at 3%)** | Sequential processing: 50 projects → 36 API calls, each with individual DB upserts | Increase batch size, add batched DB operations, show better progress feedback |
| **Progress feels frozen** | UI only updates after each batch completes (50 projects) | Add estimated time, improve progress display |

---

## Solution Overview

### 1. Remove Auto-Approval Completely

**Edge Function (`reelly-api-sync/index.ts`):**
- Remove `autoApprove` option entirely
- Delete `autoApproveToProjects()` function
- Delete `isProjectComplete()` function
- Projects will ONLY go to `pending_project_imports` table
- You must manually approve to make them live

**Result:** All synced projects stay in the approval queue until you review and approve them.

### 2. Speed Up Sync (Batch Processing)

**Edge Function Changes:**
- Increase default page size from 50 to 100
- Batch database inserts (bulk upsert instead of one-by-one)
- Skip developer/area creation if already exists (reduce DB queries)
- Remove redundant lookups

**UI Changes:**
- Show estimated time remaining
- Update progress more frequently
- Add "items/second" metric

### 3. Improved Progress Display

Show clearer feedback:
```
Syncing... 450 / 1803 projects (25%)
Speed: ~50 projects/sec • Est. ~30 seconds remaining
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/reelly-api-sync/index.ts` | Remove auto-approval, increase batch size, optimize upserts |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Remove auto-approve UI references, improve progress display |

---

## Technical Changes

### Edge Function: Remove Auto-Approval

```typescript
// REMOVE these lines:
autoApprove?: boolean; // DELETE option
autoApprove: true, // DELETE default
isProjectComplete() // DELETE function
autoApproveToProjects() // DELETE function

// REMOVE this block (lines 737-743):
if (options.autoApprove && pendingImportId && isProjectComplete(...)) {
  const approved = await autoApproveToProjects(...);
  if (approved) autoApproved++;
}

// REMOVE from response:
auto_approved: autoApproved, // DELETE
```

### Edge Function: Speed Optimization

```typescript
// Increase default page size
const limit = Math.min(Math.max(Number(options.limit ?? 100), 1), 200);

// Pre-fetch all existing source_urls for batch check
const existingUrls = new Set(
  (await supabase.from("pending_project_imports")
    .select("source_url")
    .like("source_url", "%reelly_%")).data?.map(r => r.source_url) || []
);

// Skip individual lookups, use Set for O(1) check
```

### UI: Better Progress Display

```typescript
// Calculate estimated time
const elapsedMs = Date.now() - syncStartTime;
const projectsPerSec = syncProgress.fetched / (elapsedMs / 1000);
const remaining = syncProgress.total - syncProgress.fetched;
const estimatedSecondsLeft = Math.ceil(remaining / projectsPerSec);

// Display:
// "Fetched 450 / 1803 (25%) • ~50/sec • ~30s remaining"
```

---

## Summary of Changes

1. **Remove auto-approval** - Projects only go to pending queue, require manual approval
2. **Increase batch size** - 100 projects per API call instead of 50
3. **Pre-fetch existing records** - Avoid N individual lookups
4. **Better progress UI** - Show speed and estimated time remaining

After these changes:
- Full sync of 1803 projects will complete faster (~1-2 minutes vs 3-5 minutes)
- NO projects will be auto-approved
- You approve manually from the queue
- Progress bar shows real-time speed and ETA
