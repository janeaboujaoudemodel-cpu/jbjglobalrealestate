
# Complete Reelly × Provident Synchronization System Rebuild

## Executive Summary

This plan addresses the critical failures in the current synchronization system and implements a robust, enterprise-grade solution that ensures:
- 100% data extraction from Reelly API (floor plans, brochures, amenities, etc.)
- Persistent sync state that survives page refresh
- Premium UI with full Reelly parity for project pages
- Best-in-class developer directory merging Reelly data with Provident-style UI

## Current State Analysis

### Database Statistics
| Metric | Count | Status |
|--------|-------|--------|
| Total Projects | 1,804 | Synced |
| Projects with Cover Images | 1,802 | 99.9% |
| Projects with Floor Plans | 0 | CRITICAL |
| Projects with Amenities | 0 | CRITICAL |
| Projects with Payment Breakdown | 1 | CRITICAL |
| Project Documents | 0 | CRITICAL |
| Developers | 554 | Synced |
| Developers with Logos | 550 | 99.3% |
| Developers with Feature Images | 401 | 72.4% |
| Pending Imports | 1,804 | Queued |

### Critical Issues Identified

1. **Data Extraction Incomplete**: The `reelly-fetch-details` function only updates `pending_project_imports` table, but the detail data (floor_plans, documents, amenities, unit_types) is NOT being transferred to the live `projects` table during approval.

2. **Bulk Approve Mapping Gap**: The `bulk-approve-imports` function correctly maps these fields BUT the pending imports don't have the data populated because `reelly-fetch-details` hasn't been run on them.

3. **Sync Order Problem**: Projects are approved before detail enrichment runs, so they end up with null values for floor_plans, amenities, etc.

## Implementation Plan

### Phase 1: Fix Data Pipeline Order

The sync pipeline must execute in this order:
1. Fetch project list from Reelly API → `pending_project_imports`
2. Fetch detailed data for each project → Update `pending_project_imports` with floor plans, docs, amenities
3. Approve and publish → Transfer complete data to `projects` table

---

### Phase 2: Upgrade Detail Fetcher

**File: `supabase/functions/reelly-fetch-details/index.ts`**

Enhance to fetch ALL detail fields:
- Extract `floor_plans` array with bedroom types and PDF URLs
- Extract `brochures` and `documents` array
- Extract full `amenities` list (not just 5-10 items)
- Extract `unit_types` with pricing and availability
- Extract `payment_plan` milestones
- Extract `faqs` if available
- Extract `highlights` and `features`

Add a "fill_all" mode that runs on already-approved projects to backfill missing data directly into the `projects` table.

---

### Phase 3: Create Backfill Function

**File: `supabase/functions/reelly-backfill-projects/index.ts`** (NEW)

This function will:
1. Query projects that have `reelly_id` but null `floor_plan_types`, `amenities`, etc.
2. For each project, fetch detail from Reelly API using the reelly_id
3. Update the project directly in the `projects` table
4. Track progress in `sync_jobs` for persistence

```text
Processing Logic:
┌──────────────────────────────────────────────────────────────┐
│  SELECT FROM projects WHERE reelly_id IS NOT NULL            │
│  AND (floor_plan_types IS NULL OR amenities IS NULL)         │
│  LIMIT batch_size                                            │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  For each project:                                           │
│  1. Fetch /api/v2/clients/projects/{reelly_id}              │
│  2. Extract floor_plans, documents, amenities, unit_types    │
│  3. UPDATE projects SET ... WHERE id = project.id            │
└──────────────────────────────────────────────────────────────┘
```

---

### Phase 4: Upgrade Admin Panel

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Add new workflow step:
1. **Step 1**: Sync Project List (existing)
2. **Step 2**: Enrich All Details (NEW - runs reelly-backfill-projects)
3. **Step 3**: Sync Developers (existing)
4. **Step 4**: Generate AI Interiors (existing)
5. **Step 5**: Extract Areas (existing)

Add "Backfill Missing Data" button that:
- Shows count of projects missing floor plans/amenities
- Runs backfill in batches
- Displays progress with persistence

Add resume banner that reads from `sync_jobs` table on mount.

---

### Phase 5: Developer Directory Enhancement

**File: `src/pages/Developers.tsx`**

Enhance developer cards to match Provident layout:
- Hero image (feature_image_url from developer or first project cover)
- Logo overlay
- Short description (truncated to 2 lines)
- Project count
- "View Developer" CTA

**File: `src/pages/DeveloperDetail.tsx`**

