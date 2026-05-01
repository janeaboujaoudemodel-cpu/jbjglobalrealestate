# Make sidebar Contact + Support buttons readable with stacked icons

## Problem

In the vertical sidebar's bottom block, the **Contact** and **Support** buttons are unreadable:
- Tiny `text-[10px]` label sits *next to* a small icon on a single row, leaving very little width for text in the narrow sidebar.
- Resting state uses a faint translucent red wash (`rgba(220,38,38,0.06)` background, `rgba(220,38,38,0.40)` border) on a champagne backdrop, so both the icon and the label appear washed out at first glance.

User wants:
1. The icon **above** the label (stacked) so both have room to breathe.
2. The button title clearly readable in the resting state, not only on hover.

## Fix — single file: `src/components/navigation/GlobalVerticalNav.tsx` (lines 1245–1269)

Restructure the Contact and Support buttons in the expanded sidebar's bottom block:

- Switch layout from `flex items-center` (icon + label inline) to `flex flex-col items-center` (icon stacked above label).
- Bump icon size from `w-3.5 h-3.5` to `w-4 h-4` so the headphones / ticket glyph reads cleanly above the word.
- Bump label from `text-[10px]` to `text-[11px] font-bold tracking-wide leading-none`.
- Replace the faded `rgba(220,38,38,0.06)` background with a solid champagne fill (`#FDFBF7`) and a solid 2px red border (`#DC2626`), giving high resting contrast: ink-black label, red border, white surface.
- Icon color uses `inherit` so it follows the label color, flipping cleanly to white on hover (when background turns solid red).
- Hover state stays the same intent: solid red `#DC2626` fill with white text/icon.
- Increase button padding to `py-2` and container padding to `py-2.5` / gap `gap-2` to accommodate the stacked layout without crowding.

No other components affected. The collapsed (icon-only) sidebar variant at lines 1354–1366 already shows tooltips and remains unchanged.

## Result

- Resting: white pill with crisp red 2px border; **headphones icon on top**, bold ink-black "Contact" / "Support" label below — instantly readable on the champagne sidebar.
- Hover: pill fills solid red with white icon + label.
- Same routing (`/contact`, `/ticket-hub`) and same red brand accent — only legibility changes.
