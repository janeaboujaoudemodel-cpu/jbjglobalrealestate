

## Developer Detail Page: DLD Market Widget + Premium AI Analyzer

### What will change

**1. Add DLD Market Widget to Developer Detail Page**
- Import and render the existing `DLDMarketWidget` component (same one used on Area Detail pages) inside the developer detail page
- Place it after the projects grid and before the AI Analyzer
- The widget already displays live YTD 2026 DLD transaction data (volume, transactions, top areas, buyer nationalities) and updates its "As of" date dynamically on each page load
- The data comes from `dldMarketData.ts` constants -- when these constants are updated, every page showing the widget reflects the new numbers instantly

**2. Move AI Analyzer Before the Projects Grid**
- Currently the `DeveloperAIAnalyzer` is rendered after the projects section
- Move it to render before the Emirates Tabs / projects section (after the developer header + map, before the filter bar)

**3. Upgrade AI Analyzer to Premium Visual Charts**
- Replace the current plain-text card layout in `DeveloperAIAnalyzer.tsx` with the same premium chart components used in `AreaAIAnalyzer.tsx`:
  - **Price Per Sqft**: BarChart with historical trend + projection + YoY badge
  - **Supply vs Demand**: AreaChart with gold (supply) and emerald (demand) gradient fills + market status badge
  - **Investment Metrics**: Horizontal BarChart with Rental Yield, Cap Rate, Appreciation, Occupancy
  - **Portfolio Strength**: Developer landscape card with styled entries
  - **Rating**: Radial PieChart gauge (gold arc on black background) with quality label
  - **Overview**: Enhanced card with icon header and community profile subtitle
  - **Pros/Cons**: Same emerald/red styled cards
- All chart components (PricePerSqftChart, SupplyDemandChart, InvestmentMetricsChart, DeveloperLandscapeCard) and their parsing functions will be copied from `AreaAIAnalyzer.tsx` into the developer analyzer, adapted with developer-specific labels (e.g., "Developer Overview" instead of "Area Overview", "Portfolio Profile" subtitle)

### Files to change

| File | Action |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Import `DLDMarketWidget`, move `DeveloperAIAnalyzer` above projects section, add DLD widget after projects |
| `src/components/developer/DeveloperAIAnalyzer.tsx` | Full rewrite with recharts-based premium chart components matching the Area AI Analyzer visual standard |

### Technical Details

- **DLD Widget placement**: Rendered after the projects grid `</div>` and before the AI analyzer, using `<DLDMarketWidget />` with no `highlightArea` prop (developer pages are not area-specific)
- **Chart dependencies**: `recharts` is already installed (`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`, `Cell`, `AreaChart`, `Area`, `PieChart`, `Pie`)
- **Parsing functions**: `parsePricePerSqftMetrics`, `parseInvestmentMetrics`, `parseSupplyDemandMetrics` will be included in the developer analyzer file, adapted to work with developer context
- **Section order on page**: Hero -> Developer Header + Stats -> Map -> AI Analyzer -> Emirates Tabs + Filter + Projects Grid -> DLD Market Widget
- **No backend changes**: Uses the same `ai-property-analyzer` edge function and `dldMarketData.ts` constants

