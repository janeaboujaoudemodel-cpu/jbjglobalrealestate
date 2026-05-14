I found the concrete breakage: the Omar envelope is stored with `template_key = jbj-letterhead-leasing`, so the app is rendering it as a blank letterhead instead of the approved PAA template. The uploaded PDF is the source of truth for the approved PAA layout.

Plan:

1. Restore the approved PAA leasing template
   - Rebuild `JBJ PAA Leasing` HTML to match the uploaded approved PDF exactly:
     - Header: JBJ monogram, legal company name, Port Saeed office line, doc number and contact stack.
     - Title: `PROPERTY ADVERTISING AGREEMENT — LEASING`.
     - Sections exactly as uploaded: `1. Landlord / Owner Details`, `3. Property Specs`, `4. Pricing & Lease Terms`, `7. Terms and Conditions`, `8. Landlord`.
     - Same compact underline field layout, same one-page A4 proportions, same footer.
   - Keep the existing editable field keys so every client can still have different values.
   - Do not replace the PAA with blank-letterhead logic again.

2. Repair the broken Omar envelope data
   - Correct the existing envelope `810df24a-145b-48f2-8e5a-f18e44e0c576` from `jbj-letterhead-leasing` back to the real PAA template key.
   - Re-render its current field values into the restored approved PAA HTML/PDF.
   - Preserve current client data, recipients, status, document number, audit data, and signing links.

3. Fix Edit Fields behavior
   - Move the edit-fields panel above the document preview, directly under the action/header area.
   - When `Edit fields` is clicked, open the fields immediately in the visible top area and focus/scroll to them.
   - Keep every PAA field editable using the same field groups; no missing fields.

4. Fix EnvelopeDetail layout and preview width
   - Remove the right-side vertical rail layout.
   - Put Recipients, CCs, Details, Customize header/footer, Signed document, Listing Draft, and Activity Log above the document in a full-width responsive control band.
   - Make the document preview full width below those controls.
   - Use an A4 iframe/preview wrapper with proper scrolling only when needed, not a clipped fixed-height blank panel.

5. Finish remaining Documents & Forms tasks
   - New Envelope opens an in-page template picker, not upload/sign directly.
   - Embed the document editor and e-sign tools as inline tabs/surfaces inside Documents & Forms instead of sending the user away to separate pages.
   - Add full Manage dropdown actions for saved signatures/stamps: set default, replace image, rename, archive, delete, upload new.

6. Rework BlankLetterStudio layout
   - Top toolbar: back, document number/date, save/send/download controls.
   - Centered A4 preview scaled to fit the viewport.
   - Move inputs/assets into a compact top toolbar or collapsible panels around the preview.
   - Remove the old left/right split and avoid scroll-heavy layout.

7. Confirm AI model bump
   - Verify `paa-ai-copilot` and `ai-contract-reviewer` remain on `google/gemini-2.5-pro`.
   - If either regressed, update only the model identifier.

8. QA before saying done
   - Open `/owner/documents/forms/810df24a-145b-48f2-8e5a-f18e44e0c576` and compare the visible preview against the uploaded approved PDF.
   - Click `Edit fields` and verify fields open immediately above the document.
   - Verify the document is full-width with top control bands, not a vertical recipient/details rail.
   - Verify New Envelope picker, asset Manage actions, BlankLetterStudio A4 fit, and inline editor/e-sign surfaces.