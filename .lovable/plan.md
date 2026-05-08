# E-Signature DocuSign-Grade Upgrade

Fix the broken editor on `/e-signature/create` and bring the whole flow up to DocuSign parity. Strict "no removal" — every existing capability stays.

## Problems to fix

1. **Drag is wrong** — uses native HTML5 drag with `dataTransfer`; on the scrollable container the drop coordinates skip and snap. Cannot drag downward past the visible area.
2. **No resize / no style controls** — fields are fixed-size; no font, color, or size handles.
3. **Signature flow is clunky** — clicking a signature field doesn't open Adopt-and-Sign; saved signature isn't auto-applied across all required fields.
4. **AI Auto-Detect is dumb** — drops generic "Click to sign" + a date with the literal text "JBJ" instead of recipient name / company / email at the real anchor positions.
5. **No document editing** — cannot delete, reorder, merge, rotate pages, or export to PNG / Excel / individual page.
6. **Saved assets not unified** — signature, initials, stamp, name, email, date come from different tables; not auto-applied.

## Plan

### 1. Fix drag + add resize (presentation only)

Replace HTML5 drag with a pointer-event drag inside `DocumentFieldPlacer.tsx`:

- `onPointerDown` on field → capture pointer, store `(offsetX, offsetY)` and starting field rect.
- `onPointerMove` → compute new `x%/y%` against `overlayRef.getBoundingClientRect()`, clamp using **field width** (not 95%), so wide signature fields don't snap.
- Auto-scroll the overlay when cursor nears top/bottom edge so dragging downward works inside the scroll container.
- 8 resize handles (corners + edges) using the same pointer model; min 24×24, max page width.
- Per-field inspector panel (right rail) when a field is selected: font family, font size, text color, bold/italic, alignment, fill tint, border style. Stored on `SignatureField` as optional `style: { fontFamily, fontSize, color, bold, italic, align, tint }`.

### 2. Adopt-and-Sign modal (one click, auto-broadcast)

New `AdoptAndSignDialog.tsx` opened the first time the signer clicks any signature/initials/stamp/name field:

- Tabs: **Draw**, **Type** (script fonts), **Upload**.
- Generates **signature + initials + stamp** in one pass using the existing `ai-signature-generator` for "Type" mode.
- On confirm: saves to `owner_signature_assets` via existing `useSaveSignatureAsset` (kind = `signature` / `initial` / `stamp`, `is_default = true`).
- Auto-fills **every** field of the same type/recipient on every page. If only one field exists, fills just that one. Same logic for Name, Email, Date, Stamp.
- "Don't ask again" → next sessions auto-apply the default asset on click without opening the dialog. Re-open via a small pencil icon on the field.

### 3. Smarter AI Auto-Detect

Upgrade `supabase/functions/esign-auto-detect-fields/index.ts`:

- Rasterize each PDF page server-side (pdf-lib + pdfium via Deno; or send page images from the client) and OCR with Lovable AI (`google/gemini-2.5-pro`) to find anchor phrases: "Signature", "Sign here", "Print Name", "Date", "Initials", "Email", "Title", "Company", "Stamp".
- Return precise `{ pageNumber, x%, y%, width, height, type, suggestedValue, label }` per anchor, mapped to **each recipient by signing order**.
- `suggestedValue` populated from recipient's profile: name → recipient.name, email → recipient.email, date → today, company → user's brand profile, initials → derived. **Never** literal "JBJ".
- Client merges results, dedupes overlapping anchors, and shows a confirm toast "Detected N fields across M pages — review".

### 4. Saved Assets Hub (unified)

Single `useOwnerSignatureAssets` already exists. Extend to cover:

- `signature` (multiple, one default)
- `initial`
- `stamp` (existing brand_assets stamp also surfaced)
- `saved_text` kind: full name, title, company, email, phone, address — keyed by label.

New `Saved Assets` drawer in the editor (top-right): list, set-default, delete, add new. Deleting clears auto-apply; adding new offers "make default".

### 5. Document Editor (pages + export)

New `DocumentEditor.tsx` panel (toggle button "Edit Document"):

- Page grid with thumbnails. Per page: **Delete**, **Rotate 90°**, **Duplicate**, **Drag to reorder**.
- Toolbar: **Merge another PDF**, **Insert blank page**, **Print**, **Export**.
- Export menu:
  - PDF (current state)
  - PDF per page (zip)
  - PNG per page (zip)
  - Single PNG (current page)
  - XLSX (text content per page → rows)
  - DOCX (text)
- Implemented with `pdf-lib` (page ops) + existing `loadPdfJs` (rasterize to canvas) + `jszip` + `xlsx` + `jspdf` (already in project).
- After edits, the modified PDF replaces the working file in memory; field coordinates re-mapped if pages are reordered/deleted (drop fields whose page is gone, shift `pageNumber` for moved pages).

### 6. Multi-party send (already exists — polish)

- After fields are placed, "Send for Signature" generates per-recipient signing links (existing `esign-send-for-signature`).
- Recipient opens link → sees only their fields → Adopt-and-Sign once → all their fields fill → submit. Existing `apply-adopt-signature` is reused.

### 7. End-to-end test

Add `tests/esign.smoke.spec.ts` (vitest + jsdom):

- Place field, drag with synthetic pointer events, assert new `x/y`.
- Resize via handle, assert width/height.
- Open Adopt dialog, save, assert all matching fields filled.
- Auto-detect mock returns 5 fields, assert they render with `suggestedValue`.
- Page delete: assert fields on deleted page removed, fields on later page shifted.

## Technical notes

- **No DB schema changes required** (uses existing `owner_signature_assets`, `brand_assets`, `ai_tool_projects`, `esign_envelopes`).
- New optional `style` and `label` columns on `SignatureField` are **client-side only**; serialized into the existing `fields` jsonb on the envelope.
- New deps to add: `jszip`, `xlsx` (only if missing — verify first), nothing else.
- Files to add: `AdoptAndSignDialog.tsx`, `DocumentEditor.tsx`, `FieldInspector.tsx`, `useUnifiedSignatureAssets.ts`.
- Files to modify: `DocumentFieldPlacer.tsx`, `FieldContentRenderer.tsx`, `documentFieldTypes.ts`, `supabase/functions/esign-auto-detect-fields/index.ts`, `CreateEnvelope.tsx`.
- All styling stays in semantic tokens; gold = hairline only per design rules. No emojis.

## Acceptance

- Drag a signature field anywhere on the page (including dragging downward past the fold) and it lands exactly under the cursor.
- Resize from any handle; width/height update live.
- Click signature → Adopt-and-Sign opens → save once → every signature field for me on every page is filled. Same for initials, name, email, date, stamp.
- AI Auto-Detect returns real anchor positions with my real name/email/company prefilled — never literal "JBJ".
- Document editor lets me delete a page, reorder, merge another PDF, export PDF/PNG/XLSX, and print.
- All existing features (brand assets picker, contract analyzer, AI signature designer, multi-recipient flow) still work.
