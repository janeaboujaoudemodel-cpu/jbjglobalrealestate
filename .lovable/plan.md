I will not add a new broad CSS rule. I will remove the conflicting winner and reduce the contrast system back to explicit primitives, then verify with screenshots.

What I found:
- The visible homepage issue is real: the hero headline is rendered almost black on the dark video overlay, and some CTA/button areas are at risk of black-on-navy or white-on-champagne conflicts.
- The main winning conflict is the final block in `src/index.css`: `CTA + SURFACE CONTRAST CONTRACT — FINAL SINGLE SOURCE OF TRUTH`, especially Rule A/Rule B at lines 4145–4233.
- That block uses very broad descendant selectors with `!important`, including `-webkit-text-fill-color`, so it overrides local component intent across buttons, spans, icons, headings, and nested surfaces.
- There are also earlier overlapping locks in `src/index.css` and `src/styles/theme-tokens.css` for phone buttons, gold debrand, careers fields, and hero readability. These are not all wrong, but the final Rule A/Rule B sweep is too broad and is still winning.

Fix plan:
1. Remove the broad descendant repaint section from the final contrast contract in `src/index.css` instead of adding more exceptions.
   - Remove/neutralize Rule A descendant forcing all children to white.
   - Remove/neutralize Rule B descendant forcing all children to ink.
   - Keep only narrow primitive styling for `.jj-cta-dark`, `.jj-cta-champagne`, `.jj-cta-outline`, `.jj-pill-active`, `[data-phone-code-trigger]`, and `[data-surface]` variables.

2. Restore explicit primitive foregrounds, not global sweeping.
   - `.jj-cta-dark`, `.jj-navy-cta`, and `button[data-phone-code-trigger]`: own text/icons white.
   - `.jj-cta-champagne`, `.jj-pill-active`, `.jj-cta-outline`: own text/icons ink, while allowing `.text-gold`/gold accents to remain gold.
   - Dark hero text stays white through the existing hero-specific rule, not through global dark-ancestor repainting.

3. Clean only proven duplicate/conflicting locks.
   - Remove duplicate phone-code foreground rules only if the primitive lock replaces them exactly.
   - Do not touch unrelated careers/form rules unless visual inspection proves they are currently winning incorrectly.
   - Do not add champagne backgrounds or broad new `!important` color sweeps.

4. Add a read-only visual audit script/check that reports:
   - black/dark text on navy/dark buttons,
   - white text on champagne/light/gold backgrounds,
   - visible text contrast below threshold in the viewport,
   - the last matching CSS rules for each failure.
   This is for verification only, not runtime repainting.

5. Visual verification before claiming fixed:
   - Capture screenshots of `/` at the current 1178×891 viewport.
   - Test the visible states: initial homepage, hover on Free Consultation, header controls, mode selector, contact tab, and the welcome/modal state if it appears.
   - Also inspect `/founder` because it was previously affected.
   - I will only say fixed if screenshots show: white on blue/navy/dark buttons, ink/gold on champagne surfaces, and hero text readable.