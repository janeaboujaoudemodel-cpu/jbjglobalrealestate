

## Fix All Remaining Faded/Gray Text Across Data Components

### Issues Found

**AreaIntelligenceGrid.tsx:**
- Line 67: `text-black/50` on "Dubai, UAE" subtitle
- Lines 76, 83: `text-black/60` on "Price Index" and "Rental Index" labels
- Line 121: `text-black/60` on "Year-over-Year" label
- Line 130: `text-black/70` on highlights text
- Line 171: `text-black/70` on section description

**AIMarketInsights.tsx:**
- Line 149: `text-black/70` on section description
- Line 170: `text-black/70` on insight body text
- Line 189: `text-black/70` on narrative generator description
- Line 238: `text-black/80` on generated narrative text (acceptable but could be stronger)
- Line 257: `text-black/70` on disclaimer text

**MarketOverviewDashboard.tsx:**
- Line 94: `text-black/80` on section description (borderline)
- Line 156: `text-black/70` on quarterly trend labels
- Line 173: `text-black/70` on source text
- Line 195: `text-black/70` on volume text
- Line 221: `text-black/50` on bullet separator
- Line 222: `text-black/70` on data source text

**DLDMarketWidget.tsx:**
- Line 93: `text-black/70` on date text
- Line 109: `text-black/80` on stat labels
- Line 119: `text-black/70` on section label
- Line 130: `text-black/70` on section label
- Line 205: `text-black/60` on disclaimer

**DataSourcesPanel.tsx:**
- Line 78: `text-black/80` on description
- Line 85: `text-black/70` on data type tags
- Lines 128, 131: `text-black` on trust indicators — but the section has a DARK background (`from-[hsl(32,28%,13%)]`), so black text is invisible here

**ClientMarketSnapshot.tsx:**
- Line 126: `text-muted-foreground` on info icon
- Line 193: `text-black/70` on explanation text
- Line 226: `text-black/60` on disclaimer

### Plan

#### File 1: `AreaIntelligenceGrid.tsx`
- Line 67: `text-black/50` → `text-black/80 font-medium`
- Lines 76, 83: `text-black/60` → `text-black font-medium`
- Line 121: `text-black/60` → `text-black font-medium`
- Line 130: `text-black/70` → `text-black/90`
- Line 171: `text-black/70` → `text-black/90`

#### File 2: `AIMarketInsights.tsx`
- Line 149: `text-black/70` → `text-black/90`
- Line 170: `text-black/70` → `text-black/90`
- Line 189: `text-black/70` → `text-black/90`
- Line 257: `text-black/70` → `text-black/80`

#### File 3: `MarketOverviewDashboard.tsx`
- Line 156: `text-black/70` → `text-black font-medium`
- Line 173: `text-black/70` → `text-black/90`
- Line 221: `text-black/50` → `text-black/70`

#### File 4: `DLDMarketWidget.tsx`
- Line 93: `text-black/70` → `text-black/90`
- Line 119: `text-black/70` → `text-black font-medium`
- Line 130: `text-black/70` → `text-black font-medium`
- Line 205: `text-black/60` → `text-black/80`

#### File 5: `DataSourcesPanel.tsx` — Critical fix
- Trust indicators (line 128): `text-black` → `text-white` (dark background makes black text invisible)
- Line 131: Trust indicator text stays `text-sm` but needs `text-white`
- Line 78: `text-black/80` → `text-black/90`
- Line 85: `text-black/70` → `text-black font-medium`

#### File 6: `ClientMarketSnapshot.tsx`
- Line 126: `text-muted-foreground` → `text-black/70`
- Line 193: `text-black/70` → `text-black/90`
- Line 226: `text-black/60` → `text-black/80`

#### File 7: Take screenshot to verify

After all fixes, use browser tools to screenshot the market intelligence page and confirm no faded text remains.

### Files Modified

| File | Changes |
|------|---------|
| `src/components/market-intelligence/AreaIntelligenceGrid.tsx` | Bump all /50, /60, /70 opacity text to readable levels |
| `src/components/market-intelligence/AIMarketInsights.tsx` | Bump all /70 text to /90 |
| `src/components/market-intelligence/MarketOverviewDashboard.tsx` | Fix remaining faded labels |
| `src/components/shared/DLDMarketWidget.tsx` | Fix remaining faded labels and disclaimer |
| `src/components/market-intelligence/DataSourcesPanel.tsx` | Fix invisible black-on-dark trust indicators → white |
| `src/components/client-intelligence/ClientMarketSnapshot.tsx` | Remove last muted-foreground, bump faded text |

