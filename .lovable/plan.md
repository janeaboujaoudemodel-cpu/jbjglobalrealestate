

## Fix Plan: Replace All AI-Generated Photos with Real Source Photos

### Current State
- **Areas**: 33 out of 184 areas have AI-generated images (stored in `area-images` bucket). All 33 have zero projects in the database and no Provident URL, so project images are not available.
- **News**: 9 out of 80 articles need fixing -- 5 have NULL images, 4 have AI-generated images (stored in `news-images` bucket). Sources are mostly moec.gov.ae, gulfnews, zawya, wam.ae.

### Strategy

**Priority: Real photos only. No AI generation.**

For each area/article, the function will:
1. Scrape the Provident area page (`providentestate.com/area/{slug}`) for a hero/community photo
2. Firecrawl Search for `"{Area Name}" Dubai area photo site:bayut.com OR site:propertyfinder.ae OR site:dubizzle.com` to find real listing portal community photos
3. Firecrawl Search broader: `"{Area Name}" Dubai aerial community` to find real photos from any source
4. If all 3 fail, set to NULL rather than using a fake/AI image -- the UI already handles NULL gracefully with a gradient fallback

For news articles:
1. Re-scrape the source URL with longer timeout for OG image extraction
2. Firecrawl Search for the article title to find the same article on other portals with images
3. If all fail, set to NULL -- no AI generation

---

### Part 1: Update `enrich-area-images` Edge Function

**File: `supabase/functions/enrich-area-images/index.ts`**

Changes:
- Remove the AI image generation step entirely (Step 3 / lines 194-241)
- Add a new Step 2b: Scrape Provident area page `https://www.providentestate.com/area/{slug}` for the hero image
- Add a new Step 2c: Firecrawl Search targeting real estate portals (bayut.com, propertyfinder.ae) for community photos
- Modify the query to also match areas with `image_url LIKE '%supabase.co/storage%area-images%'` so it picks up the 33 AI-generated ones
- If no real photo is found after all attempts, set `image_url = NULL` to clear the fake AI photo
- Delete the AI-generated file from storage when replacing

### Part 2: Update `ai-news-collector` Enrich Action

**File: `supabase/functions/ai-news-collector/index.ts`**

Changes to the enrich action (lines 304-351):
- Remove the AI image generation step entirely
- Keep the Firecrawl Search step but improve it: search with exact article title, try metadata.ogImage from results
- For moec.gov.ae articles specifically: try scraping the individual article page (not the media-center listing page)
- If no real photo found, set `image_url = NULL` to clear any AI-generated photo
- Delete AI-generated files from `news-images` bucket when replacing

### Part 3: Deploy and Run

1. Deploy both updated functions
2. Call `enrich-area-images` with `batch_size: 15` repeatedly until all 33 areas are processed
3. Call `ai-news-collector` with `action: "enrich"` to process the 9 articles
4. Verify via screenshots

---

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Remove AI generation fallback; add Provident scraping + portal-targeted Firecrawl search; target AI-generated images for replacement; set NULL if no real photo found |
| `supabase/functions/ai-news-collector/index.ts` | Remove AI generation fallback from enrich action; improve source scraping; set NULL if no real photo found |

### Technical Details

**Area image search strategy (in order):**
```text
1. Project images from DB (existing, already works)
2. Scrape: providentestate.com/area/{slug} -> extract hero image
3. Search: "{name} Dubai" site:bayut.com OR site:propertyfinder.ae
4. Search: "{name} Dubai community aerial neighborhood"
5. No match -> set image_url = NULL (UI shows gradient fallback)
```

**Filter to catch AI-generated images:**
```sql
image_url LIKE '%supabase.co/storage%area-images%'
```

**News image search strategy:**
```text
1. Scrape source_url for OG image (existing, improved timeout)
2. Search: exact article title -> metadata.ogImage from results  
3. No match -> set image_url = NULL
```

**What gets deleted from storage:**
- All `.webp` files in `area-images` bucket that were AI-generated
- All `.webp` files in `news-images` bucket that were AI-generated

