Plan to fix this properly:

1. Correct the navigation and routing
- Replace the separate sidebar entries with one owner sidebar entry: `Forms & Agreements`.
- Stop `/owner/documents` from opening the old standalone Documents editor page.
- Make `/owner/documents` render the unified Forms & Agreements hub with a `Documents` section selected.
- Stop `/e-signature` from using a redirect.
- Make `/e-signature` render the unified hub directly with the `E-signature` section selected, so the URL does not bounce to `/owner/documents/forms`.
- Keep existing deep links working by rendering the right hub section rather than sending the user through slow redirect chains.

2. Restructure the hub as the single home for all three tools
- Add clear top-level sections inside `/owner/documents/forms`:
  - Templates
  - Documents
  - E-signature
  - Drafts / Generated
  - Pending Signature
  - Submitted / Review
  - Signed
  - Recently Deleted
  - Stamps & Signatures
- Move the old document editor access into the `Documents` section, not as a separate sidebar page.
- Move e-signature creation, sent envelopes, signature assets, and signed documents into the `E-signature` section, not as a redirected separate page.
- Keep all existing functionality; do not delete existing document/editor/e-signature capabilities.

3. Restore the standard blank letter as a normal template
- Add the blank JBJ letterhead as the first template card in the Templates section.
- Rename it away from `AI Blank Page` / `Blank Letter AI`; use a normal premium label like `Standard JBJ Letterhead`.
- It should sit next to the other templates and open the branded letter studio/template workflow.
- Keep AI generation available inside the tool, but do not label the template itself as AI.

4. Fix the blank letter workflow details that are still broken
- Ensure uploaded signatures/stamps immediately appear in the saved brand assets list.
- Ensure uploaded signature/stamp can be selected, made default, deleted, and reused.
- Ensure placed signature and stamp are draggable on the A4 preview.
- Keep the signature line on the lower-left with `Founder & CEO` by default.
- Keep the stamp on the lower-right by default.
- Keep the document date editable.
- Keep the body as normal typed text, not HTML/code.
- Preserve proper spacing between greeting, body, and closing.

5. Improve e-signature loading behavior
- Remove unnecessary redirect hops from `/e-signature` and old e-signature entry points.
- Avoid loading heavy e-signature pages unless the active hub section actually needs them.
- Keep envelope detail/create/signature-studio routes available, but make them part of the hub flow.

6. Visual QA and approval screenshots
- After implementation, I will open the live preview and capture/verify screenshots for:
  - Owner sidebar showing the corrected single `Forms & Agreements` entry.
  - `/owner/documents/forms` hub with the new section layout.
  - `/owner/documents` rendering the integrated Documents section.
  - `/e-signature` rendering the integrated E-signature section without redirecting.
  - Templates section showing `Standard JBJ Letterhead` first.
  - Letter preview showing A4 layout, editable date, signature line left, stamp right.

7. End-to-end audit tests
- Test route behavior for `/owner/documents`, `/owner/documents/forms`, and `/e-signature`.
- Test template visibility and opening the standard letterhead template.
- Test signature/stamp asset display from the hub.
- Test that the blank letter body remains plain text and the rendered preview is formatted.
- Check console/network for new errors after the flow.

Technical notes
- Files likely involved: `OwnerSidebarNav.tsx`, `OwnerRoutes.tsx`, `AdminRoutes.tsx`, `DocumentsFormsHub.tsx`, `BlankLetterStudio.tsx`, `useOwnerSignatureAssets.ts`, and possibly `useEsignTemplates.ts` / template seed handling if the standard letterhead template is missing from the backend.
- I will not remove features; I will embed or route them into the unified hub and preserve legacy URLs by rendering the hub directly instead of redirecting.