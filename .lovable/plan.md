# Filter bar bug fixes + Mode dropdown alignment

## Problems observed

### 1. Filter popovers (Payments, Property Type, Bedrooms, Status, Construction, Handover, Views)
- **Stuck / won't close on outside click**: Popovers like *Payments* either don't open, take time, or stay open after outside click.
- **Selecting an option closes/freezes the popover**: e.g. selecting "post handover only" or any pill inside an uncontrolled popover causes the bar to feel frozen.
- **Root cause**: When `FilterShortcutBar` is mounted via `GlobalFilterBar` from a non-property page (e.g. homepage), every `update(...)` call inside an uncontrolled popover triggers `navigate('/properties?...')`. That unmounts the page → remounts the bar → tears down the open Radix popover mid-interaction. Result: popover appears "stuck" and click-outside detection misfires because the trigger element is being recreated.
- A secondary issue: `Payments` popover only commits via the Apply button (correct), but its trigger sits inside an `overflow-x-auto` scroll container with `touchAction: 'pan-x'`, which on touch can swallow the first tap.

### 2. ModeSwitcher dropdown ("Mode: Investor" panel)
- The **active row** (currently Investor) shows a visible **gap between the orange card edge and the outer orange border**. Cause: `boxShadow: inset 4px 0 0 base, 0 0 0 2px #FFFFFF, 0 0 0 4px base` adds a 2px white ring + 2px outer color ring → looks like "wide space gap".
- The **4 rows are not uniform height**: rows use only `py-3` with no min-height, so descriptions of different lengths (1 line vs 2 lines wrap) make rows visibly different heights. The user wants all 4 (Investor, Broker, Investor+Broker, Developer) to be the **same height, same width, same padding, same chip size** across header & footer instances.

---

## Fix plan

### A. `src/components/filters/FilterShortcutBar.tsx`
1. **Make every popover controlled** (add `useState` for `handoverOpen`, `propertyTypeOpen`, `bedroomsOpen`, `statusOpen`, `constructionOpen`, `viewsOpen`). This guarantees Radix's outside-click + Esc handlers operate on stable React state and aren't disrupted by parent re-renders / navigation.
2. **Defer navigation to next tick** so the popover can finish its close animation before the route changes. In `GlobalFilterBar.handleFilterChange`, wrap the `navigate(...)` call in `queueMicrotask` / `setTimeout(..., 0)` when navigating from a non-property page. This eliminates the "freeze" felt when toggling a filter pill from homepage.
3. **Auto-close multi-select popovers on Apply, not on every click** — keep current "click pill toggles selection" behavior but add a small `Apply` row at the bottom of *Bedrooms / Status / Construction / Views / Property Type* popovers that calls `setOpen(false)`. Click-outside and Esc still close.
4. **Touch-tap reliability**: remove `touchAction: 'pan-x'` from the outer scroll container's inline style (keep `WebkitOverflowScrolling: touch` and `scrollbarWidth: none`). `pan-x` on a horizontal scroller can swallow tap events on filter pills on touchpads / trackpads. Horizontal scrolling still works via the wheel + drag default.
5. **Payments popover**: confirm `paymentsOpen` is bound (it already is). No additional changes beyond items 1–4.

### B. `src/components/navigation/GlobalFilterBar.tsx`
- In `handleFilterChange`, when navigating from a non-property page, defer `navigate()` with `setTimeout(..., 0)` so the popover that triggered the change can close cleanly before unmount.

### C. `src/components/ModeSwitcher.tsx` — dropdown row alignment
1. **Remove the white-then-color double ring on the active row.** Replace the active `boxShadow` with a single solid 3px outer ring in the mode color, no white gap:
   - Active: `boxShadow: 'inset 4px 0 0 ' + base + ', 0 0 0 3px ' + base`
   - Inactive: unchanged (`inset 4px 0 0 base`).
   This eliminates the perceived "wide space gap" between the card and the orange border.
2. **Force all 4 rows to identical dimensions**:
   - Add `min-h-[76px]` to every row (`DropdownMenuItem` className).
   - Add `w-full` (already implied by stack) and ensure `pl-5 pr-3 py-3` is identical for every row (already true).
   - Clamp the description to **exactly 2 lines** with `line-clamp-2` so single-line descriptions don't shrink the row, and longer ones don't grow past 2 lines. Add `min-h-[28px]` on the description block to lock vertical rhythm.
   - Lock the icon badge at `w-10 h-10` (already true) and the right-side chip at a fixed `min-w-[68px] h-[22px] justify-center` so the "Selected" pill and the short-label pill take the same horizontal footprint → all rows align edge-to-edge.
3. Apply identically to the `header` and `full` variants (single render path already covers both).

---

## Files to edit
- `src/components/filters/FilterShortcutBar.tsx`
- `src/components/navigation/GlobalFilterBar.tsx`
- `src/components/ModeSwitcher.tsx`

## Out of scope
- No changes to filter logic / URL schema.
- No design changes to mode colors or icons — only geometry, ring, and row-height parity.
- No changes to mobile bottom-sheet filter UI.
