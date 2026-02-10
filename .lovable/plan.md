

# Comprehensive Area Extraction, Photos, Maps, and Intelligence

## Current State
- **178 areas** in the database, **0 have images** -- every area card uses the same generic Dubai skyline fallback
- Areas sourced from Reelly project locations only (district names)
- Provident has **~40 curated area guides** with real photos, descriptions, and property data at `/area-guides/`
- Emirate data is fragmented (duplicate entries like "Abu Dhabi" vs "Abu Dhabi Emirate", "Sharjah" vs "Sharjah Emirate")
- Area detail page has no hero photo, no search bar, no map, no developer/project counts, no AI analysis

## What Will Be Built

### Phase 1: New Edge Function -- `provident-areas-sync`

A new backend function that:

1. **Scrapes Provident's area-guides index** via Firecrawl to get all ~40 area guide URLs
2. **Scrapes each area detail page** (e.g., `/area-guides/downtown-dubai/`) to extract:
   - Hero/banner image URL (the real area photo)
   - Area description text
   - Key stats (properties for sale, average price, etc.)
3. **Matches Provident areas to existing DB areas** by slug similarity (e.g., "downtown-dubai" matches our `downtown-dubai` slug)
4. **Updates `areas` table** with real `image_url` from Provident -- never overwrites existing images
5. **For areas without Provident coverage**, uses Google image search via Firecrawl search to find real area photos (searching "Downtown Dubai skyline" etc.)

### Phase 2: Database Schema Additions

Add columns to the `areas` table:

```
developer_count    INTEGER DEFAULT 0
project_count_sale INTEGER DEFAULT 0
project_count_rent INTEGER DEFAULT 0
avg_price_sqft     NUMERIC
provident_url      TEXT
hero_image_url     TEXT        -- full-screen hero (larger than card image)
```

Also normalize emirates (merge "Abu Dhabi" + "Abu Dhabi Emirate" into "Abu Dhabi", etc.).

### Phase 3: Update Area Detail Page (`AreaDetail.tsx`)

Transform into a Provident-style premium area page:

1. **Full-screen hero section** with the real area photo as background (not a gradient), a search bar overlay, and breadcrumb navigation
2. **Stats bar** below hero showing: Projects count, Developers count, Avg Price/sqft, Properties for Sale
3. **Projects grid** -- fetch and display projects in this area from the `projects` table
4. **Developers in this area** -- aggregate and show developer logos active in this area
5. **Interactive Map** using Leaflet (already installed) showing project pins in this area
6. **AI Area Analyzer** section -- embedded AI Property Analyzer pre-configured for this area, showing:
   - Price per sqft analysis
   - Area performance intelligence
   - Supply vs demand comparison
   - Comparison with neighboring areas

### Phase 4: Update Area Guides Page (`AreaGuides.tsx`)

- Area cards now show **real photos** instead of the generic skyline fallback
- Add developer count and project count stats to each card
- Cards link to the enhanced area detail pages

### Phase 5: Sync Developer/Project Counts per Area

Create a query (or backend function step) that:
- Counts distinct developers per area from the `projects` table
- Counts projects by sale/rent status per area
- Calculates average price per sqft per area
- Stores these in the new `areas` columns

---

## Technical Details

### New Files
| File | Purpose |
|---|---|
| `supabase/functions/provident-areas-sync/index.ts` | Edge function: scrape Provident area guides, extract photos/descriptions, update DB |
| `src/components/area-detail/AreaHeroSection.tsx` | Full-screen hero with real photo + search bar |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Projects in this area grid |
| `src/components/area-detail/AreaDevelopersBar.tsx` | Developers active in this area |
| `src/components/area-detail/AreaMapSection.tsx` | Leaflet map with project pins |
| `src/components/area-detail/AreaAIAnalyzer.tsx` | Embedded AI analysis for this area |

### Modified Files
| File | Changes |
|---|---|
| `src/pages/AreaDetail.tsx` | Complete redesign with hero photo, search, map, AI analyzer, projects grid |
| `src/pages/AreaGuides.tsx` | Cards now show real photos, developer/project counts |
| `src/hooks/useAreas.ts` | Add hooks for area stats (developer count, avg price) |
| `supabase/functions/reelly-areas-sync/index.ts` | Add Provident photo extraction step, emirate normalization |

### Database Migration
```sql
-- Add new columns to areas
ALTER TABLE areas ADD COLUMN IF NOT EXISTS developer_count INTEGER DEFAULT 0;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS project_count_sale INTEGER DEFAULT 0;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS avg_price_sqft NUMERIC;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS provident_url TEXT;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Normalize emirates
UPDATE areas SET emirate = 'Abu Dhabi' WHERE emirate = 'Abu Dhabi Emirate';
UPDATE areas SET emirate = 'Sharjah' WHERE emirate = 'Sharjah Emirate';
UPDATE areas SET emirate = 'Ajman' WHERE emirate = 'Ajman Emirate';
UPDATE areas SET emirate = 'Ras Al Khaimah' WHERE emirate IN ('Ras al-Khaimah', 'Ras Al Khaimah');
UPDATE areas SET emirate = 'Umm Al Quwain' WHERE emirate = 'Umm al-Quwain';
```

### Provident Area Sync Flow

```text
1. Scrape providentestate.com/area-guides/ --> get all area URLs
2. For each URL (e.g., /area-guides/downtown-dubai/):
   a. Scrape with Firecrawl (markdown + screenshot)
   b. Extract hero image URL from HTML/metadata
   c. Extract description text
   d. Match to DB area by slug
   e. UPDATE areas SET image_url = ?, hero_image_url = ?, description = ? WHERE slug = ?
3. For remaining areas without images:
   a. Use Firecrawl search: "{area_name} Dubai real estate skyline"
   b. Take first image result as fallback
```

### Area Detail Page Layout (top to bottom)

```text
+--------------------------------------------------+
|  FULL-SCREEN HERO (real area photo)               |
|  [Search bar: "Search properties in Downtown..."] |
|  Breadcrumb: Home > Areas > Downtown Dubai        |
|  Stats: 21 Projects | 8 Developers | AED 2,500/sf |
+--------------------------------------------------+
|  PROJECTS IN THIS AREA (grid of project cards)    |
+--------------------------------------------------+
|  DEVELOPERS IN THIS AREA (logo bar)               |
+--------------------------------------------------+
|  INTERACTIVE MAP (Leaflet with project pins)      |
+--------------------------------------------------+
|  AI AREA INTELLIGENCE                             |
|  - Price/sqft analysis                            |
|  - Supply vs Demand                               |
|  - Comparison with nearby areas                   |
+--------------------------------------------------+
|  RELATED AREAS (existing section, enhanced)       |
+--------------------------------------------------+
```

## Execution Order
1. Database migration (add columns, normalize emirates)
2. Create `provident-areas-sync` edge function
3. Deploy and run it to populate area images
4. Build area detail sub-components (hero, map, projects grid, AI analyzer)
5. Redesign AreaDetail.tsx with all new sections
6. Update AreaGuides.tsx cards to show real photos

