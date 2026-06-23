# Global UI System Rebuild — Emerald + Champagne Gold

Stop patching pages. Rebuild the shared primitives so every page inherits the Homepage's premium identity automatically.

## Scope

The Homepage becomes the **visual benchmark**. Every reusable component is rewritten once, in one place, so all routes (Overview, CRM, Broker portal, Developer portal, Owner dashboard, Tools, Marketing pages) inherit the same look automatically.

## Design Language (locked tokens)

- **Champagne** = page surfaces, cards, raised panels (`#FDFBF7`, `#F7F2EA`, `#EFE6D6`)
- **Gold `#B89555`** = decorative hairline accent only (1px), never a fill
- **Emerald `#064E3B`** = the **primary interactive accent** for the entire platform
- **Ink `#1A1A1A`** = default text on champagne
- **White** = mandatory text/icon color on every Emerald or dark surface
- Black is **not** a default action color — only intentional, rare use

## Workstream 1 — Reusable Primitives (single source of truth)

Rebuild these so every consumer inherits the system:

1. **Button system** (`src/components/ui/button.tsx` + variants)
   - `default` / `primary` → Emerald metallic with WHITE text+icon
   - `secondary` → Champagne with EMERALD text+icon
   - `ghost` → transparent with Emerald hover
   - Remove every black default. Migrate all `bg-black`, `bg-foreground`, raw dark buttons.

2. **Card** (`src/components/ui/card.tsx`)
   - Champagne raised surface, 1px gold hairline option, Emerald accent bar for active state

3. **Tabs / Filters / Chips** (`tabs.tsx`, filter pills, segmented controls)
   - Active = Emerald fill + white text. Idle = champagne + ink. No dark gradient swipe.

4. **Active "Overview" card animation**
   - Remove the dark gradient swipe fill entirely
   - Replace with subtle Emerald metallic sheen (slow shimmer, no fill animation, no dark block)

5. **Icons** — unify through `IconTile` (already standard). Audit every direct `<Lucide />` usage on dashboards and migrate.

6. **KPI cards / Stat cards / Dashboard widgets**
   - Champagne surface, Emerald accent number/icon, gold hairline divider
   - Replace any purple/blue/neutral accents

7. **Charts** (Recharts wrappers in `src/components/charts/*`)
   - Primary series = Emerald `#064E3B`, secondary = Emerald-light, tertiary = Champagne-dark
   - Tooltips/legends use the same tokens. Remove default Recharts blues.

8. **Progress / Sliders / Focus rings**
   - Track = champagne, fill = Emerald metallic
   - Focus ring = Emerald

9. **Scrollbars** — global CSS replacement
   - Replace **all** gold/champagne scrollbar styling with Emerald (`#064E3B` thumb, champagne track)
   - Webkit + Firefox

10. **Empty states & illustrations**
    - Emerald icon tile + champagne backdrop + ink copy

11. **Titles / headings / arrows**
    - Single Typography primitive enforcing weight/tracking
    - Decorative arrows = Emerald or ink, never white-on-image

## Workstream 2 — Homepage as Benchmark

- Lock the Homepage hero, section bands, card grid spacing, and CTA hierarchy as the canonical reference
- Extract any one-off Homepage styles into the primitives so other pages match by default
- Document the benchmark in `mem://style/...` for future runs

## Workstream 3 — Global Migration Sweep

After primitives land, sweep consumers:
- Replace remaining hardcoded `bg-black` / dark-button uses → `<Button>` default
- Replace direct Recharts color props → chart theme tokens
- Replace any custom Emerald hex strings → `.jj-surface-emerald` primitive
- Remove any remaining "fill-swipe" active-card animations
- Audit: Overview, CRM Kanban, Broker dashboard, Developer portal, Owner dashboard, Tools hub, Marketing/News hubs

## Workstream 4 — Visual Validation (Playwright)

Capture screenshots at 1280×1800 on every major route:
`/`, `/properties`, `/project/:slug`, `/favorites`, `/compare`, `/tools`, `/broker`, `/broker/dashboard`, `/developer`, `/owner`, `/owner/crm`, `/news`, `/intel`, `/guides`.

Automated checks per route:
- No Emerald surface with non-white text/icon
- No black-default buttons in branded flows
- No gold scrollbar
- No dark swipe-fill animations on active cards
- Charts/KPIs use Emerald primary
- Section padding matches Homepage

Deliver screenshots as proof before claiming completion.

## Technical Targets

- `src/index.css` — scrollbars, active-card animation, primitive class definitions
- `src/components/ui/button.tsx`, `card.tsx`, `tabs.tsx`, `badge.tsx`, `input.tsx`, `progress.tsx`, `slider.tsx`
- `src/components/ui/icon-tile.tsx` — audit consumers
- `src/components/charts/*` — chart theme
- `tailwind.config.ts` — ensure tokens map to Emerald primary
- Sweep: `src/pages/**`, `src/components/**` for `bg-black`, hardcoded gold scrollbars, custom Emerald hex, dark swipe animations
- `mem://style/...` — record Homepage-as-benchmark + Emerald-primary rules

## Out of Scope

- No business logic changes
- No data model, edge function, or backend changes
- No new features — only visual unification

## Definition of Done

1. All reusable primitives rebuilt and consumed everywhere
2. Zero Emerald surfaces with dark text/icons across all audited routes
3. Zero gold scrollbars; Emerald scrollbars everywhere
4. Zero black default buttons in branded flows
5. Overview active card uses Emerald metallic sheen (no swipe-fill)
6. Charts, KPIs, tabs, filters, progress all Emerald-accented
7. Section padding matches Homepage globally
8. Playwright screenshots delivered for every major route as proof
