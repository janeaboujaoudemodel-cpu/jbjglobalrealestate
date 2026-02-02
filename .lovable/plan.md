
## What’s actually happening (root cause)

Your “queue stuck at ~16/17”, “bulk extraction completes immediately”, and “wipe/rebuild buttons look broken” are all the same root bug:

- The **discovery function** (`discover-all-projects`) tries to insert the 1,336 URLs using an **upsert** with `onConflict: "slug"`.
- But in the database, the current uniqueness protection on `pending_project_imports.slug` / `source_url` is implemented as **partial unique indexes** (they have `WHERE slug IS NOT NULL` / `WHERE source_url IS NOT NULL`).
- Postgres **cannot use a partial unique index** as the conflict target for `ON CONFLICT (slug)` unless the statement also matches the index predicate. Result:
  - Inserts fail with: **“there is no unique or exclusion constraint matching the ON CONFLICT specification”**
  - So the discovery call returns “success” to the UI (because we weren’t surfacing insert failure properly), but **it inserts 0 rows**.
  - Therefore:
    - Queue stays at 0 (or whatever few were previously created by other workflows like page-sync)
    - “Start Bulk Extraction” instantly says “Complete” because there’s nothing to process
    - Wipe/reset appears “stuck” because the next step (discovery insert) silently fails

I confirmed this in backend logs: discover batches fail with that exact ON CONFLICT error, and “Total inserted: 0”.

---

## Fix Strategy (high confidence, minimal moving parts)

### A) Database schema fix (the real blocker)
**Goal:** Make Postgres accept `ON CONFLICT (slug)` and `ON CONFLICT (source_url)`.

1. **Create a new migration** to update queue integrity:
   - Remove the partial unique indexes:
     - `DROP INDEX IF EXISTS public.pending_project_imports_slug_unique;`
     - `DROP INDEX IF EXISTS public.pending_project_imports_source_url_unique;`
   - Add **non-partial** unique constraints/indexes:
     - `CREATE UNIQUE INDEX ... ON public.pending_project_imports (slug);`
     - `CREATE UNIQUE INDEX ... ON public.pending_project_imports (source_url);`
2. Safety in the migration:
   - Before creating the new unique indexes:
     - Normalize `slug` to lowercase
     - Normalize `source_url` (strip query/hash, strip trailing slash)
     - Remove duplicates (keep oldest row per slug/source_url)
3. (Optional but recommended) Hardening:
   - Set defaults / non-null:
     - `status` default `'pending'`
     - `slug` and `source_url` non-null (only if we are 100% sure nothing uses null; current data shows 0 nulls)

**Outcome:** `discover-all-projects` can finally insert 1,336 rows reliably.

---

### B) Backend function correctness: make failures visible and deterministic
**Goal:** Stop reporting “success” when inserts failed.

1. Update `supabase/functions/discover-all-projects/index.ts`:
   - If any insert batch fails, return:
     - `success: false`
     - a clear `error` field (include the Postgres ON CONFLICT message)
     - `inserted_batches`, `failed_batches`, `attempted_rows`
   - Keep the current discovery logic, but make the response reflect reality.
2. Add a “guardrail”:
   - After insert loop, if `placeholders.length > 0` and `insertedCount === 0`, return HTTP 500 (or `success:false`) so the UI doesn’t proceed into extraction.

**Outcome:** No more “fake success” and no more confusing UI states.

---

### C) Listing Admin UI fixes (why buttons feel “stuck”)
**Goal:** Make the admin workflow resilient and transparent.

1. Update `src/components/listing-admin/SyncDashboard.tsx`:
   - **FULL WIPE & REBUILD** currently does:
     - wipe → single long discover call → auto start extraction
   - Change it to:
     - wipe → **chunked queue rebuild** (the existing `rebuildQueueFromMap` logic) → only start extraction when queue count is correct.
2. Add “stuck detection”:
   - After each discovery chunk, re-check pending count.
   - If pending count does **not increase** after a discover chunk:
     - stop the loop immediately
     - show a toast explaining the real reason (insertion blocked / discovery failed)
3. Bulk extraction runner improvements:
   - Before starting bulk extraction:
     - If pending count is 0, show “Queue is empty — rebuild queue first” and do not start.
   - When bulk extraction reports `processed = 0`:
     - verify whether queue still has items needing extraction
     - if yes, show “0 eligible rows found; likely missing marker fields” (and surface diagnostics)
     - if no, show “Complete”.

**Outcome:** Buttons won’t “look broken”; they’ll either complete successfully or show a precise failure reason.

---

## Execution / Validation Checklist (what we will test end-to-end in Preview)

1. Click **Reset/Clear queue** → confirm queue becomes 0.
2. Click **Rebuild Queue**:
   - Expect pending queue to rise quickly (MAP inserts ~1331)
   - Then chunk passes fill to **exactly 1,336**
3. Confirm:
   - Dashboard pending count == Queue view count == **1,336**
   - No case where queue exceeds target.
4. Click **Start Bulk Extraction**:
   - Expect it to process many rows (not instantly “complete”)
   - Expect `needs_extraction_pending` to decrease over time.
5. Verify:
   - No “0 outside / 16 inside” mismatch after refresh (counts computed consistently, errors surfaced)

---

## Files/Areas that will be changed

### Backend (schema)
- New migration file to:
  - Replace partial unique indexes with full unique indexes on:
    - `pending_project_imports.slug`
    - `pending_project_imports.source_url`

### Backend (function)
- `supabase/functions/discover-all-projects/index.ts`
  - fail fast when inserts fail
  - return accurate inserted/error stats

### Frontend (admin)
- `src/components/listing-admin/SyncDashboard.tsx`
  - FULL WIPE uses chunked rebuild logic
  - better stuck detection & guardrails
  - extraction start conditions improved

---

## Why this will stop the recurring mistakes
- The system was not “discovering only 17”; it was **failing to insert** the discovered set due to a database constraint mismatch.
- Once the conflict target is fixed, queue build becomes deterministic, count can’t exceed target, and bulk extraction will have real work to do.

If you approve this plan, I’ll implement the migration + function fix first (so discovery can actually insert), then update the admin dashboard flows so the buttons cannot get into these “looks stuck but silently failed” states again.
