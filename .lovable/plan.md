## Continuing: Unified Documents & Agreements Hub

Picking up from the Blank Letter Studio fixes. Next pass focuses on merging the three fragmented entry points into a single premium experience and finishing the asset/email plumbing.

### 1. Single hub at `/owner/documents/forms`
- Make this the canonical route. Redirect `/e-signature` and `/owner/documents` (designer) into it as sub-tabs, preserving all existing deep links.
- Sub-tabs (sticky champagne header, gold hairline underline on active, ink text — no gold fills):
  - Overview (counts: Drafts / Pending / Signed / Templates)
  - Templates (JBJ letterhead, Leasing PAA, Selling PAA, Job Offer, Blank Letter AI)
  - Blank Letter Studio
  - Upload & Send for Signature
  - Brand Assets (signatures, stamps, initials)
  - Pending Signature / Signed / Recently Deleted
- Keep every existing card, button, table, and edge-function call — this is a re-layout, not a rewrite (No Removal policy).

### 2. Brand Assets panel (fix "none yet")
- New `BrandAssetsPanel` component reading from `owner_signature_assets` via `useOwnerSignatureAssets`.
- Thumbnail grid with: set default, rename, delete, upload new (signature / stamp / initials).
- Mirror on save into `brand_assets` so the existing Brand Assets picker elsewhere stops showing "none yet".
- Optimistic insert + `qc.invalidateQueries` so uploads appear without refresh.

### 3. Blank Letter polish
- Tighten the "Agreement — Leasing" style dash row: replace ad-hoc `—` separators with a single `<AdaptiveHairline />` between meta fields.
- Auto-save subject/body/date on every keystroke (debounced 600ms) into `template_field_values`, not only on send.
- Persist signature/stamp drag positions to `template_field_values.placement` so export matches preview.

### 4. Email composer handoff
- Single `openEmailComposer({ envelopeId, pdfBlob, recipient })` helper used by Blank Letter, Templates, and Upload flows so the same `SendViaEmailDialog` is reused everywhere.
- Locked-send pipeline already in place — just route all three entry points through it.

### 5. Edge function deploys
- Redeploy `letter-ai-generate` (already updated to gemini-2.5-pro structured JSON).
- No schema changes required; `owner_signature_assets` and `template_field_values` already exist.

### 6. QA checklist before closing
- `/owner/documents`, `/owner/documents/forms`, `/e-signature` all land on the unified hub with the right tab pre-selected.
- Upload signature → appears in Brand Assets immediately → selectable in Blank Letter → drag/reset/delete works → export PDF matches preview.
- AI generate → editable plain text → auto-saved → send via email uses locked-send.
- Mobile (375px) and desktop (1440px) layouts both clean; no white-on-light, no gold fills, hairline-only gold accents.

### Technical notes
- Files: `src/pages/e-signature/*`, `src/pages/owner/documents/DocumentsFormsHub.tsx` (new wrapper), `src/components/documents/BrandAssetsPanel.tsx` (new), `src/hooks/useOwnerSignatureAssets.ts` (mirror to brand_assets), `src/App.tsx` route redirects, `supabase/functions/letter-ai-generate`.
- No DB migration needed.
- Aligns with Champagne-Gold, IconTile, No-Gold-Fills, and Locked-Send standards already in memory.

Approve to implement.