

## Global Data Color Upgrade & Issue Highlighting

### Problems Found

1. **InvestmentMetricsSection** — Labels use `text-muted-foreground` (faded gray), cards have `hover:shadow-gold/15` (ugly gold hover), `ring-gold/10` on icons. Values like rental yield use `text-gold` which is low-contrast on light cards.

2. **MarketOverviewDashboard** — StatCard labels use `text-black/60` (faded), property type volume shows `text-black/50`, data attribution uses `text-black/50` and `text-black/40`. No color differentiation between property types in the list.

3. **DLDMarketWidget (full)** — Stat labels use `text-black/60`. Top Areas list uses `text-black/40` for rank numbers and `text-black/80` for names. Disclaimer is `text-black/40`.

4. **DLDMarketWidget (compact)** — Uses `text-gray-600` for disclaimer, `text-white/60` and `text-white/70` (faded).

5. **ClientMarketSnapshot** — "Moderate" badge uses `text-muted-foreground` (invisible), "stable" trend icon uses `text-muted-foreground`, disclaimer uses `text-muted-foreground/60`.

6. **DataSourcesPanel** — Descriptions use `text-black/60`, trust indicators use `text-black/70`.

7. **No red highlighting** for issues/errors/negative data anywhere.

### Plan

#### Step 1: Create `src/lib/dataColors.ts` — Global Semantic Color Map

A single source of truth for all data/chart/metric colors:

```text
offPlan    → emerald-500 (green)
secondary  → red-500 (red)
cash       → blue-500
mortgage   → amber-500
growth     → emerald-600
decline    → red-600
issue/alert → red-600 (always red)
price      → emerald-700
volume     → purple-600
yield      → blue-600
roi        → emerald-500
rental     → blue-500
```

Plus Tailwind class constants for bars, text, backgrounds, and badges.

#### Step 2: Fix `InvestmentMetricsSection.tsx`

- Replace all `text-muted-foreground` labels with `text-black font-medium`
- Change gold hover shadow to a clean `hover:shadow-lg hover:shadow-black/10`
- Keep ROI green, yield blue (not gold), rental income blue — all with bold saturated values
- Remove `ring-gold/10`, use `ring-emerald-200`, `ring-blue-200`, etc. matching each metric
- Remove `border-gold/40` from metric cards, use matching semantic border colors

#### Step 3: Fix `MarketOverviewDashboard.tsx`

- StatCard labels: `text-black/60` → `text-black font-medium`
- Property Type list: add colored dot indicators per type (Villa=emerald, Apartment=blue, Townhouse=amber, Land=purple)
- Volume text: `text-black/50` → `text-black/70 font-medium`
- Data attribution: `text-black/50` → `text-black/70`

#### Step 4: Fix `DLDMarketWidget.tsx` (full + compact)

- Stat labels: `text-black/60` → `text-black/80 font-medium`
- Top Areas rank: `text-black/40` → `text-black/70 font-bold`
- Compact: `text-gray-600` → `text-black/70`, `text-white/60` → `text-white/80`
- Disclaimer: `text-black/40` → `text-black/60`

#### Step 5: Fix `ClientMarketSnapshot.tsx`

- "Moderate" badge: replace `text-muted-foreground` with `text-blue-600 border-blue-400 bg-blue-50`
- "Stable" trend icon: `text-muted-foreground` → `text-blue-500`
- All `text-muted-foreground` labels → `text-black/80 font-medium`
- Disclaimer: `text-muted-foreground/60` → `text-black/60`

#### Step 6: Fix `DataSourcesPanel.tsx`

- Descriptions: `text-black/60` → `text-black/80`
- Trust indicators: `text-black/70` → `text-black font-medium`

#### Step 7: Add "Issue = Red" Global Rule

- Any negative change, decline, or issue indicator MUST use `text-red-600` with a red background badge
- Update `master-lock.ts` to add a `DATA_COLOR_LOCK` section that enforces:
  - Positive = emerald, Negative = red (always)
  - No gray for any data value, metric label, or chart element
  - Issues/alerts always highlighted in red
  - Each data category must use a distinct semantic color

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/dataColors.ts` | **NEW** — semantic color constants |
| `src/components/project-detail/InvestmentMetricsSection.tsx` | Fix faded labels, gold hover, gold yield color |
| `src/components/market-intelligence/MarketOverviewDashboard.tsx` | Fix faded labels, add property type color dots |
| `src/components/shared/DLDMarketWidget.tsx` | Fix all faded text in both compact and full modes |
| `src/components/client-intelligence/ClientMarketSnapshot.tsx` | Fix moderate badge, stable icon, all faded labels |
| `src/components/market-intelligence/DataSourcesPanel.tsx` | Fix faded descriptions and trust indicators |
| `src/config/master-lock.ts` | Add `DATA_COLOR_LOCK` governance section |

