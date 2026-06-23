# Backend Design System Rebuild — Fix primitives once, every page inherits

Treat this as a single primitive-layer refactor. Every fix lands in a shared component or a single CSS rule. No page-level patches. A page edit is only allowed when the page bypasses the primitive (those bypasses are listed and replaced with the primitive).

## 0. Lock the two-color contract (single source of truth)

Add a "backend tokens" block to `src/index.css` (after the existing emerald block) so every primitive reads the same values:

- `--bk-emerald`: `#064E3B` (fill, active, dots)
- `--bk-emerald-ombre`: existing `--jj-emerald-ombre` (active surfaces)
- `--bk-champagne`: `#EFE6D6` (label chip background)
- `--bk-champagne-soft`: `#F7F2EA` (single card surface)
- `--bk-gold`: `#B89555` (hairline + champagne label text)
- `--bk-ink`: `#1A1A1A` (text on champagne)
- `--bk-white`: `#FFFFFF` (text/icons on emerald only)

Icon-color rule encoded as a tiny CSS contract (no per-page overrides):

```
[data-bk-surface="emerald"]  { color: var(--bk-white); }
[data-bk-surface="emerald"] svg { color: var(--bk-white) !important; }
[data-bk-surface="champagne"]{ color: var(--bk-ink); }
[data-bk-surface="champagne"] svg { color: var(--bk-emerald) !important; }
[data-bk-surface="light"] svg { color: var(--bk-emerald); }
```

Every primitive below sets the matching `data-bk-surface` so icons follow automatically (rule 12).

## 1. Lead Status Timeline — `src/components/crm/ActivityTimeline.tsx` + `KanbanPipeline.tsx` stage strip

Replace the framed step boxes with one shared primitive `<StatusTimeline />` (new file `src/components/crm/StatusTimeline.tsx`) that renders:

- 10px emerald dot (`<EmeraldDot />`, already exists)
- gold-champagne label below
- thin gold hairline connecting dots
- NO border, NO background, NO shadow, NO container chip

Every consumer (Lead drawer, Kanban header, ApplicantProfileDrawer, BrokerLifecycleActionCenter) imports this primitive. Delete the per-step `border`/`bg-*`/`rounded-*` props from those callers.

## 2. Double card layers — `src/components/ui/card.tsx` + `src/components/ui/Surface.tsx`

Audit all CRM/back-office surfaces for `Card` nested inside another `Card`/`div.rounded-*.bg-*`. Fix at the primitive:

- `Card` now refuses to render a background when an ancestor already has `data-bk-card="true"` (uses `:has()` CSS guard in `index.css`):
  `[data-bk-card="true"] [data-bk-card="true"] { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }`
- Add `data-bk-card="true"` to `Card`, `Surface`, and the back-office `PremiumSectionCard`.

Result: any accidental "second layer behind" collapses globally without touching pages.

## 3. Status badges — `src/components/ui/badge.tsx` + `src/components/crm/LeadStatusBadge.tsx`, `BrokerStatusBadge.tsx`, `ApplicantStatusPill.tsx`, `StatusPillSelect.tsx`

Rebuild `Badge` to render exactly ONE pill. Add `data-bk-badge="single"`. CSS guard in `index.css`:

`[data-bk-badge="single"] ~ * [class*="rounded-full"]:has(> [data-bk-badge="single"]) { all: unset; }`
and inside the badge wrapper, ban outer frames via:
`[data-bk-badge-wrap] { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }`

Then sweep the four badge components above to remove their hand-rolled outer `rounded-full border ...` wrappers and render `<Badge>` directly.

## 4. Role labels — Crown / Investor / Broker / Owner / Developer

New shared primitive `src/components/crm/RoleLabel.tsx` with two variants only:
- emerald (filled, white text + icon)
- champagne (transparent, gold text + emerald icon, NO border, NO chip frame)

Find every existing inline role tag in `src/components/crm/*` and `src/pages/Admin*.tsx`, `OwnerDashboard*`, and replace with `<RoleLabel role="…" tone="champagne|emerald" />`. Delete the wrapping `rounded-full border bg-*` divs.

## 5. Backend navigation — single active level

Centralize active-state resolution in `src/components/crm/CRMListSidebar.tsx`, `CRMToolsSidebar.tsx`, and the global `GlobalVerticalNav`:

- Introduce `useActiveNavScope()` hook that returns `{ topLevel, subLevel }` from the current route.
- Sidebar primitive only sets `data-active` on the deepest matching node. Parent nodes drop to `data-active-trail="true"` (rendered as a thin gold accent, not a filled pill).

CSS encodes the rule: only `[data-active="true"]` gets the emerald fill; `[data-active-trail="true"]` gets only the gold left-border. No page changes needed once the sidebar primitives obey the hook.

## 6 + 7. CRM primary tabs & secondary tabs — `src/components/ui/tabs.tsx` (+ thin `BackOfficeTabs` wrapper)

Strengthen active state at the primitive (one place):

```
[role="tab"][data-state="active"][data-bk-tabs="primary"]   → emerald ombre + white text + white underline
[role="tab"][data-state="active"][data-bk-tabs="secondary"] → emerald ombre + white text + 2px white underline + subtle white inset
```

Idle: champagne text on transparent, gold hairline underline. No drift, no per-page overrides.

Apply `data-bk-tabs` once on the `TabsList` wrappers in `CRMShell` / `CRMToolsSidebar` consumers — single edit per shell, not per page. Lists currently overriding via inline classes get those overrides stripped.

