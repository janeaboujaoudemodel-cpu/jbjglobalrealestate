## Plan

1. **Stop the e-signature page blinking**
   - Fix the owner/auth verification race that is causing `/e-signature/:id` to alternate between the document page and the black “Verifying access…” screen.
   - Keep already-verified owner sessions rendered while background verification refreshes, instead of replacing the page with the splash.

2. **Restore the PAA header layout exactly as requested**
   - Keep the enlarged monogram.
   - Put the company legal name above “Property Advertising Agreement”.
   - Keep both inside the header area.
   - Put the gold horizontal divider after the header/title block, not separating the title into the body.
   - Preserve the rest of the document body layout.

3. **Fix the footer contact layout**
   - Put the phone on the left.
   - Put the website underneath the phone in gold.
   - Keep the contact email separate with clear spacing, not on the same line as the website.
   - Keep office/location details clean with no Dubai Chamber/CR details.

4. **Make restored fields visible and obvious**
   - When removed fields are restored, track which field names were restored.
   - Show a small restored-fields notice in the editor and highlight those restored fields in the preview so it is clear what came back.

5. **Fix Edit Fields saving**
   - Ensure “Edit fields” → changes → “Save & re-render” always persists `template_field_values` and regenerated PDF metadata.
   - Preserve changed values such as `exclusivity = EXCLUSIVE` and prevent it from reverting to the previous stored value after refresh/re-render.
   - Add stronger error handling so a failed save is shown clearly instead of silently reverting.