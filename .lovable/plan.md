

# Fix Duplicate News Images, Use Article Photo for Brochures, and Re-enrich Articles

## Problems Identified

1. **Duplicate images across articles**: 5 articles share the same UAE Ministry image, 3 share the same Zawya placeholder, 3 share the same Unsplash "Developer News" fallback, 2 share the same Zawya image, and 2 share the same Abu Dhabi logo. These are generic/fallback images that don't represent the actual article content.

2. **Brochure card uses a static Downtown Dubai photo**: `PremiumBrochureCard.tsx` imports `menu-downtown-dubai-skyline.jpg` as the background for ALL project brochures. The user wants to use the photo from the "Rent or buy?" news article instead (a Khaleej Times Dubai cityscape photo).

3. **Enrichment is not extracting real article photos**: The Firecrawl scraping + regex image extraction is failing for many sources (WAM, Dubai Media Office, Abu Dhabi Media Office), falling back to Unsplash or generic source logos.

---

## Changes

### 1. Update Brochure Card Background Image

**File: `src/components/project-detail/PremiumBrochureCard.tsx`**

- Replace the static `menu-downtown-dubai-skyline.jpg` import with the Khaleej Times Dubai cityscape photo URL: `https://imgengine.khaleejtimes.com/khaleejtimes-english/2026-02-04/lvnx1x0g/Dubai.jpg?width=1200&height=800&format=auto`
- This is the "Rent or buy?" article photo the user liked
- The card already has the project name overlaid, so it will show: beautiful Dubai photo + project title + JBJ branding

### 2. Fix Duplicate Images in Database

**File: `supabase/functions/ai-news-collector/index.ts`**

Update the enrichment logic to better extract real article images:

- **Improved image extraction**: After scraping, search for Open Graph images (`og:image`), Twitter card images, and structured data images in the markdown -- not just inline `![](url)` patterns
- **Per-article unique Unsplash fallbacks**: Instead of using the same Unsplash URL for every article in a category, append a unique search term (based on article title keywords) to the Unsplash URL to get different images per article. For example: `https://images.unsplash.com/photo-{hash}?w=1200&q=80` with different hashes per category + keyword combination
- **Block known bad images**: Add a blocklist for generic source logos that aren't article photos (e.g., `adgmo-logotype.png`, `newsbanner.jpg`, `twitter.png`, `photonpay-granted...`). These are site UI elements, not article images
- **Force re-scrape for duplicates**: When enriching, also re-process articles whose `image_url` matches known duplicate/bad URLs, not just articles with `NULL` image

### 3. Create a Diverse Fallback Image Pool

Instead of one Unsplash URL per category, maintain a pool of 5-6 unique Dubai photos per category so no two articles ever share the same fallback:

```text
Policy: 6 different government/regulatory-themed Dubai photos
Economic: 6 different business/skyline photos
Market Update: 6 different property/marina photos
Developer News: 6 different construction/building photos
(etc.)
```

When assigning a fallback, pick one that hasn't been used by any other article in the database (query existing image_urls first).

### 4. Trigger Re-enrichment for Affected Articles

After deploying the updated edge function, trigger the `enrich` action to re-process the ~15 articles currently using duplicate or generic images. The updated logic will:
1. Try to scrape the real article image from the source URL
2. If that fails, assign a unique fallback from the diversified pool

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project-detail/PremiumBrochureCard.tsx` | Replace Downtown Dubai import with Khaleej Times cityscape URL |
| `supabase/functions/ai-news-collector/index.ts` | Improve image extraction (OG tags, blocklist), diversify fallback pool, re-enrich duplicates |

### Bad Image Blocklist (Edge Function)

```typescript
const BAD_IMAGE_PATTERNS = [
  /adgmo-logotype/i,
  /newsbanner\.jpg/i,
  /twitter\.png/i,
  /photonpay-granted/i,
  /logo/i,
  /favicon/i,
];
```

### Improved Image Extraction Order

```text
1. Look for og:image or twitter:image in scraped markdown/metadata
2. Look for large inline images (skip icons/logos by checking dimensions in URL)
3. Filter out blocked patterns
4. If no valid image found, assign unique fallback from diversified pool
```

### Fallback Assignment Logic

```text
1. Query all existing image_urls from market_news table
2. For each category, maintain an array of 6 unique Unsplash photo URLs
3. Pick the first URL from the category pool that is NOT already in use
4. If all are used, append a random crop parameter to create a unique variant
```

