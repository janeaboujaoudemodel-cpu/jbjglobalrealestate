
# Unified Enrichment Engine + Backfill Persistence Fix

## Problems Identified

1. **Backfill progress resets on navigation** -- The backfill function marks projects with `detail_fetched_at` timestamp, but the UI loads previous results from `sync_jobs` table and then starts a new batch that resets counters. The `loadPersistedBackfillResults` function loads old data, but `handleRunBackfill` immediately resets `aggregated` to zeros, wiping the display. Additionally, the edge function query uses `detail_fetched_at IS NULL` but `force_refresh=true` was being sent, causing already-processed projects to be re-fetched.

2. **Multiple broken enrichment buttons** -- There are 6+ separate enrichment sections (Backfill Missing Details, Test Project Enrichment, AI Content Generation, Provident Document Extraction, Bulk Enrichment Reelly API, Full Extraction) that each call different edge functions, most of which fail or extract nothing because they depend on Firecrawl credits being available or Provident slug matching.

3. **Project detail page link from admin** -- When clicking a project in the backfill results, there's no direct link to the internal project page showing merged Reelly + Provident data.

## Solution

### Part 1: Fix Backfill Persistence (Critical)

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

- In `handleRunBackfill`, initialize `aggregated` from the persisted `sync_jobs` data when resuming (not from zero)
- Show cumulative totals: previous run totals + current batch results
- Remove `force_refresh: true` from the default backfill call -- only use it when explicitly requested. The edge function already uses `detail_fetched_at IS NULL` which correctly skips already-processed projects
- Add a progress bar showing `(total_projects - remaining) / total_projects`
- After backfill completes, immediately reload persisted results so navigating away and back shows correct numbers

**File: `supabase/functions/reelly-backfill-projects/index.ts`**

- No changes needed -- the edge function already persists progress via `sync_jobs` and uses `detail_fetched_at` to skip processed projects. The issue is entirely in the frontend.

### Part 2: Consolidate to ONE Enrichment Button

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Remove these sections entirely from the UI:
- "AI Content Generation" card (calls `ai-bulk-enrich` which requires AI credits)
- "Fetch Images & Docs (Provident)" card (calls `provident-batch-extract` which needs Firecrawl)
- "Bulk Enrichment (Reelly API)" card (calls `reelly-bulk-enrich`, redundant with backfill)
- "FULL EXTRACTION" mega button (orchestrator that calls all the broken functions)

Keep only:
- **Reelly API Sync** (Step 1/2: Test + Sync projects from API)
- **Backfill Missing Details** (calls Reelly API directly -- this works)
- **Test Project Enrichment** (single-project test using `enrich-project-test` -- this works and combines Reelly + Provident)

Replace the removed sections with ONE new card:

**"Enrich All Projects (Reelly + Provident)"** -- A single button that:
1. Calls `enrich-project-test` with `action: "apply"` in batches of projects
2. For each project, the existing `enrich-project-test` edge function already:
   - Fetches from Reelly API (primary source)
   - Fills gaps from Provident page-data (free, no Firecrawl needed for docs/PDFs)
   - Merges both sources non-destructively
3. Persists progress to `sync_jobs` table
4. Shows real-time progress with processed/enriched/errors counters

**File: `supabase/functions/enrich-project-test/index.ts`**

Add a `mode: "batch"` handler that:
- Queries projects missing enrichment data (no amenities, no FAQs, few images, etc.)
- Runs the existing enrichment logic for each project in the batch
- Returns batch results with progress info
- This reuses all the existing Reelly + Provident merging code already in this function

### Part 3: Add Project Page Link from Backfill Results

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

In the backfill results list dialog, make each project name a clickable link to `/project/{slug}` so the admin can immediately view the enriched project on the website.

### Part 4: Developer Sync, Areas Sync, Data Integrity -- Keep As-Is

These sections work correctly and don't need changes.

## Technical Summary

| File | Change |
|------|--------|
| `src/components/listing-admin/ReellyImportPanel.tsx` | Fix backfill persistence; remove 4 broken enrichment sections; add single unified "Enrich All" button; add project links in results |
| `supabase/functions/enrich-project-test/index.ts` | Add `mode: "batch"` to process multiple projects using existing Reelly + Provident merge logic |

## What Changes for the Admin

- Backfill shows correct cumulative progress that persists across page navigations
- One "Enrich All" button replaces 4+ broken ones
- Enrichment actually works because it uses Reelly API (free) + Provident page-data.json (free) -- no Firecrawl credits needed for the core enrichment
- Each processed project in results links directly to its page on the website
