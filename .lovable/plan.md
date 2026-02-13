

## Fix News Missing Images + Trigger Area Image Processing + Provident Extraction

### Current State

**News**: 4 articles out of 101 have NULL images:
1. "New Malls in Dubai (2026-2028)" -- source_url points to PropertyFinder blog listing page (not the article)
2. "CapitaLand Investment opens office at DIFC" -- WAM article
3. "Dubai housing market recorded $15.02bn..." -- Arabian Business listing page (not the article)
4. "Gulf Business Real Estate Summit & Awards" -- Gulf Business events page

**Areas**: 5 areas out of 181 still have NULL images:
- Hessian Second, Ghadeer Al Tayr, Rak Central, Maryam Island, Wadi Al Safa 2

**Provident Extraction**: 0 of 2,484 projects have `source = 'provident'`. Provident data has NOT been synced into the projects table despite multiple sync functions existing.

---

### Plan

#### Part 1: Fix 4 Missing News Images (Direct SQL + fetch fix)

For articles where the source URLs are listing/events pages (not actual articles), the scraping approach will never work. The fix is:

1. **Fetch the actual article OG images** using the `fix-missing-images` edge function (already deployed and has the logic for news)
2. **For articles where source URLs are wrong** (listing pages), manually find and set correct image URLs by:
   - Searching for the actual article URLs
   - Directly updating the `market_news` table with verified image URLs
3. **Fallback**: For any article where no image can be found, leave NULL -- the UI already renders a gradient fallback with a Newspaper icon

#### Part 2: Fix 5 Remaining Area Images

1. **Maryam Island** and **Rak Central** already have Bayut slug mappings in both `enrich-area-images` and `fix-missing-images`
2. **Trigger `fix-missing-images`** with `{"target": "areas", "batch_size": 5}` to process remaining areas
3. **For obscure areas** (Hessian Second, Ghadeer Al Tayr, Wadi Al Safa 2) that have no Bayut pages -- these are extremely small communities. The gradient fallback is appropriate.

#### Part 3: Trigger Provident Data Sync

The Provident page-data discovery system (`_shared/provident/pagedata-discovery.ts`) can discover all ~1,336 listings from Provident's Gatsby endpoints. Several sync functions exist:
- `provident-full-sync` 
- `provident-batch-sync`
- `provident-sync-master`
- `daily-provident-auto-sync`

**Action**: 
1. Inspect the `provident-full-sync` or `provident-sync-master` function to understand the entry point
2. Trigger it to begin importing Provident listings into the projects table
3. This will enrich existing Reelly projects with Provident data (descriptions, amenities, floor plans, documents) and potentially add new listings not in Reelly

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/fix-missing-images/index.ts` | Add Bayut slug for Rak Central and Maryam Island (if not present); improve news image fetching for WAM/Arabian Business articles |
| Database (SQL) | Directly update the 4 news articles with verified image URLs where possible |

### Execution Order

1. Trigger `fix-missing-images` for areas (batch_size: 5) to process Maryam Island + Rak Central
2. Fetch actual article pages for the 4 missing news images and update directly
3. Trigger Provident sync to begin importing/enriching project data
4. Verify all changes

