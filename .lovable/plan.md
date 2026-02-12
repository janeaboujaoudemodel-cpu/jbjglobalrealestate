

## Fixes: Divider Background, Page Contrast, Mode Dropdown, and Filter Row Layout

### 1. Fix SectionDivider Background on Developer Page

**Problem**: The `SectionDivider` component renders with `bg-black`, creating a jarring black stripe between the champagne project grid and the DLD Market Widget.

**Fix in `src/pages/DeveloperDetail.tsx`**: Replace `<SectionDivider fullWidth />` with an inline champagne-background divider that uses the gold sparkle line but inherits the surrounding champagne background color instead of black. Alternatively, pass a background override or render a custom divider inline with the champagne gradient background, keeping only the gold horizontal line and sparkle icon.

### 2. Darken Project Page Main Background for Card Contrast

**Problem**: The main content background (`#FDFBF7 -> #F5F0E6 -> #EDE4D3`) is the same champagne as the cards inside, resulting in no contrast -- cards blend into the page.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx`** (line 638): Change the main section background to match the darker champagne tone used in Row 2 of the sticky nav: `from-[#EDE0C8] via-[#E2D4B8] to-[#D4C4A8]`. This is the exact gradient from line 596. The cards inside (which use `bg-card` or lighter champagne) will now pop with visible contrast.

### 3. Mode Button -- Open Dropdown Instead of Toggle

**Problem**: The Mode button in `UtilityButtons` (FilterShortcutBar.tsx line 662) calls `toggleMode()` on click, cycling modes without a dropdown. User wants a dropdown to appear showing available modes.

**Fix in `src/components/filters/FilterShortcutBar.tsx`** (lines 572-665): Replace the simple `<button onClick={toggleMode}>` with a `<Popover>` containing the three mode options (Investor, Broker, Both). Each option calls `setMode(...)` and closes the popover. The trigger button remains the same styling but opens a dropdown instead of toggling.

### 4. Rearrange Row 1 Layout: Left = Saved + Currency + Mode, Center = Sort Pills, Right = Map

**Current Row 1**: Left: `[Saved] [Currency] [Mode]` | Right: `[Map] [Newest] [Low-High] [High-Low] [A-Z]`

**Requested Row 1**: Left: `[Map] [Saved] [Currency] [Mode]` | Center: `[Newest] [Low-High] [High-Low] [A-Z]`

**Fix in `src/components/filters/FilterShortcutBar.tsx`**:
- Move the Map button from the right-side sort group into the left `UtilityButtons` group (first position)
- Change Row 1 layout to: left group has `[Map] [Saved] [Currency] [Mode]`, and the sort pills are centered using `justify-center` with `flex-1`

### Technical Details

| File | Changes |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Replace `<SectionDivider>` with a champagne-background divider (gold line + sparkle icon on matching champagne bg) |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Change main content background from light champagne to darker champagne (`from-[#EDE0C8] via-[#E2D4B8] to-[#D4C4A8]`) for card contrast |
| `src/components/filters/FilterShortcutBar.tsx` | (a) Replace Mode toggle button with a Popover dropdown showing Investor/Broker/Both options; (b) Move Map button to left utility group; (c) Center sort pills in Row 1 |
| `src/components/ui/section-divider.tsx` | Add optional `bg` prop to override the default `bg-black` background, allowing champagne-toned dividers |

