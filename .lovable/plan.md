## Problem

`media-ingestion-classify` crashes with `WORKER_RESOURCE_LIMIT` (HTTP 546) and the hub goes blank. Root causes:

1. **Edge worker overloaded per call.** Each invocation downloads *all developers* + *up to 2,000 projects*, then calls the AI gateway. Frontend (`useMediaIngestion.classify`) fans out **10 batches × 10 jobs in parallel** → Deno worker runs many concurrent AI calls and dies on CPU/wall-time before `EdgeRuntime.waitUntil` finishes.
2. **Unstable model id.** `google/gemini-3-flash-preview` is a preview model and frequently returns errors that get retried, amplifying compute use.
3. **Blank screen.** Frontend doesn't catch the 546 from `supabase.functions.invoke`; the unhandled rejection in `MediaIngestionHub` mount path nukes the page.
4. **PDF text extractor** runs for every PDF unconditionally and downloads the whole staging file into memory (up to 500 MB), worsening worker pressure.

## Fix

### 1. `supabase/functions/media-ingestion-classify/index.ts`
- Switch model to **`google/gemini-2.5-flash-lite`** (stable, cheap, fast — supported per Lovable AI rules).
- **Process one job per invocation** (cap server-side `job_ids` to 1; if more, return 400). Removes the in-function loop and `EdgeRuntime.waitUntil` background fan-out → no resource limit.
- Cap project list passed to AI prompt to **300 rows** (was 2000 fetched + 500 prompt).
- Skip PDF download when `file_size > 25 MB` (use filename heuristic only).
- Always return **HTTP 200** with `{ok:false, error}` payload on failure (keeps frontend from crashing on 5xx).
- Keep auth + role check.

### 2. `src/hooks/useMediaIngestion.ts`
- Rewrite `classify()` to:
  - send **one job per invoke**,
  - run with **concurrency 3** via a small worker pool (not unbounded `Promise.all`),
  - swallow errors per job (mark row `status=error, last_error=...` via UPDATE) so the UI never sees a thrown rejection.
- Wrap the post-upload `classify(allCreated)` call in try/catch (already `.catch(()=>{})`, keep it).

### 3. `src/pages/admin/MediaIngestionHub.tsx`
- Wrap render in a small inline error boundary (`<ErrorBoundary fallback=…>`) so any future hook crash shows a retry card instead of a blank screen.

## Files

- edit `supabase/functions/media-ingestion-classify/index.ts`
- edit `src/hooks/useMediaIngestion.ts`
- edit `src/pages/admin/MediaIngestionHub.tsx` (add lightweight error boundary wrapper)

## Out of scope

- No DB schema changes.
- No changes to `media-ingestion-merge`, `-rollback`, `MergeHistory`, `IngestionCard`, or storage RLS.
- No model swap in other functions.

## Acceptance

- Dropping 10–50 files no longer returns 546 from `media-ingestion-classify`; rows transition `pending → processing → auto_matched/needs_review/unmatched`.
- If the AI gateway/PDF parse fails for a row, the hub stays interactive and that row shows `status=error` with `last_error`.
- Hub never goes blank on classify failure.
