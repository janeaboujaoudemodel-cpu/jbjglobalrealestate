# Documents — Save, Folders, Auto-NDA, Attachments

## 1. Save button (Document Studio)
- An explicit **Save** button already exists at the right of the Live Editor header. I will:
  - Promote it visually (always-on emerald CTA, never hidden behind dropdown).
  - Add `Ctrl/Cmd+S` shortcut.
  - Auto-save the draft into `crm_documents` every 8 seconds whenever the body or fields change and a candidate name is present (no toast spam — silent background save). Manual Save still shows a toast.

## 2. Per-candidate folders (DB)
Two new columns on `crm_documents`:
- `candidate_folder` (text) — normalized full candidate name (e.g. `alwalid issam shaaban alhalabi`).
- `candidate_display_name` (text) — the pretty version.

On save, `handleSaveDocument` derives the candidate name from the Offer/NDA fields (uses existing `bestLegalName`) and writes both columns. Folder = `candidate_folder`. No new tables — folders are virtual groupings keyed by the column. Matches the user's choice of "by candidate full name only".

## 3. NDA companion — auto-create on Offer save
When the saved document's `template_id === "job_offer"`:
- Look up an existing NDA for the same `candidate_folder` (`template_id="nda"`).
- If none, compose one via `composeNda(...)` using the same `field_values` (shared identity).
- Insert it into `crm_documents` with `status="draft"`, same `candidate_folder`, title `"{Candidate} — NDA ({booking_id})"`.
- Toast: "Offer saved · NDA draft created for {Candidate}".

This fires from `handleSaveDocument` after the Offer save succeeds. The "NDA" toggle in the editor will also navigate to the existing draft if one exists for this candidate, instead of starting blank.

## 4. Attachment archival (passport / Emirates ID / visa)
Currently `autoFillFileRef` triggers OCR on the file but discards it. I will:
- Create a new storage bucket `candidate-documents` (private) — owner-only via RLS on `storage.objects`.
- On every ID/passport/visa upload through Document Studio, upload the file to `candidate-documents/{candidate_folder_slug}/{timestamp}-{filename}` in parallel with the OCR call.
- Record each upload in a new lightweight table `crm_document_attachments` (id, owner_user_id, candidate_folder, candidate_display_name, file_path, mime_type, original_filename, kind, created_at, deleted_at).
- Folder view in the hub will list these attachments alongside generated documents.

(Final exported PDFs and inline body images are explicitly out of scope per the user's answer to Q3.)

## 5. 30-day soft delete (already exists — finish the UX)
`useSoftDeleteDocument` / `useCrmDocumentsDeleted` already enforce 30-day retention for `crm_documents`. I will:
- Add the same `deleted_at` column + soft-delete/restore hooks to `crm_document_attachments`.
- Add a `pg_cron` job (or a `cleanup_old_deleted` SQL function called daily) that hard-deletes rows + storage objects where `deleted_at < now() - interval '30 days'`.
- Surface a clear "Recently Deleted" section per folder in the hub with Restore / Delete-forever actions.

## 6. Documents Forms Hub — folder view
In `src/pages/owner/DocumentsFormsHub.tsx`:
- New top-level "Candidates" tab (default for HR audience) showing folder cards: one card per `candidate_folder`, with counts (Offer / NDA / Attachments), last-updated, and a "Recently Deleted (N)" chip when applicable.
- Click a folder → side sheet listing all documents + attachments for that candidate, each with Open / Preview / Download / Delete / Restore.
- "Open" loads the doc back into the Studio via the existing `loadCrmDocument` flow.

## Technical details

### Migration (one call)
```sql
ALTER TABLE public.crm_documents
  ADD COLUMN IF NOT EXISTS candidate_folder text,
  ADD COLUMN IF NOT EXISTS candidate_display_name text;
CREATE INDEX IF NOT EXISTS crm_documents_candidate_folder_idx
  ON public.crm_documents (owner_user_id, candidate_folder);

CREATE TABLE IF NOT EXISTS public.crm_document_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  candidate_folder text NOT NULL,
  candidate_display_name text,
  file_path text NOT NULL,
  mime_type text,
  original_filename text,
  kind text,                       -- 'passport' | 'emirates_id' | 'visa' | 'other'
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_document_attachments TO authenticated;
GRANT ALL ON public.crm_document_attachments TO service_role;
ALTER TABLE public.crm_document_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_rw" ON public.crm_document_attachments
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- Daily purge of soft-deleted rows older than 30 days
CREATE OR REPLACE FUNCTION public.purge_old_deleted_documents()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.crm_documents
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
  DELETE FROM public.crm_document_attachments
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
END $$;
```
Plus a private storage bucket `candidate-documents` with owner-only `storage.objects` policies.

### Files touched
- `supabase/migrations/...` (new)
- `src/components/document-studio/DocumentStudio.tsx` — promote Save button, add Cmd+S, debounced auto-save, post-save NDA auto-create, attachment upload on `autoFillFileRef` change.
- `src/hooks/useCrmDocuments.ts` — accept `candidate_folder`, `candidate_display_name` in `useSaveDocument`.
- `src/hooks/useCandidateAttachments.ts` (new) — list / upload / soft-delete / restore.
- `src/pages/owner/DocumentsFormsHub.tsx` — new "Candidates" folder grid + side sheet.
- `src/templates/composers/index.ts` — export a small `deriveCandidateFolder(fields)` helper reused by Studio.

## Out of scope (deliberately, per Q3)
- Archiving exported PDFs (Offer/NDA final files) into the folder.
- Archiving inline body images.
- Renaming/merging folders manually (folders are derived from the candidate name; if the name changes, future saves write to a new folder — we can add a manual "Move to folder" later if you want it).
