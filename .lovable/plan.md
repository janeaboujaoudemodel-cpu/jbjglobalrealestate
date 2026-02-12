

## Fix Plan: Populate Real Photos for All Areas and News Articles

### Current State
- **Areas**: 68 out of 184 active areas are missing real images (have NULL, Unsplash, or Pexels placeholders)
- **News**: 27 out of 80 articles have no image (NULL)

### Strategy (Priority Order)
1. **Source from existing project data** (areas only) -- free, instant
2. **Scrape from Provident/source websites** via Firecrawl -- real photos
3. **Firecrawl Search** for relevant real photos on the web
4. **AI-generate** via Gemini image model as last resort (only if steps 1-3 fail)

---

### Part 1: Fix Area Images (68 areas)

**File: `supabase/functions/enrich-area-images/index.ts`**

The existing function already does steps 1-3 but is missing the AI generation fallback. Changes:

- Add Step 4: When no real photo is found via projects or Firecrawl, call the Gemini image generation model (`google/gemini-2.5-flash-image`) to generate a realistic aerial/panoramic view of that area
- Prompt: "Photorealistic aerial panoramic view of [Area Name], Dubai, UAE. Show the community skyline, buildings, roads, and landscape from above. Professional real estate photography style, golden hour lighting."
- Upload the generated image to Supabase Storage (`area-images` bucket) and use the public URL
- Increase batch_size default from 5 to 10 for faster processing

After deploying, run the function multiple times (7 batches of 10) to process all 68 areas.

### Part 2: Fix News Article Images (27 articles)

**File: `supabase/functions/ai-news-collector/index.ts`**

The existing `enrich` action already scrapes source URLs for images but sets NULL when none is found. Changes to the enrich action:

- After scrape fails to find an image, add a Firecrawl Search step: search for `"[article title]" Dubai real estate photo` and extract OG images from top results
- If Firecrawl Search also fails, generate an image with Gemini: a professional editorial-style image related to the article's category (e.g., "Dubai skyline with real estate buildings" for Market Update, "UAE government building" for Policy)
- Upload generated images to Supabase Storage (`news-images` bucket) and use public URLs
- Track used URLs across the batch to prevent duplicates

After deploying, run the enrich action to process all 27 articles.

### Part 3: Trigger Both Functions

After deploying the updated edge functions:
1. Call `enrich-area-images` with `batch_size: 10` repeatedly until all 68 areas are processed
2. Call `ai-news-collector` with `action: "enrich"` to process all 27 news articles

---

### Summary of File Changes

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Add AI image generation fallback (Gemini) + Supabase Storage upload when no real photo found; increase default batch size |
| `supabase/functions/ai-news-collector/index.ts` | Add Firecrawl Search fallback + AI image generation in the enrich action for articles with no image |

### Technical Details

**AI Image Generation (fallback):**
```
POST https://ai.gateway.lovable.dev/v1/chat/completions
model: "google/gemini-2.5-flash-image"
modalities: ["image", "text"]
```

The returned base64 image is uploaded to Supabase Storage:
```
bucket: "area-images" or "news-images"
path: "{slug}.webp" or "{article-id}.webp"
```

**Supabase Storage buckets** will be created if they don't exist via the edge function using the service role key.

**Execution plan:**
- Deploy both functions
- Run `enrich-area-images` in 7 rounds (batch_size=10) to cover all 68 areas
- Run `ai-news-collector` with `action: "enrich"` once (it already processes up to 30 articles per call)
- Take screenshots of areas page and news page to verify

