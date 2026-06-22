## Goal

One clean refactor of the global styling system. Delete the 40+ legacy `PASS` blocks in `src/index.css` and the conflicting inline overrides in components. Replace them with a single, small, authoritative design-system layer that enforces the contrast contract:

- **Emerald or dark surface** → white text + white icons
- **Champagne / gold / beige / ivory / white surface** → ink text (`#1A1A1A`) + ink icons
- No `!important` stacking wars, no per-page patches, no MutationObservers repainting on the fly.

## Scope of the audit (read-only first)

1. `src/index.css` — currently 10,355 lines with **~48 PASS blocks** plus "LEGACY … NEUTRALIZED" comment graveyards. Inventory every PASS, every `!important`, every selector targeting:
   - `[data-chrome="sidebar"]`, `[data-active]`, `[data-state="active"]`
   - `[role="tab"]`, `.jj-segmented-*`, `.jj-cta-*`, `.jj-pill-*`
   - emerald / champagne / gold surface rules
2. `src/components/ui/tabs.tsx` — remove the MutationObserver + inline-style paint loop and the `stripActiveInkUtilities` filter.
3. `src/components/navigation/GlobalVerticalNav.tsx` — remove inline `style={{ color: ... }}` active-state forcing (lines ~1140–1149) and any per-row sweep/shimmer classes.
4. `src/components/ui/button.tsx` and `src/components/ui/icon-tile.tsx` — confirm they already route through tokens; do not change behaviour, only verify no inline color forcing remains needed once CSS is clean.
5. Component-side classes that hardcode `text-[#1A1A1A]` / `text-white` on active states (`data-[state=active]:text-…`) across tabs, sidebar items, and segmented controls. These will be deleted in favour of CSS-driven contrast.

Output of the audit: a short delete-list (file + line ranges) that I'll apply in one pass.

## The new single source of truth

Replace the body of `src/index.css` between the existing token block and the Tailwind layers with **one** new section: `/* === DESIGN SYSTEM — CONTRAST CONTRACT (v1, single source) === */`. It contains only these rule groups, in this order, with no `!important` except where Tailwind utility specificity genuinely requires it:

1. **Surface tokens** (already exist; keep): `[data-surface="champagne|gold|ink|emerald|dark|page"]` sets `--surface-bg`, `--surface-fg`, `--surface-border`.
2. **Contrast contract** (new, replaces PASS 7/10/22/29/40/42/44/45/47/48):
   - `[data-surface="champagne"], [data-surface="gold"], [data-surface="page"], [data-surface="raised"] { color: #1A1A1A; }` plus `svg { color: inherit; stroke: currentColor; }`
   - `[data-surface="ink"], [data-surface="dark"], [data-surface="emerald"], .jj-emerald-fill { color: #FFFFFF; }` plus the same svg rule
   - One opt-out: `[data-no-contrast-guard]` short-circuits both.
3. **Sidebar** (replaces PASS 12/14/15/16/24/27/28/47):
   - Inactive row: transparent bg, `color: #1A1A1A`, gold icon tone via `IconTile`.
   - Hover: `background: #EFE6D6` (champagne raised), ink stays.
   - Active row (`[data-chrome="sidebar"] [data-active="true"]`): `background: linear-gradient(135deg,#064E3B,#0A6B4E); color:#FFFFFF;` — no `::before`/`::after`, no animation, no shimmer.
4. **Tabs / segmented controls** (replaces PASS 25/29.1/48 + the JS observer in `tabs.tsx`):
   - `[role="tab"]` inactive: champagne bg, ink text.
   - `[role="tab"][data-state="active"]`: emerald bg, white text, no animation. SVG inherits via `currentColor`.
5. **Buttons / CTAs** (keep the existing `.jj-cta-champagne` / `.jj-cta-dark` / `.jj-cta-outline` primitives; delete every PASS that re-styles them). One rule per primitive, hover state included inline.
6. **Emerald metallic primitive** (one definition): `.jj-pill-emerald-metallic` — gradient + white FG + no per-page overrides.
7. **Sliders** (collapse PASS 37 / 44b into one block).

Everything else in `index.css` from line ~3430 to the end (the entire PASS graveyard) is **deleted**, not commented out. The "LEGACY … NEUTRALIZED" stubs are also deleted.

## Component cleanup

- `src/components/ui/tabs.tsx`: drop `useEffect` + `MutationObserver` + `stripActiveInkUtilities`. `TabsTrigger` becomes a thin wrapper around `TabsPrimitive.Trigger` with `data-surface="champagne"` and one className that relies on the CSS contract for active-state colors.
- `src/components/navigation/GlobalVerticalNav.tsx`: remove inline `style` color forcing on subitems. Active state is driven purely by `data-active="true"` + CSS.
- `src/components/ui/icon-tile.tsx`: keep as-is (already token-correct). Remove only the inline `style={{ color: '#FFFFFF', stroke: '#FFFFFF' }}` once CSS `currentColor` rules cover it.
- No new files, no new PASS, no new `!important`.

## Validation (before claiming done)

Playwright at 1280×1800 and 414×900, screenshots saved to `/mnt/documents/refactor-proof/`:

1. Sidebar: Broker, Developer, Owner, Investor — active item white-on-emerald, inactive ink-on-champagne, no sweep.
2. Tabs: `/owner` Overview, All Leads, Flagged, VIP Leads, Audit Logs, Leads Management — emerald active, white FG, no animation.
3. Light-surface pages (Guides, Reports, AI Tools, Careers, one book inner page): zero white-on-champagne, zero ink-on-emerald.
4. Backend pages (CRM, Calendar, Notes/Tasks, Inbox/Messages) — same contract.
5. `grep -n "PASS " src/index.css` returns **0 matches**.
6. `grep -nE "!important" src/index.css | wc -l` drops by ≥90%.

## Risks & guardrails

- Removing PASS blocks may briefly expose places where component code depended on a now-deleted override. Mitigation: the audit pass enumerates those before deletion; fix each at the component level (one token-correct class), not by re-adding CSS.
- Strict "No Removal" policy: only CSS rules and inline color forcing are removed. No features, no content, no routes touched.
- This is a multi-step refactor and the diff will be large (~7,000 lines removed from `index.css`). I'll do it in one focused build session and validate before reporting.

## Deliverables

- `src/index.css` shrunk to a single design-system core (~3,000 lines target, down from 10,355).
- `src/components/ui/tabs.tsx`, `src/components/navigation/GlobalVerticalNav.tsx` cleaned of inline color-forcing.
- Screenshot folder proving the contrast contract holds on every listed surface.
- No new memory entries; existing standards already cover the contract.
