

# News System Overhaul: Market Stats Split, Dropdown Fix, Full Article Content & AI Analysis

## Overview

This plan addresses 5 interconnected issues: splitting market statistics into 2025 and 2026 cards, fixing the Insights dropdown cropping, making the NewsDetail hero truly full-screen, ensuring full article content with real photos, and adding AI-generated real estate impact analysis to each article.

---

## 1. Split Key Market Statistics into 2025 and 2026 Cards

**Current state**: A single "Key Market Statistics -- 2025" card with H1 2025 data.

**Changes in `src/pages/News.tsx`**:

- Create a **2026 card first** (primary, larger) showing YTD 2026 statistics with fresh data
- Below it, add a premium separator text: "Looking back at last year's performance?" or similar
- Then a **2025 Full Year Recap card** showing Jan 1, 2025 to Jan 1, 2026 final totals (full-year closed figures)
- Both cards use the existing `jj-layer-active` / `jj-card-inner` champagne styling
- 2026 card gets a "LIVE" or "2026 YTD" badge to indicate it's current

**2026 YTD stats** (sourced from DLD public data):
- Transaction count YTD
- Transaction value YTD  
- Top performing area
- YoY growth comparison

**2025 Full Year stats**:
- Total transactions (full year closed)
- Total value (full year closed)
- YoY growth vs 2024
- Record highlights

---

## 2. Fix Insights Dropdown Cropping (No Scrolling Required)

**Current state**: `MegaMenuInsights.tsx` uses `noScroll` on `MegaMenuShell` but then wraps content in a scrollable `div` with `maxHeight: calc(100dvh - 140px)`. The Guides card has 6 items (up to Golden Visa) which gets cut off.

**Changes in `src/components/header/MegaMenuInsights.tsx`**:

- Remove the inner scrollable `div` wrapper entirely -- let the shell handle sizing
- Reduce link density: make cards more compact by reducing padding and spacing
- Use `compact` mode more aggressively with smaller text/icons so all 8 cards (4x2 grid) fit without scrolling
- If needed, merge related sections (e.g., combine "Legal" items into a single row or reduce link count per card)
- Ensure the entire dropdown fits within the viewport without any scrolling needed

**Changes in `src/components/header/mega-menu-primitives.tsx`**:
- When `noScroll` is true, the shell already avoids `maxHeight`/`overflowY` -- verify this works correctly
- Add a safety `maxHeight: 100dvh - header` even in noScroll mode to prevent overflow off-screen

---

## 3. NewsDetail: Full-Screen Hero (No Content Overlap)

**Current state**: Hero is `h-[60vh] md:h-[70vh]` with article title overlaid at the bottom. The champagne content card overlaps with `-mt-8`.

**Changes in `src/pages/NewsDetail.tsx`**:

- Change hero height to `h-[80vh] md:h-[90vh]` for a truly full-screen feel (like developer pages)
- Remove the `-mt-8` overlap on the content card so the champagne body sits cleanly below the hero
- Keep the gradient overlay light (`from-black/60 via-transparent to-transparent`) so the hero photo is clearly visible
- Move the title/badges overlay to use a thinner bottom gradient strip so the image dominates

---

## 4. Full Article Content with Real Photos and Source Links

**Current state**: Articles have content but it's AI-generated summaries (3-5 paragraphs). User wants full extracted articles with the actual photos from the source.

**Changes in `supabase/functions/ai-news-collector/index.ts`**:

- Update the `enrich` action to request `formats: ["markdown", "links"]` from Firecrawl to get richer content
- Extract ALL images from the scraped markdown (not just the first one) and store them
- Update the AI extraction prompt to preserve the full article length (not summarize to 4-6 paragraphs)
- For the `collect` action, update scraping to also capture images from each source page
- Ensure `source_url` always contains the direct link to the original article

**Changes in `src/pages/NewsDetail.tsx`**:
- Render full article content (already using `dangerouslySetInnerHTML` with markdown rendering)
- Keep the "View Original Source" link prominent at the bottom

---

## 5. Add AI Real Estate Impact Analysis to Each Article

**Database change**: Add an `ai_analysis` column to `market_news` table (type: text, nullable).

**Changes in `supabase/functions/ai-news-collector/index.ts`**:

- During enrichment, after extracting the full content, make a second AI call to generate a "Real Estate Impact Analysis"
- The AI prompt will ask: "How does this news affect Dubai real estate? Summarize the key takeaways for investors and buyers in 3-4 bullet points."
- Store the result in the new `ai_analysis` column

**Changes in `src/pages/NewsDetail.tsx`**:

- After the full article content, add a premium "AI Analysis" section:
  - Champagne card with a sparkle/brain icon
  - Title: "How This Affects Dubai Real Estate"
  - Rendered AI analysis with bullet points on positive impacts
  - Disclaimer: "AI-generated analysis for informational purposes"
- This gives readers a quick summary if they don't want to read the full article

---

## Technical Details

### Database Migration

```sql
ALTER TABLE public.market_news 
ADD COLUMN IF NOT EXISTS ai_analysis text;
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/News.tsx` | Split market stats into 2026 (primary) + 2025 (full year recap) cards |
| `src/pages/NewsDetail.tsx` | Full-screen hero (no overlap), AI analysis section at bottom |
| `src/components/header/MegaMenuInsights.tsx` | Remove inner scroll wrapper, compact layout to fit all items |
| `supabase/functions/ai-news-collector/index.ts` | Full article extraction, image extraction, AI analysis generation |

### AI Analysis Prompt (Edge Function)

```
"You are a Dubai real estate market analyst. Based on this news article, explain how it affects the Dubai real estate market. Write 3-4 concise bullet points covering: (1) immediate market impact, (2) opportunity for investors/buyers, (3) long-term outlook. Be factual and positive where appropriate. Do not add disclaimers."
```

### Enrichment Flow Update

```
For each article:
  1. Scrape source_url via Firecrawl (markdown + links)
  2. AI extracts full article text (preserve full length, don't summarize)
  3. Extract primary image from scraped content
  4. AI generates real estate impact analysis (3-4 bullet points)
  5. UPDATE market_news SET content, image_url, ai_analysis WHERE id = ...
```

