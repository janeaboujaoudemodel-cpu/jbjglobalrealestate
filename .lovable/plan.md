
## Complete Fix: Area Images + News Broken Photos

### What's Actually Wrong

**Areas**: 126 of 181 areas have `NULL` image_url. The previous edge functions (`enrich-area-images`, `fix-missing-images`) tried project_images and Firecrawl but failed for most areas because:
- Most areas have no projects with images in `project_images`
- Firecrawl searches are unreliable and consume credits

**News**: All 101 articles have image URLs in the database, but several URLs are broken (returning 403/hotlink blocked by source sites like `mediaoffice.ae`, `assets.difc.com`, `static.zawya.com`). The `onError` fallback shows a newspaper icon, which looks unprofessional.

---

### The New Approach: Use AI Image Generation via Gemini

Instead of endlessly trying to scrape images from external sites (which break due to hotlinking, CORS, and access restrictions), we use **Gemini 3 Pro Image Preview** (available through Lovable AI, no API key needed) to generate professional aerial/masterplan-style images for each area. This is:
- 100% reliable (no broken URLs, no blocked hotlinks)
- No Firecrawl credits consumed
- Produces consistent, professional community visuals

For news, we proxy broken images through the edge function to avoid hotlink blocks.

---

### Plan

#### Part 1: New Edge Function `generate-area-images`

Create a new edge function that:
1. Fetches areas with NULL image_url (batch of 5-10)
2. For each area, calls Gemini 3 Pro Image Preview via the Lovable AI gateway to generate an aerial/panoramic view of the community
3. Uploads the generated image to Supabase Storage
4. Updates the area's `image_url` and `hero_image_url` with the storage URL

Prompt template: `"Professional aerial panoramic photograph of {area_name}, Dubai/UAE. Modern urban landscape, high resolution, real estate marketing quality, daytime, clear sky."`

This guarantees every area gets a high-quality, reliable image that never breaks.

#### Part 2: Fix Broken News Images

Create a new edge function `proxy-news-image` OR update the News.tsx frontend to:
- Detect broken images via the existing `onError` handler
- Instead of showing a newspaper icon, use a **topic-relevant stock gradient** with the article category icon and source name
- For articles from WAM, DIFC, etc. where images are hotlink-blocked, store the images in Supabase Storage by fetching them server-side (edge function with proper User-Agent headers)

Alternative simpler approach: Create an edge function `fix-broken-news-images` that:
1. Fetches all news articles
2. For each image_url, does a HEAD request server-side to check if it returns 200
3. If broken, tries to re-fetch the source_url HTML and extract a working OG image
4. If still broken, sets image_url to NULL (gradient fallback is cleaner than a broken image)

#### Part 3: Improve News Fallback UI

Update `News.tsx` so that when an image fails to load, instead of showing a generic newspaper icon, it shows a **styled gradient card** with:
- The category name prominently displayed
- The source logo/name
- A relevant icon based on category (Building2 for Developer News, TrendingUp for Market Update, etc.)

This makes even image-less cards look intentional and premium.

---

### Files to Create/Change

| File | Change |
|------|--------|
| `supabase/functions/generate-area-images/index.ts` | NEW: Gemini-powered area image generation with Supabase Storage upload |
| `supabase/functions/fix-broken-news-images/index.ts` | NEW: Server-side HEAD check + re-fetch for broken news image URLs |
| `src/pages/News.tsx` | Improve the onError fallback to show a premium category-themed gradient instead of generic newspaper icon |

### Execution Order

1. Create and deploy `generate-area-images` function
2. Trigger it in batches of 5-10 to generate images for all 126 areas
3. Create and deploy `fix-broken-news-images` function
4. Trigger it to validate/fix all 101 news image URLs
5. Update News.tsx fallback UI for any remaining broken images
6. Verify everything renders correctly
