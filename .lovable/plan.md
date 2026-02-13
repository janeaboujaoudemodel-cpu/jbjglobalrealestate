

## Continue All Fixes: Area Images, News Photos, and News Hero

### Current State

**Areas**: 99 out of 181 active areas still have NULL images. The `enrich-area-images` function processes 10 at a time, and the project images in the DB are ALL from Reelly (blocked by `isGoodAreaImage`), so Step 1 never finds anything. Only Firecrawl Steps 2-3 can help.

**News**: 3 articles still have NULL images:
1. "New Malls in Dubai (2026-2028)" -- Property Finder (source URL is just the blog listing page)
2. "Tech watches and robot dogs" -- The National (has a real article URL)
3. "Dubai property market set to cool" -- The National (has a real article URL)

**News Hero**: The hero section uses a static gradient with a JBJ monogram, not a premium video like other pages (Properties, Areas). No video is present.

---

### Plan

#### Part 1: Batch-Process All 99 Area Images Efficiently

The current function processes 10 areas per call. To handle 99 areas without wasting Firecrawl credits on searches that return nothing useful, the approach changes:

**Changes to `supabase/functions/enrich-area-images/index.ts`:**

1. Increase default batch size from 10 to 20
2. Add a curated map of known premium image URLs for major areas (Al Marjan Island, Dubai Islands, JVT, Damac Hills, Damac Lagoons, Palm Jebel Ali, Arjan, Town Square, Meydan, etc.) sourced from Provident's CloudFront CDN (`d3h330vgpwpjr8.cloudfront.net` and `d3ob0s3rxbjyep.cloudfront.net`) -- these are the same premium editorial community photos already proven to work for the top 20 areas
3. Check the curated map FIRST (Step 0) before any DB or Firecrawl queries -- this is instant, free, and reliable
4. For the ~30 well-known Dubai areas with no curated image, proceed with Firecrawl search (Steps 2-3)
5. For obscure/small areas (Al Amerah, Es Sanhaya 2, Ghadeer Al Tayr, etc.), accept NULL gracefully -- the UI gradient fallback is appropriate

The curated map will cover approximately 40-50 major areas using URLs from the same CDN sources that already work for JVC, Business Bay, Downtown Dubai, etc. This eliminates ~50% of Firecrawl calls.

#### Part 2: Fix 3 Remaining News Article Images

**Changes to `supabase/functions/ai-news-collector/index.ts`:**

For the `fix-null-images` action, improve the handling of The National articles:
1. For The National articles with real article URLs (not listing pages), scrape the article directly via Firecrawl to extract OG images -- currently blocked by the `arcpublishing.com` pattern in `KNOWN_BAD_URLS`
2. Refine the bad URL check: only block `arcpublishing.com` URLs with `width=200` (tiny thumbnails), not all `arcpublishing.com` URLs (which include full-size editorial photos)
3. For the Property Finder "New Malls" article, search for the actual article page URL

#### Part 3: Add Premium Hero Video to News Page

**Changes to `src/pages/News.tsx`:**

Replace the static gradient hero with the same `PropertiesHeroVideo` component used on the Properties page, or use a dedicated news-appropriate video/image hero with the Dubai skyline video already available in `src/assets/videos/dubai-landmarks-hero.mp4`.

1. Import the existing hero video asset
2. Replace the static gradient background with a video background element (using the same pattern as `PropertiesHeroVideo`)
3. Keep the existing text overlay content (title, subtitle, badges)

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Add curated image map for ~40 major areas; increase batch size to 20; check curated map before Firecrawl |
| `supabase/functions/ai-news-collector/index.ts` | Refine `arcpublishing.com` blocking to only reject tiny thumbnails; improve The National scraping |
| `src/pages/News.tsx` | Replace static gradient hero with premium video background using existing Dubai landmarks video |

### Execution Order

1. Update `enrich-area-images` with curated map and deploy
2. Trigger enrichment in batches until all 99 areas are processed
3. Update `ai-news-collector` and deploy
4. Trigger `fix-null-images` for the 3 remaining articles
5. Add video hero to News page
6. Verify all changes via DB queries

