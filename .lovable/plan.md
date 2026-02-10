

# Fix Bulk Enrichment Failures, Routing Bugs, and Add Full Enrichment Mode

## Problems Found

### 1. Provident Batch Extract is completely broken (wrong column names)
The `provident-batch-extract` edge function inserts documents using columns `document_url` and `document_name`, but the actual `project_documents` table has columns `file_url` and `file_name`. Every single document insert silently fails. The `onConflict` clause also references the non-existent `document_url` column.

### 2. Project routing is broken (`/projects/:slug` redirect)
The redirect route passes `to="/project/:slug"` to `RedirectWithParams`, which generates the URL by doing `${to}/${slug}` — resulting in `/project/:slug/actual-slug` (literally `:slug` in the path). Should be `to="/project"`.

### 3. Enrichment only runs in small batches
Both AI enrichment (10 at a time) and Provident extraction (25 at a time) require clicking repeatedly. User wants a "Full" button that processes ALL projects continuously until done, even if it takes time.

---

## Fix 1: Provident Batch Extract — Column Name Fix

**File:** `supabase/functions/provident-batch-extract/index.ts`

Change all document insert objects:
- `document_url` to `file_url`
- `document_name` to `file_name`
- Fix `onConflict` from `"project_id,document_type,document_url"` to `"project_id,file_url"`

3 locations for column names (brochure, payment plan, floor plan inserts) and 1 upsert call.

## Fix 2: Project Route Redirect

**File:** `src/App.tsx`

Change line 794 from:
```
<Route path="/projects/:slug" element={<RedirectWithParams to="/project/:slug" />} />
```
to:
```
<Route path="/projects/:slug" element={<RedirectWithParams to="/project" />} />
```

## Fix 3: Full Enrichment Mode — Process ALL Projects

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

Add a "Full AI Enrichment" button that loops through ALL projects:
- Calls `ai-bulk-enrich` with limit=25 repeatedly until `processed === 0` (no more candidates)
- Shows live progress counter (e.g., "Enriched 150 of ~1800 projects...")
- Has a stop button to cancel mid-run
- Same pattern for Provident extraction: a "Full Provident Extraction" button that loops `provident-batch-extract` until no projects remain

**File:** `supabase/functions/ai-bulk-enrich/index.ts`

Increase max limit from 25 to 50 for faster throughput. Reduce throttle from 2s to 1s between AI calls since the rate limiter handles backoff automatically.

## Fix 4: Deploy Updated Edge Functions

Re-deploy both `ai-bulk-enrich` and `provident-batch-extract` after fixes.

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/provident-batch-extract/index.ts` | Fix `document_url` to `file_url`, `document_name` to `file_name`, fix `onConflict` |
| `supabase/functions/ai-bulk-enrich/index.ts` | Increase max limit to 50, reduce throttle |
| `src/App.tsx` | Fix `/projects/:slug` redirect from `to="/project/:slug"` to `to="/project"` |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add "Full" buttons for both AI and Provident enrichment with continuous loop + progress + stop |

## Expected Result

- Provident document extraction actually saves brochures, floor plans, and payment plan PDFs to the database
- Clicking a project listing from `/projects/...` correctly redirects to `/project/...`
- "Full AI Enrichment" button processes all 1,800+ projects automatically with live progress
- "Full Provident Extraction" button processes all projects automatically with live progress
- Both full modes can be stopped mid-run without data loss

