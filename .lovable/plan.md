

## Fix Provident Extraction: Full Data Parity with Source Pages

### Root Cause Analysis

The extraction pipeline has **3 cascading failures** that prevent full data extraction:

**Problem 1: Page-data.json parser returns empty structured data.**
The `pagedata-detail.ts` parser finds images in the JSON but gets 0 amenities, 0 USPs, 0 FAQs, 0 distances, 0 floor plans. The Provident API nests these fields under paths the parser doesn't check. Meanwhile, the Firecrawl markdown parser (`extract-from-markdown.ts`) CAN extract all these fields perfectly from the scraped page.

**Problem 2: Firecrawl fallback is never triggered.**
In `enrich-project-test`, the `needsFirecrawl` check (line 430) requires ALL fields to be empty. But since page-data returns 20 images, the system considers Firecrawl "Not needed" -- even though amenities, USPs, FAQs, distances, and floor plans are all still empty.

**Problem 3: No name verification on slug match.**
Provident recycles slugs. The slug `99-parkplace` now serves "Kaia by Emaar" -- a completely different project. The system blindly imports this wrong data.

---

### Fix 1: Always Run Firecrawl When Structured Fields Are Missing

**File: `supabase/functions/enrich-project-test/index.ts`**

Change the `needsFirecrawl` condition from "ALL fields must be empty" to "ANY critical structured field is empty":

Current (line 430-431):
```
const needsFirecrawl = enrichment.amenities.length === 0 && enrichment.usp_bullets.length === 0 &&
  enrichment.faqs.length === 0 && !enrichment.description && enrichment.gallery.length <= 1 && enrichment.documents.length === 0;
```

New logic:
```
const needsFirecrawl = enrichment.amenities.length === 0 || enrichment.usp_bullets.length === 0 ||
  enrichment.faqs.length === 0 || enrichment.location_distances.length === 0;
```

This ensures Firecrawl fires whenever structured fields are missing, even if images were already found.

Also update the Firecrawl merge logic to be additive (fill gaps, not replace):
- If page-data already provided images, keep them; only add Firecrawl images if none exist
- If page-data returned nothing for amenities/USPs/FAQs, fill from Firecrawl

---

### Fix 2: Add Name Verification Guard

**File: `supabase/functions/enrich-project-test/index.ts`** and **`supabase/functions/provident-enrich-projects/index.ts`**

After fetching Provident page-data, compare the returned project name against the local project name using word-token similarity:

```
function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}
```

If similarity is below 0.2, skip that Provident match entirely. This prevents "99 Parkplace" from importing "Kaia by Emaar" data.

---

### Fix 3: Fix Empty Array vs Null Guards

**File: `supabase/functions/provident-enrich-projects/index.ts`**

Change guards like `!project.amenities` to `(!project.amenities || (Array.isArray(project.amenities) && project.amenities.length === 0))` for all structured fields: amenities, faqs, floor_plan_types, usp_bullets, location_distances.

---

### Fix 4: Add Firecrawl Name Verification in Markdown Extraction

**File: `supabase/functions/enrich-project-test/index.ts`** (Firecrawl section)

After extracting from markdown, compare the extracted name against the local project name. If they don't match (similarity below 0.2), discard the extraction and try the next slug variant.

---

### Fix 5: Clean 99 Parkplace Bad Data

Run a one-time cleanup to remove the wrong "Kaia" images that were already imported. Since 99 Parkplace has no Provident listing, its data will remain from the Reelly source. The user can use the "Generate and Improve" feature in Listing Admin to manually extract from the developer's website.

---

### Fix 6: Image Filename-Based Deduplication

**File: `supabase/functions/_shared/provident/pagedata-detail.ts`**

Current deduplication uses exact URL matching. Add filename-based dedup: extract the filename portion from URLs (e.g., `Kaia_by_Emaar_at_The_Valley_8d6ea4c2e0.jpg`) and deduplicate on that. Filter out broken URLs like bare `.jpg`.

---

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/enrich-project-test/index.ts` | Fix `needsFirecrawl` to OR condition; add name similarity check for both page-data and Firecrawl matches |
| `supabase/functions/provident-enrich-projects/index.ts` | Add name similarity guard; fix empty-array guards |
| `supabase/functions/_shared/provident/pagedata-detail.ts` | Add filename-based image dedup; filter broken URLs |
| Database cleanup | Delete wrong Kaia images from 99 Parkplace project |

### Expected Result After Fix

When enriching any project:
1. Page-data.json is tried first (fast, no API credits)
2. If structured fields (amenities, USPs, FAQs, distances) are still empty, Firecrawl scrapes the page
3. Firecrawl markdown parser extracts ALL sections: description, USPs with bullets, amenities list, floor plan types, location with distances, payment breakdown percentages, FAQs, documents (brochure/payment plan PDFs)
4. Name verification prevents cross-contamination from recycled slugs
5. Result: full data parity with the Provident source page, displayed in your UI

