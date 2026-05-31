## Diagnosis

The screenshot confirms the broken area is not a missing local class. The winning rule is the final global `RULE A — dark/navy/ink own boxes` in `src/index.css`.

Why it is winning:
- `/founder` wraps large champagne cards inside parent sections with `bg-[#1A1A1A]`.
- Rule A treats any ancestor with `bg-[#1A1A1A]` as a dark surface and forces all descendant text/icons to white with `!important`.
- Its nested exclusion only detects light descendants if they have explicit markers like `data-surface="champagne"`, `.surface-*`, or exact raw classes such as `bg-[#FDFBF7]`.
- The Founder page’s champagne panels mostly use gradients like `from-champagne-light via-champagne to-champagne-dark` and classes like `jj-layer-2`, `jj-layer-active`, `jj-card-inner`, so Rule A does not recognize them as light surfaces and overrides their ink text to white.
- This means the architecture is still ancestor-driven instead of own-surface-driven.

## Plan

1. **Fix the contract selector, not the symptom**
   - In `src/index.css`, change the final contrast contract so dark Rule A does not repaint descendants inside known light/champagne containers.
   - Add the missing light-surface primitives to the Rule A exclusion list: `.jj-layer-2`, `.jj-layer-active`, `.jj-card-inner`, champagne gradient utility combinations, and existing light token surfaces.
   - Keep Rule B responsible for ink text on those light containers.

2. **Mark Founder champagne panels as light surfaces where necessary**
   - In `src/pages/Founder.tsx`, add `data-surface="champagne"` only to the actual champagne/gold cards and panels that currently sit under dark parent sections.
   - Fix the few dark icon tiles that currently contain `text-[#1A1A1A]` icons on `bg-[#1A1A1A]` so icons are white on dark tiles.
   - Do not change layout, content, background design, photos, or section structure.

3. **Remove remaining conflicting foreground locks in token CSS**
   - In `src/styles/theme-tokens.css`, remove broad `-webkit-text-fill-color` / `color` locks that are not component-specific and can override hover/idle text unexpectedly.
   - Preserve legitimate scoped controls: form fields, disabled placeholders, and explicit navy button states.

4. **Add a targeted audit script output for the real failure**
   - Use existing contrast scripts plus a focused source audit for “light/champagne card under dark parent without `data-surface`”.
   - This catches exactly the conflict in the screenshot instead of only counting generic white-on-light classes.

5. **Verify idle and hover states**
   - Check `/founder` at the user’s viewport.
   - Verify the visible Founder profile text, bio card, role cards, governance cards, regulatory card, CTA buttons, sidebar buttons, and hover states.
   - Confirm: champagne/gold surfaces render ink text/icons; navy/ink boxes render white text/icons; gold accents remain gold hairlines/text where intended.

## Boundaries

- No new broad `!important` repaint sweep.
- No runtime contrast guard.
- No feature/content removal.
- No changes to backend or business logic.
- Keep the design champagne/gold with ink text, not white-on-champagne.