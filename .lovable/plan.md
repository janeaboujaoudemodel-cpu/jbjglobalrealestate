

## Fix Plan: Search Bar in FilterShortcutBar + Sort Pills Layout + News Page Fixes

### Issue 1: FilterShortcutBar Row 1 Layout Fix

**Current Problem:** On the Properties page, the `FilterShortcutBar` Row 1 shows: `Map | Saved | AED | Filter | Mode: Investor` but NO search input and NO sort pills. The search bar is rendered separately above the FilterShortcutBar. The "Mode: Investor" button stretches too wide.

**Required Layout (Row 1):**
```
[ Search (area, project, keyword...) ] | Newest | Low-High | High-Low | A-Z | Map | Saved | AED | Filter | Mode: Investor
```

**Required Layout (Row 2 - unchanged):**
```
Price | Payments | Handover | Property Type | Bedrooms | Status | Construction | Hide Sold | Reset
```

**Changes to `src/components/filters/FilterShortcutBar.tsx`:**
- Move the 4 sort pills (Newest, Low-High, High-Low, A-Z) from Row 2 into Row 1, positioned BETWEEN the search slot and the Map toggle
- Sort pills in Row 1 should be compact inline buttons within the connected bar (same height/style as Map, Saved, etc.)
- Remove sort pills from Row 2 (keep only filter popovers + Hide Sold + Reset)
- Fix "Mode: Investor" button to use compact sizing (`max-w-fit`, not stretching) -- same as other buttons in the bar

**Changes to `src/pages/Properties.tsx`:**
- Pass the existing search input as `searchSlot` to FilterShortcutBar instead of rendering it separately
- Remove the separate search input above FilterShortcutBar
- Make placeholder text: "Search area, project or keyword..."

**Changes to `src/pages/AreaGuides.tsx`:**
- Ensure the same searchSlot pattern is passed (already done for sticky version, verify inline version too)

---

### Issue 2: News Page Hero Video

**Problem:** The hero section still uses the `press-kit-hero.mp4` video which the user finds ugly.

**Fix in `src/pages/News.tsx`:**
- Replace the video with a static gradient background with the JBJ monogram as a subtle watermark
- Use a premium dark gradient (`bg-gradient-to-b from-black via-zinc-900 to-black`) with gold accent blurs
- Add the JBJ monogram image centered with low opacity as a brand element

---

### Issue 3: News Featured Badge Color

**Problem:** The "Featured" badge on line 379 uses `bg-gold` (old yellow gold), not the new champagne gradient style.

**Fix in `src/pages/News.tsx`:**
- Change Featured badge from `bg-gold` to `bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#E2D4B8] text-black border border-gold/50`

---

### Issue 4: News Cards Missing Photos

**Problem:** 10+ news articles have `image_url = NULL`. Cards show a dark gradient placeholder with a newspaper icon.

**Fix in `supabase/functions/ai-news-collector/index.ts`:**
- After scraping each article, if no image is found, use Firecrawl Search to find a relevant image for that article's topic
- Search query: `"{article_title}" Dubai real estate photo`
- Extract image URLs from search results, pick the first high-quality one
- Deduplicate across the batch to prevent same image on multiple cards
- Also add a one-time backfill: create a small edge function or SQL update to find existing articles without images and populate them

**Fix in `src/pages/News.tsx`:**
- For cards that STILL have no image, show a better placeholder with the article category icon and a premium gradient instead of the dark void

---

### Issue 5: Duplicate Photos on News Cards

**Problem:** Same photo appears on multiple news cards.

**Fix in `supabase/functions/ai-news-collector/index.ts`:**
- Track all image URLs used in the current batch
- Before assigning an image, check if it's already been used
- If duplicate, search for an alternative image or skip

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Move sort pills from Row 2 to Row 1 (between search and Map); fix Mode button sizing |
| `src/pages/Properties.tsx` | Pass search input as `searchSlot` to FilterShortcutBar; remove separate search input |
| `src/pages/News.tsx` | Replace hero video with static gradient + monogram; fix Featured badge to champagne style; improve no-image placeholder |
| `supabase/functions/ai-news-collector/index.ts` | Add Firecrawl image search fallback for articles without images; deduplicate across batch |

### Technical Details

**FilterShortcutBar Row 1 new structure:**
```
<div connected-bar>
  {searchSlot}           // flex-1, search input
  | Newest | Low-High | High-Low | A-Z   // sort buttons, compact, border-r separators
  | Map | Saved | AED | Filter | Mode    // existing controls
</div>
```

Each sort button in Row 1 will be a compact inline button matching the style of Map/Saved/AED (same `px-3 py-2.5 text-xs font-semibold` with `border-r border-gold/20`). Active sort will have `bg-gold/20 text-black font-bold`.

**Mode button fix:** Add `flex-shrink-0` and remove any `flex-1` or stretching. Keep same compact style as other buttons.

**News hero replacement:**
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-black to-black">
  <img src={jbjMonogram} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-5" />
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
</div>
```

**News image backfill approach:** After deploying the collector fix, run a one-time collection to backfill existing articles. Alternatively, update the edge function to accept an `action: 'backfill-images'` parameter that queries articles with null images and searches for images via Firecrawl.
