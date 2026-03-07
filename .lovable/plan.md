

# Fix: Project Card Badge Positioning, Tooltip Direction, Properties Page Scroll/Mode Sizing

## 4 Issues to Fix

### 1. "On Sale" Badge Overlapping Developer Logo on Project Cards
**Current**: `badgePosition` is set to `bottom-3 left-3` when a developer logo exists, but both the logo (top-3 left-3) and the sale status badge can overlap visually. The user wants the "On Sale" badge on the **right side** of the image instead of under the logo.

**Fix in `ProjectCard.tsx`**:
- Move the sale status badge position to **top-right** when a developer logo is present: change `badgePosition` from `bottom-3 left-3` to `top-3 right-3`.
- Since the Favorite/Shortlist/Badge buttons are also at `top-3 right-3`, make the "On Sale" badge appear on hover-out (default visible), and **hide it on hover** when the favorite/shortlist buttons appear. Use the existing `group-hover` pattern: sale badge gets `group-hover:opacity-0` and the favorite/shortlist buttons keep their existing `opacity-0 group-hover:opacity-100`.

### 2. Tooltip on Favorite/Shortlist Opens Upward (Clipped by Image)
**Current**: `TooltipContent` uses `side="top"` which pushes tooltips above the buttons — into the image area where they get clipped/hidden. The user can't see them.

**Fix in `FavoriteButton.tsx`**:
- Change `side="top"` to `side="bottom"` on both `TooltipContent` elements so tooltips open **downward**, away from the image.
- Keep `sideOffset={8}` and the dark styling.

### 3. Properties Page Row 1 — Remove Scroll Divider and Arrows
**Current**: `PremiumHorizontalScrollHint` is rendered for Row 1 (line 364 of `FilterShortcutBar.tsx`) even when the content is a single line that doesn't overflow. The component already returns `null` when `showRail` is false (no overflow), but the user reports seeing it. This may be because the row content is slightly wider than viewport on some screens.

**Fix in `FilterShortcutBar.tsx`**:
- Remove `<PremiumHorizontalScrollHint scrollRef={row1Ref} />` from Row 1 entirely (line 364). Row 1 should never show scroll indicators — if content overflows, it simply scrolls without visual indicators.
- Keep the `PremiumHorizontalScrollHint` on Row 2 as-is.

### 4. Mode Dropdown (Investor/Broker/Both) — Text Too Small
**Current**: The popover is `w-44` but the button text inside uses `text-xs` (12px) — too small relative to the dropdown width.

**Fix in `FilterShortcutBar.tsx` (ConnectedModeButton)**:
- Change button text from `text-xs` to `text-sm` (14px).
- Add `text-center` to center the labels.
- Increase vertical padding from `py-2` to `py-2.5`.

## Files to Modify

### `src/components/ProjectCard.tsx`
- Change sale status badge position to right side when dev logo is present
- Add `group-hover:opacity-0` to sale badge so it hides when favorite/shortlist buttons appear on hover
- Keep favorite/shortlist buttons with `opacity-0 group-hover:opacity-100` (already in place)

### `src/components/FavoriteButton.tsx`
- Change both `TooltipContent` from `side="top"` to `side="bottom"`

### `src/components/filters/FilterShortcutBar.tsx`
- Remove `PremiumHorizontalScrollHint` from Row 1 (line 364)
- In `ConnectedModeButton`: increase option text to `text-sm`, center text, increase padding

