
## Comprehensive Fix Plan: Sarah Whitelist, News Page, Loading, and Enrichment

This plan addresses all issues raised across multiple areas of the application.

---

### 1. Remove URL Whitelist Restriction for Sarah (Listing Admin Chat)

**Problem:** The `listing-admin-chat` edge function checks URLs against `listing_admin_authorized_sources` table. Only 4 government sources exist (Dubai REST, Al Nair, DLD, RERA). Any other URL is blocked with "not in the authorized source whitelist."

**Fix:** Remove the authorization check entirely. Sarah should accept ANY URL, scrape it with Firecrawl, extract project data, and merge with existing listings if a match is found.

**File: `supabase/functions/listing-admin-chat/index.ts`**
- Remove the `isAuthorizedSource()` function call on line 141
- Always scrape the URL if Firecrawl key is available
- Remove the "UNAUTHORIZED SOURCE DETECTED" warning block (lines 167-176)
- Update system prompt to remove "CANNOT scrape unauthorized sources" restriction (line 272/281)
- Keep the scraping logic intact, just remove the gate

**File: `supabase/functions/listing-admin-chat/index.ts` (merge logic)**
- After extracting project data from a URL, search the `projects` table by name similarity
- If a matching project is found, merge the new data (images, documents, description, amenities) into the existing record
- If no match, suggest creating a new listing as currently done

---

### 2. News Page Fixes (Multiple Sub-Issues)

#### 2a. Hero Section Cleanup
**File: `src/pages/News.tsx`**
- The hero section text rendering is fine structurally; ensure no broken text by reviewing the badge/title markup
- Add the JBJ monogram alongside the hero for branding (import `jbjMonogramDark` and render it in the hero overlay area as a subtle watermark or centered element)

#### 2b. Search Bar + Sticky Category Filter
**File: `src/pages/News.tsx`**
- Add a search input to the category filter bar (search by title/excerpt)
- Ensure the category filter bar is properly sticky under the main header (`sticky top-16` is already set at line 321 -- verify it works and fix if content overflows)
- Fix content overflow in the filter bar that causes text to spill outside

#### 2c. Active Category Button Gold Champagne Style
**File: `src/pages/News.tsx`**
- Change the active category button style from `bg-black text-gold` to the gold champagne gradient: `bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#E2D4B8] text-black border border-gold/50`

#### 2d. News Cards Missing Photos
**File: `supabase/functions/ai-news-collector/index.ts`**
- Currently `pickNullFallback()` returns `null` (line 77). When no image is found from the source, news cards show a blank gradient placeholder
- Fix: After scraping, if no image found, use Firecrawl Search to find a relevant image for the article topic
- Add a secondary search step: search for `"{article title} Dubai real estate"` and extract the first good image from results
- Ensure each article gets a unique image (track used URLs to prevent duplicates across articles in same batch)
- Upgrade all image URLs to high quality (append `w=1920&q=90` for Unsplash-style URLs)

#### 2e. Add DLD Market Intelligence Section Under Each News Article
**File: `src/pages/NewsDetail.tsx`**
- After the AI Analysis section and before the Source Attribution, add a "Dubai Market Intelligence" section
- Reuse the DXB Interact / DLD transaction breakdown components from `News.tsx` (the `TransactionBreakdown` component and market stats)
- Extract the shared components into a reusable component or import the data constants directly

---

### 3. Fix Global Loading Spinner (BrandedLoader)

**Problem:** The BrandedLoader uses the monogram with a clip-path fill animation, but it's not properly centered or visible on all pages. Most pages still use the basic gold spinning circle (`PageLoader.tsx`).

**Fix:**
**File: `src/components/PageLoader.tsx`**
- Replace the basic spinning circle with the `BrandedLoader` component
- Import the BrandedLoader and use it with centered positioning

**File: `src/components/ui/BrandedLoader.tsx`**
- Verify the monogram is properly centered (it currently uses `min-h-[60vh]` which may not fill the full screen)
- Change to `min-h-screen` for full-page loading states
- Ensure the fill animation is smooth and visible

**File: `src/pages/NewsDetail.tsx`** (line 131)
- Replace the basic `Loader2` spinner with `BrandedLoader`

**File: `src/pages/News.tsx`** (line 345-348)
- Replace the basic `Loader2` spinner with `BrandedLoader`

---

### 4. Enrichment Flow Consolidation

#### 4a. Merge Provident Enrichment into Test Flow
**Problem:** There are two separate sections: "Test Project Enrichment" (Section 5 in Reelly card) and "Provident Enrichment" (Section 2, separate card). User wants a single flow: test one project first, then bulk.

**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- Move the Firecrawl extraction controls INTO the "Test Project Enrichment" section
- The test flow should: (1) Enter slug, (2) Test enrichment (which already includes Provident + Firecrawl), (3) Review checklist, (4) Apply
- Remove the separate "Provident Enrichment" card (Section 2) or collapse it into an "After testing, run bulk" section within the same card
- Keep "Page-Data Enrichment (Free)" as a sub-section since it uses no credits

#### 4b. Remove Reelly API Error References
**File: `src/components/listing-admin/ReellyImportPanel.tsx`**
- The enrichment test uses `enrich-project-test` which tries Reelly first then Provident. If Reelly token is expired, it shows "Reelly API error: 401"
- Update the error display to not show Reelly-specific errors when doing Provident extraction
- In the edge function, catch Reelly errors gracefully and proceed to Provident without surfacing the Reelly error

#### 4c. Ensure All Checklist Items Are Green
- The checklist already has proper green/red status indicators (lines 1045-1070)
- The issue is that the extraction doesn't populate all fields. This was addressed in the previous approved plan (Firecrawl OR fallback logic)
- Verify after deploying the previous fixes that the enrichment fills: amenities, USPs, FAQs, distances, floor plans, unit types, description, payment plan, video, highlights, service charge, ROI

---

### Summary of File Changes

| File | Change |
|------|--------|
| `supabase/functions/listing-admin-chat/index.ts` | Remove URL whitelist check; always scrape any URL; add merge logic for existing projects |
| `src/pages/News.tsx` | Add search input; fix active button to gold champagne style; add JBJ monogram to hero; replace Loader2 with BrandedLoader |
| `src/pages/NewsDetail.tsx` | Add DLD Market Intelligence section; replace Loader2 with BrandedLoader |
| `supabase/functions/ai-news-collector/index.ts` | Add Firecrawl Search fallback for missing article images; deduplicate across batch |
| `src/components/PageLoader.tsx` | Replace spinning circle with BrandedLoader |
| `src/components/ui/BrandedLoader.tsx` | Ensure proper full-screen centering |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Merge Provident section into test flow; suppress Reelly errors during Provident extraction |

### Technical Details

**Whitelist removal (listing-admin-chat):**
```text
// BEFORE: Check authorization, block if not whitelisted
const authCheck = await isAuthorizedSource(supabase, extractedUrl);
if (authCheck.authorized) { scrape... } else { warn unauthorized }

// AFTER: Always scrape any URL
console.log(`Scraping URL: ${extractedUrl}`);
const scrapeResult = await scrapeUrl(extractedUrl, FIRECRAWL_API_KEY);
```

**News image fallback (ai-news-collector):**
```text
// After scrape fails to find image:
// 1. Search Firecrawl for "{title} Dubai" 
// 2. Extract first good image from search results
// 3. Filter against already-used URLs in this batch
// 4. Upgrade to high quality
```

**Active category button style:**
```text
// FROM: "bg-black text-gold shadow-lg"
// TO: "bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#E2D4B8] text-black border border-gold/50 shadow-lg"
```
