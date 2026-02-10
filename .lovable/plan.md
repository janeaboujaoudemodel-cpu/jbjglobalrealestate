

# Bulk Project Enrichment — Fix Missing Photos, Documents, and Details

## The Problem

The database currently has:
- **1,809 published projects** but only **1 image per project** (just the cover image)
- **0 documents total** (no brochures, no floor plans, nothing)
- **0 enriched records** from either Reelly or Provident — the batch enrichment has never successfully run

The existing `provident-batch-extract` function tries to scrape Provident (an external website), which is unreliable and rate-limited. Meanwhile, **1,802 projects already have Reelly IDs** — and the Reelly API has full galleries, documents, and floor plans ready to fetch. The `enrich-project-test` function already knows how to extract this data, but it only works one project at a time.

## Solution

Build a new **bulk Reelly enrichment** function that processes projects in batches, pulling galleries (10-30 photos per project), documents (brochures, PDFs), floor plans, FAQs, payment plans, and all other details directly from the Reelly API. Also add a trigger button in the admin panel so you can run it yourself.

---

## Step 1: Create `reelly-bulk-enrich` Edge Function

**New file:** `supabase/functions/reelly-bulk-enrich/index.ts`

This function will:
1. Query all published projects that have a `reelly_id` but are missing data (0 documents, only 1 image)
2. Process them in batches of 20 with a 1-second delay between API calls
3. For each project, call the Reelly detail API (`/api/v2/clients/projects/{reellyId}`)
4. Extract using the existing shared helpers: `extractGalleryImages`, `extractDocuments`, `extractFloorPlans`, `extractAmenities`, `extractUnitTypes`
5. Insert gallery images into `project_images`, documents into `project_documents`
6. Update the project record with amenities, FAQs, floor plans, payment info, highlights, etc.
7. Return a progress summary (processed count, images added, docs added, errors)

Key design choices:
- Uses Reelly API (reliable, no rate limits like Firecrawl) instead of Provident scraping
- Non-destructive: only adds data where fields are empty, never overwrites existing data
- Processes up to 50 projects per invocation to stay within edge function timeout limits
- Logs progress so you can call it multiple times to work through all 1,802 projects

## Step 2: Add "Bulk Enrich" Button to Admin Panel

**Edit:** `src/components/listing-admin/ReellyImportPanel.tsx`

Add a new section in the admin panel with:
- A "Run Bulk Enrichment" button that calls `reelly-bulk-enrich`
- Progress display showing: projects processed, images added, documents added, errors
- A "Run Again" button to process the next batch
- Status text showing how many projects still need enrichment

## Step 3: Fix the Existing `provident-batch-extract`

**Edit:** `supabase/functions/provident-batch-extract/index.ts`

The current function has a bug: it only looks for projects where `cover_image_url IS NULL`, but 1,802 projects already have cover images from Reelly — they just lack additional gallery photos and documents. Fix the query to find projects with 0 documents regardless of cover image status.

---

## Technical Details

### Reelly Bulk Enrich Function Logic

```text
POST /reelly-bulk-enrich
Body: { "limit": 50 }

1. SELECT projects WHERE is_published = true 
   AND reelly_id IS NOT NULL
   AND id NOT IN (SELECT DISTINCT project_id FROM project_documents)
   LIMIT 50

2. For each project:
   a. GET Reelly API /projects/{reelly_id}
   b. Extract gallery -> INSERT into project_images
   c. Extract documents -> INSERT into project_documents  
   d. Extract amenities, FAQs, floor_plans, highlights, payment_plan
   e. UPDATE projects SET amenities=..., faqs=..., etc WHERE id=...
   f. Sleep 1 second

3. Return { processed: 50, images_added: 450, docs_added: 75, errors: 2 }
```

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/reelly-bulk-enrich/index.ts` | New | Batch enrichment using Reelly API for all projects |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Edit | Add bulk enrich button and progress display |
| `supabase/functions/provident-batch-extract/index.ts` | Edit | Fix query to find projects missing docs (not just cover images) |

### Expected Results After Running

After running the bulk enrichment across all 1,802 projects with Reelly IDs:
- Each project should have 5-30 gallery images (up from 1)
- Projects with available brochures/PDFs will have documents attached
- Amenities, FAQs, floor plans, payment plans, and highlights will be populated
- You can trigger it from the admin panel as many times as needed until all projects are enriched

