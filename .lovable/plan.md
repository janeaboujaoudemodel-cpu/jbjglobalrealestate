# Documents Section — Stability, Autosave, Applicant Sync, Naming & Downloads

## What I found (verified in code)

**Editor instability / state resets**
- `DocumentsFormsHub.tsx` renders the editor with `key={audience:templateId}`, so switching template fully remounts the editor and destroys in-memory state.
- Two `useEffect`s in the same hub sync `tab` ⇄ `?tab=` in both directions, which can re-write the URL and re-render the hub on every tab touch.
- The editor's hydration effect explicitly disables session restore (`void snap; void applySnapshot;`), so a returning user starts blank even though snapshots are written.
- Local snapshot writing runs on a 400 ms timer over a payload that includes the full body HTML, and an identity-mirror effect fires on every `fields` change — heavy churn on each keystroke.

**Autosave**
- Autosave only runs when a candidate name exists *and* body HTML exists; otherwise nothing is saved to the database at all.
- It fires on an 8 s debounce with `JSON.stringify(fields)` as a dependency and calls the save mutation with `id: currentDocId`, which is only set *after* the first insert resolves. Two overlapping autosaves therefore insert two rows → duplicate drafts.
- There is no "Saving / Saved / Save failed" indicator anywhere in the editor.

**Applicant data**
- No single applicant source. Identity lives in: per-template field aliases (`employeeName`, `fullNameAsPerPassport`, `recipientName`, `client_name`, …), a `localStorage` shared-identity blob, and a one-shot `sessionStorage` prefill key. `ApplicantProfileDrawer` (backed by `hr_candidates`) has no bridge into the editor.
- `crm_documents` already has `candidate_folder` / `candidate_display_name` but no applicant/candidate ID column.

**Naming**
- Saved titles are `"<Name> — <Template Label> (JBJ-DOC-XXXX)"` and fall back to `"Untitled — …"`, not the requested `"[Applicant Name] – Offer Letter"`.

**Downloads**
- Export re-renders the whole document synchronously before capture, then chains a save + storage upload; PDF has a toast progress but DOCX/PNG have none, there is no retry action, and a failed export leaves only a toast.

## Plan

### 1. Stop the churn
- Remove the remount `key` on the editor; drive template changes through state instead, so switching templates keeps the session.
- Make the hub's tab ⇄ URL sync one-directional (URL is the source of truth, written with `replace`).
- Memoise handlers/derived values passed into the editor; throttle the snapshot writer (1 s idle + flush on `visibilitychange`/`pagehide`) and drop the per-keystroke identity-mirror effect in favour of the centralized applicant store below.
- Add an unsaved-changes guard (`beforeunload` + in-app navigation confirm) that only warns when a dirty draft has not yet been persisted.

### 2. Reliable autosave
- Rewrite autosave as a single `useDocumentAutosave` hook:
  - Debounce 1.5 s after any change; no longer gated on candidate name or body HTML.
  - Serialise saves with an in-flight lock and a "pending" flag so a second change queues instead of racing.
  - Create the draft row **once** (first save), keep the returned id in a ref, and always update thereafter — eliminating duplicate drafts.
  - Track a monotonic revision so a stale in-flight response can never overwrite newer content.
- Add a compact status chip in the editor toolbar: `Saving…` / `Saved <time>` / `Save failed — Retry`.
- Re-enable draft restore: on open, load the newest draft for the template (+ applicant when one is selected), preferring the database row and falling back to the local snapshot, with a "Restored your last draft" toast and an "Start fresh" action.

### 3. Centralized applicant source
- New `ApplicantContext` + `useApplicant` hook exposing one canonical shape: `id`, `full_name`, `position`, `email`, `phone`, `address`, `username/applicant_id`.
- Backed by `hr_candidates`, read/written through a single hook so the sidebar, applicant profile, position page and editor all use the same record; selecting an applicant anywhere sets it for the session.
- One field-mapping table maps the canonical fields → every template alias, so all placeholders are populated from a single write. Editing a value in the editor writes back to the applicant record (debounced) and propagates everywhere.
- Persist the link on the document row (new `applicant_id` column on `crm_documents`, indexed) so drafts and folders resolve per applicant rather than by name string.

### 4. Naming
- Single `buildDocumentTitle(applicantName, templateLabel)` helper producing `"[Applicant Name] – Offer Letter"` / `"– NDA"` / `"– Employment Contract"` / `"– [Document Type]"`.
- Used for the saved title, the folder file name and the exported file name. When no name exists yet the title stays `"Untitled draft – <Type>"` and is renamed automatically the moment the name is known; the literal string "Applicant Name" is never rendered when a real value exists.

### 5. Generation
- When an applicant + position are selected, prepare the relevant drafts (Offer Letter, NDA, Employment Contract) with placeholders already substituted — reusing the existing companion-NDA logic, made idempotent per applicant + template so it can't duplicate.
- Placeholder replacement runs through one resolver over the canonical applicant record, so no `[Full Name]` survives in body, header or signature blocks.
- Manual edits stay possible: an edited document keeps its manual body, and synced fields are re-applied only to untouched placeholders (existing `userEdited` flag, tightened).

### 6. Downloads
- Move export prep off the critical path: preload libraries on editor open, capture pages in sequence with a real progress value.
- Replace the toast-only flow with a determinate progress indicator, disable the export control while running (guards repeat clicks for all formats, not just PDF), and show an explicit `Retry` action on failure.
- Archive-to-storage stays in the background after the file hits the device; failures surface as a retryable notice instead of a silent warning.

### Validation
Playwright runs against the running app covering: open editor → type → status chip reaches `Saved`; reload → draft restored, single row (verified with a database count query, no duplicates); switch templates → no state loss; select a second applicant → placeholders and title update; export PDF/DOCX for two applicants and two document types → progress shown, file produced, repeat clicks blocked. Screenshots attached in the report.

## Technical notes
- Files: `src/components/document-studio/DocumentStudio.tsx`, `src/pages/owner/DocumentsFormsHub.tsx`, `src/hooks/useCrmDocuments.ts`, `src/components/document-studio/export/exporters.ts`, `src/utils/candidateFolder.ts`, plus new `src/hooks/useDocumentAutosave.ts`, `src/contexts/ApplicantContext.tsx`, `src/lib/documents/applicantFieldMap.ts`, `src/lib/documents/documentTitle.ts`.
- Database: one migration adding `crm_documents.applicant_id` (nullable, indexed) and a partial unique index preventing more than one live draft per (owner, template, applicant). No data is deleted or rewritten.
- Risk: the editor is ~4.5k lines with several interlocking refs (`userEditedRef`, `liveEditedBodyHtmlRef`, `autoBodyRef`); autosave and sync changes will be made incrementally with screenshot checks after each step rather than as one rewrite.
