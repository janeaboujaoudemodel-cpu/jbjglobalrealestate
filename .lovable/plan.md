

## Root Cause Found

The edge function logs reveal the exact error killing ALL extractions:

```
Error: Insert failed: Could not find the 'completion_percentage' column of 'pending_project_imports' in the schema cache
```

The edge function at line 666 writes `completion_percentage` but the actual DB column is `construction_progress`. Additionally, two more fields don't exist in the table: `unit_details` and `nearby_landmarks` (should map to `location_distances`), and `rera_number`.

Every single extraction attempt fails at the final INSERT step -- after spending 15-20 seconds on scraping and AI. The data is extracted successfully but never saved.

---

## Plan

### Fix 1: Patch column name mismatches in edge function (IMMEDIATE UNBLOCK)

**File:** `supabase/functions/extract-listing-from-link/index.ts` (lines 640-678)

Change the `importPayload` object:
- `completion_percentage` → `construction_progress`
- `nearby_landmarks` → `location_distances`
- Remove `unit_details` (store in `highlights` or add column)
- Remove `rera_number` (store in `review_notes` or add column)

This single fix will unblock all extractions immediately.

### Fix 2: Add missing columns via migration

Add `unit_details JSONB DEFAULT NULL` and `rera_number TEXT DEFAULT NULL` to `pending_project_imports` so no data is lost.

### Fix 3: Implement async queue architecture

**New table:** `listing_extraction_queue`
```sql
CREATE TABLE listing_extraction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  urls TEXT[] DEFAULT '{}',
  files JSONB DEFAULT '[]',
  auto_approve BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  results JSONB DEFAULT '[]',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**New edge function:** `process-extraction-queue` -- picks up pending jobs and processes them (called by the existing function or a cron)

**Modified flow in `extract-listing-from-link`:**
1. Insert job into queue with status `pending`
2. Return `{ jobId, status: 'queued' }` immediately
3. Fire-and-forget call to `process-extraction-queue`

**Frontend changes in `ListingAdminChat.tsx`:**
- On submit: get jobId back instantly, show "Queued" status
- Poll every 3 seconds for job status updates
- When `completed`, render the listing cards as before

### Files to change
- `supabase/functions/extract-listing-from-link/index.ts` -- fix column names + convert to queue-based
- `src/components/listing-admin/ListingAdminChat.tsx` -- add polling for async jobs
- DB migration -- add `unit_details`, `rera_number` columns + `listing_extraction_queue` table

