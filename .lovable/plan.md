## What is actually breaking now

The screenshot confirms the damage is not the Apply button anymore. The broken text is inside the champagne job cards on `/join`: titles, metadata, descriptions, badge labels, and footer copy are rendering white over the light champagne card.

The likely winning conflict is in `src/styles/theme-tokens.css`, not a missing component class:

- `.careers-card-navy` is a dark/navy parent section.
- It still has broad descendant rules around that section, especially:
  - `[data-careers-page] .careers-card-navy > :not(.careers-card-strong) :is(...) { color: #FFFFFF; -webkit-text-fill-color: #FFFFFF; }`
  - `.careers-white *`, `.careers-gold *`, `.careers-navy *`, `.allow-white`, and duplicate end-of-file hard override blocks.
- Because job cards are nested below `CardContent`/grid wrappers, the `> :not(.careers-card-strong)` selector can still match descendants inside the job cards. That means the navy-section rule is wrongly painting nested champagne card text white.
- The later `.careers-card-strong { color: ink }` inheritance is not enough because child elements have their own Tailwind text classes and/or inherited `-webkit-text-fill-color`, so white still wins visually.

## Surgical fix plan

1. **Remove/narrow only the winning broad careers selectors**
   - In `src/styles/theme-tokens.css`, replace the navy-section descendant selector with a scope that targets only the Open Positions header/search chrome, not the job card grid.
   - Remove duplicate broad hard overrides at the end of the file that use `.allow-white` / generic descendants and can leak into light cards.
   - Keep the existing primitives only:
     - dark/navy buttons (`.careers-navy-cta`, `.jj-cta-dark`) = navy background + white text/icons, normal and hover.
     - champagne job cards (`.careers-card-strong`) = ink/navy text/icons, normal and hover.
     - explicitly dark badges (Featured) = navy background + white text/icons.

2. **Make the job card surface declare its own contrast locally**
   - In `PremiumJobCard.tsx`, mark the card as its own champagne surface (`data-surface="champagne"`) so parent dark-section rules should not treat it as part of the navy surface.
   - Remove unnecessary `allow-white`/inline white styling except on the true dark Featured badge and true dark selected icon tile.
   - Do not add new visual styles; only restore intended text classes already present in the component.

3. **Clean the `/join` button/link local misuse**
   - Fix the Sign In/Create Account child link that currently adds `text-white` inside a champagne default button. It should not force white text on a champagne CTA.
   - Keep actual navy CTAs white via the existing `.jj-cta-dark` / `.careers-navy-cta` primitives.

4. **Audit for the same conflict pattern in current contrast architecture**
   - Check `src/index.css` and `src/styles/theme-tokens.css` for remaining broad selectors that repaint all `span`, `div`, `*`, or nested descendants on a parent surface.
   - Only remove/narrow selectors that can override nested own-surfaces. Do not add a new global CSS system.

5. **Visual validation before claiming complete**
   - Use browser screenshots, not guesses, after the patch:
     - `/join` at the job cards: normal state and hover over one card/button.
     - `/join` hero/top: navy description panel and dark buttons remain white-on-navy.
     - `/owner`: sidebar Sign Out and expanded shell remain readable.
     - `/` and one marketing page: no obvious regression.
   - Confirm computed colors for visible problem elements:
     - champagne/gold/light backgrounds: ink/navy text/icons.
     - navy/dark backgrounds and dark CTA buttons: white text/icons.

## Files to change

- `src/styles/theme-tokens.css`
- `src/components/careers/PremiumJobCard.tsx`
- `src/pages/JoinApplication.tsx`
- `src/index.css` only if the audit finds another broad winning selector that must be narrowed, not expanded.