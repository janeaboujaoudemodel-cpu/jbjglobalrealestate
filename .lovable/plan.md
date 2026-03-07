

# Background Enrichment System: Persistent Processing, Notifications, Before/After, and 403 Fix

## Problem Analysis

### 1. Enrichment Stops When Leaving Page
The current enrichment in `EnrichmentCenter.tsx` runs a `while` loop calling `supabase.functions.invoke("reelly-auto-enrich")` batch by batch from the **frontend**. When the user navigates away, React unmounts the component and the loop dies. All 610 projects cannot complete.

### 2. "No Match", "Zero Image", "Zero Document"
The Reelly auto-enrich edge function (`reelly-auto-enrich/index.ts`) processes projects that have a `reelly_id` but no `reelly_raw_data`. Projects without a valid `reelly_id` or where the Reelly API returns no data show "no_api_data". This is expected for some projects but needs better handling — a `force_refresh` mode should re-extract from stored `reelly_raw_data` for projects that already have it.

### 3. No Progress Notifications
There is no mechanism to notify the owner about batch progress (every 50) or completion (all 610 done).

### 4. 403 "Access Denied" / "Trial Verification"
The `OwnerGuard` wraps `/listing-admin`. When the owner verification edge function times out or fails, it shows a screen with "Retry Verification" and "Verification Temporarily Unavailable." The user sees this as "trial verification" and "access denied." The fix: when `ownerError` occurs, instead of showing a blocking error screen, auto-retry silently up to 3 times before showing the error UI.

---

## Plan

### 1. Create Background Enrichment Edge Function
**New file: `supabase/functions/background-enrichment-runner/index.ts`**

A single edge function that:
- Accepts `{ action: "start" | "status" | "stop" }`.
- On `start`: Uses `EdgeRuntime.waitUntil()` to kick off a background process that loops through ALL projects needing enrichment (calling the Reelly API in batches of 10, with 1s delays).
- Tracks progress in a new `enrichment_jobs` table: `{ id, status, total, processed, images_added, docs_added, fields_updated, errors, started_at, completed_at, log }`.
- Every 50 projects processed, inserts a notification into `user_notifications` for the owner: "50 of 610 projects enriched..."
- On completion, inserts a final notification: "All 610 projects enriched successfully."
- On `status`: Returns current job progress from the `enrichment_jobs` table.
- On `stop`: Sets a flag in the table to stop processing.

### 2. Database Migration — `enrichment_jobs` Table
```sql
CREATE TABLE public.enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, stopped, failed
  total_projects int DEFAULT 0,
  processed int DEFAULT 0,
  images_added int DEFAULT 0,
  docs_added int DEFAULT 0,
  fields_updated int DEFAULT 0,
  errors int DEFAULT 0,
  stop_requested boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  log jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage enrichment jobs" ON public.enrichment_jobs
  FOR ALL TO authenticated USING (auth.uid() = created_by);
```

### 3. Update EnrichmentCenter.tsx — Background Mode
**File: `src/components/listing-admin/EnrichmentCenter.tsx`**

Modify `ReellyEnrichmentPanel`:
- Instead of running a frontend loop, call `background-enrichment-runner` with `action: "start"`.
- Poll `action: "status"` every 5 seconds to update the UI (progress bar, log, stats).
- Show a persistent banner: "Enrichment running in background — safe to navigate away."
- "Stop" button calls `action: "stop"`.
- On mount, check if there's an active job and resume polling.

### 4. Fix OwnerGuard — Auto-Retry on Verification Error
**File: `src/components/OwnerGuard.tsx`**

- Add a `retryCount` ref. When `ownerError` is set and `retryCount < 3`, automatically call `refreshOwnerVerification()` after 2 seconds instead of immediately showing the error UI.
- Only show the "Verification Temporarily Unavailable" screen after 3 failed auto-retries.
- This prevents the intermittent "403 / access denied" the user experiences.

### 5. Ensure Full Extraction Works
The existing `reelly-auto-enrich` edge function already does full extraction (gallery, docs, amenities, payment plans, floor plans, unit types, videos, POI, highlights, service charges, ROI). The background runner will call this same logic but within a single long-running background task using `waitUntil()`, bypassing the 25-second edge function timeout.

The background function will directly use the Reelly API and write to the DB (same logic as `reelly-auto-enrich/index.ts` lines 263-385), but without the `MAX_RUNTIME_MS` limit since it runs via `waitUntil()`.

### 6. Add Results to Pending Approval
After all enrichment completes, the background function will insert enriched projects into `listing_pending_updates` so they appear in the approval queue with before/after data:
- Store a snapshot of key fields BEFORE enrichment starts (images count, docs count, amenities, payment plan).
- After enrichment, store the AFTER snapshot.
- Insert into `listing_pending_updates` with `change_type: "enrichment"` and both snapshots in metadata.

---

## Files to Create/Modify

1. **Database migration** — Create `enrichment_jobs` table
2. **`supabase/functions/background-enrichment-runner/index.ts`** — New background processing function
3. **`src/components/listing-admin/EnrichmentCenter.tsx`** — Switch to background mode with polling
4. **`src/components/OwnerGuard.tsx`** — Auto-retry verification on error (fix 403)
5. **`supabase/config.toml`** — Add `verify_jwt = false` for the new function (handled automatically)

## Not Touched
- `DocumentFieldPlacer.tsx`, `AISignatureDesigner.tsx`, `ProjectCard.tsx`, `LeadCaptureModal.tsx`, `SignDocument.tsx`, `EnvelopeDetail.tsx` — per user instruction

