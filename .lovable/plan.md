Plan to finish the contrast cleanup without touching already-fixed sections:

1. Remove the duplicate/winning contrast systems in `src/index.css`
   - Neutralize the older global blocks that still compete with the final contract:
     - `GLOBAL PREMIUM ICON VISIBILITY` broad dark/light icon rules around lines 569-943.
     - `UNIVERSAL WHITE-ON-CHAMPAGNE/GOLD CONTRAST GUARD` around lines 945-1008.
     - `GLOBAL CONTRAST ENFORCEMENT` around lines 2991-3238.
     - `LIGHT-SURFACE INTERACTIVE LABEL GUARD` around lines 3239-3262.
     - `DARK SURFACE ESCAPE HATCH` around lines 3264-3375.
     - `FINAL LIGHT-SURFACE INK RESTORE` and global heading/navy sweep around lines 5220-5258 where it can override nested dark boxes.
     - `UNIVERSAL SVG ICON CONTRAST GUARD` around lines 5352-5390 where it still treats gold/champagne descendants too broadly.
     - Duplicate CTA/surface blocks around lines 5699-6150 that repeat the same rules before the final contract.
   - Keep unrelated locked fixes intact: hero consultation lock, photo copy lock, favorite button lock, sidebar collapse gold control, phone trigger/cmdk lock, sign-out red lock, price/developer/card standards.

2. Keep only the final two-rule architecture at the end of `src/index.css`
   - Rule A: any element whose own surface is navy / ink / dark must render white text and white icons.
   - Rule B: any element whose own surface is champagne / page / cream / raised / gold / white must render ink text and ink icons.
   - Use only exact own-surface selectors: `[data-surface]`, `.surface-*`, `.jj-cta-*`, `.jj-pill-active`, `.jj-navy-cta`, and exact whole-token background matches like `[class~="bg-[#102540]"]`.
   - No broad substring surface detection like `[class*="bg-black"]`, `[class*="bg-[#0"]`, `[class*="from-[#FDFBF7]"]`, or descendant-wide inheritance that repaints nested opposite-tone boxes.

3. Fix the final contract so nested surfaces are stable
   - A navy CTA inside champagne stays white.
   - A champagne/light card inside navy stays ink.
   - Gold is treated as light/champagne for foreground, per your rule.
   - `allow-white` stops being a light-surface escape hatch unless the element itself is dark/navy.
   - Existing explicit exceptions remain only where already locked: photo overlays, hero consultation, sign-out red, phone trigger, sidebar collapse control.

4. Align loaded secondary stylesheet only if validation proves it conflicts
   - `src/styles/theme-tokens.css` is imported after `index.css`, so I will inspect and only narrow any selectors there that override the final two-rule contract.
   - I will not rewrite the careers/join styling that is already repaired unless it directly violates the two rules.

5. Validate with screenshots and computed checks
   - Routes to validate: `/`, `/properties`, `/developers`, `/areas`, `/toolkit`, `/ai-hub`, `/ai-broker-workspace`, `/join`, `/profile?tab=settings`.
   - Check both conditions programmatically in the browser:
     - White/champagne text or icons on champagne/gold/light backgrounds: zero.
     - Ink/black text or icons on navy/dark backgrounds: zero.
   - Capture screenshots after the cleanup and only report complete once the two-rule contract is stable.