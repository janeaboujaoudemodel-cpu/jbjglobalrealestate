

# Fix Bulk Enrichment — The Reelly API Has No Detail Data

## Root Cause

After thorough investigation, the Reelly API detail endpoint (`/projects/{id}`) returns the **same limited data** as the list endpoint. It does NOT include:
- Gallery images (only cover image)
- Documents / brochures
- Floor plans
- FAQs
- Highlights / USP bullets
- Unit types
- Payment plan details
- Videos

This is why the bulk enrichment processed 50 projects and added **0 images, 0 docs, 0 fields** for every single one. The function code is correct — the API simply has nothing to give.

**Current state of 1,809 published projects:**
- 1,809 have descriptions
- 1,802 have amenities
- 1,809 have 1 cover image each
- **0** have FAQs, floor plans, highlights, unit types, payment plans, or documents

## Solution: Multi-Source Enrichment

Since the Reelly API cannot provide this data, we need two alternative approaches:

### Step 1: AI-Powered Content Generation

Create a new edge function `ai-bulk-enrich` that uses AI (Lovable AI / Gemini) to generate professional content for each project based on what we already know (name, developer, location, price range, bedrooms, amenities, description).

**Generated fields per project:**
- **FAQs** (5-8 relevant Q&As about the project)
- **Highlights / USP bullets** (5-7 key selling points)
- **Payment breakdown** (typical Dubai payment plans based on construction status)
- **Location distances** (nearby landmarks based on area/coordinates)

This runs in batches of 10 projects per invocation, using the existing project data as context for the AI.

### Step 2: Provident Image & Document Extraction

Fix and optimize the existing `provident-batch-extract` function to:
- Match project names to Provident slugs
- Fetch gallery images from Provident pages via Firecrawl
- Fetch PDF documents (brochures, floor plans, payment plans) from Provident's page-data.json endpoint (this part works WITHOUT Firecrawl credits)

The page-data.json approach for documents is free and reliable — it just fetches a JSON file from Provident's Gatsby build.

### Step 3: Updated Admin UI

Update the Reelly Import Panel to show two separate enrichment actions:
- **"Generate Content (AI)"** — Runs AI enrichment for FAQs, highlights, payment info
- **"Fetch Images & Docs (Provident)"** — Runs Provident extraction for photos and PDFs
- Progress display for both, showing what was added

---

## Technical Details

### New Edge Function: `ai-bulk-enrich/index.ts`

```text
POST /ai-bulk-enrich
Body: { "limit": 10, "action": "enrich" | "stats" }

For each project missing FAQs/highlights:
1. Build prompt with: name, developer, location, price range, amenities, description
2. Call Gemini via Lovable AI to generate:
   - 5-8 FAQs
   - 5-7 highlight bullets
   - Payment breakdown (if construction_status known)
   - Location distances (if lat/lng available)
3. Parse structured JSON response
4. UPDATE projects SET faqs=..., highlights=..., usp_bullets=..., payment_breakdown=...
```

### Fix: `provident-batch-extract/index.ts`

- Run the free page-data.json fetch for ALL projects (no Firecrawl needed for documents)
- Only use Firecrawl for images (with credit awareness)
- Better slug matching: try multiple slug variations (e.g., "amalia-residences", "amalia-residences-by-deyaar")

### Fix: `reelly-bulk-enrich/index.ts`

- Add raw API response logging so we can see exactly what Reelly returns
- Skip processing if the API has no enrichable data (avoid wasting time)
- Log a clear message: "Reelly API has no gallery/documents for this project"

### Updated Admin Panel: `ReellyImportPanel.tsx`

Add two new action cards:
- **AI Content Generation**: Button + progress for generating FAQs, highlights, USPs
- **Provident Document Fetch**: Button + progress for fetching brochures and floor plan PDFs
- Stats display showing current enrichment gaps

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/ai-bulk-enrich/index.ts` | New | AI-generated FAQs, highlights, payment info, location distances |
| `supabase/functions/reelly-bulk-enrich/index.ts` | Edit | Add raw logging, skip empty API responses gracefully |
| `supabase/functions/provident-batch-extract/index.ts` | Edit | Prioritize free page-data.json for docs, improve slug matching |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Edit | Add AI enrich + Provident extract buttons with progress |

### Expected Results

After running both enrichment passes across all projects:
- **AI Content**: Every project gets FAQs (5-8), highlights (5-7), USP bullets, and payment breakdown
- **Provident Docs**: Projects matching Provident listings get brochures, floor plan PDFs, and additional gallery images
- Projects not on Provident still get AI-generated professional content

