## Scope

Phased Document Studio uplift — items 27‑41. Phase 1 ships the visual + contrast + chrome fixes the user can see today. Phase 2 ships the DMS depth (vault, intake, autofill, universal search). Phase 3 ships the AI legal assistant + multi-format export. Each phase is independently testable and shippable.

---

## Phase 1 — Visual lock & chrome cleanup (items 27, 28, 29, 30, 31, 32, 41-light)

**Goal:** what the user sees in the screenshot reads correctly.

1. **Contrast audit (item 28)** — `DocumentStudio.tsx` step chips, English language pill, Live Document Editor title bar, Signature/Save Template/Save Document/Fullscreen/Hide buttons. Replace any white-on-champagne with `#1A1A1A` (charcoal) or `#064E3B` (dark emerald). Verify against PASS 50 contract; no new !important rules.
2. **Template header (item 29)** in `jbjLockedChrome.ts`:
   - Remove "GENERATED 26 JUNE 2026" date stamp.
   - Cut header block height ~50%.
   - Force "JBJ GLOBAL REAL ESTATE L.L.C. S.O.C." to solid `#000` on champagne theme.
3. **Footer (item 30)** in `jbjLockedChrome.ts` / `letterheadChrome.ts`:
   - Delete "JBJ GLOBAL REAL ESTATE L.L.C. S.O.C." footer text and its secondary divider.
   - Keep one gold hairline; reduce footer to ~20% of current height; all remaining text in charcoal.
4. **Monogram (item 31)** — bump `JBJ` mark to ~2× current size, keep proportions. Champagne theme → black monogram; emerald theme → white.
5. **Multi-theme (item 32)** — add `theme: "champagne" | "emerald"` prop to `jbjLockedChrome.ts`. Emerald variant: emerald header band, white type, white monogram, white icons. Theme switch in `DocumentStudio.tsx` header (segmented pill, charcoal-on-champagne contrast).
6. **First-class entry points (item 27)** — add Document Studio tile to:
   - Owner Dashboard quick-actions strip
   - `OwnerDashboardShell.tsx` left nav (top section, not nested)
   - Global Search registry (`globalSearchSources`)
   - Owner top-bar quick actions
   - Recently Used + Favorites are deferred to Phase 2 (need vault).
7. **One-click action menu (item 41 — light)** — wire the existing `DocumentActionSheet` to Download PDF, Download DOCX (via existing exporter), Print, Duplicate. Share / Send for Signature / Archive stubbed to Phase 2/3.

**QA:** Playwright at 1440 + 390. Screenshot proof of the Document Studio page, header chrome, footer chrome, both themes, and the dashboard entry tile.

---

## Phase 2 — Document Management System (items 33, 35, 36, 37, 38, 39, 40, 41-full)

**Goal:** turn the studio into an enterprise DMS.

1. **Expanded template library (item 33)** — extend `documentCatalog.ts` with the 6 groups (Sales, Leasing, Legal, HR, Brokerage, Company). Each entry has `slug`, `group`, `professional: composer`, `blank: composer`. Add UI category tabs and search.
2. **Client + Employee Vault (items 38, 39)** — new tables `document_vault_folders` + `document_vault_files` with RLS scoped to `auth.uid()`-owned org. Folder seeding trigger when a client/employee is created. Storage bucket `vault` (private). Vault UI panel in studio sidebar with the tree from the spec.
3. **Drag-and-drop intake (item 35)** — dropzone overlay on editor + per-vault folder. Accepts PDF/DOCX/IMG/JPG/PNG, max 25 MB.
4. **Auto-extraction (item 36)** — edge function `document-extract` calls `google/gemini-3-flash-preview` with the doc as multipart, returns structured JSON (full name, passport, EID, nationality, DOB, address, email, phone, company, property, unit, contract dates). Persist to `document_extractions` keyed to uploaded file id.
5. **Smart contract autofill (item 37)** — placeholder syntax `{{client.full_name}}` in composers; new `resolvePlaceholders(template, clientId, propertyId, agentId)` server-side that pulls from CRM, vault extractions, and listings. Re-runs when client data changes.
6. **Universal search (item 40)** — RPC `vault_search(q text)` returning unified rows across clients, employees, contracts, IDs, invoices, templates, property files. Wire into existing GlobalSearch overlay with a "Documents" section + dedicated `/owner/documents/search`.
7. **Action menu (item 41 — full)** — complete Share (signed URL), Send for Signature (existing DocuSign handoff), Archive (soft-delete flag).

**Backend migration outline:**
- `document_vault_folders(id, owner_id, subject_type, subject_id, label, parent_id, sort)` — RLS owner-only, service_role all.
- `document_vault_files(id, folder_id, owner_id, storage_path, mime, size, original_name, uploaded_by, soft_deleted_at)` — same RLS.
- `document_extractions(id, file_id, json, model, created_at)` — owner-scoped via folder.
- Trigger on `crm_leads` and `employees` insert → seed folder tree.
- Storage policy: only owner can read/write under `vault/{owner_id}/`.

---

## Phase 3 — AI Legal Assistant (item 34)

**Goal:** real legal copilot in the Live Document Editor.

Edge function `document-ai-edit` with action enum:
`generate | rewrite_clause | summarize | explain_legal | improve_wording | translate | compare_versions | detect_missing_clauses | suggest_improvements`.

Model: `openai/gpt-5.4` with extended reasoning for compare + detect_missing; `google/gemini-3-flash-preview` for translate/summarize.

Editor UI: action dropdown (replaces free-text only), inline diff view for rewrites + compare, side-panel "missing clauses" list with one-click insert.

Telemetry: log each action to `document_ai_events` for credit accounting.

---

## What ships in this turn

Only **Phase 1**. Phase 2 + 3 are large enough that the user should approve them as separate scoped batches once Phase 1 looks right.

## Out of scope (Phase 1)

- DB migrations
- Edge functions
- Any of items 33–40 except the entry-point wiring in item 27
- DOCX exporter improvements beyond what already exists
