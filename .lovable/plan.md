

# Fix Market Data Consistency, Remove Provident References, Upgrade Data Sources

## Issues Found

1. **NewsDetail.tsx** shows "Top 5 Areas" with `slice(0, 5)` — should be Top 10 to match News.tsx and DLDMarketWidget.tsx
2. **News.tsx line 781** lists "Provident" as a source badge in the Victoria Hayes reporter section — must be removed
3. **NewsDetail.tsx** also shows `topNationalitiesData.slice(0, 5)` — should show all 10
4. **News.tsx** uses hardcoded fallback data directly instead of the `useDLDMarketData()` hook (which fetches live data from the database) — inconsistent with DLDMarketWidget which uses the hook
5. Multiple backend files reference Provident (edge functions, admin panels) — those are internal/admin only and acceptable, but all **user-facing** Provident references must go
6. **WhyDubaiSection.tsx** already has "#1 Safest City" but lacks sourcing — needs real source citations (Numbeo, Global Peace Index, Knight Frank Wealth Report)
7. **open-data-config.ts** and **dldMarketData.ts** data is static — needs to be enriched with real source attributions

## Changes

### 1. `src/pages/NewsDetail.tsx` — Fix Top 5 → Top 10
- Change "Top 5 Areas by Transaction Volume" → "Top 10 Areas by Transaction Volume"
- Change `topAreas2026Data.slice(0, 5)` → `topAreas2026Data.slice(0, 10)`
- Change `topNationalitiesData.slice(0, 5)` → `topNationalitiesData.slice(0, 10)`

### 2. `src/pages/News.tsx` — Remove Provident, Use Live Data Hook
- **Line 781**: Remove "Provident" from the source badges array. Replace with "Knight Frank" or "Property Monitor"
- **Lines 128-131**: Replace hardcoded data with `useDLDMarketData()` hook (same pattern as DLDMarketWidget) so all pages use the same live data source
- Update source references to include: "Dubai Media Office", "Dubai Land Dept", "Abu Dhabi Media", "Ministry of Economy", "RERA", "Knight Frank", "Property Monitor"

### 3. `src/components/shared/DLDMarketWidget.tsx` — Already consistent (Top 10), no changes needed

### 4. `src/constants/dldMarketData.ts` — Add real source attributions
- Add a `DATA_SOURCES` constant listing official sources: DLD, RERA, Property Monitor, Knight Frank, Bayut Index, Property Finder, DXB Interact
- Add Dubai city ranking facts: safest city (Numbeo 2025), #1 FDI destination MENA (fDi Intelligence), Knight Frank Prime Global Cities Index ranking

### 5. `src/components/WhyDubaiSection.tsx` — Enrich with real sourced rankings
- Add source citations for "#1 Safest City" (Numbeo Safety Index)
- Add Knight Frank Wealth Report ranking
- Add Global Liveability ranking
- Add source footnotes with attribution

### 6. `src/config/open-data-config.ts` — Add real portal sources
- Add Property Monitor, Knight Frank, Bayut, Property Finder, Dubizzle, Airbnb/Holiday Homes data sources to the `OPEN_DATA_SOURCES` array
- Update `lastUpdated` dates
- Add real market stats from these sources (avg rental yields by area, price per sqft trends)

### 7. `src/pages/MarketReport.tsx` — Already references Property Monitor and Knight Frank correctly, no Provident references in user-facing content

## Files to Edit
- `src/pages/NewsDetail.tsx` — Top 5 → Top 10, nationalities 5 → 10
- `src/pages/News.tsx` — Remove Provident badge, use `useDLDMarketData()` hook
- `src/constants/dldMarketData.ts` — Add source attributions and Dubai ranking facts
- `src/components/WhyDubaiSection.tsx` — Add real sourced rankings with citations
- `src/config/open-data-config.ts` — Add Property Monitor, Knight Frank, Bayut, Property Finder, Airbnb sources

