

# Auto-Find Real Developer Images from the Web

## Problem
124 developers have either no feature image or the same fake Unsplash downtown photo. You need real images sourced automatically -- not manual uploads.

## Solution
Create a new edge function `auto-find-developer-images` that:

1. Gets all developers with missing/fake feature images (batch of 10 at a time to avoid timeouts)
2. For each developer, uses **Firecrawl search** to find real photos of their projects/buildings online
3. Uses **AI (Gemini Flash)** to pick the best, most relevant image URL from search results
4. Updates the developer's `feature_image_url` in the database with the real image

## How It Works

```text
For each developer (e.g., "AAF Developments"):
  1. Firecrawl search: "AAF Developments Dubai real estate projects building"
  2. Get search results with screenshots/images
  3. AI picks the best project/building image URL
  4. Save to developers.feature_image_url
```

## Edge Function: `supabase/functions/auto-find-developer-images/index.ts`

- Accepts `{ batch_size: 10 }` parameter (default 10 to stay within timeout)
- Queries developers where `feature_image_url IS NULL` or `feature_image_url LIKE '%unsplash%'`
- For each developer:
  - Calls Firecrawl search API with query: `"{developer.name}" real estate Dubai projects building`
  - Extracts image URLs from the search results (links, screenshots, metadata)
  - Sends extracted URLs + context to Gemini Flash to select the single best building/project photo
  - Updates the developer record with the chosen image URL
- Returns a summary of how many were updated, failed, or had no results
- Can be called multiple times to process all 124 developers in batches

## Technical Details

| Aspect | Detail |
|--------|--------|
| APIs used | Firecrawl Search + Lovable AI (Gemini 2.5 Flash) |
| Secrets required | `FIRECRAWL_API_KEY` (exists), `LOVABLE_API_KEY` (exists) |
| Batch size | 10 per invocation (avoids edge function timeout) |
| Total developers | ~124 needing images |
| Invocations needed | ~13 calls to process all |

## Files

| File | Action |
|------|--------|
| `supabase/functions/auto-find-developer-images/index.ts` | **Create** -- new edge function |

After creating and deploying, I will invoke the function multiple times to process all 124 developers.

