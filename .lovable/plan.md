I found the remaining contrast conflicts and will fix them in the global system rather than patching only one visible page.

Plan:

1. Clean the final CSS contrast contract in `src/index.css`
   - Stop treating `data-no-contrast-guard`, `allow-white`, and `data-allow-dark-cta` as blanket permission to escape contrast.
   - Make the contract surface-aware:
     - Light/champagne/gold/white own-surface always forces ink text/icons.
     - Dark/black/navy/ink own-surface always forces white text/icons.
     - Nested own-surfaces override the parent correctly.
   - Add explicit protection for inline dark gradients and inline light backgrounds, because these are where the current selector gap remains.

2. Fix the confirmed `/list-property` failures
   - The segmented listing pills currently use `data-no-contrast-guard` and inline styles, so the inactive white buttons can keep white text and active dark-gradient chooser cards can inherit ink.
   - Remove the unnecessary escape flags from the segmented pills/cards or add correct `data-surface`/CTA markers so the global rule can classify them correctly.
   - Ensure active dark-gradient cards/buttons render white and inactive white cards/buttons render ink/deep accent.

3. Fix the welcome guide modal contrast leak
   - The modal visually showed white text on a light champagne/white card even though the DOM intended ink.
   - Mark the modal card as a light surface and remove/neutralize any inherited hero/dark text-fill leakage.
   - Keep the “Start the quick tour” button as a true dark CTA with white text/icons.

4. Harden the automated visual scanner
   - Add the important routes to the default scan list, not only `/` and `/founder`.
   - Make the scanner catch the exact cases now seen: white text-fill on light modal/card surfaces, black text-fill on dark gradients, and SVG stroke/fill polarity failures.

5. Validate visually before reporting done
   - Re-run the architecture guard.
   - Re-run the rendered contrast scan across: `/`, `/properties`, `/developers`, `/market-intelligence`, `/market-report`, `/guides`, `/faq`, `/list-property`, `/tools`, `/owner`, `/owner/crm`, `/admin`, `/compare`, `/document-studio`.
   - Use browser screenshots/inspection for `/` welcome modal and `/list-property` because those are confirmed visual failures.
   - I will only report fixed if the rendered checks pass; if an authenticated route cannot be fully inspected, I will state that clearly.