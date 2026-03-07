

## Diagnosis: Listing Generator Stuck at "0s Elapsed"

### Root Cause

The edge function logs reveal the problem: every invocation shows only `booted` → `shutdown` with no actual processing logs in between. The `runExtraction` function is called via `EdgeRuntime.waitUntil()` (line 610), but the edge function is being **killed before the AI call completes**.

Here is what happens:
1. User submits files → edge function creates a job, fires `runExtraction` via `waitUntil`, returns job ID
2. `runExtraction` starts, updates progress to "Analyzing batch 1 of 2...", then calls Gemini 2.5 Pro
3. **Gemini 2.5 Pro with multiple large base64 images takes 60-120+ seconds** to respond
4. The edge function runtime kills the process before the AI responds (wall-clock timeout)
5. Frontend polls, sees "batch 1 of 2" forever, timer shows 0s because the progress text never updates past that point

The progress IS written to the database ("Analyzing batch 1 of 2"), but the actual AI extraction call hangs until the function is terminated. The job never transitions to "completed" or "failed" -- it stays stuck in "processing" permanently.

### Fix Plan

**1. Switch from Gemini Pro to Gemini Flash for batch extraction**

In `supabase/functions/generate-listing/index.ts`, line 284:
- Change `model: "google/gemini-2.5-pro"` to `model: "google/gemini-2.5-flash"` for storage-file batches
- Gemini Flash responds 3-5x faster, well within edge function timeouts
- Keep Pro only if explicitly needed for single high-value extractions

**2. Add fetch timeout to the AI call**

Wrap the AI fetch call (line 280) with `AbortController` set to 55 seconds, so the function can catch the timeout, mark the batch as failed, and move to the next batch instead of hanging forever.

**3. Reduce batch size from 3 to 2**

Change `BATCH_SIZE` (line 122) from 3 to 2. Fewer images per AI call = faster response time and less chance of timeout.

**4. Add a per-batch retry with fallback**

If a batch fails due to timeout, retry once with a single file at a time (batch of 1) before giving up on that batch. This ensures partial results are still returned.

**5. Fix the stuck job detection**

In the `pollJob` function (frontend, line 417), add a "stale progress" detector: if the same progress message is returned for 90+ seconds, mark the job as potentially stuck and show a "Retry" button instead of polling indefinitely.

**6. Mark timed-out jobs as failed in the edge function**

In the `process` action handler (line 504), check if the job has been in "processing" for more than 5 minutes with no progress update. If so, mark it as failed so the frontend can stop polling.

### Files to Modify

- `supabase/functions/generate-listing/index.ts` -- AI model change, fetch timeout, batch size, retry logic, stale job detection
- `src/components/listing-admin/ListingGenerator.tsx` -- Stale progress detection, retry button

### Technical Details

The key change in the edge function AI call:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash", // Flash instead of Pro
    ...
  }),
  signal: controller.signal,
});
clearTimeout(timeout);
```

This ensures the function never hangs -- it either gets a response or cleanly times out and moves to the next batch.