Add sections:
- Founded year, headquarters, completed projects stats
- Full description with markdown rendering
- Interactive map showing only this developer's projects
- Projects grid filtered by emirate

**File: `src/components/developer/DeveloperProjectsMap.tsx`** (Already exists)

Verify it's properly integrated and filtering works correctly.

---

### Phase 6: Project Detail Parity with Reelly

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Ensure all sections render when data exists:
- Floor Plans Gallery (currently shows nothing because data is null)
- Brochure Download (same issue)
- Amenities Grid
- Unit Inventory Table
- Construction Progress Timeline
- Payment Plan Visualization

The UI components already exist but are hidden due to missing data.

---

### Phase 7: Content Quality Improvements

**File: `src/lib/markdownUtils.ts`**

Enhance `renderMarkdownToHtml` to:
- Strip hashtags (#PropertyInDubai etc.)
- Convert bullet lists properly
- Handle line breaks consistently
- Limit paragraph lengths for readability

**File: `supabase/functions/batch-generate-interiors/index.ts`** (Already exists)

Verify it generates images for:
- Kitchen interiors
- Bathroom styles
- Living room concepts
- Color palette boards

---

### Phase 8: Global Map Enhancement

**File: `src/pages/PropertyMap.tsx`**

Add features:
- Developer filter dropdown
- Buy/Rent toggle (currently shows "all")
- Area filter
- Improved marker clustering for dense areas

---

## Technical Implementation Details

### Backfill Function Schema

```typescript
// Input
interface BackfillRequest {
  mode: 'batch' | 'all' | 'specific';
  batch_size?: number; // default 50
  project_ids?: number[]; // for specific mode
  force_refresh?: boolean; // overwrite existing data
}

// Response
interface BackfillResponse {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
  remaining: number;
  errors?: string[];
}
```

### Data Mapping

```text
Reelly API Field              → Projects Table Column
─────────────────────────────────────────────────────
floor_plans[]                 → floor_plan_types (JSONB)
documents[] / brochures[]     → project_documents (via junction)
amenities[] / facilities[]    → amenities (TEXT[])
units[] / unit_types[]        → unit_types (JSONB)
payment_plan.milestones       → payment_breakdown (JSONB)
faqs[]                        → faqs (JSONB)
highlights[] / features[]     → highlights (JSONB)
```

### Sync Persistence

The `sync_jobs` table already has:
- `id`, `status`, `current_page`, `next_cursor`
- `stats_created`, `stats_updated`, `stats_skipped`, `stats_errors`
- `error_log` (JSONB array)

Each batch updates this table, allowing resume from any interruption point.

---

## Execution Order

1. **Create `reelly-backfill-projects` edge function** - New function to backfill existing projects
2. **Update `ReellyImportPanel.tsx`** - Add backfill step to admin workflow
3. **Run backfill on all 1,804 projects** - Populate missing floor_plans, amenities, etc.
4. **Verify data in projects table** - Confirm non-null counts increase
5. **Test project detail pages** - Floor plans, amenities sections should now render
6. **Enhance developer pages** - Add map integration and Provident-style layout
7. **Enhance global map** - Add developer filter

---

## Success Criteria

| Requirement | Metric |
|-------------|--------|
| Projects with floor plans | > 1,000 (from 0) |
| Projects with amenities | > 1,500 (from 0) |
| Projects with brochures | > 500 (from 0) |
| Sync persistence | Refresh page during sync → resumes from last batch |
| Developer cards | Show logo, image, description, project count |
| Developer map | Shows only that developer's project pins |
| Global map filters | Developer, Buy/Rent, Area dropdowns work |
| Project detail parity | All Reelly sections visible when data exists |

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/reelly-backfill-projects/index.ts` | Backfill missing detail data to projects table |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/reelly-fetch-details/index.ts` | Add mode to update projects table directly |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Add backfill step, improve resume UI |
| `src/pages/Developers.tsx` | Enhance card layout, add project counts |
| `src/pages/DeveloperDetail.tsx` | Add founder/stats section, verify map works |
| `src/pages/PropertyMap.tsx` | Add developer filter dropdown |
| `src/lib/markdownUtils.ts` | Strip hashtags, improve formatting |

---

## Risk Mitigation

1. **API Rate Limiting**: Use 200ms delay between requests, batch size of 50
2. **Partial Failures**: Track errors in `sync_jobs.error_log`, provide retry-failed button
3. **Data Corruption**: Always use UPSERT pattern, never DELETE before INSERT
4. **UI Regression**: Existing components already handle null data gracefully

This plan prioritizes the data backfill first since the UI components already exist and are just waiting for data to render.
