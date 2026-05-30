Plan to fix the global contrast architecture without marking it complete until verified visually.

 do not mark complete after checking only the homepage or one button.

&nbsp;

Before building, first remove the runtime repaint/flicker source completely, then rebuild only the stable surface/foreground contract. Do not patch individual screenshots.

&nbsp;

After build, validate the actual live preview across homepage, broker portal visuals, careers visuals, property cards, books/guides, Get Verified, search bars, floating widgets, and cookie/banner buttons. Test idle, hover, focus, after scroll, and after 5 seconds. No blinking, no delayed color switching, no white on champagne/light, no black on navy/dark.

&nbsp;

Only say complete after visual proof from multiple sections.

1. Remove runtime repainting completely

- Remove the `installContrastGuard()` import/call from `src/App.tsx`, not just no-op the function.
- Keep `src/utils/contrastGuard.ts` as a no-op compatibility module and add a static guard test so no MutationObserver / hover / scroll / focus contrast repaint engine can be reintroduced.
- Confirm no remaining contrast-related MutationObserver/event listener is changing foreground colors after load.

2. Replace the current conflicting CSS layers with one stable surface contract

- In `src/index.css`, remove the broad competing contrast blocks that force black/white/navy via class-name guessing, hover matching, `aria-*`, `data-active`, global nav/button selectors, and broad `!important` descendants.
- Replace them with a single final contract based on explicit semantic primitives only:
  - `.surface-dark`, `.surface-navy`, `[data-surface="dark|navy|ink"]` → white foreground/icons/strokes/placeholders in every state.
  - `.surface-light`, `.surface-cream`, `.surface-champagne`, `.surface-gold`, `.surface-pearl`, `[data-surface="page|light|cream|champagne|gold|pearl|raised"]` → ink/navy foreground/icons/strokes/placeholders in every state.
  - `.image-overlay-dark` → dark overlay with white foreground/icons/strokes.
  - `.glass-dark` → dark glass with white foreground/icons/strokes.
  - `.glass-light` → light glass with ink/navy foreground/icons/strokes.
  - `.cta-navy` / `.jj-cta-dark` → navy + white in idle/hover/focus/active/disabled.
  - `.cta-champagne` / `.jj-cta-champagne` → champagne + ink in idle/hover/focus/active/disabled.
  - `.cta-outline-light` / `.jj-cta-outline` → light/transparent + ink.
  - `.cta-outline-dark` → transparent on dark + white.
- Preserve brand constraints: no gold fills, champagne palette, navy CTA, price orange, semantic data colors, AI purple.

3. Refactor reusable primitives instead of individual visible buttons

- Update `Surface` to emit both `data-surface` and the matching `.surface-*` class, with correct light/dark foreground tokens.
- Update `Button` variants to use only the stable CTA primitive classes; remove variants that switch text color on hover.
- Update `Badge`, `Tabs`, and `IconTile` to declare stable own-surface contracts.
- Ensure child `svg`, Lucide icons, labels, counters, placeholders, and text inherit from the primitive, not from page-level guesswork.

4. Explicitly contract the affected templates/components

Apply stable surface classes to reusable templates only, not one-off screenshots:

- Homepage hero search block and hero CTAs.
- Get Verified banner/button.
- Floating Contact Us and Web Developer widgets.
- Cookie banner and its buttons.
- Property cards, recently viewed cards, handover/date/status chips, and image overlay content.
- Guide/book covers and guide tiles.
- Broker portal preview/mockup cards.
- Careers/JBJ visual cards.
- Any generated card/overlay primitives used by those sections.

5. Strengthen regression checks

- Update `scripts/contrast/*` to fail on:
  - runtime contrast guard installation or MutationObserver color repainting,
  - broad global `color: ... !important` selectors that target generic `button`, `a`, `span`, `div`, `nav`, `[aria-*]`, `[data-active]`, or hover class-name matching,
  - white-on-light or dark-on-dark in reusable primitives/templates,
  - image/overlay cards missing `.image-overlay-dark`, `.glass-dark`, or explicit `data-surface`.

6. Visual validation before calling it done

After implementation, use the live preview on desktop and mobile and verify each target in idle, hover/focus, after scroll, and after waiting 5 seconds:

- Homepage top hero.
- Homepage search bar, including Search button.
- Get Verified banner/button.
- Floating Contact Us and Web Developer widgets.
- Recently viewed/property cards and overlay chips.
- Guide/book carousel and cover titles.
- Broker portal homepage visual card.
- Careers/JBJ visual card.
- Cookie banner/buttons.

Completion criteria:

- Zero text/icon blinking or black↔white flipping.
- No readable state depends on hover, scroll, or delayed repaint.
- Dark/navy/image-overlay surfaces stay white foreground.
- Champagne/cream/pearl/gold/light surfaces stay dark foreground.
- Provide screenshots/observations from multiple pages/states before saying complete.