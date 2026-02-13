

## Fix News: Import Provident Blog + Fix Missing Photos

### Current State
- **70 total articles** in database
- **7 articles with NULL images**: 5 from Property Finder, 1 from The National, 1 from Abu Dhabi Media Office
- **0 articles from Provident Estate blog** -- the Provident blog at providentestate.com/blog/ has 12 high-quality articles with real CloudFront images, but none have been imported yet
- **Property Finder articles** all point to the listing page `/blog/` instead of individual article URLs, which is why they have no images

### What Provident Blog Has (Not Yet in DB)
From scraping providentestate.com/blog/, these 12 articles are available with real images:

| Article | Image Source |
|---------|-------------|
| RTA Confirms Dubai Loop Tunnel Project | d3h330vgpwpjr8.cloudfront.net |
| AED 100 Billion Zabeel District at DIFC | d3h330vgpwpjr8.cloudfront.net |
| Sobha Unveils AED 50 Billion Sobha Sanctuary | d3h330vgpwpjr8.cloudfront.net |
| Provident Estate and Sobha Realty Partnership | d3h330vgpwpjr8.cloudfront.net |
| Dubai Creek Tower Impact on Dubai Creek Harbour | d3h330vgpwpjr8.cloudfront.net |
| Meraas Dubai Design District (d3) Expansion | d3h330vgpwpjr8.cloudfront.net |
| Dubai Real Estate Market Report 2025 | d3h330vgpwpjr8.cloudfront.net |
| Invest in 2026: What Smart Investors are Doing | d3h330vgpwpjr8.cloudfront.net |
| Dubai to Get 152 New Parks and 33km Cycling Tracks | d3h330vgpwpjr8.cloudfront.net |
| 15 Important Updates Before Moving to Dubai 2026 | d3h330vgpwpjr8.cloudfront.net |
| Wellness Real Estate Market Surges Globally | d3h330vgpwpjr8.cloudfront.net |
| Emaar AED 180 Billion Dubai Square Mall | d3h330vgpwpjr8.cloudfront.net |

All images are real editorial photos hosted on Provident's CloudFront CDN -- no AI or stock photos.

---

### Plan

#### Part 1: Add `"import-provident-blog"` action to `ai-news-collector/index.ts`

A new action that:
1. Scrapes `providentestate.com/blog/` via Firecrawl
2. Parses the markdown to extract article titles, URLs, images, dates, and categories directly from the page structure
3. For each article, gets the full-resolution image by replacing `/x/340x/` with `/x/1200x/` in the CloudFront URL
4. Scrapes each individual article page for full content
5. Inserts into `market_news` with fuzzy dedup check (skips if already exists)
6. Source: "Provident Estate", source_url: individual article URL

The Provident blog page has a clear, parseable structure:
```
[Category\n![Title](image_url)](article_url)\n[Title](article_url)\nDate
```

This can be parsed directly from the scraped markdown without AI -- just regex extraction.

#### Part 2: Fix 5 Property Finder articles with NULL images

For each of the 5 Property Finder articles (which all have `source_url: propertyfinder.ae/blog/`):
1. Use Firecrawl Search with the article title + `site:propertyfinder.ae` to find the actual article page
2. Extract the OG image from the search result metadata
3. Update `source_url` to the actual article URL (not the listing page)
4. If no image found, use Firecrawl Search on broader news portals for the same topic

Articles to fix:
- "New Malls in Dubai (2026-2028)"
- "JVT vs JVC: Comparison"
- "Property Management Fees in Dubai"
- "Top 10 Upcoming Mega Projects in Dubai [2026 and beyond]"
- "15 Reasons Why You Should Invest in Dubai Real Estate in 2026"

#### Part 3: Fix 2 remaining NULL image articles

- "Tech watches and robot dogs" (The National) -- scrape the actual thenationalnews.com article URL which is already a proper individual page URL
- "MAG Group Holding / Marsa Zayed" (Abu Dhabi Media Office) -- search for this specific story on news portals

#### Part 4: Deploy and execute

1. Deploy updated `ai-news-collector`
2. Trigger `import-provident-blog` action to import all 12 Provident articles
3. Trigger `enrich` action to fix the 7 NULL-image articles and add content/analysis to new Provident articles
4. Verify all articles have unique, real images

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/ai-news-collector/index.ts` | Add `"import-provident-blog"` action with direct markdown parsing; improve `enrich` action to fix Property Finder source URLs via search |

### Expected Result After Execution
- ~82 total articles (70 existing + 12 from Provident, minus any fuzzy dupes)
- All articles with real editorial photos from their source pages
- Zero NULL images (or gradient fallback only for truly unavailable government source photos)
- Zero duplicate articles
- All Provident blog content imported with CloudFront images

