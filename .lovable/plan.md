
# Unified Documents Hub & E-Signature Overhaul

A comprehensive pass that fixes every broken interaction in `/e-signature/create`, consolidates every document-related tool into ONE hub (no duplicates), and wires the AI tools together so the user never leaves the document preview.

---

## Part 1 — E-Signature Bug Fixes (`/e-signature/create`)

### 1.1 Signature Pad — stop auto-saving on pen-up
- In `AdoptAndSignDialog.tsx`, the canvas currently commits the signature on `pointerup`. Change it so lifting the finger ONLY ends the current stroke. The signature is committed only when the user clicks **Adopt & Sign** (or new **Save**) button.
- Allow multi-stroke drawing (dots, dotted i's, accents). Add **Clear** and **Undo last stroke** buttons next to **Adopt & Sign**.

### 1.2 Field placement — drop where the cursor is
- Fix `DocumentFieldPlacer.tsx`: when a field type is selected from the toolbar and the user clicks anywhere on a page, the new field is created with its center at the click coordinates (page-relative %), not at page top.
- Fix dragging an existing field: pointer-move now correctly translates the field across pages including page 6+. Auto-scroll the page container while dragging near edges.
- Add visible **trash/bin icon** on every field hover (top-right corner, always visible — currently clipped by border). One click deletes the field.

### 1.3 Sticky tools rail
- Replace the unrelated "Price / Payment / Property" sidebar shown on `/e-signature/create` with a **document-aware rail** containing: Signature, Initials, Name, Date, Text, Checkbox, Auto-detect, Adopt & Sign, Saved Recipients.
- Make the rail `position: sticky; top: 88px` so it stays visible while scrolling all 6+ pages.

### 1.4 Auto-detect fields — scroll & accuracy
- Update `esign-auto-detect-fields` to return only fields that exist in the document (no spurious "Title" if no title anchor was found). Strict prompt: "ONLY emit fields whose anchor text or visible blank line was detected in the page image. Never invent."
- After response: scroll the viewer to the FIRST detected field's page, then briefly highlight each detected field one-by-one.
- Pre-fill values from the signed-in user profile + recipient profile: signature → saved default signature asset, "Name" → recipient.full_name, "By" / "On Behalf Of" → recipient.company_name, "Date" → today.

### 1.5 Recipients — auto-load + replace vs add new
- Always pre-fill the most recently used recipient(s) on mount (no need to click "Recent").
- Two distinct buttons: **Replace recipient** (swap without persisting) and **Save & add new** (persists to `esign_saved_recipients`). A star toggles "Default recipient".

### 1.6 Draft persistence
- New table `esign_drafts` keyed by user_id. On every meaningful change (debounced 1.5s) save: pdf_storage_path, fields[], recipients[], current_page. On `/e-signature/create` mount, auto-restore the latest draft unless the user clicks **Start new** or **Discard draft**. Explicit **Save as Draft** and **Delete draft** buttons in the header.

---

## Part 2 — Unified Documents Hub (`/documents`)

One page, accordion sections, tools wired to the SAME loaded document. Opening a section header expands it inline; no navigation away.

Sections (in this order):
1. **Library** — all uploaded documents, forms, agreements, signed contracts. Filters: type (Contract, MOU, Agency Registration, NDA, Form, Other), developer, agency, signer, status, date.
2. **Editor** (merged from existing Document Editor) — pages reorder/delete/rotate/merge, export PDF/PNG/ZIP/DOCX.
3. **E-Signature** (merged from `/e-signature/create`) — field placement, recipients, send.
4. **Forms & Agreements** (merged from existing Forms hub) — templates list, fillable forms.
5. **Signed Contracts** — archive of every completed envelope; auto-categorised; same filters as Library.
6. **AI Tools** — Summarise, Translate, Extract data, Compare versions, OCR, Risk-flag clauses. Each tool acts on the currently-loaded document without leaving the page.

Routing: `/documents`, `/documents?tool=editor`, `/documents?tool=esign`, etc. Old routes (`/e-signature/*`, `/document-editor`, `/forms`) become redirects to the matching section.

### 2.1 Signed contracts → backend
- New table `signed_contracts` (envelope_id, contract_type enum, developer_id, agency_id, signer_ids[], pdf_path, signed_at, metadata). Trigger on envelope completion inserts a row.
- Vertical sidebar (frontend AND backend) now both link to the same `/documents` hub — no duplication.

---

## Part 3 — Business Card Scanner Cleanup

- Audit & delete the old broken scanner route/component. Keep ONE scanner accessible from the AI Tools sidebar at `/tools/business-card-scanner`.
- Upgrade UX:
  - Multi-photo capture (Front, Back, +Add another). All images sent together to `crm-save-scanned-card`.
  - AI merges fields from all images (front+back) into one contact.
  - On Save: insert into `crm_contacts` with `source = 'business_card'` and store original images in storage. Show in CRM with a "Business Card" source badge.

---

## Technical notes

- DB migrations: `esign_drafts`, `esign_saved_recipients`, `signed_contracts`, `contract_type` enum. RLS = owner-only.
- Edge function updates: `esign-auto-detect-fields` (strict no-invention prompt), `crm-save-scanned-card` (multi-image merge), new `esign-save-draft` and `esign-archive-signed`.
- Files touched (key): `src/pages/Documents.tsx` (new hub), `src/components/e-signature/DocumentFieldPlacer.tsx`, `AdoptAndSignDialog.tsx`, `RecipientsPanel.tsx`, `src/pages/tools/BusinessCardScanner.tsx`, sidebar configs (frontend + admin), router redirects.
- Memory: add `mem://features/documents/unified-hub-standard` and update sidebar/route memory.

---

## Verification

After each task: load `/documents` and `/e-signature/create` in the preview, run through the full flow (upload PDF → auto-detect → place signature on page 6 → adopt & sign → send → verify archive in Signed Contracts) and capture before/after screenshots for every fix.
