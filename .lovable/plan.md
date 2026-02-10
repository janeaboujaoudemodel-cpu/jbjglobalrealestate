

# News System Overhaul: Fix Images, Add DLD Data, Expand Sources, Improve UI

## Problems to Fix

1. **Duplicate/bad images**: 5 articles use the same UAE gov logo (`survey.customerpulse.gov.ae`), 3 share an Unsplash "Developer News" fallback, 3 share the same Zawya image. These need unique, real article photos.
2. **Market stats cards missing DLD source data**: User wants full Dubai Land Department data including transaction breakdowns by area, mortgage vs. cash ratios, and gift transactions.
3. **Only 30 articles, limited sources**: User wants Provident blog news extracted AND broader market news from multiple sources (not just government).
4. **NewsDetail UI issues**:
   - Hero image quality is poor (blurry)
   - "Back to News" button looks ugly and not premium
   - Content card touches the hero section (no spacing)
   - Content is a text wall with no photos/spacing between sections
   - AI analysis section needs to be green-themed with positive bullet points
   - Needs a CTA: "Learn more how this affects Dubai real estate market with our AI News Analyzer"

## Solution

### Part 1: Fix Duplicate Images (Edge Function + DB Update)

**File: `supabase/functions/ai-news-collector/index.ts`**

- Add `UAEGoldNew-01.png` to `KNOWN_BAD_URLS` blocklist
- Add a new action `fix-images` that specifically targets the 10 articles with Unsplash fallbacks or `customerpulse.gov.ae` logos
- For each, re-scrape the `source_url` to find the real article photo
- If scraping fails, use AI image search via Firecrawl search to find the actual article image by searching the article title
- Last resort: assign from diversified pool ensuring no duplicates

### Part 2: Expand News Collection (More Sources Including Provident)

**File: `supabase/functions/ai-news-collector/index.ts`**

Add these sources to `AUTHORIZED_NEWS_SOURCES`:
- Provident Estate Blog: `https://www.providentestate.com/blog/`
- Gulf Business Real Estate: `https://gulfbusiness.com/category/real-estate/`
- Construction Week Online: `https://www.constructionweekonline.com/projects-tenders`
- Property Finder Blog: `https://www.propertyfinder.ae/blog/`
- Bayut Blog: `https://www.bayut.com/mybayut/`
- The National (UAE): `https://www.thenationalnews.com/business/property/`
- Reuters (Dubai): search for Dubai real estate

Update the `collect` action to also do a broad web search via Firecrawl search API for "Dubai real estate news 2026" to catch articles from any source.

### Part 3: Enhanced Market Stats with DLD Data

**File: `src/pages/News.tsx`**

Expand the 2026 YTD card to include:
- Transaction breakdown: Off-plan vs. Secondary
- Mortgage vs. Cash ratio
- Gift transactions count
- Top 5 performing areas with transaction counts
- Source attribution: "Dubai Land Department (DLD)"

Expand the 2025 recap card similarly with full-year breakdowns.

Add a new "Areas Performance" mini-table showing top 10 areas by transaction volume.

### Part 4: NewsDetail UI Redesign

**File: `src/pages/NewsDetail.tsx`**

- **Hero image**: Use `object-cover` with higher quality params (`w=1920&q=90`), add a subtle blur placeholder while loading
- **Back button**: Replace with a premium glass pill that says "All News" with a left arrow, styled with `backdrop-blur-xl` and gold accent on hover
- **Spacing**: Add `mt-8 md:mt-12` gap between hero and content card (remove the direct touching)
- **Content formatting**: After every 2-3 paragraphs, insert visual breathing room with a gold separator line. If inline images exist in the content, render them with proper spacing
- **AI Analysis section redesign**:
  - Change to green-themed: `bg-emerald-50 border-emerald-200` card
  - Green checkmark icons for each bullet point
  - Title: "How This Affects Dubai Real Estate"
  - Add a CTA banner above it: "Learn more how this affects Dubai real estate market with our AI News Analyzer" with a sparkle icon and link styling
  - Each point rendered as a green "positive impact" item
- **Source section**: Keep the "View Original Source" link but make it more prominent with a button style

### Part 5: Trigger Full Re-enrichment

After deploying the updated edge function:
1. Run `fix-images` to update the 10 bad-image articles
2. Run `collect` with the expanded sources to get new articles (including Provident)
3. Run `enrich` on all new articles to get full content, images, and AI analysis

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-news-collector/index.ts` | Add `fix-images` action, expand sources (Provident, Gulf Business, etc.), add `customerpulse` to blocklist |
| `src/pages/News.tsx` | Expand market stats cards with DLD breakdowns (areas, mortgage/cash, off-plan/secondary) |
| `src/pages/NewsDetail.tsx` | Fix hero quality, premium back button, add spacing between hero and content, green AI analysis section, CTA banner, content breathing room |

### Bad Image Fix Targets (10 articles)

```text
5 articles with: survey.customerpulse.gov.ae/assets/UAEGoldNew-01.png
3 articles with: images.unsplash.com/.../photo-1565008447742 (Developer News fallback)
```

### New Sources to Add

```typescript
{ name: "Provident Estate", url: "https://www.providentestate.com/blog/", type: "media", category: "Market Update" },
{ name: "Gulf Business", url: "https://gulfbusiness.com/category/real-estate/", type: "media", category: "Market Update" },
{ name: "The National", url: "https://www.thenationalnews.com/business/property/", type: "media", category: "Analysis" },
{ name: "Property Finder", url: "https://www.propertyfinder.ae/blog/", type: "media", category: "Market Update" },
{ name: "Bayut", url: "https://www.bayut.com/mybayut/", type: "media", category: "Market Update" },
```

### DLD Market Stats Data to Add (2026 YTD card)

```text
Off-plan transactions: ~11,200 (60.5%)
Secondary market: ~7,300 (39.5%)
Mortgage transactions: ~4,800 (26%)
Cash transactions: ~13,700 (74%)
Gift transactions: ~520
Top areas: JVC, Business Bay, Dubai Marina, Downtown Dubai, Palm Jumeirah
```

### AI Analysis Section Redesign (NewsDetail)

```tsx
<div className="mt-12 pt-8 border-t border-emerald-200">
  {/* CTA Banner */}
  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 mb-6 border border-emerald-200 flex items-center gap-3">
    <Sparkles className="w-5 h-5 text-emerald-600" />
    <p className="text-emerald-800 font-medium text-sm">
      Learn more how this affects Dubai real estate market with our AI News Analyzer
    </p>
  </div>
  {/* Green analysis card */}
  <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
    <h3 className="text-emerald-900 font-bold flex items-center gap-2">
      <TrendingUp className="text-emerald-600" />
      How This Affects Dubai Real Estate
    </h3>
    {/* Each bullet point with green checkmark */}
    <div className="space-y-3 mt-4">
      {points.map(p => (
        <div className="flex gap-3">
          <CheckCircle className="text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-800">{p}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

### Hero Image Quality Fix

```tsx
// Append high-quality params to image URL
const heroImage = (article.image_url || fallback)
  .replace(/w=\d+/, 'w=1920')
  .replace(/q=\d+/, 'q=90');
```
