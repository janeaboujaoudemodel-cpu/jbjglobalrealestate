I will execute one global design-system pass that fixes the shared primitives first, then removes the places that bypass them.

## Scope
- Lock one JBJ Emerald gradient token and make it the only primary accent.
- Make Emerald backgrounds render white text and white icons at rest, hover, focus, and active states.
- Make champagne/light backgrounds render dark text with Emerald icons/accent.
- Standardize these primitives globally:
  - Primary CTA
  - Secondary CTA
  - Active tabs / segmented controls
  - Badge
  - Icon tile
  - Dropdown/select menu
  - Table
- Apply the primitives to the visible broken flows, including “Add database” and “Add lead”.

## Implementation plan
1. **Replace the fragile cascade with locked semantic primitives**
   - Move the final Emerald contract into one final `@layer components` block in `src/index.css`.
   - Define canonical variables: `--jj-emerald-gradient`, `--jj-emerald-gradient-hover`, `--jj-emerald`, `--jj-emerald-on`, `--jj-emerald-soft`, and alias existing `--primary`, `--accent`, `--ring`, sidebar, AI, and legacy Emerald tokens to them.
   - Add one contrast guard for `[data-surface="emerald"]`, `[data-cta="primary"]`, active tabs, active sidebar items, Emerald badges, and Emerald icon tiles.

2. **Fix shared components instead of one-off selectors**
   - `Button`: make `variant="primary"` / default use only the locked Emerald CTA class; `secondary` / `outline` use champagne with Emerald text/icons.
   - `Tabs`: active trigger uses one `data-active-surface="emerald"` contract; remove conflicting hardcoded active text utilities.
   - `Badge`: default badge = Emerald + white; secondary/outline = champagne + Emerald.
   - `IconTile`: default/interactive tile = Emerald + white icon; light tiles = champagne + Emerald icon.
   - `DropdownMenu` and `Select`: single-select rows show no checkbox square; multi-select checkbox rows have aligned checkbox + text; hover/focus use Emerald wash.
   - `Table`: header, row hover, selected rows, checkbox column, and action cells use the same Emerald/champagne rules.
   - `Card`: keep normal cards champagne/light, but make `surface="emerald"` fully white text/icons.

3. **Remove bypasses in high-impact pages and shared local helpers**
   - Refactor local CTA/card helpers that still hardcode beige, black icons, or non-primitive button styles.
   - Fix the broker CRM actions so “Add database” and “Add lead” are the same primary CTA style.
   - Replace inline Emerald button text overrides such as dark text on Emerald backgrounds.
   - Keep the existing content/features intact; no removals.

4. **Run a style audit and targeted visual pass**
   - Use source audit to find remaining `bg-[#...]`, `text-[#...]`, `bg-black`, and custom action buttons in `src/pages` and `src/components` that affect CTAs, tabs, badges, dropdowns, tables, cards, or icon tiles.
   - Patch only design-system bypasses, not unrelated content.

5. **Validate visually before reporting**
   - Use Playwright on desktop `1280x1800` and mobile `390x844`.
   - Verify routes covering frontend and backend surfaces: `/`, `/broker/crm`, `/owner/crm`, `/broker`, `/developer-hub`, `/investor`, `/news`, and representative tool/admin pages.
   - Capture screenshots only after checks pass.
   - Verify computed styles for primary CTAs and active tabs: Emerald gradient background, white text, white SVG strokes.
   - Verify dropdown/select rows: no random checkbox square on single-select; aligned checkbox only for multi-select.

## Done condition
I will not claim completion unless the visual checks show the shared primitives are consistent across the audited desktop and mobile routes, with screenshots saved as proof.