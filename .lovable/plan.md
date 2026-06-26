
# Phase 2 — Global Design System Unification

Goal: collapse every page in the Website and Owner Portal onto one enforceable design system so nothing looks "designed at a different time." The work is split into one foundation pass (tokens + primitives) and targeted refactors that consume them. No business logic changes.

## 1. Lock the foundation (single source of truth)

Edit `src/index.css` and the design-token layer only — every later step consumes these.

- **Color contract** (CSS variables + utility classes, all `!important`-scoped to `[data-surface]`):
  - `--surface-emerald` → fg pure white `#FFFFFF` (text + svg + borders on emerald)
  - `--surface-champagne` / `--surface-pearl` / `--surface-white` → fg charcoal `#1A1A1A` (or dark emerald `#064E3B` for headings)
  - `--surface-ink` → fg white
  - Kill switch: any descendant `text-black`, `text-white`, `bg-black` inside the wrong surface is overridden by `[data-surface="emerald"] *` / `[data-surface="champagne"] *` rules.
- **Active/Selected/Focus**: introduce `--state-active: var(--jj-emerald-ombre)`. Replace every `data-[state=active]:bg-black`, `aria-selected:bg-black`, `:focus { outline: black }` via a global selector sweep in `index.css`. Black is banned as an interactive state color.
- **Elevation + radius tokens**: `--radius-card: 16px`, `--radius-pill: 999px`, `--shadow-card`, `--shadow-card-hover`, `--ring-focus: 0 0 0 2px var(--jj-emerald)`.
- **Spacing scale**: confirm `--card-px: 20px`, `--card-py: 20px`, `--card-gap: 16px`, `--grid-gap: 24px`.

## 2. Promote 3 primitives to mandatory

- **`MetricCard`** (new canonical at `src/components/ui/MetricCard.tsx`): one layout — IconTile (top-left, 40×40 emerald) · Number (display, 32px, charcoal) · Title (14px medium) · Subtitle (12px muted). Fixed min-height `140px`, identical paddings. All dashboard tiles (Employees, Active Positions, Pending Approvals, Payroll, AI Recruiting, CRM KPIs) must import this — delete inline variants.
- **`ActionStrip`** (new at `src/components/ui/ActionStrip.tsx`): horizontal container, gap `8px`, height `40px`. Children = `<Button variant="primary">` (emerald/white) or `<Button variant="secondary">` (champagne/charcoal). Removes faded/borderless top strips on Document Studio, CRM, Leads, HR.
- **`IconTile`** already exists — enforce single source by adding an ESLint rule (or simple `rg` guard in `scripts/contrast/`) that fails the build if a raw `<div class="… rounded-lg bg-…"><Icon/></div>` is added outside the primitive.

## 3. Document Studio redesign

File: `src/pages/owner/DocumentStudio.tsx` (and child grid components).

- Replace bespoke page wrapper with `<PageShell>` + `.jj-page` grid.
- 12-col responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`), `gap-6`.
- Header row: title (display) · subtitle · right-aligned `<ActionStrip>` (primary = "New Document" emerald, secondary = "Templates" champagne).
- Each document card: champagne surface, gold hairline, IconTile, title, meta, footer actions. Identical heights via `MetricCard`-style template (or sister `DocCard` primitive that shares tokens).
- Remove all unused whitespace by capping `max-w-[var(--page-max-w)]` and using `--section-gap-y`.

## 4. Page sweep (consume foundation)

For each route below: replace inline state colors, swap to primitives, verify `data-surface` is set on the wrapper. No content/logic changes.

- **Owner Portal**: `OwnerDashboard`, `OwnerCRM` (pipeline + leads), `HR` (Employees, Positions, Approvals, Payroll, AI Recruiting), `DocumentStudio`, `Inbox`, `Calendar`, `Tasks`, `Notes`, `MarketingHub`, `Reports`.
- **Website**: `Home`, `AIHomeFinder`, `Projects`, `ProjectDetail`, `Developers`, `Areas`, `MarketIntelligence`, `Compare`, `Mortgage`, `News`, `Guides`, `FAQ`, `Search overlay`.
- **Active state sweep**: ripgrep for `data-[state=active]:bg-black`, `bg-black text-white`, `aria-selected:bg-black`, `border-black`, replace with emerald state classes.

## 5. Contrast audit + verification

- Run existing `scripts/contrast/check-rendered.mjs` and `check-same-tone.mjs` against the full route list; fix every offender.
- Playwright pass at 1280×1800 over: `/owner/dashboard`, `/owner/crm`, `/owner/hr`, `/owner/documents`, `/owner/inbox`, `/`, `/ai-home-finder`, `/projects`, `/developers`, `/market-intelligence`. Screenshots saved to `/tmp/browser/phase2/` as proof.
- Add a CI guard (`scripts/contrast/check-banned-states.mjs`) that fails on `bg-black` in interactive state selectors and on `text-white` inside `[data-surface="champagne"]`.

## Technical details

```text
src/
├─ index.css                 # tokens, surface contracts, banned-state overrides
├─ components/ui/
│  ├─ MetricCard.tsx         # NEW — single dashboard tile
│  ├─ ActionStrip.tsx        # NEW — top action row primitive
│  ├─ button.tsx             # ensure variants map to data-surface/data-cta
│  └─ icon-tile.tsx          # already canonical, enforce via lint
├─ pages/owner/
│  ├─ DocumentStudio.tsx     # full layout rebuild on PageShell + grid
│  ├─ Dashboard.tsx          # swap tiles → MetricCard
│  ├─ HR/*.tsx               # swap tiles → MetricCard
│  └─ CRM/*.tsx              # ActionStrip + MetricCard, kill black states
└─ scripts/contrast/
   └─ check-banned-states.mjs  # NEW lint guard
```

Out of scope: data model changes, new features, copy edits, animation work beyond existing hover transitions.

## Deliverable

One PR-style change set + Playwright screenshots of all audited routes showing: emerald-only active states, identical metric-card layouts, redesigned Document Studio, contrast-clean top strips. Each screenshot attached in the final reply as visual proof.
