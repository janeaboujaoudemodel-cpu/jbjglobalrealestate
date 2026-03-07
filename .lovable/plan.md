

# Plan: Enrich-Before-Approve Pipeline + Provident Enrichment Center

## Problem Summary

1. **Pending Updates Queue** (`listing_pending_updates` table) has **1,616 "new_project" records** from the `Provident Estate - Developers` external source. These are empty shells with only names — no images, descriptions, or data. The current UI says "Will be enriched after approval" which is backwards.
2. The **Enrichment Center** only has Reelly enrichment. No Provident enrichment tab exists.
3. The approval flow allows approving unenriched projects, which creates garbage listings.

## What We Will Build

### 1. Migrate 1,616 Legacy Pending Updates → `pending_project_imports` Queue

The 1,616 records in `listing_pending_updates` are just project names from Provident. We will:

- Create a new edge function `enrich-pending-imports` that:
  1. Reads all 1,616 `new_project` rows from `listing_pending_updates` (status=pending)
  2. For each: derives a Provident slug from the project name
  3. Uses the existing `fetchProvidentPageDataDetail()` (free, no Firecrawl credits) to pull structured data: images, amenities, payment plans, FAQs, USPs, location distances, floor plans
  4. If page-data returns data, creates a fully enriched record in `pending_project_imports` with all fields populated
  5. If page-data fails and Firecrawl is available, does a single Firecrawl scrape as fallback
  6. Marks the original `listing_pending_updates` row as `migrated`
  7. Processes in batches of 10 with a 22s time budget per invocation (matches existing patterns)

**Files**: `supabase/functions/enrich-pending-imports/index.ts` (new)

### 2. Block Approval of Unenriched Projects (Balanced Gate)

Update `PendingImportCard.tsx` and `ProjectApprovalQueue.tsx`:

- The Approve button is **disabled** when a project is missing core fields: description, developer name (not "unknown"), 2+ images, and at least 1 document (brochure)
- Show a clear "Needs Enrichment" status instead of "Incomplete"
- The Repair button triggers enrichment (already exists via `repair-project-extraction`)
- Add a bulk "Enrich All Incomplete" button that calls the new `enrich-pending-imports` function in batch mode

**Files**:
- `src/components/listing-admin/PendingImportCard.tsx` — disable Approve when unenriched
- `src/components/listing-admin/ProjectApprovalQueue.tsx` — add "Enrich All" bulk action button

### 3. Provident Enrichment Tab in Enrichment Center

Add a second enrichment panel alongside the existing Reelly one:

- New component `ProvidentEnrichmentPanel` inside `EnrichmentCenter.tsx`
- Stats: total published projects, how many have Provident data gaps (missing amenities, payment plans, FAQs, USPs, documents)
- "Start Provident Enrichment" button that calls `provident-enrich-projects` edge function in successive batches (same pattern as Reelly auto-enrich)
- Live log showing per-project results (matched slug, images added, fields updated)
- This enriches **already published projects** by finding matching Provident pages and filling gaps

**Files**:
- `src/components/listing-admin/EnrichmentCenter.tsx` — add Provident tab with batch runner

### 4. Update PendingUpdatesQueue to Show Migration Status

Change the "Will be enriched after approval" message to show actual migration progress:
- When migration is running: show progress bar
- When complete: show "All projects migrated to approval queue"
- Add a "Migrate & Enrich All" button that triggers the migration edge function

**Files**:
- `src/components/listing-admin/PendingUpdatesQueue.tsx` — replace placeholder text, add migration trigger

### 5. Add "Provident Enrichment" Data Ops Tab

Add a dedicated tab in the Listing Admin Data Ops view:

**Files**:
- `src/pages/ListingAdmin.tsx` — add "Provident" tab trigger next to existing tabs

## Edge Function: `enrich-pending-imports/index.ts`

```text
Flow:
1. Read batch of listing_pending_updates (status=pending, change_type=create)
2. For each: parse project name from proposed_value JSON
3. Generate slug variants (same logic as provident-enrich-projects)
4. Call fetchProvidentPageDataDetail(slug) — FREE, no Firecrawl
5. If data found: build full pending_project_imports record with images, docs, amenities, etc.
6. Insert into pending_project_imports (or update if slug already exists)
7. Mark listing_pending_updates row as status=migrated
8. Return stats: { processed, enriched, failed, remaining }
```

## Implementation Order

1. Create `enrich-pending-imports` edge function
2. Update `PendingUpdatesQueue.tsx` — add migration button, remove "will be enriched after approval"
3. Update `PendingImportCard.tsx` — disable Approve when unenriched
4. Update `ProjectApprovalQueue.tsx` — add "Enrich All" bulk action
5. Update `EnrichmentCenter.tsx` — add Provident enrichment tab
6. Update `ListingAdmin.tsx` — wire new tab

## Files to Create/Modify

- `supabase/functions/enrich-pending-imports/index.ts` (new)
- `src/components/listing-admin/PendingUpdatesQueue.tsx`
- `src/components/listing-admin/PendingImportCard.tsx`
- `src/components/listing-admin/ProjectApprovalQueue.tsx`
- `src/components/listing-admin/EnrichmentCenter.tsx`
- `src/pages/ListingAdmin.tsx`

