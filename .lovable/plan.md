## Mode Switcher color fix everywhere it appears

### 1. Rebuild the per-mode styling so each dropdown row has its own real color
File: `src/components/ModeSwitcher.tsx`

Problem:
- The current dropdown rows are still ending up visually neutral/same-looking because the generic dropdown hover/focus behavior is fighting the per-mode tint classes.
- The current override strategy (`text-current`, `hover:!bg-transparent`, `focus:!bg-transparent`) is flattening the visual differences instead of preserving them.

Changes:
- Replace the current `MODE_CONFIG` color fields with explicit per-mode style groups for:
  - row background
  - row border
  - row text/icon color
  - highlighted/hover state
  - active ring state
  - trigger button styling
- Give each mode a clearly distinct palette:
  - Investor: emerald
  - Broker: blue
  - Investor + Broker: purple
  - Developer: amber
- Apply those classes directly to the full `DropdownMenuItem`, not just to the inner icon/text.
- Remove the generic `text-current` / transparent hover overrides and replace them with mode-specific highlighted states like:
  - `data-[highlighted]:bg-emerald-50`
  - `data-[highlighted]:text-emerald-700`
  - equivalent blue/purple/amber variants for the other modes

Result:
- Every dropdown category keeps its own color when opened, hovered, focused, and selected.

### 2. Add real spacing so the mode sections never touch
File: `src/components/ModeSwitcher.tsx`

Changes:
- Move the row spacing responsibility out of the item-state styling and into a stable layout wrapper.
- Wrap the mode items in a vertical stack with consistent gap (`space-y-1.5` or equivalent), so the colored cards stay visually separated in all placements.
- Keep rounded corners and distinct borders on every row so each mode reads like its own card.

Result:
- No touching tiles in the dropdown.

### 3. Strengthen the active mode trigger color in header, footer, and shared placements
File: `src/components/ModeSwitcher.tsx`

Problem:
- The active trigger is technically tinted now, but not strongly enough to read as clearly mode-specific in the horizontal header and footer.

Changes:
- Give the trigger button its own per-mode classes instead of reusing the softer dropdown row tint.
- Make the active trigger visibly mode-colored in every place this shared component is mounted:
  - `HorizontalUtilityBar`
  - `Footer`
  - `MegaMenuAccount`
  - any other existing `ModeSwitcher` usage
- Keep icon, label, chevron, border, and subtle shadow all aligned to the active mode color.
- Preserve current behavior and layout, but make the selected mode unmistakably green/blue/purple/amber.

Result:
- The currently selected mode is visibly color-coded in the horizontal header, footer, and other shared placements.

### 4. Keep the fix centralized
Files affected by behavior:
- `src/components/ModeSwitcher.tsx`

Files reviewed for usage confirmation:
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/Footer.tsx`
- `src/components/header/MegaMenuAccount.tsx`

Implementation note:
- Because all those places already use the shared `ModeSwitcher`, the styling fix should be done centrally in that component rather than patched separately at each call site.

## Technical details
- The shared dropdown primitive in `src/components/ui/dropdown-menu.tsx` applies generic gold hover/focus styling by default.
- The mode switcher fix will override that at the item level with stronger per-mode state classes instead of transparent resets.
- The trigger button will get separate mode-specific classes so the active mode remains visually obvious on both light and dark surfaces.

## Expected outcome
- The dropdown rows are individually colored by mode.
- The colored rows no longer touch each other.
- The selected mode button is clearly color-coded in the horizontal header and footer, not just inside the dropdown.