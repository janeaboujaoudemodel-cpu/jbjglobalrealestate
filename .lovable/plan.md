
# Fix Project Enrichment: API URL, Complete Data Extraction, and Clickable Cards

## Problem Summary
The enrichment test shows identical "before" and "after" because:
1. The Reelly API URL is wrong (`/api/v2/projects/` instead of `/api/v2/clients/projects/`)
2. The function only extracts 5 fields (amenities, USPs, distances, images, docs) but ignores FAQs, floor plans, payment plans, unit types, description, video, and highlights
3. The before/after cards are not clickable -- they should link to the project detail page

---

## Changes

### 1. Fix Reelly API URL in Edge Function

**File: `supabase/functions/enrich-project-test/index.ts`**

Change line 19 from:
```
https://api-reelly.up.railway.app/api/v2/projects/${reellyId}
```
to:
```
https://api-reelly.up.railway.app/api/v2/clients/projects/${reellyId}
```

This matches the working URL used by all other Reelly functions (defined in `_shared/reelly-types.ts` as `REELLY_API_BASE`).

---

### 2. Extract ALL Missing Fields from Reelly API

Add extraction for these additional fields in the edge function:

| Field | Source in Reelly API | DB Column |
|-------|---------------------|-----------|
| FAQs | `project.faqs` | `faqs` (JSONB) |
| Floor Plans | `project.floor_plans` | `floor_plan_types` (JSONB) |
| Payment Plan | `project.payment_plan` | `payment_plan` (text) |
| Payment Breakdown | `payment_plan.milestones` | `payment_breakdown` (JSONB) |
| Unit Types | `project.units` / `project.unit_types` | `unit_types` (JSONB) |
| Description | `project.overview` | `description` (text) |
| Video URL | `project.video_reviews[0].url` | `video_url` (text) |
| Highlights | `project.highlights` | `highlights` (JSONB) |
| Service Charge | `project.service_charge` | `service_charge` (numeric) |
| ROI Estimate | `project.roi_estimate` | `roi_estimate` (numeric) |

Update the "before" snapshot to include counts for all these fields.
Update the "after" to show what would be added.
Update the "apply" action to write all fields to the database.

---

### 3. Make Before/After Cards Clickable

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Wrap both the BEFORE and AFTER card images/titles with a link to the project detail page:
```tsx
<a href={`/project/${enrichTestResult.project?.slug}`} target="_blank" rel="noopener noreferrer">
```

This opens the project listing page in a new tab when clicking on either card.

---

### 4. Update Before/After Display to Show All Fields

Add rows to the stats grid for the new fields:
- FAQs count
- Floor plans count  
- Unit types count
- Has description (yes/no)
- Has video (yes/no)
- Has payment plan (yes/no)
- Highlights count

Each row highlights in green when the "after" value is greater than the "before" value.

---

### 5. Update TypeScript Interface

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**

Expand the `EnrichmentTestResult` interface to include all new fields in `before` and `after` snapshots.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/enrich-project-test/index.ts` | Fix API URL, add extraction for FAQs/floor plans/payment/units/description/video/highlights, update apply logic |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Make cards clickable, expand interface, show all field counts in before/after |
