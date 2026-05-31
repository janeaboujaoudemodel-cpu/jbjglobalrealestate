## Plan: finish the contrast architecture cleanup

The remaining issue is architectural, not the specific About-page icon: the final two-rule contract currently recognizes `data-surface`, `.surface-*`, and CTA primitives, but many components still use raw Tailwind own-background classes such as `bg-[#1A1A1A]`, `bg-[#102540]`, `bg-[#F7F2EA]`, and hover variants. Those raw own-boxes can escape the contract, so black-on-black or white-on-champagne can still appear.

## What I will change

1. **Make the two-rule contract recognize real own-backgrounds**
   - Extend the final contract in `src/index.css` so exact raw background utilities are treated as own surfaces:
     - Dark/navy/ink: `bg-[#1A1A1A]`, `bg-black`, `bg-[#102540]`, `bg-[#1a3d63]`, and safe opacity variants like `bg-[#1A1A1A]/60`.
     - Light/champagne/cream: `bg-[#FDFBF7]`, `bg-[#F7F2EA]`, `bg-[#EFE6D6]`, `bg-white`, `bg-page`, `bg-surface`, `bg-raised`.
   - Use whole-token or token-prefix selectors only, not broad substring selectors that catch unrelated hover/gradient classes.

2. **Protect nested opposite surfaces**
   - Keep the important rule: a navy button inside a champagne card stays white-on-navy, and a champagne pill inside a dark banner stays ink-on-champagne.
   - Add opposite-surface exclusions for both explicit `data-surface` classes and raw `bg-*` own boxes.

3. **Remove/neutralize remaining competing contrast layers**
   - Clean leftover legacy foreground rules in `src/index.css` that still override the final contract, especially:
     - global icon interaction rules that repaint icons on hover/focus;
     - old monochrome active-state classes still defaulting to white;
     - marketing-page remaps that only partially change section backgrounds but leave descendants in conflicting colors;
     - premium/careers escape hatch comments/rules that claim to beat global contrast guards.
   - Keep locked business/design primitives untouched: CTA primitives, PricePill, DeveloperLink, IconTile, phone trigger, sign-out red, photo-copy lock, sidebar gold exception, no-gray/no-gold-fill rules.

4. **Normalize hover/focus/active states under the same two rules**
   - Ensure hover/focus/active does not introduce a third contrast system.
   - Where a hover class changes the element to dark/navy, text/icons become white.
   - Where a hover class changes the element to champagne/light, text/icons become ink.

5. **Surgical cleanup only where raw classes are clearly wrong**
   - Fix obvious component patterns that are directly contradictory, such as `bg-[#1A1A1A]` with `text-[#1A1A1A]` icons, but only when the global rule cannot safely cover the pattern.
   - The screenshot’s About-page black icon tiles should be fixed by the global rule, not a one-off About-page patch.

## Validation

- Run a CSS selector audit to confirm no broad contrast selectors remain, especially unsafe `[class*="bg-"]` / `[class*="text-"]` foreground repaint rules.
- Check the About page example and representative dark/navy + champagne components.
- Audit hover/focus states for buttons, cards, pills, tabs, icon tiles, and modal controls.
- Confirm there are no white-on-light, ink-on-dark, or black-on-black failures in the sampled DOM.

## Files expected to change

- `src/index.css` as the primary cleanup target.
- `src/styles/theme-tokens.css` only if needed to remove old escape-hatch contrast conflicts.
- Minimal component edits only if a class combination is impossible to solve safely at the architecture layer.