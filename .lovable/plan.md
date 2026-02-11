

# Fix Remaining 57 Developers with Generic Pexels Fallback

## Problem
57 developers still have the generic Pexels building photo (`pexels-photo-323780.jpeg`) instead of real images. The current edge function only searches for developers with `NULL` or `%unsplash%` images -- it does not target the Pexels fallback.

## Solution

Two changes needed:

### 1. Update the edge function to also target Pexels fallbacks

Modify the query filter in `auto-find-developer-images/index.ts` to include `%pexels%` URLs:

```
.or("feature_image_url.is.null,feature_image_url.ilike.%unsplash%,feature_image_url.ilike.%pexels%")
```

Also improve the search queries to be more targeted:
- Add "Dubai" to search context for UAE-based developers
- Increase search limit from 3 to 5 results for better coverage
- Also try the developer's website directly if found in results

### 2. Run the function repeatedly until all 57 are processed

After deploying the updated function, invoke it multiple times (6 batches of 10) to process all 57 developers. For any that still fail, use alternative search strategies (e.g., searching for the developer name + "projects" or "portfolio").

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/auto-find-developer-images/index.ts` | Update query to include `%pexels%`, improve search queries, increase search limit |

## Execution

After deploying, I will run the function 6+ times in sequence to process all 57 developers, and verify the count drops to 0.
