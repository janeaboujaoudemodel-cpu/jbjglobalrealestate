## Goal

Turn Document Studio into a true premium document workspace:
- Real **PDF / DOCX export** (not just `window.print`)
- **Signature manager** (upload, draw, type) + **Stamp manager** (upload), reusable across every document, every form
- **Live, designer-grade editing** — inline content edits, drag-positionable signature & stamp on the A4 canvas, plus AI rewriting
- One unified engine wired into BOTH catalogs (Careers / Staff and Contracts / Client/Investor)
- Full E2E QA pass — technical (build, runtime, RLS, edge calls) and visual (every step, every export)

## Findings from audit

Current `DocumentStudio.tsx` (713 lines) already has the 3-step shell, live `contentEditable` body, floating toolbar, and AI panel. What's missing or broken for "premium exportable":

1. **Export is fake** — `handlePrint` opens a new window and calls `window.print()`. No real PDF or DOCX file is produced. `jsPDF` and `html2canvas` are already in `package.json` but unused here.
2. **No signature anywhere** — zero references to `signature` in the studio. Bucket `owner-signature-assets` exists but is unused by this feature.
3. **No stamp anywhere** — buckets `stamp-vectors` / `stamp-previews` / `stamp-exports` exist (used by other tools) but stamps cannot be placed on a generated document.
4. **Single audience surface** — `DocumentStudioLauncher` already supports `staff` and `client`, but signature/stamp must apply uniformly across both, plus the existing `ContractForms` investor flow.
5. **No persistence** — drafts are lost on close. Acceptable to skip for v1, but signature/stamp assets must persist per owner.

## Build plan

### 1. Database & storage (one migration)

- New table `public.owner_document_assets` — per-owner signature + stamp library:
  - `id uuid pk`, `owner_id uuid` (= `auth.uid()`), `kind text check in ('signature','stamp')`, `label text`, `storage_path text`, `is_default boolean`, `created_at timestamptz`.
  - GRANTs to `authenticated` + `service_role`. RLS: owner-only `select/insert/update/delete using (owner_id = auth.uid())`.
- Re-use existing **private** buckets `owner-signature-assets` (signatures + drawn PNGs) and `stamp-previews` (uploaded stamp PNG/JPG). Add RLS on `storage.objects` scoped to `auth.uid()` prefix folders (`{uid}/sig/…`, `{uid}/stamp/…`).
- Files served via signed URLs (60 min) — never public.

### 2. Signature & Stamp manager

New module `src/components/document-studio/assets/`:

- `useOwnerAssets.ts` — hook: list / upload / set default / delete signatures & stamps for current owner.
- `SignatureCapture.tsx` — three tabs:
  - **Upload** (PNG/JPG, transparent preferred)
  - **Draw** (HTML5 canvas, exports PNG)
  - **Type** (cursive font preview, exports PNG via `html2canvas`)
- `StampUpload.tsx` — single tab: upload PNG/JPG, square preview, set as default.
- `AssetLibraryDialog.tsx` — opens from a topbar button in `StudioShell`. Shows owner's saved signatures + stamps in two rows; supports add / set default / delete.

### 3. Place signature & stamp on the document

Inside `EditableBody` add a **non-text "marks" layer**:

- New piece of state `marks: { signature?: {url, x, y, width}, stamp?: {url, x, y, width, rotation} }`.
- Rendered as absolutely-positioned `<img>` over the A4 page, draggable (pointer events) and resizable from a corner handle.
- Footer of the page reserves a "Signature" + "Stamp" zone with a "Insert" button each → opens `AssetLibraryDialog` to pick from saved assets.
- Marks are serialized to HTML on export (`<img src="signed-url" style="position:absolute;…">` inside the body wrapper) so PDF/DOCX/email all carry them.

### 4. Real export

New `src/components/document-studio/export/exporters.ts`:

