
# Provident Data Enrichment, Map Fix, and Area Sync

## Overview

This plan creates a new edge function that matches existing Reelly projects with their Provident counterparts, extracts the missing details (gallery photos, payment plans, floor plans, brochures, amenities, USPs, FAQs, location distances), and merges them into the database without duplicating data. It also fixes the map scroll behavior and enhances the area sync system.

## Current State

- **1,795 Reelly projects** in the database, most with only 0-1 images and no payment plans, floor plans, or brochures
- **Sunset Bay Grand** (reelly_id 3003): 0 images, 0 documents, no amenities/payment plan despite `detail_fetched_at` being set (Reelly detail returned empty for these fields)
- **178 active areas** but no descriptions or photos for most
- **Map**: `scrollWheelZoom={true}` causes two-finger scroll to zoom instead of page scroll
- **Provident page-data detail extractor** already exists and can extract: images, USPs, amenities, payment breakdown, floor plans, FAQs, location distances, brochures, and PDFs

## Plan

### 1. New Edge Function: `provident-enrich-projects`

Creates a new function that:
1. Queries projects that are missing key data (no images, no payment plan, no amenities)
2. For each project, generates a Provident slug from the project name (e.g., "Sunset Bay Grand" becomes "sunset-bay-grand")
3. Calls `fetchProvidentPageDataDetail(slug)` from the existing shared module
4. If Provident has the data, merges it into the project WITHOUT overwriting existing Reelly data:
   - **Images**: Insert into `project_images` table (only if project has fewer than 3 images)
   - **Documents**: Insert brochures, payment plan PDFs, floor plan PDFs into `project_documents`
   - **Amenities**: Update `amenities` JSON column (only if currently NULL)
   - **Payment plan/breakdown**: Update `payment_plan` and `payment_breakdown` columns
   - **USPs**: Store in description or a new section (append to existing description)
   - **FAQs**: Update `faqs` JSON column
   - **Location distances**: Update `location_distances` JSON column
   - **Floor plan types**: Update `floor_plan_types` JSON column
5. Processes in configurable batches (default 10) with 1s delay between to avoid rate limits
6. Supports `project_id` parameter for single-project enrichment
7. Tracks what was enriched with `data_source: 'provident'` on images and documents

**File**: `supabase/functions/provident-enrich-projects/index.ts`

### 2. Fix Map Scroll Behavior

**File**: `src/components/project-detail/ProjectLocationMap.tsx`

Change `scrollWheelZoom={true}` to `scrollWheelZoom={false}` so that two-finger scroll on the page scrolls the page (not zooms the map). Users can still zoom via:
- Double-click to zoom in
- The existing zoom +/- buttons
- Pinch-to-zoom (touch gesture)

### 3. Enhanced Area Sync from Both Sources

**File**: `supabase/functions/reelly-areas-sync/index.ts`

The current area sync only fetches the first 500 projects from Reelly. Update to:
1. **Paginate through ALL Reelly projects** (1,795) to extract every unique area
2. **Also extract areas from Provident** using the page-data discovery module (which finds ~1,336 projects with location data)
3. **Merge without duplicates**: Match by normalized area name/slug
4. **Enrich area data**: For areas without descriptions or images, use AI to generate a premium description based on known project data in that area

### 4. Sunset Bay Grand Specific Fix

Run the enrichment for Sunset Bay Grand specifically to pull from Provident:
- Full gallery photos
- Payment plan PDF and breakdown
- Floor plans
- Brochure
- Amenities list
- USPs
- Location distances

## Technical Details

### Provident Slug Matching Strategy

The function will try multiple slug variations to find a match:
```text
"Sunset Bay Grand" -> try slugs:
  1. "sunset-bay-grand"
  2. "sunset-bay-grand-dubai-islands"  (append location)
  3. "sunset-bay-grand-imtiaz"  (append developer)
```

### Data Merge Rules (No Overwrites)

| Field | Rule |
|-------|------|
| `amenities` | Only set if currently NULL |
| `payment_plan` | Only set if currently NULL |
| `payment_breakdown` | Only set if currently NULL |
| `floor_plan_types` | Only set if currently NULL |
| `faqs` | Only set if currently NULL |
| `location_distances` | Only set if currently NULL |
| `description` | Keep Reelly description; append Provident USPs as a new section |
| Images | Only add if project has < 3 images; tag with `data_source: 'provident'` |
| Documents | Only add if no existing document of same type; tag with `data_source: 'provident'` |

### Map Interaction Changes

| Action | Before | After |
|--------|--------|-------|
| Two-finger scroll | Zooms map | Scrolls page |
| Double-click | Zooms map | Zooms map (unchanged) |
| Zoom buttons | Zoom in/out | Zoom in/out (unchanged) |
| Pinch gesture | Zooms map | Zooms map (unchanged) |

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/provident-enrich-projects/index.ts` | New edge function for Provident data enrichment |
| `src/components/project-detail/ProjectLocationMap.tsx` | `scrollWheelZoom={false}` to fix two-finger scroll |
| `supabase/functions/reelly-areas-sync/index.ts` | Full pagination + Provident area extraction + AI descriptions |
