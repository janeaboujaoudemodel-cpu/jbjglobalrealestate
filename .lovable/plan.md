You are right: it is not fixed, and I should not have said it was fixed without visually validating the affected pages.

Clear answer:

1. The screenshot proves the issue is still active on `/join`: navy/blue icon tiles are rendering black/dark icons.
2. The cause is not one component only. The conflict is CSS infrastructure:
   - `src/styles/theme-tokens.css` has repeated careers-page rules that repaint SVGs inside `.careers-card-navy .careers-card-strong` to navy/dark unless `.allow-white` is present.
   - Some dark/navy icon boxes, like the contact cards, are not using the locked CTA/IconTile primitive, so they can still be caught by the wrong SVG repaint rule.
   - `src/index.css` still has the marketing-page dark-section remap at lines 1021–1023, but it only changes section background; it does not correctly solve nested foreground ownership. Per your instruction, this winning rule should be removed, not expanded.
3. The previous fix was incomplete because it changed some visible instances instead of removing the conflicting cascade pattern globally and then validating across the page.

Plan to fix cleanly:

1. Remove the wrong winning rule
   - Delete the `[data-marketing-page] section[class~="bg-[#1A1A1A]"]` background remap from `src/index.css`.
   - Do not replace it with another broad descendant repaint sweep.

2. Fix the global dark-surface contract once
   - Extend the existing final primitive/surface contract in `src/index.css` so elements explicitly marked as dark/navy/ink surfaces keep white text/icons:
     - `.surface-navy`, `.surface-ink`, `.surface-dark`
     - `[data-surface="navy"]`, `[data-surface="ink"]`, `[data-surface="dark"]`
     - `[data-allow-dark-cta]`, `[data-no-contrast-guard].allow-white`
   - Scope it only to explicit own-surface elements, not every nested descendant on the page.

3. Clean the duplicate conflicting careers CSS
   - In `src/styles/theme-tokens.css`, remove the duplicate `svg:not(.allow-white)` navy repaint blocks that are overriding white icons.
   - Keep form/input rules and phone-code trigger rules that are already correct.
   - Keep `.careers-navy-cta` white foreground lock, but make it consistent with the global primitive instead of competing with it.

4. Fix the visible `/join` contact cards at the source
   - Update `CareersContactBlock` icon boxes to use the existing `IconTile` primitive or mark them as explicit navy/dark icon surfaces.
   - This prevents black icons on blue tiles without adding a new CSS system.

5. Technical validation after implementation
   - Use browser inspection on `/join` to verify computed styles for the failing elements:
     - contact-card icon tile background = navy/blue
     - SVG color/stroke = white
     - Continue button arrow color/stroke = white
     - phone-code trigger text/chevron = white
   - Search the codebase for remaining conflicting selectors like `svg:not(.allow-white)` and broad `text-white`/dark background mismatches.

6. Visual validation after implementation
   - Navigate as a user and take screenshots/inspect sections on the pages already implicated:
     - `/join`
     - `/about`
     - `/contact`
     - `/founder`
     - `/ai-hub`
   - Check visible sections for dark-on-dark or white-on-light failures before reporting completion.

I will not claim “fixed” unless the computed styles and screenshots confirm it.