## 8. Filter dropdowns — `src/components/ui/dropdown-menu.tsx` + `src/components/ui/popover.tsx` + `CRMFiltersPopover.tsx`

Lock the dropdown content shell:

- `DropdownMenuContent` / `PopoverContent` default to `p-2`, `gap-1`, `rounded-xl`, gold hairline, champagne surface, 14px row height, `pl-3 pr-4`.
- New `<FilterCheckboxRow />` primitive: 16px checkbox + 12px gap + label + right-side count, never wrapping, `truncate` on label.
- `CRMFiltersPopover` switches to `<FilterCheckboxRow />` everywhere, removing the current hand-rolled rows that overlap.

Result: All Sources / All Owners / All Tags and every other filter inherit consistent spacing.

## 9. Scrollbars — `src/index.css` global rule (already partially set)

Tighten to 6px width, transparent track, emerald-at-30%-opacity thumb, rounded thumb, fade-in on `:hover`. Remove the long gold horizontal scrollbar by adding `overflow-x:auto` + `scrollbar-width: thin` globally on `[data-bk-scroll]` and tagging the long horizontal CRM tables with `data-bk-scroll`.

```
[data-bk-scroll]::-webkit-scrollbar { width:6px; height:6px; }
[data-bk-scroll]::-webkit-scrollbar-thumb { background: rgba(6,78,59,.35); border-radius:999px; }
[data-bk-scroll]::-webkit-scrollbar-thumb:hover { background: rgba(6,78,59,.6); }
```

## 10. Insights & Analytics — `src/components/crm/CRMDashboardCards.tsx`, `CRMEnhancedDashboard.tsx`, `BrokerageAnalyticsStrip.tsx`

Build three shared chart primitives (one file `src/components/crm/insights/`):
- `<KpiCard />` (emerald icon tile, large ink number, gold delta)
- `<EmeraldBarChart />` / `<EmeraldAreaChart />` (recharts; series colors locked to emerald scale)
- `<ProgressBar tone="emerald" />`

Swap inline KPI markup in the three dashboard components for these primitives. No page edits beyond those three files; every dashboard consumer (Investors, Brokers, Employees, Reports) imports through them.

## 11. Owner account label

`RoleLabel` from §4 already covers this. Owner chip in header + sidebar = `<RoleLabel role="owner" tone="champagne" />`. Single change.

## 12. Icons — already enforced by the `data-bk-surface` contract in §0

Sweep `src/components/ui/icon-tile.tsx` so every `IconTile` sets `data-bk-surface` based on its `tone` prop. Pages stop forcing colors.

## 13. Global hygiene sweep (no page edits)

One codemod step (`scripts/backend-restyle-sweep.mjs`):
1. Find files under `src/components/crm/` and `src/pages/(Admin|CRM|Owner|Broker|Developer)*` that hardcode `rounded-full border` around a `<Badge>`, `<RoleLabel>`, status chip, or filter row.
2. Replace with primitive usage. Print a diff for review before applying.
3. CI guard: `scripts/contrast/check-backend-frames.mjs` fails if any file outside the primitives folder reintroduces `border rounded-* bg-*` around a `<Badge>` or status pill.

## Files that change

Primitives (≈12 files):
- `src/index.css` (tokens + surface contract + dropdown + scrollbar + double-card guard)
- `src/components/ui/card.tsx`, `badge.tsx`, `tabs.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `icon-tile.tsx`
- `src/components/ui/emerald/*` (already correct, audit only)
- `src/components/crm/StatusTimeline.tsx` (new)
- `src/components/crm/RoleLabel.tsx` (new)
- `src/components/crm/insights/{KpiCard,EmeraldBarChart,EmeraldAreaChart,ProgressBar}.tsx` (new)
- `src/components/crm/CRMListSidebar.tsx` + `CRMToolsSidebar.tsx` (active-state hook)

Targeted primitive consumers (≈8 files):
- `LeadStatusBadge.tsx`, `BrokerStatusBadge.tsx`, `ApplicantStatusPill.tsx`, `StatusPillSelect.tsx`
- `ActivityTimeline.tsx`, `KanbanPipeline.tsx`
- `CRMDashboardCards.tsx`, `CRMEnhancedDashboard.tsx`, `BrokerageAnalyticsStrip.tsx`
- `CRMFiltersPopover.tsx`

Codemod: 1 script under `scripts/`.

## Visual validation (mandatory before claiming done)

Playwright sweep at 1280×1800 (sidebar expanded) of every back-office route:
`/admin/crm`, `/admin/crm/leads`, `/admin/crm/leads/:id`, `/admin/crm/databases`, `/admin/crm/investors`, `/admin/crm/developers`, `/admin/crm/brokers`, `/admin/crm/employees`, `/crm/calendar`, `/crm/notes`, `/crm/relationships`, `/crm/tasks`, `/owner/inbox`, `/contract-forms`, `/admin/reports`, plus a Lead drawer open and the filter popovers open.

Saved to `/tmp/browser/bk-rebuild/`. Each screenshot is checked against the 13 rules above with a small DOM assertion (no nested `Card` background, no badge double frame, exactly one active sidebar item, scrollbar height ≤ 6px). Only ship when every screenshot passes.

## Out of scope

- No new features, no data model changes, no copy changes, no route changes.
- Public-site styling untouched.
