

# Dynamic Market Report Book: Auto-Sync with Live Data

## What Changes

The market report book is currently a static HTML template hardcoded in `MarketReport.tsx` with fixed stats from 2025. The plan is to make it dynamically pull the latest data from the database every time a user downloads it, so it is always up-to-date.

## Architecture

Instead of a 1,500-line hardcoded HTML string, the `downloadBook` function will:

1. **Fetch live data** from the database before generating the HTML
2. **Inject** that data into the book template
3. The book will always reflect the latest available information

### Data Sources for the Book

| Book Section | Data Source | What Gets Injected |
|---|---|---|
| Latest Market News (new page) | `market_news` table (top 5 recent) | Headlines, summaries, dates, source names |
| DLD Transaction Stats | Hardcoded constants updated via the daily sync memory (manually curated since DLD has no public API) | YTD transactions, off-plan vs secondary, cash vs mortgage, gift counts |
| Top Areas Performance (new page) | DLD stats constants from News.tsx | Top 10 areas with transaction volumes and YoY changes |
| Top Buyer Nationalities (new page) | Nationality constants from News.tsx | Country, percentage, transaction count |
| Project Listings (new page) | `projects` table (top 10 featured) | Name, location, price range, developer, cover image |
| Developer Showcase (new page) | `projects` table (grouped by developer) | Developer names, project counts, key projects |

## Implementation Steps

### Step 1: Extract DLD Data Constants to a Shared File

**New file: `src/constants/dldMarketData.ts`**

Move the DLD stats, top areas, and nationalities data currently hardcoded in `News.tsx` into a shared constants file. This way both `News.tsx` and `MarketReport.tsx` use the same single source of truth.

### Step 2: Fetch Live Data Before Book Generation

**File: `src/pages/MarketReport.tsx`**

Update the `downloadBook` function to:
- Query `market_news` for the 5 most recent articles (title, summary, published_at, source)
- Query `projects` for top 10 featured projects (name, location, price_from, developer_name, cover_image_url)
- Import DLD constants from the shared file
- Pass all this data into the HTML template

### Step 3: Add New Dynamic Pages to the Book HTML

Add 3 new pages to the book template:

**Page: "Latest Market News"**
- Gold-themed news cards with date, headline, and 2-line summary
- Source attribution for each article
- "Updated daily" badge with the current date

**Page: "DLD Market Transactions"**
- Same visual bar charts already in the book but with live numbers
- Off-plan vs Secondary breakdown with colored progress bars
- Cash vs Mortgage ratio with progress bars
- Gift transactions count
- Top 10 Areas table with transaction volumes
- Top 10 Buyer Nationalities with percentage bars
- Date stamp: "Data as of [current date]"

**Page: "Featured Properties"**
- Grid of property cards with cover images
- Name, location, starting price, developer
- "Explore at JBJ.ae" link for each

### Step 4: Update Table of Contents

Add the 3 new sections to the Table of Contents page with correct page numbers.

### Step 5: Add Visual Enhancements

- Colored progress bars (gold for primary, emerald for growth indicators, zinc for secondary)
- Mini bar charts for area transaction volumes
- Nationality flags using emoji indicators
- Date stamps on every data section showing "Last Updated: [date]"
- Gradient dividers between sections

## Technical Details

### Files to Modify

| File | Changes |
|---|---|
| `src/pages/MarketReport.tsx` | Add async data fetching before book generation, inject live news/projects/DLD stats into HTML template, add 3 new book pages |
| `src/pages/News.tsx` | Import DLD constants from shared file instead of inline |

### New Files

| File | Purpose |
|---|---|
| `src/constants/dldMarketData.ts` | Shared DLD stats, top areas, nationalities data used by both News page and Market Report book |

### Data Fetching (before book opens)

```typescript
// Fetch latest 5 news articles
const { data: latestNews } = await supabase
  .from("market_news")
  .select("title, summary, published_at, source, category")
  .order("published_at", { ascending: false })
  .limit(5);

// Fetch top 10 featured projects
const { data: featuredProjects } = await supabase
  .from("projects")
  .select("name, location, price_from, developer_name, cover_image_url, area_name")
  .eq("is_published", true)
  .order("created_at", { ascending: false })
  .limit(10);
```

### Book HTML New Pages (structure)

**Latest News Page:**
- Each news item rendered as a gold-bordered card with date, headline, summary
- Bottom note: "For full articles, visit JBJ.ae/news"

**DLD Stats Page:**
- Reuses existing `.bar-chart`, `.stat-grid`, `.stat-box` CSS classes already in the book
- Progress bars with percentage fills for off-plan/secondary and cash/mortgage splits
- Table for top areas (same `.table-wrapper` styling)

**Featured Properties Page:**
- 2-column grid of property cards using `.info-card` styling
- Cover images with `object-fit: cover` at 120px height
- Price in gold, location in gray, developer name below

### How It Stays Up-to-Date

Since the book HTML is generated client-side at download time:
- News is always the latest 5 articles from `market_news` (which syncs daily via pg_cron)
- Projects reflect the current published listings
- DLD stats update when the shared constants file is updated
- The date stamp on each page shows the actual download date
