## Scope

Five connected items continuing the e-signature/CRM work. `deleted_at` already exists on `esign_envelopes` (with index) — no schema migration needed for it.

---

### 1. Drafts bulk-select + Recently Deleted tab

**`src/pages/e-signature/ESignatureDashboard.tsx`**

- Add a top-level Tabs row: **Active** (current behaviour, `deleted_at IS NULL`) and **Recently Deleted** (`deleted_at IS NOT NULL`, ordered by `deleted_at DESC`, auto-purge note: kept 30 days).
- Convert `handleDelete` from hard `DELETE` to soft delete: `update({ deleted_at: new Date().toISOString() })`. Hard-delete remains only via a "Delete permanently" action inside the Recently Deleted tab.
- **Bulk select** on the Active tab:
  - Add a leading checkbox column on each envelope row + a master checkbox in the toolbar.
  - Selection state: `Set<string>` of envelope IDs in component state.
  - Floating action bar appears when `selected.size > 0`: **Send reminder**, **Move to Recently Deleted**, **Clear selection**, count badge.
  - Bulk soft-delete = single `update({ deleted_at }).in("id", [...selected])`.
- **Recently Deleted tab actions** per row + bulk:
  - **Restore** → `update({ deleted_at: null })`.
  - **Delete permanently** → confirm dialog → real `DELETE` (cascades remove recipients/fields/audit via existing FKs).
- React Query: invalidate `["esign-envelopes"]` after every mutation; both tabs share the same key but pass a `view: "active" | "deleted"` filter and key suffix.

No DB migration required for this item.

---

### 2. CRM merge dialog + dropdown filters

**Files:** `src/pages/CRMRelationships.tsx` (and the leads table component it renders, plus a new `src/components/crm/MergeContactsDialog.tsx`).

**Dropdown filters** (added to the existing filter row):
- **Status** (Lead / Contacted / Qualified / Won / Lost — pulled from existing `crm_leads.status` enum)
- **Source** (re-uses `LeadSourceFilter` values)
- **Owner / Assignee** (distinct `assigned_to` from `crm_leads`)
- **Tag** (multi-select from `crm_leads.tags` jsonb)
- All driven by URL search params so deep-links work (consistent with Global Filter System Standard).

**Merge dialog** (`MergeContactsDialog.tsx`):
- Triggered when 2 or 3 leads are checked in the table → toolbar shows **Merge selected** button.
- Dialog shows a 2- or 3-column field-by-field comparison (name, email, phone, company, source, tags, notes).
- Per-row radio chooses the surviving value; one record is the **primary** (kept), others are absorbed.
- On confirm: call existing `upsert_contact_with_company` RPC for the surviving row, then `update` non-primary rows to set `merged_into = primary_id` and `deleted_at = now()`. (Soft-merge — non-destructive.)
- All linked artefacts (envelopes, tasks, comm history) are re-pointed to the primary id via a single SQL UPDATE per related table.

**Schema additions needed (one small migration):**
- `crm_leads.merged_into uuid` (nullable, FK → `crm_leads.id`)
- `crm_leads.deleted_at timestamptz` (nullable) — if not already present
- Index on `merged_into`
- RLS already covers owner/admin; no policy change.

---

### 3. Owner-side "Upload signed PDF" on EnvelopeDetail

**`src/pages/e-signature/EnvelopeDetail.tsx`**

- New action in the envelope header (visible to sender/owner only, all statuses except `completed`/`voided`): **Upload signed PDF**.
- Click opens a file picker (`accept="application/pdf"`, max 25 MB).
- Upload path: `supabase.storage.from("esign-signed").upload(\`${envelope.id}/${Date.now()}-signed.pdf\`, file, { upsert: false })`.
- On success: `update esign_envelopes set signed_document_url = <publicUrl>, status = 'completed', completed_at = now() where id = envelope.id`.
- Insert an `esign_audit_log` row: `action = 'manually_completed'`, `description = 'Owner uploaded signed PDF'`.
- Trigger the existing completion email pipeline (call `esign-finalize-envelope` edge function if present, otherwise reuse `esign-send-completion-email`).

**Migration:** ensure storage bucket `esign-signed` exists (private) with RLS — owners insert/read on their own envelopes.

---

### 4. Outbound envelope email — embed DocuSign notice + PDF attachment

**Files:** `src/lib/email/buildEnvelopeEmailHtml.ts` + mirrored `supabase/functions/_shared/envelope-email-html.ts` (kept byte-identical) + `supabase/functions/esign-send-for-signature/index.ts`.

- Append a clearly-labelled **"Sign with DocuSign"** block above the existing CTA: short paragraph + the numbered 3-step mini-guide (already drafted), plus a divider above the JBJ signature.
- Confirm the **PDF chip** (signed/unsigned attachment) uses the 7-day signed Storage URL (already implemented in `SendViaEmailDialog.resolveAttachmentUrl`) and surface it inside the same email card with file size + filename.
- In `esign-send-for-signature/index.ts`, also pass the resolved attachment URL through to Resend's `attachments` array (Resend supports `path` for remote files) — so the PDF lands as a real file attachment, not just a link. Cap at 10 MB to stay under Resend's limit; if larger, fall back to the link chip only.
- Re-deploy `esign-send-for-signature`.

---

### 5. Full E2E screenshot pass

After 1-4 ship, run a manual screenshot pass on the preview using the browser tools and capture each step into `/mnt/documents/esign-e2e-<timestamp>/`:

1. Dashboard — Active tab, empty selection
2. Dashboard — Active tab, 3 rows selected → bulk action bar
3. Dashboard — Recently Deleted tab with restore/permanent buttons
4. CRM Relationships — new dropdown filters open
5. CRM Relationships — Merge dialog, 2 leads
6. EnvelopeDetail — Upload signed PDF button + post-upload state
7. Email preview iframe — DocuSign block + attachment chip
8. Inbox screenshot of the test send to `infoo.jane@gmail.com`

Compile a one-page QA contact sheet (`/mnt/documents/esign-e2e-<timestamp>/contact-sheet.pdf`) for review.

---

### Files to change

- `src/pages/e-signature/ESignatureDashboard.tsx` — tabs, bulk select, soft-delete
- `src/pages/e-signature/EnvelopeDetail.tsx` — Upload signed PDF action
- `src/pages/CRMRelationships.tsx` + leads table — dropdown filters, selection + Merge button
- `src/components/crm/MergeContactsDialog.tsx` — **new**
- `src/lib/email/buildEnvelopeEmailHtml.ts` + `supabase/functions/_shared/envelope-email-html.ts`
- `supabase/functions/esign-send-for-signature/index.ts` — attach PDF via Resend attachments
- **Migrations:** `crm_leads.merged_into` + `crm_leads.deleted_at` + `esign-signed` storage bucket & policies

### Open questions

1. **Hard-purge schedule** for Recently Deleted — auto-delete after **30 days** via a daily cron (pg_cron), or keep forever until manual purge?
2. **Merge of 3+ leads** — cap at 3, or allow N (with a scrollable comparison table)?
3. **PDF attachment cap** — Resend's hard limit is 40 MB total per message. Use **10 MB**, **25 MB**, or fall back to link-only above any size?
