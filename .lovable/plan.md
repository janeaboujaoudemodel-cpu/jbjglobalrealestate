

# Fix: Property Filter Dropdowns and Card Grid for iPad/Tablet View (834px)

## Issues Identified

### 1. Filter Grid Layout -- Cramped at Tablet Width
The filter row uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6`. At 834px (md breakpoint), 6 filter dropdowns are squeezed into 3 columns across 2 rows. The text inside each trigger (e.g., "All Developers", "Square Feet", "AED (Dirham)") gets truncated heavily. The third action row (Display Mode, Sale Status, Premium Only, Hide Sold Out, More Filters, Search button) wraps chaotically with `flex-wrap`.

**Fix (line 522 of Properties.tsx):**
- Change to `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6` -- at 834px this gives 4 columns (2 rows of 3+3 becomes 2 rows of 4+2), better use of horizontal space
- On the third action row (line 674), add `md:gap-2` for tighter but clean spacing on tablet

### 2. Card Grid -- Only 2 Columns on Tablet, Wastes Space
The card grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3`. At 834px, it shows 2 columns which is reasonable, but the gap is `md:gap-8` (32px) which is too large for tablet, making cards narrower than needed.

**Fix (lines 1072 and 1078 of Properties.tsx):**
- Change gap from `gap-4 sm:gap-6 md:gap-8` to `gap-4 sm:gap-5 md:gap-6` -- tighter gaps on tablet give cards more breathing room
- Keep 2 columns at `md` as this is appropriate for iPad

### 3. Sticky Filter Section Overflow
The sticky filter section at line 421 has `z-40` and the inner champagne layer has `style={{ overflow: 'visible' }}`. However, the outer `section` element does not have `overflow: visible`, which can clip dropdown portals in some rendering scenarios. The Radix Select uses a Portal so this should not be an issue, but the Popover-based filters (SaleStatusSelect, FilterToolbar Save) also portal correctly.

**Verification:** Dropdowns render via Portal with `z-[10200]` -- they should appear above the sticky section. No code change needed here, confirmed working from screenshot.

### 4. Sort Buttons Row -- Wrapping on Tablet
The sort buttons row (line 1003-1022) uses `flex items-center justify-center gap-2` which may wrap on tablet. The buttons have fixed `px-4` padding.

**Fix:** Add `flex-wrap` to ensure graceful wrapping, and reduce button padding slightly for tablet with responsive classes.

---

## Files to Modify

### `src/pages/Properties.tsx`

1. **Line 522** -- Filter grid: change `md:grid-cols-3` to `md:grid-cols-4`
2. **Lines 1072 and 1078** -- Card grid: reduce gap from `md:gap-8` to `md:gap-6`
3. **Line 1074** -- Loading skeleton height: change `sm:h-[480px]` to keep consistent with tighter gaps

These are targeted, minimal changes that improve the tablet experience without affecting mobile or desktop layouts.
