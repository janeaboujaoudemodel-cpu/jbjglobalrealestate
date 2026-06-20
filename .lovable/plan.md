I found the root cause: there are still competing global CSS contrast locks plus a runtime `ChampagneCtaInkGuard` mounted in `App.tsx`. Those rules force colors after components render, which is why buttons/icons keep flipping between black/white incorrectly.

Plan:
1. Remove the runtime contrast repaint
   - Delete the `ChampagneCtaInkGuard` mount from `App.tsx`.
   - Remove the `ChampagneCtaInkGuard` import.
   - Leave contrast controlled by static CSS only.

2. Clean the conflicting global CSS winners
   - Remove the old final `ABSOLUTE FINAL CHAMPAGNE-CTA INK LOCK` that hard-forces `.mi-hero-cta`, `.jj-cta-champagne`, `.jj-cta-outline`, and `.jj-pill-active` to ink everywhere.
   - Remove the earlier hero-scoped `.mi-hero-cta` champagne repaint block.
   - Replace them with a smaller surface contract:
     - light/champagne/gold own-background buttons/icons = ink
     - dark/black/hero glass own-background buttons/icons = white
     - explicit `data-on-dark` / `allow-white` is respected only on dark/glass surfaces, not champagne fills

3. Fix the selected Market Intelligence info icon
   - Replace the hand-coded black tile + white icon in `MarketIntelligence.tsx` with the global `<IconTile />` primitive using a valid tone.
   - This prevents a tiny low-contrast icon from being overridden by unrelated CSS.

4. Normalize the Market Intelligence hero CTAs
   - Keep them as glass/fiberglass buttons with white text/icons on the dark video hero.
   - Remove inline color hacks where possible after the global rules are corrected.

5. Strengthen future protection
   - Update the contrast architecture check so it fails if `ChampagneCtaInkGuard` or any new `MutationObserver`-based contrast repaint is mounted.
   - Add Market Intelligence routes to the rendered contrast sweep so `/market-intelligence` and its key subpages are tested, not skipped.

6. Validate before marking complete
   - Run the existing contrast guard scripts for architecture, white-on-light, black-on-dark, same-tone, low-opacity, faded-gold, interactive, and rendered contrast.
   - Inspect `/market-intelligence` in the browser after changes, including the hero CTAs and the Compliance & Transparency icon.
   - Check at least desktop and mobile viewport sizes for the affected page.