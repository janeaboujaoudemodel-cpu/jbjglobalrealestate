

## Fix Listing Admin Enrichment Edge Function Errors

### Root Cause Analysis

**Issue 1: "Failed to send request" timeout**
The `enrich-project-test` batch mode (lines 147-158) calls itself recursively via HTTP fetch. Each inner call runs Reelly API + multiple Provident slug lookups + Firecrawl fallback, potentially taking 30+ seconds each. A batch of 10 self-calls easily exceeds the edge function timeout, causing "context canceled" / "failed to send request" errors.

**Fix:** Replace the self-referential HTTP fetch in batch mode with inline enrichment logic. Instead of calling `fetch(enrichUrl)` to itself, directly call the same enrichment code path for each project within the batch handler.

**Issue 2: Provident enrichment showing zeros**
The Provident page-data parser (`pagedata-detail.ts`) looks for fields at the wrong nesting level. Real Provident response structure:
```
result.serverData.data = { status: true, message: "...", data: { id, about, amenities, ... } }
```
The parser resolves `data` to `{status, message, data}` and then looks for `data.amenities` which doesn't exist. The actual amenities are at `data.data.amenities` (the inner `data` object).

The parser also doesn't check for Provident's `"No record found"` response, so it tries to parse empty objects and returns all zeros.

**Fix:** Update `parsePageDataDetail` to unwrap the nested `data.data` layer, and add an early return when `message` is `"No record found"`.

---

### Changes

#### File 1: `supabase/functions/_shared/provident/pagedata-detail.ts`

**Fix the data path resolution (lines 159-169):**
- After extracting `data` from `result.serverData.data`, check if `data.status === true` and `data.data` exists (the Provident API wrapper pattern)
- If so, unwrap: use `data.data` as the actual project data
- Add early return if `data.message === "No record found"`
- Map Provident field names to parser expectations: `about` -> description, `developer` -> developer_name, `display_address` -> location, `media_images` -> images

Specifically, insert after line 164:
```typescript
// Provident API wraps data in {status, message, data: {actual fields}}
if (data && typeof data === "object" && (data as any).status === true && (data as any).data) {
  // Check for "No record found"
  if ((data as any).message === "No record found") return null;
  // Unwrap the inner data object
  data = (data as any).data;
}
```

#### File 2: `supabase/functions/enrich-project-test/index.ts`

**Fix batch mode self-call (lines 113-186):**
Replace the self-referential HTTP fetch pattern with inline enrichment. Instead of:
```typescript
const res = await fetch(enrichUrl, { ... body: { slug: proj.slug, action: "apply" } });
```
Directly execute the enrichment logic for each project within the loop. This eliminates the HTTP round-trip, prevents timeout cascading, and allows the batch to process within a single function execution.

The inline approach will:
1. Fetch current project data from DB (same as the single-slug path does)
2. Try Reelly API (unless `skip_reelly`)
3. Try Provident page-data slug matching
4. Apply updates directly
5. Continue to next project

This removes ~30s of HTTP overhead per project in batch mode.

---

### Summary

| File | Change | Impact |
|------|--------|--------|
| `pagedata-detail.ts` | Unwrap nested `data.data`, handle "No record found" | Fixes Provident returning zeros |
| `enrich-project-test/index.ts` | Inline batch enrichment instead of self-calling HTTP | Fixes "failed to send request" timeouts |

