## Plan

### 1) Make one premium Documents & Agreements hub
- Make `/e-signature` and `/owner/documents/forms` use the same unified hub instead of two different dashboards.
- Keep existing features; reorganize them into clear sections: Templates, Blank Letter AI, Upload & Sign, Signature/Stamp Assets, Generated Forms, Pending Signature, Signed, Recently Deleted.
- Add canonical redirects/links so sidebar items, dashboard buttons, and detail pages do not send the user to mismatched front-end/back-end views.
- Keep `/owner/documents` as the document designer, but add a direct handoff into the unified Forms & Agreements hub.

### 2) Fix Blank Letter Studio immediately
- Replace the `Body (HTML)` code textarea with a normal plain-text editor.
- Convert AI output to `body_text`, not visible HTML code, while keeping legacy HTML readable for old saved documents.
- Default signer title to `Founder & CEO`.
- Keep the document date editable and visible as a normal editable field.
- Ensure preview/export are always true A4 dimensions.
- Remove office location from the letterhead header and keep it only in the footer.
- Keep email and website links in gold.
- Improve letter spacing/padding: salutation, body paragraphs, closing, signature line, and stamp area.

### 3) Fix signature and stamp asset persistence
- When a signature/stamp image is uploaded from Blank Letter Studio or Signature Studio, save it by default to `owner_signature_assets` and also mirror it into `brand_assets` so the Brand Assets picker no longer says “none yet”.
- Show saved thumbnails immediately after upload without needing a reload.
- Support multiple saved signatures/stamps with default selection.
- Add delete/default controls where assets are shown.

### 4) Make signatures/stamps editable on the document preview
- Add a proper overlay in Blank Letter Studio for signature and stamp placement.
- Signature defaults to bottom-left above a line; stamp defaults to bottom-right.
- User can drag/move, remove with X, reset to standard placement, and choose which saved signature/stamp to use.
- Persist placement in `template_field_values` so saved envelopes/exported PDFs match the preview.

### 5) Upgrade the AI document generation function
- Update `letter-ai-generate` prompt and response format to behave like a UAE business/legal document drafter.
- Return structured plain text: subject, recipient, body text, suggested date/title/category, and optional pages if needed.
- Use a stronger supported Lovable AI model for higher-quality contract/job-offer drafting.
- Add validation/cleanup so the UI never receives markdown fences or raw code.
- Redeploy the updated function after changes.

### 6) Improve templates and live previews
- Add Blank Letter AI into the Forms & Agreements templates area.
- Add live preview buttons for the four core JBJ templates/letterheads.
- Organize templates with titles, filters, categories, and status counts.
- Preserve existing PAA leasing/selling templates and do not remove current workflow features.

### 7) Wire documents to email and employee/job-offer workflows
- Reuse the existing e-signature email composer for generated letters and uploaded contracts.
- For job-offer letters, store enough metadata/category to surface them in the employee/HR workflow and track draft/sent/signed status.
- Auto-sync entered client/recipient name/email into the document body generation and email composer.

### 8) Multi-page support
- Surface the existing page editor more prominently for A4 PDFs: add/merge pages, duplicate, delete, rearrange, rotate.
- Ensure generated multi-page AI letters/contracts can be saved as envelopes with correct page count.
- Keep field/signature placement stable when pages are rearranged.

### 9) Verification
- Test the three entry points: `/owner/documents`, `/owner/documents/forms`, `/e-signature`.
- Test upload signature/stamp -> appears in saved assets -> place on blank letter -> drag/reset/delete -> save/export.
- Test AI blank letter generation, normal text editing, A4 PDF export, and send-via-email handoff.
- Test responsive layout at desktop and mobile widths.

## Technical notes
- Primary files: `BlankLetterStudio.tsx`, `jbjBlankLetter.ts`, `letterheadChrome.ts`, `useOwnerSignatureAssets.ts`, `DocumentsFormsHub.tsx`, e-signature routes, and `letter-ai-generate`.
- Existing `DocumentEditor.tsx` already supports reorder/delete/duplicate/merge; I’ll integrate it into the unified flow instead of rebuilding it.
- No existing document/e-signature feature will be removed; this is a merge and repair pass.