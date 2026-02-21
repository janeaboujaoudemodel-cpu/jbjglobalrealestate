
# Complete Offline Mirroring: Save ALL Reelly Data Locally

## Current State (The Problem)

Your database currently stores external URLs (pointing to Reelly's servers) instead of saving the actual files locally. If the Reelly API disconnects, you lose:

| Asset Type | Total | Saved Locally | Still External |
|------------|-------|---------------|----------------|
| Cover Images | 1,838 | 106 (6%) | 1,732 (94%) |
| Gallery Images | 5,470 | 3,424 (63%) | 2,046 (37%) |
| Brochures/Documents | 263 | 0 (0%) | 263 (100%) |
| Floor Plan Images | ~1,838 | 0 (0%) | All external |
| Unit Types Data | 1,838 | 214 (12%) | 1,624 missing |
| Amenities | 1,838 | 314 (17%) | 1,524 missing |

## What This Plan Does

Downloads and saves EVERY asset into your own storage and database so the website works identically with or without the Reelly API.

---

## 1. Mirror Documents and Brochures to Local Storage

**File: `supabase/functions/reelly-complete-offline-save/index.ts`**

Add a `mirrorDocument` function (similar to `mirrorImage`) that:
- Downloads the PDF/document from the external URL
- Uploads it to the `project-media` storage bucket under `projects/{reellyId}/docs/`
- Updates `project_documents.file_url` with the local storage URL
- Handles Google Drive links by converting them to direct download URLs first

This runs as part of `buildUpdateData` for every project, alongside the existing image mirroring.

---

## 2. Mirror Floor Plan Images to Local Storage

**File: `supabase/functions/reelly-complete-offline-save/index.ts`**

Currently `floor_plan_types` stores JSON with external image URLs. The fix:
- After extracting floor plans, download each floor plan image
- Upload to `project-media` under `projects/{reellyId}/floorplans/`
- Save the local URL back into the `floor_plan_types` JSON
- Also create entries in `project_documents` with type `floor_plan`

---

## 3. Full Data Enrichment for ALL 1,838 Projects

**File: `supabase/functions/reelly-complete-offline-save/index.ts`**

Currently batch mode only processes projects with missing bedrooms/price/cover. Change to process ALL projects missing ANY data:
- Add checks for missing `amenities`, `unit_types`, `floor_plan_types`, documents
- Expand the query: `or("amenities.is.null,unit_types.is.null,cover_image_url.not.like.%mdafrewypkkrildjgtey%")`
- This ensures every project gets fully enriched with exact Reelly API data

---

## 4. New "Full Mirror" Mode for Emergency Complete Sync

**File: `supabase/functions/reelly-emergency-mirror/index.ts`**

Add a `full` mode that processes ALL projects (not just those with missing critical fields):
- Iterates every published Reelly project in batches of 10
- Calls `reelly-complete-offline-save` with `mirror_images: true` for each batch
- This is the "run once" command to fully localize everything

---

## 5. Update Daily Sync to Always Mirror New Assets

**File: `supabase/functions/daily-reelly-auto-sync/index.ts`**

Step 8 currently skips image mirroring (`mirror_images: false`). Change to:
- `mirror_images: true` — always download new images/documents locally
- Increase batch size to 50 for daily processing
- Add a new Step 9 that specifically targets projects with external (non-local) URLs to gradually convert them

---

## 6. Frontend: Load Everything from Local Database

**File: `src/pages/ProjectDetail.tsx`**
- The page already loads from the database — no changes needed for data source
- Documents, images, and floor plans will automatically show local URLs once mirrored

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- The brochure download handler already works with any URL — once documents point to local storage, downloads work without external dependencies

---

## 7. Trigger the Full Enrichment

After deploying the updated functions:
- Call `reelly-emergency-mirror` with `mode: "full"` to start the complete mirroring process
- This will process all 1,838 projects in batches, downloading every image, document, brochure, and floor plan to local storage
- Estimated processing: ~180 batches of 10 projects, running in parallel groups

---

## Technical Execution Order

1. Update `reelly-complete-offline-save` to add document/floor plan mirroring functions
2. Update `reelly-emergency-mirror` to add "full" mode targeting ALL projects
3. Update `daily-reelly-auto-sync` to enable `mirror_images: true` and add external URL cleanup step
4. Deploy all three functions
5. Trigger the full mirror job to start localizing all 1,838 projects

## Result After Completion

- Every image, brochure, floor plan, and document stored in your own storage
- All unit types, amenities, and project details saved in the database
- If Reelly API disconnects tomorrow, your website shows the exact same content
- Daily sync keeps mirroring any new projects or updates automatically
