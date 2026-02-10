
# Simplify Listing Admin: Two Clear Sections

## Problem
The ReellyImportPanel currently has 13+ separate cards/sections for extraction and enrichment, many overlapping or broken. The user wants exactly TWO clear sections.

## Solution: Restructure into Two Sections

### Section 1: Reelly Enrichment (Green theme)
A single card that consolidates ALL Reelly-related operations:

**Sub-sections within the card:**
1. **API Connection** -- Test button + status badge (compact, inline)
2. **Project Sync** -- Quick Sync / Full Sync buttons + progress
3. **Backfill Details** -- Fetch floor plans, amenities, docs for approved projects (uses `reelly-backfill-projects`)
4. **Developer Sync** -- Test / Quick / Full buttons
5. **Areas Sync** -- Extract areas from projects
6. **Test Single Project** -- The enrichment test tool (Reelly source only)

**What gets REMOVED:**
- "Fetch Missing Details" card (lines 2336-2438) -- redundant with Backfill
- "Clean & Sync Fresh" card (lines 1818-1909) -- destructive, rarely used, move to a collapsible "Advanced" section
- "Data Integrity" card (lines 1978-2132) -- move to collapsible "Advanced"
- "API Connection Status" standalone card (lines 1109-1155) -- merge into main card header
- "Need API Key" card (lines 2852-2868) -- remove (key already configured)

### Section 2: Provident Enrichment (Blue/Orange theme)
A single card for ALL Provident extraction:

**Features:**
1. **Provident Full Extraction** -- Uses Firecrawl to scrape Provident pages for images, PDFs, brochures, floor plans (calls `provident-batch-extract`)
2. **Provident Page-Data Enrichment** -- Uses free page-data.json to fill FAQs, descriptions, amenities without Firecrawl credits (calls `enrich-project-test` in batch mode, Provident-only)
3. **Progress tracking** -- Real-time counters showing processed/enriched/errors
4. **Test Single Project** -- Provident source preview

**What gets REMOVED/CONSOLIDATED:**
- "Enrich All Projects (Reelly + Provident)" mega card (lines 2441-2602) -- split: Reelly part goes to Section 1, Provident part goes to Section 2

### Advanced Section (Collapsible)
A collapsible accordion at the bottom for maintenance tools:
- Clean & Sync Fresh
- Data Integrity / Restore to Reelly-Only
- Clear Stuck Jobs
- Resume Interrupted Sync

---

## Technical Changes

### File: `src/components/listing-admin/ReellyImportPanel.tsx`

**Remove these state variables and their related handlers (no longer needed):**
- `isFullExtracting`, `fullExtractionStep` (full extraction orchestrator removed)
- `isAiEnriching`, `aiEnrichResult`, `aiEnrichStats`, `isLoadingAiStats` (AI enrichment removed previously)
- `isProvidentExtracting`, `providentResult` (merged into new Provident section)
- `isGeneratingInteriors`, `interiorsResult` (AI interior generation removed)

**Restructure the JSX return to render in this order:**
1. Live Database Counts banner (compact)
2. Resume Sync banner (conditional)
3. **Section 1: Reelly Enrichment** -- single `Card` with internal sub-sections using dividers
4. **Section 2: Provident Enrichment** -- single `Card` with Firecrawl extraction + page-data enrichment
5. **Advanced Tools** -- collapsible `Accordion` with maintenance cards

**No edge function changes needed** -- all existing functions (`reelly-api-sync`, `reelly-backfill-projects`, `reelly-developers-sync`, `reelly-areas-sync`, `provident-batch-extract`, `enrich-project-test`) already work correctly. The change is purely UI reorganization.

### File: `supabase/functions/enrich-project-test/index.ts`

Add a `source: "provident_only"` option to the batch mode so the Provident section can call enrichment without touching Reelly data. This skips the Reelly API fetch and only runs Provident page-data extraction.

---

## Summary of Cards: Before vs After

| Before (13 cards) | After (3 sections) |
|---|---|
| API Connection Status | Merged into Reelly header |
| Reelly API Sync | Reelly Enrichment > Sync |
| Backfill Missing Details | Reelly Enrichment > Backfill |
| Clean & Sync Fresh | Advanced (collapsible) |
| Data Integrity | Advanced (collapsible) |
| Developer Sync | Reelly Enrichment > Developers |
| Areas & Emirates Sync | Reelly Enrichment > Areas |
| Fetch Missing Details | REMOVED (redundant) |
| Enrich All Projects | Split into both sections |
| Test Project Enrichment | Reelly Enrichment > Test |
| Need API Key | REMOVED |

**Result:** 2 main sections + 1 collapsible advanced section. Clean, simple, no confusion.
