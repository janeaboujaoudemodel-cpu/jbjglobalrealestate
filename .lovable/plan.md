## Plan: stop the contrast flicker at the root

Do not rely only on a “nearest surface” inheritance rule, because many broken areas are image cards, dark overlays, gradients, glass panels, and generated book/property covers where the parent surface is not enough. Every reusable card/CTA/chip/book/property overlay must explicitly declare its own `data-surface` or primitive class.

Also, disabling the runtime contrast guard is approved, but after removing it you must manually fix all affected primitives and card templates. Do not leave generated/dynamic sections without a stable surface contract.

Before marking done, validate actual screenshots for idle, hover, after scroll, and after 5 seconds. No blinking, no text disappearing, no black on navy, no white on champagne.

&nbsp;

&nbsp;

### What I will change

1. **Disable the repainting runtime contrast guard**
  - Remove the app install call that mounts `contrastGuard.ts`.
  - Replace the runtime guard with a no-op compatibility export so nothing repaints colors on hover, scroll, mutation, focus, or timers.
  - This directly addresses the blinking black→white→black / white→black→white behavior.
2. **Remove competing global override layers**
  - Consolidate the multiple late-stage `!important` contrast blocks in `src/index.css` that currently fight each other.
  - Keep one final, source-ordered, foreground-only contract.
  - Do not change backgrounds to fix contrast.
3. **Create stable semantic foreground contracts**
  - Dark/navy/black surfaces always set foreground variables to white.
  - Champagne/gold/cream/pearl/light surfaces always set foreground variables to ink/navy.
  - Descendant text, icons, SVG strokes, placeholders, chips, badges, tabs, and button children inherit from the nearest declared/current surface.
  - Nested surface islands win deterministically: a dark button inside a light card stays white; a light chip inside a dark card stays dark.
4. **Lock interactive states without color flipping**
  - Normal, hover, active, focus, disabled, loading, scroll-in-view, and after-animation states keep the same readable foreground for each surface.
  - `jj-cta-dark`, `jj-cta-champagne`, `jj-cta-outline`, `jj-pill-active`, and badge primitives become the stable source of truth.
  - Hover may change shadow/border/background shade, but not foreground polarity unless the actual surface class changes.
5. **Cover the called-out modules globally**
  - Homepage CTAs and role cards.
  - Broker portal preview cards and tabs.
  - Careers/JBJ sections.
  - Guide/book covers and generated book tiles.
  - Recently viewed/property cards, handover/date/status chips, dark property overlays.
  - Floating Contact Us and Web Developer widgets.
  - Cookie banner and Get Verified surfaces.
6. **Strengthen static contrast checks**
  - Update the existing contrast scripts to fail if the runtime guard is reinstalled or if broad conflicting global overrides are added again.
  - Add checks for dark-surface dark text, light-surface white text, and unstable hover-state foreground polarity.

### Validation before I claim this is done

I will open and inspect multiple pages in the live preview, scroll up/down, hover representative CTAs/widgets/cards, then wait 5 seconds to confirm no flicker. I will provide visual proof for:

- Homepage idle + hover + after scroll/wait.
- Broker portal visuals/cards.
- Careers/JBJ page section.
- Guide/book covers.
- Property/recently viewed/dark card chips.
- Floating Contact Us/Web Developer widgets.
- Get Verified and cookie/banner-style controls.

### Files expected to change

- `src/App.tsx`
- `src/utils/contrastGuard.ts`
- `src/index.css`
- `src/components/ui/button.tsx` if needed for stable primitive data attributes
- `src/components/ui/badge.tsx` if needed for stable primitive data attributes
- `src/components/ui/tabs.tsx` if needed for stable primitive data attributes
- `scripts/contrast/*.mjs` for regression checks