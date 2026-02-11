
# Fix Plan: Complete Provident Enrichment with Full Firecrawl Extraction

## Root Cause

The current "Provident Enrichment" uses `pagedata-detail.ts` which calls Provident's `page-data.json` endpoint. For many projects (including Titania), this endpoint returns `"No record found"` -- meaning zero data is available from the free JSON source. That's why you see 0 images, 0 documents, 0 USPs, 0 FAQs, etc.

The system already has `full-project-extract` which does proper Firecrawl scraping and extracts ALL sections (USPs, amenities, floor plans, payment plans, FAQs, location distances, brochure, description, images) via markdown parsing. But it's only wired to the import queue, not to published project enrichment.

## Solution: Wire Full Firecrawl Extraction into the Test Enrichment Flow

### Step 1: Upgrade `enrich-project-test` Edge Function

Add a third data source: when both Reelly API and Provident page-data return empty, fall back to Firecrawl scraping of the Provident page (using the same extraction logic from `full-project-extract`).

**File:** `supabase/functions/enrich-project-test/index.ts`

Changes:
- Import or inline the `extractFromMarkdown()` function from `full-project-extract`
- After Reelly + page-data attempts, if key fields are still empty (amenities, USPs, FAQs, description, images, documents), trigger a Firecrawl scrape of `https://providentestate.com/new-projects/{slug}/`
- Map the Firecrawl-extracted data into the enrichment accumulator (USPs, location distances, amenities, FAQs, floor plans, payment breakdown, images, documents/brochure)
- Return all extracted data in the Before/After response

### Step 2: Create Shared Extraction Module

Extract the markdown parsing logic from `full-project-extract` into a shared module to avoid code duplication.

**New file:** `supabase/functions/_shared/provident/extract-from-markdown.ts`

This module will contain:
- `extractFromMarkdown(markdown, html, links)` -- the deterministic regex parser
- Extracts: name, description, USPs (headline + bullets + image), location (headline + description + distances + image), amenities, floor plan types, FAQs, payment breakdown, images (CloudFront URLs), documents (PDFs categorized as brochure/payment/floor)

### Step 3: Update Before/After Checklist in UI

The checklist already has 14 items (from the previous fix). Ensure the "after" snapshot correctly reflects Firecrawl-extracted data for all fields.

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

Changes:
- Add a "Source: Firecrawl" indicator when Firecrawl was used as fallback
- Show gallery preview thumbnails (first 4 images) in the After card
- Show document names (brochure, payment plan, floor plans) in the After card so the user can verify

### Step 4: Single Test Listing Workflow

The user wants to test ONE project, see the full Before/After, click through to the live page, confirm correctness, then approve bulk.

The current test flow already supports this (enter slug, click test, see Before/After, click Apply). The fix is ensuring the data is actually populated by using Firecrawl when page-data returns empty.

Flow:
1. User enters project slug (e.g., "titania-binghatti" or auto-detected)
2. System tries: Reelly API -> Provident page-data -> Firecrawl scrape (fallback)
3. Before/After cards show all 14 metrics with checkmarks
4. User clicks "View Live" to inspect the current page
5. User clicks "Apply Enrichment" to write data
6. User clicks "View Live" again to confirm changes
7. Once satisfied, user runs bulk extraction

### Step 5: Bulk Extraction Uses Same Logic

Update the batch mode of `enrich-project-test` to use the same Firecrawl fallback, with rate limiting (1 concurrent, 3s throttle between items).

---

## Technical Details

### Firecrawl Scrape Configuration (for Provident pages)
```
url: https://providentestate.com/new-projects/{slug}/
formats: ["markdown", "links"]
waitFor: 8000
timeout: 60000
onlyMainContent: false
```

### Extraction Targets (from markdown parsing)
| Section | Regex Pattern | DB Field |
|---------|--------------|----------|
| Description | `/About the project\s*\n+(.+)/i` | `description` |
| USP Headline | `/Unique Selling Points\s*\n+###?\s*(.+)/i` | `usp_headline` |
| USP Bullets | Bullet list after USP headline | `usp_bullets` |
| USP Image | CloudFront URL near USP section | `usp_image_url` |
| Location Headline | `/Location\s*\n+###?\s*(.+)/i` | `location_headline` |
| Location Description | Text lines in location section | `location_description` |
| Location Distances | `/\d+\s*Minutes?\s*[--]\s*(.+)/i` | `location_distances` |
| Location Image | CloudFront URL near location section | `location_image_url` |
| Amenities | `/## Amenities\s*\n+(.+)/i` | `amenities` |
| Floor Plans | `/## Floorplans\s*\n+(.+)/i` | `floor_plan_types` |
| FAQs | Q&A pairs from "Useful Information" | `faqs` |
| Payment Plan | `/Payment Plan\s*\n*(\d+\/\d+)/i` | `payment_plan` |
| Payment Breakdown | Down/Construction/Completion percentages | `payment_breakdown` |
| Images | CloudFront image URLs (filtered, high-res) | `project_images` table |
| Brochure PDF | PDF URL containing "brochure" | `project_documents` table |
| Payment Plan PDF | PDF URL containing "payment" | `project_documents` table |
| Floor Plan PDFs | PDF URLs containing "floor" | `project_documents` table |

### Rate Limiting for Bulk
- 1 Firecrawl request per project
- 3-second delay between projects
- Stop on 402 (credit exhaustion)
- Skip projects that already have all fields populated

### Files Modified
1. **`supabase/functions/_shared/provident/extract-from-markdown.ts`** -- NEW shared module
2. **`supabase/functions/enrich-project-test/index.ts`** -- Add Firecrawl fallback source
3. **`supabase/functions/full-project-extract/index.ts`** -- Import shared module (dedup)
4. **`src/components/listing-admin/ReellyImportPanel.tsx`** -- Show source indicator and document details in After card
