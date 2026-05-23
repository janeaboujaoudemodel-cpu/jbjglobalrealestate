### Goal
Update the two bottom CTA buttons (Contact / Support) in the global vertical nav so their gold borders look premium and luminous — bright champagne gold, not dark or muddy.

### Current State
In `src/components/navigation/GlobalVerticalNav.tsx` around lines 1166-1204 there are two small Link buttons:
- `borderColor: '#B89555'` (muted/antique gold)
- Icon color also `#B89555`
- `border-2` class making the stroke look heavy on the small buttons

### Plan
1. Lighten the border to a bright champagne gold (`#D4B896`) for a luminous, premium look.
2. Reduce `border-2` to `border` (1px) so the hairline stays elegant per the "No Gold Fills / 1px hairline" standard.
3. Match the icon color to the brighter gold tone.
4. Update hover shadow tints to the same brighter gold so the glow stays consistent.
5. Leave all other layout and interaction logic untouched.

### Expected Result
Contact and Support CTAs gain a delicate, bright champagne-gold 1px border that reads as premium rather than dark/muddy.