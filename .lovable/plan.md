Execute a full design-system refactor, not isolated element patches.

Scope
- Lock one Emerald accent system across frontend/backend UI surfaces.
- Apply it through shared primitives first, then remove local bypasses from CRM/Pipeline and other high-impact pages.
- Enforce the contrast rule everywhere:
  - Emerald background -> white text and white icons.
  - Champagne/light background -> black typography with Emerald icons/accent.

Implementation plan

1. Lock the global Emerald tokens
- Consolidate the current token sprawl in `src/index.css` into one canonical set:
  - `--jj-emerald`
  - `--jj-emerald-deep`
  - `--jj-emerald-on`
  - `--jj-emerald-soft`
  - `--jj-emerald-gradient`
  - `--jj-emerald-gradient-hover`
- Alias legacy `--primary`, `--accent`, `--ring`, sidebar, AI/tool, active-state, and current `--gradient-emerald` variables to that locked system.
- Remove remaining alternate hover accents and default blue focus/selection styling from shared surfaces.

2. Rebuild the shared primitives as the only visual language
- `Button`
  - Primary/default/destructive/tool aliases use the locked Emerald gradient only.
  - Secondary/outline/ghost/link use Champagne/light surface with Emerald text/icons.
  - Remove conflicting `jj-cta-champagne` class from primary CTAs so primary is not both Emerald and Champagne.
- `Tabs`
  - Active trigger uses one active Emerald contract with white text/icons.
  - Inactive triggers remain Champagne/light with Emerald hover/focus.
  - Add premium underline/indicator behavior for navigation bars.
- `Badge`
  - Default/important badges use Emerald + white.
  - Outline/secondary badges use Champagne + Emerald.
  - Replace blue/status badge leakage where it is not semantic data visualization.
- `IconTile`
  - Default tile becomes the Emerald identity tile.
  - Champagne/light tile option renders Emerald icons, never black icons.
  - Restrict blue/red/amber only to explicitly semantic data states.
- `Dropdown/Select/Command`
  - Single-select: no square checkbox artifacts.
  - Multi-select: aligned checkbox column, no text overlap, easy select/deselect.
  - Hover/highlight/focus use the locked Emerald soft state.
- `Table`
  - Header, selected rows, hover rows, checkbox cells, and action cells use Emerald/Champagne rhythm.
  - Remove default blue selection/focus behavior.
- `Card`
  - Add reusable premium variants for Champagne card, Emerald active card, selected card, KPI card, empty state, and pipeline stage card.

3. Refactor Broker CRM / Pipeline as the proving surface
- Replace local `PremiumCard`, KPI, tab, stage-card, empty-state, table-row, and action-button styling with shared JBJ primitives/classes.
- Make “Add database” and “Add lead” use the exact same primary CTA implementation as “Back to JBJ Owner”.
- Improve KPI cards:
  - large centered metric number
  - secondary label
  - Emerald icon tile
  - hover inversion: Champagne card -> Emerald background + white content
- Improve CRM tab/header nav:
  - better spacing and alignment
  - active Emerald underline/indicator
  - active icon/text white when on Emerald
  - inactive Champagne with Emerald icon/hover
- Improve Pipeline by Stage:
  - stage cards get Emerald icon/arrow accents
  - active/hover state uses Emerald + white
  - stronger hierarchy and rhythm instead of plain white boxes
- Improve empty states:
  - Emerald icon/illustration treatment
  - primary CTA as locked Emerald
  - secondary CTA as Champagne/Emerald
  - no generic black icon treatment

4. Remove color bypasses globally
- Audit and replace visible UI bypasses in `src/pages` and `src/components` for:
  - `bg-[#...]`, `text-[#...]`, `border-[#...]` where used on CTAs, cards, tabs, badges, dropdowns, tables, icons, counters, empty states, pipeline/status UI.
  - `bg-blue-*`, `text-blue-*`, `ring-blue-*`, `border-blue-*` outside approved semantic data visualization.
  - hardcoded black icons on Champagne cards where Emerald icon/accent is required.
  - hardcoded white/dark text conflicts on Emerald surfaces.
- Keep existing Champagne, black typography, and gold hairlines where they are part of the locked JBJ system.
- Do not remove features or content.

5. Add global guardrails
- Add high-specificity contrast guards only for the shared contracts, not broad page-wide hacks:
  - `[data-surface="emerald"]`
  - `[data-cta="primary"]`
  - `[data-active-surface="emerald"]`
  - `[data-icon-tile-tone="emerald"]`
  - `[data-jj-badge="default"]`
  - active tabs/sidebar items
  - selected/active cards
- Add hover rules:
  - Champagne interactive card hover -> Emerald gradient + white content.
  - Emerald interactive card hover -> locked hover gradient + stronger glow.
- Add focus rules using the locked Emerald ring.

6. Verify visually before claiming completion
- Use Playwright on desktop and mobile viewports.
- Validate `/broker/crm` across Pipeline, My Databases, My Leads, Calls, Insights, Activity, Calendar.
- Validate key owner/backend surfaces that share the same primitives.
- Computed-style checks must confirm:
  - primary CTA text/icons are white
  - active tabs/icons are white on Emerald
  - Champagne cards show Emerald icons/accent
  - no blue/default browser focus colors on the audited CRM surfaces
  - dropdown single-select has no stray square box
  - multi-select checkbox alignment is correct
- Capture proof screenshots only after these checks pass.