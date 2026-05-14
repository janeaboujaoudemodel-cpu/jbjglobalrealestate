I found the current breakage in the frontend layout/rendering code:

- `BlankLetterStudio` still uses a left editor + right preview grid, so the A4 preview is squeezed off-screen instead of centered.
- The preview scale uses CSS `scale(min(...))`, which is fragile and leaves the document clipped at this viewport.
- Signature/stamp custom placement overlays are independent boxes on top of the preview and can overlap/break when uploaded or dragged.
- `buildBlankLetterHtml` pins the signature/stamp near the bottom instead of placing them intelligently based on body length.
- `EnvelopeDetail` top sections are expanded cards, not minimized accordions, and the edit panel has no clear minimize/collapse control or top/down navigation.

Plan:

1. Rework `BlankLetterStudio` into a centered A4 workspace
   - Make the A4 letter preview the central hero area.
   - Move AI prompt, subject/body fields, and signature/stamp controls into a compact top/header frame around the preview instead of a left column that shrinks the page.
   - Give the preview its own scrollable centered canvas so the page is always visible and horizontally centered.
   - Replace the fragile CSS `scale(min(...))` with a stable React-calculated scale based on the preview container width/height.

2. Fix stamp/signature controls in the letterhead studio
   - Stop showing overlapping preview overlays by default.
   - Keep uploaded signature/stamp assets in compact rows/cards in the header controls.
   - Only show placement handles when the user explicitly enters custom placement mode.
   - Clamp placement coordinates so handles cannot fall over the footer or outside the A4 page.
   - Add reset behavior that returns to smart automatic placement.

3. Make blank letter signature/stamp placement smart
   - Update the blank letter template so the signature/stamp block sits immediately after the body when content is short.
   - If content grows, allow the block to move lower naturally while keeping safe spacing above the footer.
   - Remove the large forced blank body area that pushes the signature/stamp down near the footer for short letters.
   - Keep final PDF rendering consistent with the visible preview.

4. Minimize EnvelopeDetail control sections by default
   - Convert Recipients & CCs, Details, Signed Document/Activity Log, and Listing Draft into compact collapsible sections above the document.
   - Default them to collapsed/minimized so the document starts higher.
   - Preserve all existing controls/content inside each section when expanded.
   - Keep Activity Log and Listing Draft minimized by default, including for signed documents.

5. Fix Edit Fields panel behavior in EnvelopeDetail
   - Keep `Edit fields` above the document, but make it a collapsible/minimizable panel with a visible minimize button.
   - When `Edit fields` is clicked, open it and scroll/focus to the panel.
   - Add `Go to Top` and `Go Down` buttons near the document/editor controls for fast navigation.
   - Ensure fields remain editable and visible; do not remove PAA fields.

6. Verify the affected routes
   - Check `/owner/documents/forms/blank-letter` at the current 1041×891 viewport for centered A4 preview and scrollability.
   - Check `/owner/documents/forms/810df24a-145b-48f2-8e5a-f18e44e0c576` for minimized top panels, full-width document, edit panel collapse, and top/down buttons.
   - Confirm the PAA template content remains routed to the approved PAA rendering and is not replaced by blank letterhead logic.

Important constraint: I will not delete or rewrite the approved PAA document content; this plan only fixes the layout, controls, preview visibility, and smart placement behavior.