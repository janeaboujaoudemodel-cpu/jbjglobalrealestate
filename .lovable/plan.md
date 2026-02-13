

## Complete Fix: Remove All Bayut Images, Delete Duplicate Projects, Verify News

### Problem Summary

Three critical issues found after thorough investigation:

| Issue | Scope | Detail |
|-------|-------|--------|
| Area images from Bayut | **123 of 181** areas | Images hosted on `d3ob0s3rxbjyep.cloudfront.net` (Bayut's CDN) -- competitor branding, NOT allowed |
| Duplicate projects | **568 new rows** created today | `bulk-approve-imports` inserted new rows instead of merging into existing Reelly records. 100 are exact name duplicates of existing projects |
| News photos | **0 NULL in database** | All 101 articles have image URLs. If cards appear broken, it is a rendering or image-load issue to investigate |

### What Went Wrong

The `bulk-approve-imports` function created **new project rows** from Provident discoveries instead of matching them to existing Reelly projects by name and merging supplementary data (descriptions, amenities, documents). This inflated the count from 2,484 to 3,052.

For areas, the `enrich-area-images` function scraped Bayut area guide pages and saved their CDN images. These are competitor-branded assets and must all be removed.

---

### Fix Plan

#### Part 1: Delete All 568 Duplicate Projects (Immediate)

Delete every project row created after the bulk-approve run today. These are all duplicates or unmatchable Provident entries that were inserted as new rows instead of merged:

```text
DELETE FROM project_images WHERE project_id IN (SELECT id FROM projects WHERE created_at > '2026-02-13 02:00:00');
DELETE FROM project_documents WHERE project_id IN (SELECT id FROM projects WHERE created_at > '2026-02-13 02:00:00');
DELETE FROM projects WHERE created_at > '2026-02-13 02:00:00';
```

This restores the project count to ~2,484 (the correct pre-duplicate number).

#### Part 2: Replace All 123 Bayut Area Images

**Strategy**: Use the Provident CDN (`d3h330vgpwpjr8.cloudfront.net`) as the primary image source -- these are real editorial community photos already proven to work for top areas (JVC, Business Bay, Downtown, etc.). For areas without Provident coverage, use official developer/master plan sources (Emaar, Nakheel, DAMAC official sites) or Google-sourced community photos via Firecrawl search.

**Changes to `supabase/functions/enrich-area-images/index.ts`:**

1. Remove ALL Bayut scraping logic (the `extractBayutCoverImage` function, the `BAYUT_SLUGS` map, any fetch to `bayut.com`)
2. Add a `BLOCKED_DOMAINS` list: `bayut.com`, `d3ob0s3rxbjyep.cloudfront.net`, `static.bayut.com`, `mybayutcdn.bayut.com`
3. New image sourcing priority:
   - Step 0: Check if area has projects with good images in `project_images` table (from Reelly API)
   - Step 1: Search for real community/aerial photos via Firecrawl using query like `"{area name}" Dubai community aerial photo` -- filtering OUT any Bayut domain results
   - Step 2: For well-known areas, use official developer CDNs (Emaar, Nakheel, DAMAC, Aldar)
   - Step 3: Accept NULL for obscure areas (gradient fallback)
4. Reset all 123 Bayut image URLs to NULL via SQL so the function can reprocess them

**SQL to reset Bayut images:**
```text
UPDATE areas SET image_url = NULL, hero_image_url = NULL 
WHERE image_url LIKE '%d3ob0s3rxbjyep%' 
   OR image_url LIKE '%static.bayut%' 
   OR image_url LIKE '%mybayutcdn%';
```

#### Part 3: Build Proper Provident Merge Function

Instead of creating new rows, the Provident sync must find existing projects by name similarity and enrich them in place.

**New logic for `supabase/functions/bulk-approve-imports/index.ts`:**

1. Before inserting a pending import as a new project, search existing projects for a name match (case-insensitive TRIM comparison)
2. If a match is found: UPDATE the existing project with any missing data from the Provident record (description, amenities, payment_plan, brochure_url) -- never overwrite existing non-null fields
3. If NO match is found: Insert as new project with `source = 'provident'`
4. Add a `merge_mode` parameter (default: true) to enable/disable this behavior

#### Part 4: Verify News Rendering

All 101 news articles have non-null image URLs in the database. Check if there is a rendering issue in `News.tsx` where images fail to load (broken URLs, CORS issues) and add proper error handling with fallback gradient.

---

### Files to Change

| File | Change |
|-------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Remove all Bayut scraping; add blocked domains; use project images and Firecrawl (non-Bayut) as sources |
| `supabase/functions/bulk-approve-imports/index.ts` | Add name-matching merge logic instead of blind insert |
| `supabase/functions/fix-missing-images/index.ts` | Remove all Bayut references and slug mappings |
| Database (SQL) | Delete 568 duplicate projects; reset 123 Bayut area image URLs to NULL |

### Execution Order

1. Delete all 568 duplicate project rows (restore to 2,484)
2. Reset all 123 Bayut area image URLs to NULL
3. Rewrite `enrich-area-images` to use non-Bayut sources only
4. Deploy and trigger area image enrichment in batches
5. Update `bulk-approve-imports` with merge-first logic
6. Verify news page rendering

