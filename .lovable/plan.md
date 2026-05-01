# Fix faded "Mode: Investor" chip in the footer

## Problem

In the footer, the "Mode: Investor" pill renders as a pale peach instead of the vivid orange shown in the top header. The chip is correct in code — it uses an inline orange gradient (`#F97316 → #C2410C`) with inline `color: #FFFFFF` for the icon, label, and chevron.

Why it looks faded:
- The footer wraps the chip in a translucent panel: `bg-[#FDFBF7]/[0.03]` (`src/components/Footer.tsx:529`).
- The PASS 5 same-tone contrast guard in `src/index.css` matches **any** class containing `bg-[#FDFBF7]` regardless of alpha, so it treats that panel as a "light surface".
- Rule at `src/index.css:3670-3674` then force-rewrites `.text-white` and `[class*="text-white"]` descendants to `#1A1A1A !important`, beating the inline `color: #FFFFFF`.
- Result: the chip's icon, label, and chevron go dark on the orange gradient, producing the washed-out look.

The header chip is unaffected because the header wrapper does not have a `bg-[#FDFBF7]*` class.

## Fix

Add the documented opt-out attribute (`data-no-contrast-guard`) to the ModeSwitcher trigger button so the contrast guard leaves its white icon/label/chevron alone. The PASS 5 guard already excludes `[data-no-contrast-guard]` in its champagne-surface rules.

Single, scoped edit — no new CSS, no behavior change.

### File: `src/components/ModeSwitcher.tsx`

On the `<button>` returned from `DropdownMenuTrigger asChild` (the trigger that renders the orange chip with label + chevron, currently around lines 158–183), add:

```tsx
data-no-contrast-guard
```

Also add the same attribute to the compact `<button>` variant (around lines 127–145) so the chip stays vivid wherever it is rendered against translucent light overlays.

No other files need to change. The header instance is already vivid and continues to work; this only restores the same vividness when the chip sits inside a translucent champagne wrapper (footer, future cards, etc.).

## Verification

After the change, in the footer:
- Chip background: saturated orange gradient (`#F97316 → #C2410C`) — unchanged.
- Icon, "Mode: Investor" label, and chevron: pure white, fully legible.
- Header chip: unchanged (still vivid).
- Other modes (Broker blue, Investor+Broker green, Developer purple) automatically benefit from the same fix.

## Out of scope

No changes to the contrast guard itself, no changes to footer layout, and no changes to the ModeSwitcher dropdown panel.
