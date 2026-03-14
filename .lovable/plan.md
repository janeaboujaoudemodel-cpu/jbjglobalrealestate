

## Plan: Listing Admin Source Naming Fix, Provident Portal Hub & Enrichment Dashboard

### Current State

**Source naming issues found in 6 files:**
- `SourceCountsPanel.tsx`: Uses `source-a`/`source-b` internal types, but labels are already "Provident Portal" and "Reelly Portal" — the internal type names need cleanup
- `ProvidentSyncButton.tsx`: Shows "External Source Sync" (line 234)
- `PendingUpdatesQueue.tsx`: Falls back to "External Source" (line 483)
- `EnrichmentCenter.tsx`: Shows "External Source Enrichment" (lines 525, 562), "External API Enrichment" (line 552)
- `ExtractionJobsPanel.tsx`: Shows source names from `external_data_sources` DB table — these may need DB-level name updates
- `AdminDevelopers.tsx`: Shows "External Source Sync" header (line 383)

**Provident extraction tools** currently live inside `ReellyImportPanel.tsx` (lines 1211-1255) — nested deep in the Reelly flow. Task 6 requires moving these into a dedicated Provident Portal Hub.

**No dedicated Provident Portal Hub exists.** When clicking the Provident source card, it just filters the existing tabs. No centralized dashboard for scrape stats, timestamps, enrichment status.

### Implementation Plan

#### 1. Fix All Source Naming (Task 1, 5)

Rename across all files:

| File | Current | New |
|------|---------|-----|
| `SourceCountsPanel.tsx` | `source-a`/`source-b` type + "Reelly Portal" | `provident`/`reelly` type + "PROVIDENT PORTAL" / "REELLY API" |
| `ProvidentSyncButton.tsx` | "External Source Sync" | "Provident Source Sync" |
| `PendingUpdatesQueue.tsx` | "External Source" fallback | "Source" fallback |
| `EnrichmentCenter.tsx` | "External Source Enrichment", "External API Enrichment", "external sources" | "Provident Enrichment", "Reelly API Enrichment", "data sources" |
| `ExtractionJobsPanel.tsx` | Reads from DB `external_data_sources.name` — add display name mapping |
| `AdminDevelopers.tsx` | "External Source Sync" | "Provident Source Sync" |

#### 2. Create Provident Portal Hub Component (Tasks 4, 6)

New file: `src/components/listing-admin/ProvidentPortalHub.tsx`

This component displays when the Provident source is selected and shows:
- **Stats cards**: Total projects scraped, newly discovered, enriched, pending, updated
- **Scrape timestamps**: Last scrape time + previous scrape runs (from `extraction_job_logs` where source = provident)
- **Provident Firecrawl Extraction tools** (relocated from `ReellyImportPanel.tsx` lines 1211-1255): Extract Single + Full Extraction buttons with progress
- **Enrichment status per-project**: Enriched fields count, pending enrichment, before/after indicators

#### 3. Provident Enrichment Status Dashboard (Task 3)

Add to `ProvidentPortalHub.tsx`:
- Query projects table for enrichment field coverage (amenities, floor_plan_types, documents count, gallery count, description length, handover_date presence, developer_name presence)
- Display per-project enrichment scorecard: enriched fields vs pending
- Show aggregate stats: X projects fully enriched, Y partially, Z unenriched
- Before/after comparison links (already partially in `EnrichmentAuditPanel`)

#### 4. Integrate Provident Portal Hub into Data Ops (Tasks 4, 5, 6)

Modify `ListingAdmin.tsx`:
- When `activeSource === "provident"`, show the new `ProvidentPortalHub` as a prominent section above or as a new tab
- Remove the Provident Firecrawl Extraction section from `ReellyImportPanel.tsx`
- Source selector already has Provident on LEFT and Reelly on RIGHT — confirmed correct

#### 5. Source-Level Data Enrichment (Task 2)

The enrichment edge functions already exist (`provident-enrich-project`, `reelly-auto-enrich`). The Provident Portal Hub will surface their controls more prominently. No new edge functions needed — just better UI organization.

### Files Summary

| File | Change |
|------|--------|
| New: `ProvidentPortalHub.tsx` | Provident Portal Hub with stats, scrape timestamps, extraction tools, enrichment dashboard |
| `SourceCountsPanel.tsx` | Replace `source-a`/`source-b` with `provident`/`reelly`, rename labels to "PROVIDENT PORTAL" / "REELLY API" |
| `EnrichmentCenter.tsx` | Replace all "External Source/API" labels with proper names |
| `PendingUpdatesQueue.tsx` | Replace "External Source" fallback |
| `ProvidentSyncButton.tsx` | Rename "External Source Sync" |
| `AdminDevelopers.tsx` | Rename "External Source Sync" header |
| `ExtractionJobsPanel.tsx` | Add display name mapping for sources |
| `ReellyImportPanel.tsx` | Remove Provident Firecrawl Extraction section (moved to ProvidentPortalHub) |
| `ListingAdmin.tsx` | Add ProvidentPortalHub as a new Data Ops tab when Provident is active source |

### Implementation Order

1. Fix source naming across all 6 files
2. Create ProvidentPortalHub component with stats + extraction tools + enrichment dashboard
3. Remove Provident extraction from ReellyImportPanel
4. Wire ProvidentPortalHub into ListingAdmin Data Ops tabs

