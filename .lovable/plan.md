## Goal
Fix the JBJ Hub backend so every emerald/action surface uses the locked real emerald palette and pure-white text/icons, and prevent toolbar/action buttons from collapsing into vertical letters on narrower content widths.

## Confirmed root causes
- The final emerald contrast lock in `crmShell.css` only covers older CRM modules. It does not include the newer **Forecasts** (`.jc-fc*`) and **Documents Library** (`.jc-doclib*`) selectors, so active/action states can keep inherited black/dark text or non-brand green.
- The Documents toolbar is a single nowrap flex row. At narrower effective content widths, buttons shrink instead of wrapping/grouping, which causes text like **Filter / Sort / New Folder / Upload** to render vertically.
- The notification badge is positioned inside the icon button and overlaps the bell instead of sitting outside the button corner.
- Several backend styles still use champagne/gold/alternate green remnants in module-specific blocks instead of the JBJ emerald lock.

## Implementation plan

### 1. Add a backend-wide emerald action contract
- Extend the final CRM lock in `src/pages/owner/crm/shell/crmShell.css` to cover:
  - Forecasts: `.jc-fc__chip--primary`, active period buttons, owner avatars, health tags, progress fills.
  - Documents: `.jc-doclib__new`, active folders, primary chips, view-toggle active states, bulk action bar.
  - Existing backend action patterns that use `data-active`, `is-active`, or primary action classes.
- Force all children inside emerald surfaces to pure white:
  - text, spans, strong, counts, SVGs, paths, icons.
- Replace remaining non-brand green accents with the official JBJ emerald gradient:
  - `#064E3B -> #032A1E -> #000000` where chrome/action depth is needed.
  - Flat `#064E3B` only for small indicators/dots.

### 2. Fix Forecasts page contrast
- Make **New forecast** use the official emerald action style with pure white icon/text.
- Make owner initial circles emerald with pure white initials, not black/dark text.
- Fix **Coverage health** so emerald pills/dots never render black text on emerald.
- Normalize the pipeline/coverage bars so emerald fills are brand emerald, not fake green.

### 3. Fix Documents page toolbar layout
- Rebuild the toolbar CSS so it behaves as a premium responsive control row:
  - Search stays readable and takes available width.
  - Filter / Sort / New Folder / Upload / view toggle remain horizontal buttons.
  - Buttons wrap into clean rows when needed instead of shrinking into vertical letters.
  - Add stable min-heights, `white-space: nowrap`, `flex: 0 0 auto`, and mobile breakpoints.
- Fix **New**, **My Files**, **Upload**, active folder, active view-toggle, and selected/bulk controls to use emerald with pure white icons/text.

### 4. Fix Hub header notification badge
- Move the red badge visually outside the bell button corner with fixed dimensions and z-index.
- Ensure it does not cover the bell icon and never stacks vertically.

### 5. Deep backend contrast scan
- Search backend files for risky patterns:
  - Black/dark text inside emerald/action classes.
  - Non-brand greens (`green-*`, `#047857`, `#059669`, `#0f7a5a`, etc.).
  - Champagne/gold action backgrounds inside JBJ Hub modules.
  - Button text wrapping risks in toolbars.
- Patch only backend/JBJ Hub surfaces, not public frontend pages.

### 6. Visual and technical validation
- Use Playwright on real preview routes, with nonblank screenshot proof:
  - `/owner/crm/jbj/forecasts`
  - `/owner/crm/jbj/documents`
  - Hub header notifications/search state if reachable
- Validate at multiple widths:
  - Current desktop width
  - Narrow desktop around the problematic 752px content width
  - Mobile-ish/narrow breakpoint
- Confirm screenshots show:
  - No vertical letter buttons.
  - New forecast/New/Upload/My Files are emerald with white text/icons.
  - Forecast owner circles are emerald with white initials.
  - Coverage health has no black-on-emerald text.
  - Notification badge no longer hides the bell.
- If a screenshot is blank/white or still broken, continue fixing before reporting completion.