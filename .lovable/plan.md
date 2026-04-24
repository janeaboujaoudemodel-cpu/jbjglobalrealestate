## Centralized mode color correction everywhere the selector appears

### 1. Replace Tailwind semantic color classes in `ModeSwitcher` with hard-coded mode colors
File: `src/components/ModeSwitcher.tsx`

Problem confirmed from the preview screenshot:
- The dropdown rows and active trigger are all rendering gray.
- The current `ModeSwitcher` already uses `orange-*`, `blue-*`, `green-*`, and `purple-*` classes, but this project’s `tailwind.config.ts` remaps those families to grayscale.
- Because of that remapping, the requested palettes can never show correctly with the current class approach.

Changes:
- Rewrite the shared `MODE_CONFIG` to use explicit color values instead of the remapped Tailwind families.
- Use arbitrary-value utilities or inline style tokens for each mode so the colors cannot be neutralized by the global monochrome palette.
- Lock the requested mapping exactly:
  - Investor: orange
  - Broker: blue
  - Investor + Broker: green
  - Developer: purple

Result:
- The active trigger and every dropdown row will finally display distinct colors instead of four shades of gray.

### 2. Make the dropdown rows keep their mode color on hover, focus, and selected states
Files:
- `src/components/ModeSwitcher.tsx`
- `src/components/ui/dropdown-menu.tsx` if needed

Problem:
- The shared dropdown primitive still injects generic hover/focus styling.
- Even after correcting the palette source, highlighted states can still drift away from the intended per-mode styling unless the mode rows fully control their own interaction colors.

Changes:
- Strengthen each mode row with explicit per-mode background, border, text, icon, and selected-ring styles using non-remapped colors.
- Keep the existing card spacing between rows so the sections stay visually separated.
- If the shared primitive still overrides row styling, relax the hardcoded generic hover/focus styling in `DropdownMenuItem` so `ModeSwitcher` can own the final appearance.

Result:
- Investor row stays orange, Broker blue, Investor + Broker green, Developer purple.
- The colors remain visible when hovered, keyboard-focused, and selected.

### 3. Ensure the selected mode trigger is visibly color-coded in every shared placement
Files reviewed for usage:
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/Footer.tsx`
- `src/components/header/MegaMenuAccount.tsx`

Changes:
- Keep the fix centralized in `ModeSwitcher.tsx`, since these placements already use the same shared component.
- Apply the corrected explicit palette to the trigger’s background, border, text, icon, and chevron.
- Preserve readability on both the light horizontal header and the dark footer.

Result:
- The selected mode is visibly orange / blue / green / purple in the header, footer, and account menu without one-off patches.

## Technical details
- Root cause is not the mode mapping itself anymore; it is the global Tailwind theme override in `tailwind.config.ts`.
- That file remaps `orange`, `blue`, `green`, `purple`, `amber`, and other color families to grayscale values, so classes like `bg-orange-50` and `text-blue-700` resolve to neutral grays.
- The correct fix is to stop relying on those remapped families for mode identity and instead use explicit colors in the shared `ModeSwitcher`.
- Existing memory still says the old mode palette was emerald / blue / purple / amber, but the new locked requirement is:
  - Investor = orange
  - Broker = blue
  - Investor + Broker = green
  - Developer = purple
- After implementation, I will update the saved mode-color memory to match this exact mapping so it stays consistent in future edits.

## Expected outcome
- Investor mode displays orange.
- Broker mode displays blue.
- Investor + Broker displays green.
- Developer displays purple.
- The dropdown rows no longer all look the same.
- The active mode button is clearly color-coded in the horizontal header, footer, and other shared placements.