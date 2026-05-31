I will fix this as a contrast-infrastructure cleanup, not as one-off styling.

What is actually broken:
- The screenshot failures are real: navy/blue filled icon tiles are inheriting dark foreground from broader icon/color rules, so icons become dark on navy.
- `/services` has explicit `text-white/90` and `text-white/70` on a section that is now visually champagne after the global band rules, causing white-on-light text.
- The remaining risk is not only one selector. The problem is competing broad rules: `.careers-navy *`, `.careers-white *`, `.allow-white`, and the global `a/button .lucide { color: currentColor }` icon rule can override local intended contrast.

Implementation plan:
1. Narrow the careers color helper rules in `src/styles/theme-tokens.css`
   - Remove wildcard descendant repaint behavior from `.careers-navy *`, `.careers-gold *`, `.careers-white *`, and `.allow-white` where it can leak into nested surfaces.
   - Keep only explicit primitives:
     - `.careers-navy-cta` / `.jj-cta-dark` = navy background + white text/icons.
     - champagne cards/sections = ink text/icons.
     - true dark badges/tiles = white text/icons.

2. Fix the global Lucide icon conflict in `src/index.css`
   - The current `button .lucide, a .lucide, [role="button"] .lucide { color: currentColor; }` rule is too broad.
   - Replace it with a scoped version that does not override icons already marked `text-white`, `allow-white`, `data-no-contrast-guard`, or inside dark/navy/CTA primitives.
   - Add a narrow lock for dark own-surfaces only: `[data-surface="navy"|"ink"|"dark"]`, `.surface-navy`, `.surface-ink`, `.surface-dark`, `.jj-cta-dark`, `.jj-navy-cta` icons stay white.
   - Do not add a new runtime guard or duplicate system.

3. Mark the reported dark icon containers as real dark surfaces where needed
   - In `CareersContactBlock.tsx`, the navy icon tile will declare `data-surface="navy"` / existing dark opt-out so its icon stays white.
   - In `CareersFAQ.tsx`, the open FAQ chevron circle will declare the same dark surface contract so the chevron stays white.
   - This is not a visual redesign; it only declares the already-existing navy background correctly.

4. Fix the `/services` white-on-champagne text
   - In `Services.tsx`, replace the explicit white text/icon bullets in the champagne/light service scope/footer areas with ink.
   - If the section is intended to be dark, mark it `data-surface="dark"`; if it is visually champagne, all text becomes ink. I will follow the actual rendered surface from the screenshot: champagne = ink.

5. Strengthen validation so this does not get falsely marked fixed again
   - Update the existing contrast checker to inspect SVG icons as first-class contrast targets, not just text nodes, so dark-icon-on-navy is caught.
   - Re-run visible contrast checks on `/join`, `/services`, `/owner`, and `/`.
   - Use browser screenshots/computed styles for the exact reported elements before saying complete.

Files expected to change:
- `src/index.css`
- `src/styles/theme-tokens.css`
- `src/components/careers/CareersContactBlock.tsx`
- `src/components/careers/CareersFAQ.tsx`
- `src/pages/Services.tsx`
- `scripts/contrast/check-visible-contrast-contract.mjs`