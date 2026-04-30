# Refactor Market Intelligence to a Single Theme Token System

## The problem

The Market Intelligence area uses ~175 inline `style={{ color: '#000000', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}` overrides scattered across 9 files. Hex codes like `#000000`, `#374151`, `#047857`, `#1D4ED8`, `#F5F5F5` are repeated dozens of times. This:

- Bypasses our existing `.surface-light` / `.surface-dark` token system in `src/index.css`.
- Means any future theme tweak (e.g. raising muted-text contrast) has to touch every file.
- Makes the contrast guards in `src/index.css` ineffective on these elements (inline styles win over CSS).

The infrastructure to fix this already exists — the components just don't use it.

## Files in scope

Components (high inline-style density):
- `src/components/market-intelligence/MarketIntelligenceHero.tsx` (2)
- `src/components/market-intelligence/MarketIntelligenceNavigation.tsx` (22)
- `src/components/market-intelligence/MarketIntelligenceTableOfContents.tsx` (14)
- `src/components/market-intelligence/MarketOverviewDashboard.tsx` (25)
- `src/components/market-intelligence/AreaIntelligenceGrid.tsx` (36)
- `src/components/market-intelligence/AIMarketInsights.tsx` (27)
- `src/components/market-intelligence/MarketReports.tsx` (25)
- `src/components/market-intelligence/DataSourcesPanel.tsx` (19)

Parent page:
- `src/pages/MarketIntelligence.tsx` (compliance card + hero trust badges)

Subpages (mostly clean, light cleanup only):
- `src/pages/market-intelligence/MarketReports.tsx` (14)
- `src/pages/market-intelligence/MarketOverview.tsx` (2)
- `src/pages/market-intelligence/AreaIntelligence.tsx` (2)

## The token mapping

Adopt the existing scoped-surface system. Every `<section>` already wrapping with `data-surface="light"` gets a `surface-light` class added so the tokens actually rebind. Then replace inline hex with semantic Tailwind classes:

| Inline value (current)          | Replacement (Tailwind / token)              | Purpose                          |
| ------------------------------- | ------------------------------------------- | -------------------------------- |
| `backgroundColor: '#FFFFFF'`    | `bg-card` / `bg-background`                 | Card / page surface              |
| `backgroundColor: '#F9FAFB'`    | `bg-muted`                                  | Subtle section background        |
| `backgroundColor: '#F5F5F5'`    | `bg-muted`                                  | Inner stat tile                  |
| `backgroundColor: '#000000'`    | `bg-foreground` (icon chips on light)       | Inverted icon chip               |
| `borderColor: '#E5E7EB'`        | `border-border`                             | Card border                      |
| `borderColor: 'rgba(0,0,0,.1)'` | `border-border/60`                          | Subtle inner divider             |
| `color: '#000000'`              | `text-foreground`                           | Primary heading / value          |
| `color: '#374151'`              | `text-muted-foreground`                     | Secondary copy (AA on white)     |
| `color: '#FFFFFF'` on dark icon | `text-background`                           | Icon on inverted chip            |
| `color: '#047857'` (emerald)    | `text-emerald-700` (kept as semantic data)  | Demand score — data viz, not UI  |
| `color: '#1D4ED8'` (blue)       | `text-blue-700`                             | Supply score — data viz          |
| `backgroundColor: '#D1FAE5'`    | `bg-emerald-100`                            | Demand progress track            |
| `backgroundColor: '#DBEAFE'`    | `bg-blue-100`                               | Supply progress track            |

Rationale for keeping the four data-viz colors as Tailwind semantic colors (not theme tokens): per the **Data Visualization Standard** memory, charts/metrics use a fixed Emerald/Red/Blue/Amber map regardless of theme. Centralizing these as Tailwind utilities (not inline hex) is still a big win — they remain auditable and grep-able.

## Implementation steps

1. **Wire up scoped tokens on every section.** For each component with `data-surface="light"`, add the `surface-light` class so `--foreground`, `--muted-foreground`, `--card`, `--border` rebind to the light palette inside that section. Drop the inline `backgroundColor` on the section element itself (replaced by `bg-background` or `bg-muted`).

2. **Replace inline color/background/border with Tailwind classes** per the mapping table, file by file. For each of the 8 components plus `src/pages/MarketIntelligence.tsx`:
   - Strip `style={{ color, backgroundColor, borderColor }}` props.
   - Add the corresponding `text-foreground` / `text-muted-foreground` / `bg-card` / `bg-muted` / `border-border` classes.
   - Keep non-color inline styles (e.g. `wordBreak`, dynamic `width: ${score}%` for progress bars).

3. **Hero trust badges (MarketIntelligence.tsx hero).** The hero is on a dark video — switch the trust-badge `style={{ color: '#FFFFFF' }}` to `text-white` (the dark hero is already a `data-surface`-free zone, so `text-white` survives the light-surface guard).

4. **Compliance card (MarketIntelligence.tsx).** Replace the white card + black icon chip with `bg-card border-border` and `bg-foreground text-background` for the inverted icon chip, all inside a `surface-light` wrapper.

5. **Subpages cleanup.** `src/pages/market-intelligence/MarketReports.tsx` (14 inline) and the two with 2 inline each — same mapping, smaller scope.

6. **Verify with the existing automated contrast suite.** Run the `check:contrast` pipeline (already in `package.json` per recent work). The static checks (`white-on-light`, `black-on-dark`, `low-opacity-text`) should pass without new allowlist entries because we're moving to tokenized colors that inherit AA-tuned values. If anything new trips, fix it (do not add to baseline).

## Out of scope

- No design / layout changes. Fonts, spacing, animations, copy untouched.
- No changes to `src/index.css` token definitions — `surface-light` / `surface-dark` already meet AA.
- No changes to other Market Intelligence-adjacent surfaces (Market Report PDF, AIMarketAnalyzer) — those are separate components and were not flagged.

## Acceptance criteria

- Zero `style={{ color: '#...' }}` / `style={{ backgroundColor: '#...' }}` / `style={{ borderColor: '#...' }}` survives in the 9 files in scope (except the 4 data-viz emerald/blue values, which become Tailwind utilities — still no inline hex).
- Every section that was `data-surface="light"` now also carries `surface-light`, so swapping one CSS variable globally propagates.
- `npm run check:contrast` passes with no new allowlist entries.
- Visual diff on `/market-intelligence` is imperceptible: same colors, AA contrast preserved, but theme is now a single source of truth.
