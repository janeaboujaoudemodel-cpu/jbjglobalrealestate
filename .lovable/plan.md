
# Restoration & Enhancement Plan: Provident Extraction Pipeline

## Problem Summary
The extraction checklist in the **Test One Listing** panel shows red (failed) items because:
1. Location distances are not being extracted (0 count)
2. FAQs are not being extracted (0 count)  
3. Documents are sometimes missing (0 count)
4. The Firecrawl markdown parsing patterns don't match all Provident page variations

## Root Cause
The extraction relies on regex patterns in `extract.ts` to parse Firecrawl markdown output. However:
- Provident's Gatsby site has varying markdown structures per project
- The current patterns miss certain heading formats and section layouts
- The `pagedata-detail.ts` module (which can get structured JSON directly from Gatsby) exists but isn't being used in the main extraction pipeline

---

## Implementation Plan

### Phase 1: Fix Markdown Extraction Patterns (Critical)

**File: `supabase/functions/_shared/provident/extract.ts`**

1. **FAQs Extraction Fix**
   - Add multiple heading pattern variations: "FAQ", "FAQs", "Q&A", "Frequently Asked Questions", "Useful Information", "Common Questions"
   - Fix Q&A parsing to handle both "Q:" and "**Q:**" formats
   - Add fallback for numbered FAQ format ("1. Question...")

2. **Location Distances Fix**
   - Add reversed order pattern: "Place - N minutes" (not just "N minutes – Place")
   - Add metric distance support: "N km to Place"
   - Normalize time formats: "mins" → "Minutes", "min" → "Minute"
   - Handle variations with/without leading dashes

3. **USP Bullets Fix**
   - Fix section extraction to capture all bullet points even without explicit heading
   - Add fallback for unmarked USP sections that use paragraph formatting

### Phase 2: Integrate Gatsby Page-Data as Primary Source

**File: `supabase/functions/batch-extract-pending/index.ts`**

1. Try Gatsby page-data.json endpoint FIRST (credit-free, structured)
2. Only fall back to Firecrawl if page-data fails or returns incomplete data
3. Merge data from both sources if needed (page-data for structured fields, Firecrawl for images/PDFs)

**New Integration Flow:**
```
For each pending import:
1. fetchProvidentPageDataDetail(slug) → Structured data (FAQs, USPs, amenities, distances)
2. If incomplete → fetchWithRetry(Firecrawl scrape) → Markdown + HTML
3. extractProvidentProjectFromScrape() → Parse images, PDFs
4. Merge: prefer page-data for structured fields, Firecrawl for media
5. mirrorRemotePdfToPublicStorage() → Copy brochures to our storage
```

### Phase 3: Update Completeness Check

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

Current core completeness check at line 332-335:
```typescript
const coreComplete = hasImages && hasBrochure && hasDescription && hasDeveloper;
const fullyComplete = coreComplete && hasUsps && hasAmenities && hasLocation && hasPrice && hasFaqs;
```

Update to:
1. Make `fullyComplete` more lenient for fields that are genuinely unavailable on some project pages
2. Add a "partial" status for projects that have core fields but missing optional extended fields
3. Show which fields failed with specific reasons in the checklist

### Phase 4: Fix PDF/Brochure Mirroring

**File: `supabase/functions/_shared/provident/pagedata.ts`**

1. The current `fetchProvidentPageDataPdfUrls` function correctly finds PDFs
2. Issue: Some PDFs fail to mirror because they're path-only strings (e.g., "Project Brochure.pdf" without full URL)
3. Fix: Improve URL normalization to handle relative paths and path-only strings

---

## Technical Changes Summary

| File | Changes |
|------|---------|
| `supabase/functions/_shared/provident/extract.ts` | Fix FAQ patterns (lines 470-520), fix distance patterns (lines 449-480), improve USP extraction (lines 287-314) |
| `supabase/functions/batch-extract-pending/index.ts` | Add page-data integration before Firecrawl call, merge extraction results |
| `supabase/functions/_shared/provident/pagedata-detail.ts` | Already complete - no changes needed |
| `supabase/functions/_shared/provident/pagedata.ts` | Fix URL normalization for path-only strings |
| `src/components/listing-admin/TestOneListingPanel.tsx` | Improve checklist display with specific failure reasons |

---

## Testing Strategy

After implementation:
1. Run "Test One Listing" on multiple Provident URLs
2. Verify all checklist items show green for well-structured projects
3. For projects with genuinely missing data (no FAQs on source page), show "Not available on source" instead of red X
4. Test extraction of: sobha-seahaven, emaar-the-oasis, damac-lagoons, mercedes-benz-places-binghatti

---

## Expected Outcome

After implementation:
- Extraction checklist shows green for all fields that exist on the source page
- Fields genuinely missing from source show neutral status (not red failure)
- Documents (brochure, payment plan, floor plans) are reliably mirrored
- FAQs, location distances, USPs, amenities extract correctly from all page variations
- Reelly-style unified data model preserved (all fields flow to `UnifiedProject`)
