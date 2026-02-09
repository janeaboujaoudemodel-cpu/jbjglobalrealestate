
# Fix "Approve All" Button — Edge Function Timeout

## Root Cause

The UI calls `bulk-approve-imports` with `limit: 500` per batch (line 543 in `ProjectApprovalQueue.tsx`). Each project requires ~5 sequential database operations (check existing, upsert project, delete old images, insert new images, update pending status). That means ~2,500 DB queries per batch, which exceeds the edge function's execution time limit. The function times out before returning, so the UI receives an error and `approved` stays at 0.

## Fix

**File: `src/components/listing-admin/ProjectApprovalQueue.tsx` (line 543)**

Reduce the batch size from 500 to 50. This means each edge function call processes ~50 projects (~250 DB queries), which completes well within the time limit. The while-loop already handles running multiple batches until the queue is empty, so it will just run more iterations.

```
// Current (times out):
body: { limit: 500 }

// Fixed (completes in time):
body: { limit: 50 }
```

One line change. The loop logic, progress bar, and error handling all remain the same — just smaller, faster batches.
