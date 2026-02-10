

# Fix: Enrichment Edge Functions Not Working

## Three Bugs Found

### Bug 1: `enrich-project-test` batch mode queries wrong column + empty filter
**File:** `supabase/functions/enrich-project-test/index.ts`

The batch query uses `.eq("status", "published")` but the projects table uses `is_published` (boolean), not `status`. This returns 0 results every time.

Additionally, the `provident_only` filter looks for `source_url ILIKE '%provident%'` but ALL 1,809 projects have Reelly source URLs (e.g., `https://reelly.io/project/...`). No projects have "provident" in their source_url. The Provident enrichment should instead target projects that are missing data (FAQs, amenities, etc.) regardless of source, since Provident is a supplementary data source.

**Fix:**
- Change `.eq("status", "published")` to `.eq("is_published", true)` (lines 69 and 86)
- Change the `provident_only` filter to NOT filter by source_url. Instead, just run the enrichment loop but skip the Reelly API call inside each project (only do Provident page-data fetching). This is already handled by the single-project logic -- when `source` is `provident_only`, pass a flag so the self-call skips Reelly.

---

### Bug 2: `provident-batch-extract` response missing `success` field
**File:** `supabase/functions/provident-batch-extract/index.ts`

The frontend checks `data?.success` but the response JSON never includes `success: true`. The response just has `{ processed, total_pdfs_found, ... }`.

**Fix:** Add `success: true` to all response objects (lines 111-117 for empty case, line 341+ for normal summary).

---

### Bug 3: `provident-batch-extract` times out processing 25 projects
**File:** `supabase/functions/provident-batch-extract/index.ts`

With `BATCH_LIMIT = 25`, 3-second throttle between items, plus Firecrawl scraping (3s wait + 30s timeout each), the function easily exceeds edge function time limits.

**Fix:** Reduce default `BATCH_LIMIT` from 25 to 5 to stay within time limits. The frontend already loops in batches.

---

## Summary

| File | Line(s) | Bug | Fix |
|------|---------|-----|-----|
| `enrich-project-test/index.ts` | 69, 86 | `.eq("status", "published")` matches 0 rows | Change to `.eq("is_published", true)` |
| `enrich-project-test/index.ts` | 72-75, 88-90 | `source_url ILIKE '%provident%'` matches 0 rows | Remove source_url filter; instead pass `skip_reelly: true` flag to single-project call |
| `provident-batch-extract/index.ts` | 111, 354 | Response missing `success: true` | Add `success: true` to all response objects |
| `provident-batch-extract/index.ts` | 13 | `BATCH_LIMIT = 25` causes timeout | Reduce to `BATCH_LIMIT = 5` |

