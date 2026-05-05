# Upload External Developer Agreements with AI Auto-Match

## Goal

When you receive a signed agreement from a developer (e.g. Sobha, Emaar, Damac), drop the PDF into the Contract Vault. AI reads it, identifies the developer + contract type + key dates, and files it under the right developer automatically — no manual searching or tagging.

## Where it lives

`/owner/contracts` (Contract Vault) — add a new **"Upload Agreement"** button at the top, next to "Manage signature & stamp". Same page you already know, no new route to remember.

## User flow

```text
1. Click "Upload Agreement" → drawer opens
2. Drag PDF (or multiple PDFs) into drop zone
3. AI reads each file in background:
     - extracts developer name (Sobha, Emaar, etc.)
     - extracts contract type (Brokerage Agreement, NDA, MOU, Addendum...)
     - extracts effective date, expiry, commission %, signatories
     - matches developer to existing record in `crm_developers` (fuzzy)
4. Preview card shows: "Matched to Sobha Realty (98% confidence) — Brokerage Agreement, expires 2027-05"
     - [Confirm & file]  [Change developer ▼]  [Edit fields]
5. Confirm → PDF stored, row added to vault, tagged to developer
```

If AI can't confidently match (e.g. unknown developer), the card shows "No match — pick developer" with a searchable dropdown. Nothing is filed silently under the wrong company.

## What changes

### Database (migration)
- New table `external_agreements`:
  - `id`, `owner_user_id`, `developer_id` (nullable, FK to `crm_developers`), `developer_name_raw`, `contract_type`, `file_url`, `file_name`, `effective_date`, `expiry_date`, `commission_pct`, `counterparties jsonb`, `ai_confidence numeric`, `ai_extracted jsonb`, `status` (`pending_review` | `filed` | `archived`), `uploaded_at`, `created_at`
  - RLS: only owner role can read/write (reuse `requireOwnerAuth` pattern)
- New storage bucket `developer-agreements` (private), with RLS allowing only owner.

### Edge function
- `match-developer-agreement` — accepts file (or storage path), runs Lovable AI Gateway (`google/gemini-2.5-pro` for PDF vision + reasoning) with a strict JSON schema, then fuzzy-matches the extracted developer name against `crm_developers.name` (normalized). Returns `{developer_id, confidence, extracted}`.

### Frontend
- `ContractVault.tsx`:
  - Add "Upload Agreement" button + `AgreementUploadDrawer` component.
  - Add a second tab/section: **"External Agreements"** alongside the existing signed-contracts table. Columns: Developer · Type · Effective · Expiry · Status · Actions (Open / Re-match / Archive).
- `AgreementUploadDrawer.tsx` (new):
  - Drop zone (multi-file, PDF only, 25 MB cap each)
  - Per-file row with progress, AI match preview, confirm/override controls
  - Reuses the look of `DocumentExtractorUpload`

### Surfacing the contract on the developer page
- On the developer detail page, add a small "Agreements (2)" chip linking back to the vault filtered by that developer — so the contract is visible from both directions.

## Answer to your direct question

> Do I have to search Sobha and click upload, or can AI auto-file it?

After this is built: **just drop the file. AI will detect "Sobha" from the document and file it under Sobha automatically.** You only intervene if confidence is low or the developer doesn't exist in your CRM yet — and even then it's a one-click confirm, not a manual search.

## Out of scope (for this round)

- Auto-renewal reminders before `expiry_date` (easy follow-up).
- E-signing the uploaded PDF (different flow — use the existing `/owner/sign` envelope system for that).
- Bulk re-processing of historical PDFs already sitting elsewhere.
