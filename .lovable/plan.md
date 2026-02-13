

## Fix All Area Images and News Photos -- Complete Overhaul

### Root Cause

The previous "curated image map" used fabricated CloudFront URLs like `d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/damac-hills.jpg` that **do not exist** on Provident's CDN (all return 403 Access Denied). This means:
- 25 areas currently display broken images (show nothing in the browser)
- 38 areas have NULL (gradient fallback)
- Total: **63 areas** without working images

### Solution: Scrape Bayut Area Guide Pages (Zero Firecrawl Credits)

Bayut's area guide pages (e.g., `bayut.com/area-guides/damac-hills-akoya-damac/`) each contain a verified high-quality community cover photo hosted on their CDN (`d3ob0s3rxbjyep.cloudfront.net/content/...`). These are real aerial/community photos -- exactly what the user wants.

The approach:
1. Fetch each Bayut area guide page directly using `fetch()` (free, no API key needed)
2. Parse the HTML to extract the cover image URL
3. Update the database directly

No Firecrawl credits consumed.

### Plan

#### Part 1: Rewrite `enrich-area-images` Edge Function

**Complete rewrite of `supabase/functions/enrich-area-images/index.ts`:**

1. **Remove the entire fake curated map** (all `/community/` URLs are broken)
2. **Add a Bayut slug mapping** -- a lookup table mapping area names to their Bayut area guide URL slugs (e.g., "Damac Hills" maps to "damac-hills-akoya-damac", "JVT" maps to "jumeirah-village-triangle", etc.)
3. **New Step 0: Direct Bayut fetch** -- For each area:
   - Construct URL: `https://www.bayut.com/area-guides/{bayut-slug}/`
   - Fetch the HTML with a standard `fetch()` call
   - Extract the community cover image from the HTML using regex (looking for `d3ob0s3rxbjyep.cloudfront.net/content/` images in img tags)
   - These are verified, high-resolution community/aerial photos
4. **Step 1 (fallback): Firecrawl search** -- Only for areas not found on Bayut (small/obscure areas). Uses minimal credits.
5. **Step 2: Accept NULL** -- For truly obscure areas (Hessian Second, Al Arqoub, Ghadeer Al Tayr), the gradient fallback is appropriate.

#### Part 2: Reset All Broken Area Images (Database)

Run SQL to NULL out all 25 broken curated URLs so the function can re-process them:

```sql
UPDATE areas SET image_url = NULL, hero_image_url = NULL 
WHERE image_url LIKE '%/community/%';
```

This combined with the existing 38 NULL areas gives the function 63 areas to process.

#### Part 3: Fix 2 Remaining News Article Images

For the 2 news articles still missing images:
- **"Dubai property market set to cool" (The National)**: Directly fetch the article URL (`thenationalnews.com/business/property/2026/02/10/...`) and extract the OG image
- **"New Malls in Dubai" (Property Finder)**: Source URL is just the blog listing page, so search for the actual article

This will be done via a one-time update in the `ai-news-collector` function's `fix-null-images` action, with the refined `KNOWN_BAD_URLS` filter that allows full-size `arcpublishing.com` images.

#### Part 4: News Page Video Hero (Already Done)

The video hero was already added in the previous session -- confirmed working with `dubai-landmarks-hero.mp4`.

---

### Bayut Slug Mapping (Key Areas)

| Area Name | Bayut Slug |
|-----------|-----------|
| Damac Hills | damac-hills-akoya-damac |
| Town Square | town-square |
| Dubai Islands | dubai-islands |
| Al Marjan Island | al-marjan-island |
| JVT | jumeirah-village-triangle |
| Arjan | arjan |
| Damac Lagoons | damac-lagoons |
| Dubai Studio City | dubai-studio-city |
| Dubai Silicon Oasis | dubai-silicon-oasis |
| The Valley | the-valley |
| Mina Rashid | mina-rashid |
| Dubai Expo City | expo-city-dubai |
| MJL | madinat-jumeirah-living |
| Jumeirah Islands | jumeirah-islands |
| City Walk | city-walk |
| Mudon | mudon |
| Dubai Motor City | motor-city |
| Dubai Harbour | dubai-harbour |
| Dubai Science Park | dubai-science-park |
| Dubai Production City | dubai-production-city |
| Dubai International City | international-city |
| Masdar City | masdar-city |
| Al Barsha | al-barsha |
| Al Sufouh | al-sufouh |
| Blue Waters Island | bluewaters |
| Yas Island | yas-island |
| Al Reem Island | al-reem-island |
| (and ~20 more) | ... |

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Complete rewrite: remove fake curated map, add Bayut direct-fetch approach with slug mapping, keep Firecrawl as fallback only |
| `supabase/functions/ai-news-collector/index.ts` | Improve `fix-null-images` to directly fetch The National article pages for OG images |
| Database (SQL) | Reset 25 broken curated URLs to NULL |

### Execution Order

1. Reset 25 broken curated area image URLs to NULL
2. Rewrite and deploy `enrich-area-images` with Bayut direct-fetch
3. Trigger the function in batches to process all 63 areas
4. Trigger `fix-null-images` for the 2 remaining news articles
5. Verify all images load correctly via DB queries

