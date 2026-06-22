## Goal

Fix the backend Overview UI: kill the swipe-fill animation on active sidebar items, force white text/icons on emerald, and restyle the Owner Command Center cards/tabs/quick-actions to the champagne + emerald premium standard. No route or functionality changes.

## 1. Sidebar active state (`src/components/navigation/GlobalVerticalNav.tsx` + `src/index.css`)

Symptom in screenshot: active "Overview" row paints a dark emerald pill, but the label/icon read as near-black because a late `shimmerSweep` / `jbj-champagne-shimmer` / `metallicSweep` animation runs across the pill and a leftover champagne fill bleeds into the foreground.

- Remove sweep classes from the active sidebar row (`jbj-shimmer-champagne`, `animate-shimmer`, `jj-metallic-active` if applied to nav rows). Keep emerald gradient background only.
- Add a scoped CSS lock in `index.css` (new PASS 47 block):
  - `[data-sidebar-root] [data-active="true"]` → `background: linear-gradient(135deg,#064E3B,#0A6B4E)`, `color:#FFFFFF !important`, `animation:none !important`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 1px 0 rgba(0,0,0,.15)`.
  - All descendant `svg`, `span`, `[data-label]` → `color:#FFFFFF !important; stroke:#FFFFFF !important`.
  - Kill any `::before`/`::after` sweep on `[data-sidebar-root] [data-active="true"]` (`content:none !important`).
- Replace sweep with a **very subtle** metallic sheen: a single `inset 0 1px 0 rgba(255,255,255,.10)` highlight + 0.5px white top edge. No keyframe animation on resting active.
- Hover on active = no foreground flip (white stays white).

Swipe/fill animations remain available **only** for explicit swipe tutorial primitives (e.g., `.jj-swipe-hint`); guard via class selector.

## 2. Owner Command Center cards (`src/pages/OwnerDashboardOverview.tsx`)

Stat tiles (Total Leads / New This Week / Pending Tasks / Active Chats) and Quick Actions currently use plain champagne with ink icons — keep champagne but:

- Icon = emerald `IconTile` (tone="emerald" white glyph) per global IconTile standard.
- Card surface stays champagne `#F7F2EA` with 1px `#B89555/40` hairline; rounded-2xl; consistent `p-5`.
- Title text ink `#1A1A1A`, value `#1A1A1A` 28px semibold, subtitle ink/70.
- Quick Action grid: uniform `aspect-[5/4]`, center-aligned emerald IconTile (44px), 13px label, no truncation. Same grid on mobile = 2 cols, tablet = 3, desktop = 6.

## 3. Tab bar (Overview / All Leads / Flagged / VIP Leads / Leads Management / Employees Hub / Audit Logs)

- Active tab: emerald gradient pill, WHITE label + WHITE icon, NO sweep animation (same PASS 47 lock applies via `[role="tab"][data-state="active"]` selector scoped to `[data-owner-overview]`).
- Inactive tab: transparent, emerald icon, ink label, hover = champagne raised `#EFE6D6`.

## 4. Metric cards row (Calls Made / WhatsApp / Follow-ups / Total Leads / Hot/Warm/Cold/Stale / Conversion / Response)

- Champagne card, emerald IconTile top-right, gold hairline, value 26px ink, caption ink/65.
- Sentinel attribute `data-metric-card` so the CSS lock can guarantee no black-on-emerald inside child badges.

## 5. Global emerald-box contrast guard (additive in `index.css`)

Extend the existing emerald-white-fg rule with explicit selectors for backend surfaces missed today:

```
[data-sidebar-root] [data-active="true"],
[data-owner-overview] [data-state="active"],
.jj-pill-emerald-metallic,
.jj-cta-emerald {
  color:#FFFFFF !important;
  animation:none !important;
}
[data-sidebar-root] [data-active="true"] *,
[data-owner-overview] [data-state="active"] * {
  color:#FFFFFF !important;
  stroke:#FFFFFF !important;
  fill:none;
}
```

## 6. Other backend pages (CRM, Calendar, Notes, Tasks, Inbox, Messages, Team Chat, Marketing, Employee Hub, Brokers Registry)

Pure CSS-level inheritance via the same selectors above + `data-owner-overview` (rename root attr to `data-backend-shell` and add it to each page's top wrapper). No layout/structure edits — only ensure each page root has `data-backend-shell` so the contrast + no-sweep rules apply globally.

## 7. Validation (Playwright, headless)

Capture screenshots at 1280x1800 and 414x900:
- `/owner` Overview (sidebar active state close-up + full page)
- `/owner` Quick Actions grid
- `/owner` tab row Active=Overview, then click All Leads
- `/broker/portal`, `/broker/crm`, `/broker/calendar`, `/broker/tasks`, `/broker/messages`
- Mobile: `/owner` at 414x900

Save under `/tmp/browser/backend-overview/screenshots/` and inspect each before claiming done. If any black-on-emerald or sweep animation remains, iterate.

## Files

- `src/index.css` — additive PASS 47 lock block; no removals.
- `src/components/navigation/GlobalVerticalNav.tsx` — strip sweep class from active row, ensure inline `data-active`.
- `src/pages/OwnerDashboardOverview.tsx` — IconTile swap, uniform Quick Action grid, `data-backend-shell` root.
- Backend page roots (CRM, Calendar, Tasks, Notes, Inbox, Messages, Marketing, Employee Hub, Brokers Registry) — add `data-backend-shell` attribute only.

No route, schema, or functional changes.
