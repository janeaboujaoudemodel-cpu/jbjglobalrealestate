Implement the Smart Listing Creator (`List with AI`) so it visually follows the same structure as the Manual Listing page shown in the reference screenshot.

Plan:

1. Rebuild the AI page shell to match Manual Listing
- Keep the top soft purple ombre intro area.
- Replace the current rounded purple container layout with the Manual page structure:
  - light ombre intro/header section
  - full-width dark purple section below
  - horizontal step header directly on the dark section
  - centered smaller light ombre card for the active phase
- Preserve AI purple identity, but apply it using the same Manual layout rules.

2. Convert AI progress into Manual-style step header
- Replace the current thin progress bars inside the white card.
- Use circular phase icons and labels across the dark purple band, matching Manual Listing spacing and behavior.
- Active phase: bright purple circle with white icon/text.
- Completed/inactive phases: muted white outlines/text on dark purple.

3. Make each AI phase render as one centered “screen” card
- The upload phase will become the first small card, similar to “Seller Details”.
- Inside it: listing type, upload documents, paste link, paste text, and the Extract/Skip buttons.
- Other phases (`AI Extract`, `Price Predictor`, `Review & Edit`, `Pricing & Role`, `Submit`) will remain functionally the same but sit inside the same centered light ombre card layout.
- Keep next/back transitions using the existing phase state; no long stacked page layout.

4. Preserve existing AI functionality
- Do not remove upload, link extraction, paste text, AI extraction, price predictor, review/edit, pricing role, approval, or submit logic.
- Only restructure and restyle the presentation layer.

5. Fix contrast and hover issues in the AI flow
- Ensure Back to Portal arrow/text stays white on the purple dark band.
- Ensure Extract with AI remains purple ombre with white text/icons.
- Ensure Skip — Fill Manually hover becomes filled purple with white text, not black.
- Remove any remaining gold/champagne borders inside the AI wizard that clash with the purple page.

6. Visual validation
- After implementation, open `/list-property?purpose=rent&mode=ai` and `/list-property?purpose=sale&mode=ai`.
- Take desktop screenshots and compare against the Manual Listing reference: dark band, horizontal step header, centered phase card, no cropped gaps, readable text/buttons.
- If screenshots show layout/contrast problems, fix them before reporting completion.

Technical files expected:
- `src/pages/ListingPortalSubmit.tsx` for the Smart Listing Creator layout and AI phase cards.
- `src/index.css` only if a small reusable purple step/button utility is needed; otherwise keep changes inside the component.