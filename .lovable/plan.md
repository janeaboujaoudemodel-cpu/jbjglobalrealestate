# Exportable Property Advertising Agreement

Currently `EnvelopeDetail.tsx` exposes a single "Download PDF" button. Replace it with a flexible export dialog that lets you tick what you want and share to the client.

## UX

Replace the single "Download PDF" button with a split control:

- Primary button: **Download PDF** (one click, default behaviour — most common path).
- Adjacent button: **Export…** opens a champagne-themed dialog.

### Export dialog contents

Checkbox list (all default-checked = PDF only; user can tick more):

- [x] PDF document (`.pdf`) — default, always available
- [ ] Page images (`.png`, one per page) — high-res 2x render
- [ ] Single long image (`.jpg`) — vertical strip of all pages, easy WhatsApp share
- [ ] ZIP bundle — when 2+ formats selected, auto-bundle as `JBJ-PAA-<doc_number>.zip`

Below the checkboxes:

- Quality selector for image exports: Standard (1.5x) / High (2x) / Ultra (3x)
- "Include audit certificate (if signed)" toggle — appended into PDF/ZIP
- Filename preview (auto-built from `doc_number` + `landlord_name`)

Footer actions:

- **Download** — triggers the selected formats
- **Share to client** — opens a small share sheet:
  - Copy public download link (signed Supabase storage URL, 24h)
  - WhatsApp (pre-filled message + link)
  - Email (uses existing `SendForSignatureDialog` plumbing but in "share copy" mode — no signing request)

## Technical

### New file: `src/components/e-signature/ExportEnvelopeDialog.tsx`

- Uses `pdfjs-dist` (already a transitive dep via existing PDF preview) to rasterise pages of `envelope.document_url` to canvases at requested DPR.
- PNG export: each canvas → `toBlob('image/png')` → individual files.
- Long JPG: stitch all page canvases vertically onto one canvas → `toBlob('image/jpeg', 0.92)`.
- ZIP: use `jszip` (lightweight, add as dep if not present) when multiple formats are checked.
- PDF: just fetch the existing `document_url` (or signed PDF if status = completed) — no re-render.
- Saves via `file-saver` or a small anchor-click helper consistent with existing `handleDownload`.

### Edit: `src/pages/e-signature/EnvelopeDetail.tsx`

- Import the new dialog, add state `exportOpen`.
- Replace toolbar buttons with: `Download PDF` (existing one-click) + `Export…` (opens dialog).
- In the signed-document footer, also add the same `Export…` to the signed PDF.

### Share helpers

- Add `buildShareLink(envelope)` util that returns `https://jbj.ae/sign/<id>` for unsigned, or a 24h signed storage URL for the signed PDF.
- WhatsApp message template (editable later, defaults to):
  > "Hello {{landlord_name}}, please find attached the Property Advertising Agreement {{doc_number}} from JBJ Global Real Estate. {{link}}"

### No backend/schema changes

All export work is client-side from the already-stored `document_url`. No migration, no new edge function. Status, audit, and signature flows are untouched.

## Out of scope

- Re-rendering the PDF on export (already handled by existing `PAA_LAYOUT_VERSION` auto-rerender).
- Changes to template content, signature flow, or `SendForSignatureDialog`.
- New permissions / RLS work.