- `exportPdf(bodyHtml, marks, template)` — renders the same A4 React tree off-screen (or uses the live preview node), runs `html2canvas` per page, builds a multi-page PDF with `jsPDF` at A4 / 150 DPI. File name `JBJ-{template.id}-{yyyymmdd}.pdf`. Triggers download.
- `exportDocx(bodyHtml, marks, template)` — uses `docx` npm package (add as dep) to produce a `.docx` containing the locked header, body paragraphs (HTML→docx via simple paragraph parser), embedded signature + stamp images, and footer. File name `JBJ-{template.id}-{yyyymmdd}.docx`.
- Print / Send-email paths re-use the same composed HTML (so signature & stamp appear in branded email too — embedded as `cid:` attachments through `compose-branded-email`; extend that edge function only if needed, otherwise inline base64).

### 5. Studio shell wiring

- Replace the single "Print / PDF" button in step 3 with a `Export ▾` split-button: **Download PDF · Download DOCX · Print**.
- Add a topbar button **"Signature & Stamp"** that opens `AssetLibraryDialog`.
- Show small chips under the preview ("Signature: Default · Stamp: Default") with click-to-change.
- Persist `marks` to `sessionStorage` keyed by `templateId` so refresh doesn't lose placement during a session.

### 6. Unify with existing flows

- `DocumentStudioLauncher` already mounts the studio in both `CareersPortal` (staff) and `ContractForms` (client). No new mount points needed.
- Audit `ContractForms.tsx` and `CareersPortal.tsx` to confirm the launcher is the only path for generating documents and that no legacy "Job Offer" / "Form A" generators bypass the studio. Where any legacy generator exists, route its button into the studio with a `presetTemplateId`.

### 7. End-to-end QA pass (mandatory before reporting done)

Automated checks I will run:
- Build (lint + type) — must be clean.
- `supabase--linter` after migration.
- Edge call smoke: `letter-ai-generate` returns non-empty body for one staff + one client template.

Manual visual checks (via browser tools, screenshots only — no destructive actions):
1. Open `/owner/careers` → Contracts & Templates → launch studio → pick **Job Offer** → fill fields → generate → AI panel rewrite → place signature (upload) + stamp → **Download PDF** → open downloaded file → confirm letterhead, body, signature/stamp, footer.
2. Same flow for **Warning Letter** (staff) → **Download DOCX** → open file.
3. `/contract-forms` → pick **Form A** (client) → generate → place signature → **Send Test** to `infoo.jane@gmail.com` → confirm email arrives with signature embedded.
4. Re-open studio → confirm saved signature + stamp appear in library and "Set as default" sticks across sessions.
5. Resize viewport to 1280 + 1024 to confirm the A4 preview, asset library dialog, and topbar do not break (champagne theme, gold hairline, no white-on-light contrast issues).

Any failure found gets fixed in the same loop before I report back.

## New / edited files

**New**
- `supabase/migrations/{ts}_owner_document_assets.sql`
- `src/components/document-studio/assets/useOwnerAssets.ts`
- `src/components/document-studio/assets/SignatureCapture.tsx`
- `src/components/document-studio/assets/StampUpload.tsx`
- `src/components/document-studio/assets/AssetLibraryDialog.tsx`
- `src/components/document-studio/export/exporters.ts`

**Edited**
- `src/components/document-studio/DocumentStudio.tsx` — marks layer, export split-button, asset library topbar entry, sessionStorage persistence
- `src/templates/jbjLockedChrome.ts` — accept optional `signatureUrl` + `stampUrl` and render a signature/stamp block in `wrapWithJbjChrome` for print/email
- `src/pages/owner/CareersPortal.tsx` / `src/pages/ContractForms.tsx` — only if the audit finds legacy generators bypassing the studio

**Dependency**
- `bun add docx` (DOCX export). `jspdf` + `html2canvas` already present.

## Out of scope (call out, not built)

- Multi-signer / counter-signature workflow with audit trail (would be a separate "e-signature" feature).
- Server-side PDF rendering (client-side `html2canvas` is sufficient for premium look at A4 / 150 DPI).
- Versioned drafts saved to DB (sessionStorage only for v1).

Approve to proceed and I will implement + run the full E2E pass in one go.