

# Fix News System: Pre-load Real Articles with Images, Full Content, and Updated UI

## Current Problems

1. **Empty news page**: The database has 30 articles but ALL have `image_url = NULL` and `content = NULL`. Users see cards with no photos and clicking them shows an unreadable detail page with just a 1-line excerpt.
2. **Provident blog is not scrapeable**: The site blocks automated scraping. Instead, we will use the existing Firecrawl + AI pipeline to scrape each article's `source_url` individually to get full content and find a relevant image.
3. **No "Refresh" button needed**: The button should be hidden from regular users. News should load automatically from the database.
4. **NewsDetail page uses old design**: Still uses gold-on-black theme with a small hero image. Needs the champagne 3-layer design system matching the rest of the site.

## Solution

### Part 1: Enrich Existing 30 Articles (Edge Function Update)

Update `ai-news-collector` to add a second pass that enriches articles missing content/images:

- For each article with `content IS NULL` or `image_url IS NULL`:
  - Scrape the `source_url` via Firecrawl to get the full article markdown
  - Use AI to extract the full article body text (cleaned, readable paragraphs)
  - Find a relevant image from the scraped page, or assign a high-quality Unsplash Dubai image based on the article category
  - Update the database row with `content` and `image_url`

Add a new action `enrich` alongside the existing `collect` action so both can be triggered.

On initial page load, if articles exist but have no content, auto-trigger enrichment.

### Part 2: Remove "Refresh News" Button from Public View

- Remove the "Refresh News" button entirely from the public news page
- News collection/enrichment will only happen via admin or automated triggers
- The page simply displays whatever is in the database

### Part 3: Redesign NewsDetail Page (Champagne Theme)

Replace the current gold-on-black NewsDetail with the champagne 3-layer design:

- Full-width hero image (100vh on mobile, 70vh on desktop) with gradient overlay
- Title overlaid on hero in white text (large, Poppins font)
- Article body in a champagne `jj-layer-active` card below the hero
- Source badge and date in the meta row
- Full readable paragraphs (not just excerpt)
- "View Original Source" link at the bottom with the source URL
- Back to News button in champagne style
- Fast loading: no spinner delay, instant render from cache

### Part 4: Auto-assign Category Images

Create a mapping of categories to high-quality Unsplash Dubai photos as fallbacks:

| Category | Image Theme |
|----------|------------|
| Policy | Dubai government buildings |
| Economic | Dubai skyline / business |
| Market Update | Dubai Marina / properties |
| Government | UAE flag / landmarks |
| Analysis | Charts / Dubai aerial |
| Developer News | Construction / new buildings |

These serve as fallbacks when the source article has no extractable image.

## Technical Details

### Files to modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-news-collector/index.ts` | Add `enrich` action that scrapes each article's source_url for full content and images, updates DB |
| `src/pages/News.tsx` | Remove "Refresh News" button, remove the refresh handler, clean up empty state |
| `src/pages/NewsDetail.tsx` | Complete redesign with champagne 3-layer system, full-bleed hero, readable content, "View Original Source" link |

### Enrichment flow

```
For each article WHERE content IS NULL:
  1. Scrape source_url via Firecrawl (markdown format)
  2. AI extracts: full article text + main image URL
  3. If no image found: assign category-based Unsplash fallback
  4. UPDATE market_news SET content = ..., image_url = ... WHERE id = ...
```

### NewsDetail redesign structure

```
- Full-bleed hero image (h-[60vh] md:h-[70vh])
- Gradient overlay (from-black via-black/40 to-transparent)
- Back button (top-left, glass pill)
- Title + badges overlaid on hero bottom
- Below hero: jj-layer-2 container
  - jj-layer-active card with:
    - Date + Source meta row
    - Excerpt as highlighted quote
    - Full content paragraphs (readable, dark text on champagne)
    - Source attribution card at bottom with "View Original Source" link
    - Back to News button
```

### Image fallback map (Unsplash)

```typescript
const CATEGORY_IMAGES: Record<string, string> = {
  "Policy": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200&q=80",
  "Economic": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "Market Update": "https://images.unsplash.com/photo-1622015663319-e97e697503ee?w=1200&q=80",
  "Government": "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=1200&q=80",
  "Analysis": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
  "Developer News": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80",
};
```
