## Centralized mode color correction everywhere the selector appears

### 1. Replace the mode palette in the shared `ModeSwitcher`
File: `src/components/ModeSwitcher.tsx`

Update the shared mode config so it matches your exact requested colors:
- Investor: orange
- Broker: blue
- Investor + Broker: green
- Developer: purple

Changes:
- Replace the current trigger/dropdown classes in `MODE_CONFIG`:
  - Investor from emerald -> orange/amber-orange classes
  - Broker stays blue
  - Investor + Broker from purple -> green
  - Developer from amber -> purple
- Keep the palette centralized in `MODE_CONFIG` so every existing `ModeSwitcher` usage inherits the same colors automatically.

Result:
- The active mode button and dropdown entries use the correct color mapping everywhere.

### 2. Make the dropdown rows keep their own colors instead of falling back to the neutral/gold menu styling
Files:
- `src/components/ModeSwitcher.tsx`
- `src/components/ui/dropdown-menu.tsx`

Problem:
- The shared dropdown primitive still applies generic gold hover/focus styles to every `DropdownMenuItem`.
- Even though `ModeSwitcher` adds per-mode classes, those default styles are still winning in interaction states, which is why the rows keep looking the same.

Changes:
- Strengthen the row classes in `ModeSwitcher` with explicit mode-specific background, border, text, and highlighted-state utilities.
- Add stronger overrides for highlighted/focus states so each row keeps its own palette when hovered or keyboard-focused.
- If needed, slightly relax the hardcoded gold hover/focus defaults in the shared dropdown primitive so component-level classes can control the item color correctly.
- Preserve spacing between items with the existing stacked card layout so sections do not touch.

Result:
- Investor row reads orange, Broker row blue, Investor + Broker row green, Developer row purple.
- Colors remain visible on open, hover, focus, and selected states.

### 3. Keep the active trigger clearly color-coded in every shared placement
Files reviewed for usage:
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/Footer.tsx`
- `src/components/header/MegaMenuAccount.tsx`

Changes:
- Keep the fix centralized in `ModeSwitcher.tsx`, since these locations already use the same shared component.
- Strengthen the trigger’s background, border, icon, label, and chevron classes so the selected mode is clearly visible against:
  - the champagne horizontal header
  - the dark footer
  - the account dropdown card
- Ensure the trigger keeps the same requested palette mapping in all three places.

Result:
- The selected mode is visibly orange / blue / green / purple in the header, footer, and account menu without separate one-off patches.

## Technical details
- Current file inspection shows the live palette is still mapped as:
  - Investor = emerald
  - Broker = blue
  - Investor + Broker = purple
  - Developer = amber
- The shared dropdown primitive currently injects generic gold hover/focus styling on all menu items, which is the main reason the per-mode row colors are not reading correctly.
- Because `HorizontalUtilityBar`, `Footer`, and `MegaMenuAccount` all mount the same `ModeSwitcher`, the correct fix is to update the shared component and, if necessary, the dropdown primitive once.

## Expected outcome
- Investor mode displays orange.
- Broker mode displays blue.
- Investor + Broker displays green.
- Developer displays purple.
- The dropdown rows no longer look the same.
- The active mode button is clearly color-coded in the horizontal header, footer, and other shared placements.