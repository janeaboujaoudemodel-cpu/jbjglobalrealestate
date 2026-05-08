## Why "0 rows" after the 33,874-row upload

The batch row was inserted (`row_count: 33874, status: running`) but every counter stayed at 0 and the status never flipped to `complete`. Edge function analytics show only 4 CORS preflight OPTIONS calls (one per parallel worker) and **zero POSTs** — meaning the actual chunk uploads never landed on `crm-broker-bulk-import`, and the client never recorded them as failed either. The batch is orphaned in `running` state.

Three things combined to cause this:

1. **No status feedback when chunks fail to reach the function.** The client catches errors silently (`accAgg.skipped += chunk.length`) and only writes counters at the very end. If the dialog closes, the tab navigates, or the function never responds, the batch stays at `inserted=0, skipped=0, status='running'` forever — exactly what we see.
2. **No batch-level failure marking.** There is no `try/catch` around `runFastImportForFile` that flips the batch to `failed` with an error message, so failures are invisible.
3. **No resume / retry path.** Even though every row of the original file is still parseable client-side, there is no "Resume" button on the orphaned batch, and the existing matching counters are unreliable.

## Plan to fix

### A. Make the importer self-reporting
- Wrap each `runFastImportForFile` call in `try/catch`. On throw, update the batch to `status: 'failed'` with `notes` containing the first error.
- Inside `runFastImportForFile`, call `crm_import_batches.update({ inserted, updated, skipped })` after **every** chunk (not only at the end), so progress survives a tab close.
- After both workers finish, only set `status: 'complete'` if `inserted + merged + skipped >= row_count`; otherwise mark `partial` with the missing-row count.

### B. Surface the real failure cause
- In the chunk worker, when `supabase.functions.invoke` throws, log the error message to a new `crm_import_batch_errors` table (batch_id, chunk_index, error_text, attempted_at). Show the latest 3 errors on the batch card so the user sees *why* it stalled.
- Validate request size before sending: if a 1000-row chunk JSON exceeds ~900 KB, split it in half and retry, instead of letting the edge runtime reject silently.

### C. Auto-recover orphaned batches
- On dialog open, query `crm_import_batches WHERE owner_id = me AND status = 'running' AND created_at < now()-interval '5 minutes'` and offer a "Resume / Mark failed" action for each.
- Add a "Resume" button that re-parses the file (user re-selects it) and re-imports only the missing slice (rows beyond `inserted+merged+skipped`).

### D. Fix the current orphaned batch
- One-time: mark batch `a5b6cf01…` as `failed` with note "stalled — please re-upload" so the UI stops showing it as in-progress.

### E. Verify
- Re-upload the 33,874-row file, watch the batch row tick up live, and confirm final `status='complete'` with `inserted+merged+skipped == 33874`.
- Force a failure (e.g. invalid `batch_id`) and confirm the batch flips to `failed` with a readable error.

## Technical details

Files to touch:
- `src/components/crm/BrokerBulkUploadDialog.tsx` — per-chunk progress writes, try/catch around fast path, payload-size guard, orphaned-batch banner.
- `supabase/functions/crm-broker-bulk-import/index.ts` — return more detail in error responses (currently bare `{error}`), include payload size limit hint.
- New migration: `crm_import_batch_errors` table + RLS (owner can read their own).
- One-time SQL via migration to mark the existing stuck batch `failed`.

No existing import behavior is removed; this is purely additive observability + recovery.
