## Goal
Fix the project page so the broker tools no longer cover or cheapen the hero, remove the broken presentation editor experience entirely, and make “Generate branded presentation” a direct automatic download flow instead of sending users to `/presentations`.

## Plan
1. **Remove the broken presentation editor route**
   - Remove the public `/presentations` route from the app.
   - Remove the lazy import for `Presentations` in public routes.
   - Any direct visit to `/presentations` will no longer open the broken editor; I will redirect it to a safe existing page or remove the route so the broken screen is inaccessible.

2. **Remove the large rectangular broker tools card from the hero**
   - Delete the current `<BrokerBrandedMaterialsCard />` placement under the hero CTAs because it hides the hero and creates the faded-title issue shown in your screenshot.
   - Keep the existing hero actions only: **Download Brochure** and **Register Interest**.
   - Do not add “Add Application”.

3. **Replace broker presentation generation with a direct download action**
   - Add a compact broker-only action near the existing brochure/register buttons, not as a large card.
   - Clicking **Generate branded presentation** will not navigate anywhere.
   - It will trigger an automatic export/download flow with fixed JBJ standard colors and branding; users cannot change colors/templates/fonts.
   - If broker logo/photo is missing, show a small premium inline notice or toast pointing to **Edit my brand**, without covering the hero.

4. **Clean broken presentation entry points**
   - Remove or redirect visible links to the old presentation editor from places like AI Hub, footer, command palette, and owner AI tools where they point to `/presentations`.
   - Keep other document/presentation export logic elsewhere only if it does not open the broken editor.

5. **Visual and technical validation**
   - Re-open the project page in broker mode.
   - Confirm the hero is not hidden by a rectangle.
   - Confirm titles/buttons are high-contrast and not faded.
   - Confirm only intended actions appear: Download Brochure, Register Interest, and the compact direct branded presentation download if broker mode applies.
   - Confirm `/presentations` no longer opens the broken “Untitled Presentation” editor.

## Files expected to change
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/project-detail/BrokerBrandedMaterialsCard.tsx` or remove its usage
- `src/routes/PublicRoutes.tsx`
- Any visible navigation/tool entries that link to `/presentations`