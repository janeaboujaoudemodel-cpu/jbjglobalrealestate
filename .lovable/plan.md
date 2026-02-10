
# Fix: Enrichment Tools -- Edge Function Errors, Progress Tracking, and Before/After Cards

## Problems Found

### 1. Missing config.toml entries (Functions fail to invoke)
- `provident-batch-extract` -- NOT in config.toml, so it cannot be deployed/called
- `reelly-bulk-enrich` -- NOT in config.toml, so it cannot be deployed/called
- `provident-enrich-projects` -- NOT in config.toml, so it cannot be deployed/called

This is why "Fetch Images & Docs (Provident)" and "Bulk Enrichment (Reelly API)" fail with "Failed to send request to edge function."

### 2. Wrong column names in `enrich-project-test` (Data insert fails silently)
The `project_documents` table has columns: `file_url`, `file_name`
But `enrich-project-test/index.ts` line 218 uses: `document_url`, `document_name`
This means document insertion silently fails, so the "After" card shows no improvement.

Similarly, `project_images` has column `display_order`, but the enrich-project-test uses `sort_order` (line 206). This also fails silently.

### 3. `provident-batch-extract` uses `upsert` with `onConflict` on non-existent unique constraints
Lines 224 and 280 use `upsert(..., { onConflict: "project_id,file_url" })` and `upsert(..., { onConflict: "project_id,image_url" })` but no unique constraints exist on these columns. This causes inserts to fail.

### 4. No progress tracking or before/after cards for bulk enrichment
The Reelly and Provident bulk sections only show summary counts after completion. User wants the same before/after card comparison with checklists that the test enrichment has.

## Fix Plan

### Step 1: Add missing config.toml entries
Add `provident-batch-extract`, `reelly-bulk-enrich`, and `provident-enrich-projects` to `supabase/config.toml` with `verify_jwt = false`.

### Step 2: Fix column names in `enrich-project-test/index.ts`
- Line 206: Change `sort_order` to `display_order`
- Line 218: Change `document_url` to `file_url`
- Line 219: Change `document_name` to `file_name`

### Step 3: Fix `provident-batch-extract/index.ts` -- replace upsert with insert
- Line 224: Replace `upsert(..., { onConflict: "project_id,file_url" })` with regular `insert()`
- Line 280: Replace `upsert(..., { onConflict: "project_id,image_url" })` with regular `insert()`
- Add deduplication check before insert (query existing URLs first)

### Step 4: Add progress tracking with per-project results to bulk sections
Update `ReellyImportPanel.tsx` to:

**For Reelly Bulk Enrichment:**
- Add a results list state that accumulates per-project results as batches complete
- Show each project with before/after checklist (images, docs, amenities, FAQs, floor plans, unit types, payment plan, video, description, highlights)
- Color-code: green for improved fields, gray for unchanged
- Show running totals: processed / pending / done / failed

**For Provident Extraction:**
- Same pattern: accumulate per-project results showing PDFs found, images found, docs inserted, images inserted
- Show matched slug and error details per project

**For AI Content Generation:**
- Already has per-project results but show them in a scrollable card list with field-level detail

### Step 5: Deploy all fixed edge functions
Redeploy: `enrich-project-test`, `provident-batch-extract`, `reelly-bulk-enrich`, `provident-enrich-projects`, `ai-bulk-enrich`

## Technical Summary

| File | Change |
|------|--------|
| `supabase/config.toml` | Add 3 missing function entries |
| `supabase/functions/enrich-project-test/index.ts` | Fix column names: sort_order->display_order, document_url->file_url, document_name->file_name |
| `supabase/functions/provident-batch-extract/index.ts` | Replace broken upsert with insert + dedup check |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add per-project before/after cards with checklists to bulk enrichment and Provident sections |

No database schema changes needed.
