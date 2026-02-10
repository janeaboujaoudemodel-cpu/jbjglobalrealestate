

# News System Overhaul + Provident/Reelly Source Audit

## Part 1: Replace Static Fake News with Real AI-Collected News

### Problem
The News page (`src/pages/News.tsx`) has 9 hardcoded static news articles with fake Unsplash images and fabricated content. The `market_news` database table is empty, so the page always falls back to these fake articles.

### Solution
1. **Delete all static fallback articles** from `News.tsx` (lines 12-94, the `staticNewsArticles` array). Replace with an empty-state message prompting the user to click "Refresh News" to collect real articles.

2. **Expand the `ai-news-collector` edge function** to include more sources as requested:
   - Keep existing: Dubai Land Department, RERA, UAE Ministry of Economy, Dubai Media Office, WAM
   - Add new: Abu Dhabi Media Office, Dubai Chamber of Commerce, Arabian Business / Economy Middle East, Property Finder Research, Zawya Real Estate, Gulf News Property
   - Each source gets its category (Policy, Economic, Market Update, etc.)

3. **Add source badge on news cards** -- each card will display the official source name (e.g., "Dubai Land Department", "RERA", "Gulf News") as a small badge. These are real journalism/government sources, which is appropriate.

4. **Internal news detail page** -- currently "Read More" links externally via `source_url`. Instead, create a `/news/:id` route that shows the full article content internally. The source attribution at the bottom will say "Source: Dubai Land Department" etc. The external `source_url` can be a small "Original Source" link at the bottom of the article, not prominent.

### New file: `src/pages/NewsDetail.tsx`
- Fetches article by ID from `market_news` table
- Displays full content, hero image, source attribution, date, category
- Premium champagne card layout matching the site design

### Modified: `src/pages/News.tsx`
- Remove `staticNewsArticles` array entirely
- Card clicks navigate to `/news/${article.id}` instead of external links
- Show source name on each card (RERA, DLD, etc.)
- Better empty state when no DB articles exist

### Modified: `supabase/functions/ai-news-collector/index.ts`
- Add 6+ new authorized sources
- Ensure images are sourced from Unsplash stock photos related to Dubai (not fake)
- Better error handling for when Perplexity/Firecrawl credits are exhausted

### Modified: `src/App.tsx`
- Add route: `/news/:id` -> `NewsDetail`

---

## Part 2: Full Audit -- Remove ALL Provident/Reelly References from Public UI

### Files with public-facing Provident/Reelly text (code comments are fine, visible text is NOT):

| File | Issue | Fix |
|------|-------|-----|
| `src/components/DeveloperPartnersMarquee.tsx` | Comments say "extracted from Provident Homepage" (lines 6-8, 36) | Change comments to neutral wording like "Additional featured partners" |
| `src/components/ProjectCard.tsx` | Comment "Navigation Arrows - Always Visible (Provident style)" (line 213) | Change to "Navigation Arrows - Always Visible" |
| `src/components/project-detail/DataFreshnessIndicator.tsx` | Code maps "reelly"/"provident" to "Verified" (lines 50-51) | Already correct -- maps to "Verified", not showing raw source name. No change needed. |
| `src/components/project-detail/FloorPlanGallery.tsx` | Comment "Matches Provident's floor plan section" (line 32) | Change to "Floor plan section with bedroom type buttons" |
| `src/components/project-detail/CallToActionSection.tsx` | Comment "matching Provident's..." (line 45) | Change to neutral description |
| `src/components/project-detail/ProjectBreadcrumb.tsx` | Comment "Matches Provident's structure" (line 18) | Change to neutral |
| `src/components/project-detail/NewsletterSection.tsx` | Comment "matching Provident's..." (line 20) | Change to neutral |
| `src/components/project-detail/PaymentPlanVisualization.tsx` | Comment "Reelly-style" (line 218) | Change to "Milestone-style" |
| `src/components/FeaturedProjectAd.tsx` | Comment "Matches Provident Estate's sidebar" (lines 16-17) | Change to neutral |
| `src/components/home/HeroSearchBar.tsx` | Comments "Reelly API", "Reelly Parity", "Reelly-style" (lines 90, 404, 764, 806, 829) | Change all to neutral descriptions |
| `src/components/filters/SaleStatusFilter.tsx` | Comment "Reelly-style" (line 2) | Change to neutral |
| `src/pages/Properties.tsx` | Comment "Reelly API" (line 144), "like Provident" (line 1080) | Change to neutral |
| `src/pages/AreaGuides.tsx` | Comment "Reelly-synced" (line 3) | Change to "Database-synced" |
| `src/lib/imageUtils.ts` | Domain whitelist has "reelly.io", "provident.ae" (lines 43-45) -- internal only, not visible | Keep -- these are backend image domain trusts, never shown to users |

### Summary of Part 2
- ~15 files with code comments referencing Provident/Reelly -- all will be neutralized
- No user-visible text currently shows "Provident" or "Reelly" (DataFreshnessIndicator already maps to "Verified")
- Internal/admin pages (SyncDashboard, ProvidentSyncButton, etc.) are admin-only and won't be changed

---

## Technical Details

### New Route
```
/news/:id -> NewsDetail (lazy loaded)
```

### NewsDetail.tsx structure
- Fetches single article from `market_news` by UUID
- Hero image with gradient overlay
- Article title, category badge, date, source badge
- Full `content` field rendered as paragraphs
- "Source: [Official Name]" attribution at bottom
- Back button to /news

### ai-news-collector expanded sources
```typescript
const AUTHORIZED_NEWS_SOURCES = [
  // Existing
  { name: "Dubai Land Department", ... },
  { name: "RERA", ... },
  { name: "UAE Ministry of Economy", ... },
  { name: "Dubai Media Office", ... },
  { name: "Emirates News Agency (WAM)", ... },
  // New
  { name: "Abu Dhabi Media Office", url: "https://mediaoffice.abudhabi/en", category: "Government" },
  { name: "Dubai Chamber of Commerce", url: "https://www.dubaichamber.com/news", category: "Economic" },
  { name: "Arabian Business", url: "https://www.arabianbusiness.com/industries/real-estate", category: "Market Update" },
  { name: "Gulf News Property", url: "https://gulfnews.com/living-in-uae/property", category: "Market Update" },
  { name: "Zawya", url: "https://www.zawya.com/en/business/real-estate", category: "Analysis" },
  { name: "Khaleej Times", url: "https://www.khaleejtimes.com/business/real-estate", category: "Market Update" },
];
```

### Files to modify (total ~18)
- `src/pages/News.tsx` -- remove static articles, add internal linking
- `src/pages/NewsDetail.tsx` -- NEW
- `src/App.tsx` -- add route
- `supabase/functions/ai-news-collector/index.ts` -- expand sources
- ~14 component files -- neutralize Provident/Reelly comments

