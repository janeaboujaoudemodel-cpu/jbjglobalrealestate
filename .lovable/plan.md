
## Fix Plan: Find Real Photos for the 7 Remaining News Articles

### Current State
- **Areas: 100% complete** -- all 184 areas have real photos
- **News: 73/80 done** -- 7 articles from government sites (wam.ae, moec.gov.ae) still have NULL images

### Problem
The current enrich function searches `"{title}" Dubai real estate` but these are government policy/economy articles, not real estate listings. The search queries need to be tailored to find the same story on news portals that have proper editorial photos.

### Solution: Update the enrich action's search logic

**File: `supabase/functions/ai-news-collector/index.ts`**

Changes to the Firecrawl Search fallback (around lines 278-301):

1. **Smarter search queries**: Instead of appending "Dubai real estate" to every title, use multiple targeted searches:
   - First search: exact article title (shorter version, first 8 words) -- finds the same story on news portals
   - Second search: key entities from the title + "Dubai" (e.g., "Aldar Dubai Holding joint venture") -- finds related coverage
   - Third search: title keywords + `site:gulfnews.com OR site:khaleejtimes.com OR site:arabianbusiness.com` -- targets portals with good OG images

2. **Better OG image extraction from search results**: Also check `metadata.image`, `metadata.og:image`, and thumbnail fields

3. **Direct WAM article scraping**: WAM articles have individual pages with images -- scrape the actual `wam.ae/en/article/...` URL with Firecrawl (not just markdown, also extract metadata) to get the article's hero image

4. **MOEC workaround**: MOEC source URLs all point to `/en/media-center` (listing page). Use the article title to search for the specific MOEC press release or its coverage on other news sites

### After deployment:
- Trigger `ai-news-collector` with `action: "enrich"` to re-process the 7 NULL-image articles
- Verify via database query and screenshots

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/ai-news-collector/index.ts` | Improve search queries for government articles; add multi-query strategy; scrape WAM article pages directly; target news portals with OG images |

### Technical Details

**Updated search strategy for articles with no image:**
```text
1. Scrape source_url (existing -- works for most sites, fails for moec.gov.ae listing page)
2. Search #1: first 8 words of title (finds exact article on other portals)
3. Search #2: key entities + "Dubai UAE" (finds related coverage)
4. Search #3: title + site:gulfnews.com OR site:khaleejtimes.com (targets portals with images)
5. No match -> NULL (UI gradient fallback)
```

**WAM-specific fix:**
WAM articles at `wam.ae/en/article/...` have individual pages with hero images. The current scraper may be blocked. Fix: use Firecrawl scrape with `formats: ["markdown", "links"]` and extract image URLs from the markdown content (WAM embeds article images in the page body).

**MOEC-specific fix:**
All 5 MOEC articles point to `moec.gov.ae/en/media-center` (the listing page, not individual articles). Search for the article title on news portals instead of trying to scrape the useless listing page.
