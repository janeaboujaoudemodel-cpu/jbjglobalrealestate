

## Comprehensive Fix: Area Images, News Photos, and DLD Market Data Across All Pages

### Issues Identified

**A. Area Images -- 14 areas using individual building/project photos instead of aerial community views**

These 14 areas have `reelly-backend.s3.amazonaws.com/projects/...` URLs -- meaning they show a single building render, not the master community:

| Area | Current Image Source |
|------|---------------------|
| Abu Dhabi | Single project render |
| Al Jaddaf | Single project render |
| Al Yasmeen | Single project render |
| Bukadra | Single project render |
| Damac Riverside | Single project render |
| Dubai Land Residence Complex | Single project render |
| Dubai Studio City | Reelly API single building |
| Jebel Ali Freezone Extension | Single project render |
| Jumeirah Islands | Single project render |
| JVT (Jumeirah Village Triangle) | Single project render |
| Majan | Single project render |
| Ras Al Khor | Single project render |
| Saih Shuaib | Single project render |
| The Heights / Wadi Al Safa 3 | Single project render |

Additionally: **Maryam Island** has a broken Pinterest share URL (not a real image URL).

**B. News Articles -- 8 articles with bad/tiny/wrong images**

| Article | Problem |
|---------|---------|
| Top 10 Upcoming Mega Projects in Dubai | Property Finder generic 400x209 thumbnail (worker collecting trash) |
| New Malls in Dubai (2026-2028) | PF 400x209 (approved visa form -- wrong topic) |
| JVT vs JVC: Comparison | PF 400x209 (approved visa form -- duplicate) |
| Duplex vs Townhouse | PF 400x209 (gathering of people -- wrong topic) |
| Property Management Fees in Dubai | PF 400x209 (gas burner -- wrong topic) |
| 15 Reasons to Invest in Dubai 2026 | PF 2018 generic market image |
| Tech watches and robot dogs | The National 200x200 tiny thumbnail |
| Dubai property market to cool (Moody's) | The National 200x200 tiny thumbnail (duplicate of above) |

**C. DLD Market Data missing from key pages**

The News page already has the full DLD section (2026 YTD, 2025 recap, top areas, buyer nationalities). These pages are missing it entirely:
- Properties (PropertiesReelly.tsx)
- Areas (AreaGuides.tsx)
- Developers (Developers.tsx)
- Buyer Guide (BuyerGuide.tsx)

The DLDMarketWidget exists on detail pages (AreaDetail, DeveloperDetail, ProjectDetail) but NOT on the index/listing pages.

---

### Plan

#### Part 1: Fix 14 Area Images + Maryam Island (Database)

**Approach**: Update `enrich-area-images` to reject `reelly-backend.s3.amazonaws.com/projects/` URLs (these are individual project renders, not community photos). Then for each of the 15 areas:

1. Use Firecrawl Search for `"{area name}" Dubai aerial view community master plan` targeting image-rich portals (bayut.com, propertyfinder.ae, dubailand.gov.ae)
2. Extract OG images / large editorial photos from search results
3. If no community-level photo found, set to NULL (gradient fallback)

**Changes to `supabase/functions/enrich-area-images/index.ts`**:
- Add `reelly-backend.s3.amazonaws.com/projects/` to the bad image pattern in `isGoodAreaImage()`
- Add `pinterest.com` to the bad image pattern
- Add `keyspacerealty.com` to bad patterns
- Update the area selection query to also match these patterns: `.or("image_url.ilike.%reelly-backend.s3%projects%,image_url.ilike.%pinterest.com%")`
- Change search queries from generic to specifically request "aerial", "master plan", "community overview"

**SQL**: Update the 15 area image URLs to NULL so the enrichment function picks them up:
```sql
UPDATE areas SET image_url = NULL 
WHERE image_url LIKE '%reelly-backend.s3.amazonaws.com/projects/%'
   OR image_url LIKE '%pinterest.com%';
```

Then trigger `enrich-area-images` to find real community photos.

#### Part 2: Fix 8 News Article Images (Database + Edge Function)

For each of the 8 bad articles, use the `fix-null-images` action (already exists in `ai-news-collector`):

1. Set all 8 bad image URLs to NULL first (so the fix action picks them up)
2. The fix action searches for each article title via Firecrawl Search and extracts the proper OG image from the actual article page
3. Add Property Finder 400x209 thumbnails and The National 200x200 thumbnails to `KNOWN_BAD_URLS` in `ai-news-collector` to prevent future imports

**SQL**:
```sql
UPDATE market_news SET image_url = NULL 
WHERE image_url LIKE '%propertyfinder.ae/blog/wp-content/uploads%'
   OR (image_url LIKE '%arcpublishing.com%' AND image_url LIKE '%width=200%');
```

Then trigger `ai-news-collector` with `action: "fix-null-images"`.

#### Part 3: Add DLD Market Widget to 4 Pages

Add the `DLDMarketWidget` component (already built) to these pages, placed after the main content grid and before the footer:

| Page | File | Placement |
|------|------|-----------|
| Properties | `PropertiesReelly.tsx` | After the project grid |
| Areas | `AreaGuides.tsx` | After the area cards grid |
| Developers | `Developers.tsx` | After the developer cards grid |
| Buyer Guide | `BuyerGuide.tsx` | After the guide content sections |

Each will use the existing `DLDMarketWidget` component with a simple import and placement. This gives every key page the 2026 YTD stats, 2025 recap, top 10 areas, and buyer nationalities.

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Reject project render URLs; add aerial/community-focused search queries |
| `supabase/functions/ai-news-collector/index.ts` | Add PF 400x209 and National 200x200 to KNOWN_BAD_URLS |
| `src/pages/PropertiesReelly.tsx` | Import and add DLDMarketWidget after project grid |
| `src/pages/AreaGuides.tsx` | Import and add DLDMarketWidget after area cards |
| `src/pages/Developers.tsx` | Import and add DLDMarketWidget after developer cards |
| `src/pages/BuyerGuide.tsx` | Import and add DLDMarketWidget after guide content |
| Database (SQL) | NULL out 15 area images with project renders; NULL out 8 news images with bad thumbnails |

### Execution Order

1. SQL: Reset 15 bad area images and 8 bad news images to NULL
2. Update `enrich-area-images` to search for aerial/community photos specifically
3. Update `ai-news-collector` KNOWN_BAD_URLS blocklist
4. Deploy both edge functions
5. Trigger `enrich-area-images` to find community photos for the 15 areas
6. Trigger `ai-news-collector` with `fix-null-images` to find proper article photos
7. Add DLDMarketWidget to 4 pages (PropertiesReelly, AreaGuides, Developers, BuyerGuide)
8. Verify via DB queries and screenshots

