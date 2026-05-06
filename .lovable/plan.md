## Audit — what already exists (do NOT duplicate)

| Existing module | Route | Purpose |
|---|---|---|
| Documents (rich editor) | `/documents` and `/owner/documents` (`src/pages/Documents.tsx`, 769 lines) | WYSIWYG editor, font/color picker, OCR, find&replace, stamp + signature placement, template library (Offer Letter, MOU, NOC, **Broker Agreement**, Tenancy, Handover, Commission Invoice). Already supports `<Stamp />` + `<PenTool />` insertion. |
| Contract Forms | `/contract-forms` (`ContractForms.tsx`) | Template grid for UAE real-estate contracts (MoU, **Form F – Listing Agreement**, Ejari, Form A, etc.). |
| Form Builder | `/form-builder` (`FormBuilder.tsx`) | Drag-and-drop fillable form fields + responses view. |
| Scan & Sign | `/document-scanner` (`ScanSignDocuments.tsx` + hook) | Scan → annotate → sign → submit flow. |
| Exclusive Documents | `/owner/exclusive-documents` | Owner vault. |
| Signature/Stamp store | `useOwnerSignatureAssets` + `owner_signature_assets` table + `owner-signature-assets` storage bucket + `apply-adopt-signature` edge function | Already handles upload, list, apply, BG-removal pipeline for signature / initial / stamp. |
| Owner sidebar | `OwnerSidebarNav.tsx` | Has a top-level **Documents** entry pointing to `/owner/documents`. |

**Verdict:** every primitive the prompt asks for is already in the codebase. The right move is to **merge** the JBJ "Property Advertising Agreement" + the workflow polish into these modules, not to spin up a parallel system.

---

## Where users will find the new feature

```text
Owner Dashboard
└── Documents          (existing top-level item)
    ├── Editor                  ← /owner/documents               (existing — gets the new template)
    ├── Forms & Agreements      ← /owner/documents/forms         (NEW landing — this prompt's hub)
    │     ├── Templates                 (Property Advertising Agreement + existing ones)
    │     ├── Create New Document
    │     ├── Uploaded Documents
    │     ├── Sent Documents
    │     ├── Signed Documents
    │     ├── Stamps & Signatures       (reuses owner_signature_assets)
    │     └── Settings
    └── Contract Library        ← /contract-forms                (existing — adds JBJ template card)
```

A second entry point appears in **CRM → Lead/Client detail → "Send Agreement"** so a contract can be generated pre-filled from CRM data.

---

## Plan

### 1. Brand-correct PAA template (data, not a new page)

- Add a single template record to `DOC_TEMPLATES` in `src/pages/Documents.tsx` and to the grid in `ContractForms.tsx`:
  - id `jbj-property-advertising-agreement`
  - name "Property Advertising Agreement for Real Estate Owners"
  - JBJ letterhead: black wordmark, champagne hairline (#B89555 1px), footer with `+971 5471 67107` · `contact@jbj.ae` · `jbj.ae`
  - Sections exactly as requested: Landlord/Owner Details (incl. **Emirates ID**, **Mobile**, **Email**), Property Details (incl. **Additional Notes**), Terms & Conditions (Exclusive/Non-Exclusive · 1/2/3/6 months/until-date · advertise via portals/website/social/CRM/WhatsApp/email/partners · accuracy + termination clauses), Signature block (Landlord + JBJ Representative + dates).
- Pure white page, black headings, champagne-gold dividers — no blue/red/purple. Lives at `src/templates/jbj-paa.ts` so both Documents editor and the structured filler import the same HTML.

### 2. Forms & Agreements hub (the "system" layer)

New page `src/pages/owner/DocumentsFormsHub.tsx` mounted at `/owner/documents/forms`, plus child routes:

| Tab | Component | What it does |
|---|---|---|
| Templates | grid of cards | Lists JBJ PAA + existing templates; "Use template" → split-pane filler |
| Create New Document | `PAAFiller.tsx` (split-pane) | Left: structured fields (CRM client picker + manual). Right: live preview = template HTML with `{{tokens}}` replaced. Buttons: Save Draft · Export PDF · Send Email · Send WhatsApp · Request Signature |
| Uploaded Documents | reuse upload pipeline | Drag-drop PDF/DOCX/image → `convert-to-fillable` edge function tags `{{field}}` placeholders → renders inside the same filler |
| Sent Documents | table | Status pills: Draft · Sent · Opened · Filled · Signed · Completed · Expired |
| Signed Documents | table | Final PDFs with stamp+signature burned in |
| Stamps & Signatures | reuses `useOwnerSignatureAssets` | Upload, BG-remove (existing edge fn), drag-position on doc, save default |
| Settings | small form | Default sender, default expiry, default footer, watermark toggle |

The hub is the only **new page**; everything else is composed from existing components.

### 3. Data model (one new table + 2 migration tweaks)

```text
crm_documents
  id uuid pk
  owner_user_id uuid
  template_id text                 -- 'jbj-property-advertising-agreement' etc.
  title text
  status text  CHECK in (draft|sent|opened|filled|signed|completed|expired)
  field_values jsonb               -- structured form state
  rendered_html text                -- snapshot for audit
  pdf_path text                     -- storage key in 'documents' bucket
  client_lead_id uuid null fk crm_leads
  client_email text  client_phone text
  recipient_token text unique       -- for the public sign link
  sent_at / opened_at / filled_at / signed_at / completed_at / expires_at
  signature_asset_id / stamp_asset_id  -- fk owner_signature_assets
RLS: owner-only read/write; public SELECT allowed by recipient_token via SECURITY DEFINER fn
```

Storage: reuse existing `documents` bucket if present, else create one (private, owner-prefixed paths).

### 4. Edge functions (3 new, all small)

- `documents-render-pdf` — server-side jsPDF render of `rendered_html` with embedded stamp/signature; respects `Institutional PDF Reporting` standard.
- `documents-send` — channel router: `email` (Resend, reuse Dual-Inbox sender), `whatsapp` (existing Twilio path), `sign-link` (returns public URL with `recipient_token`). Always BCCs `contact@jbj.ae`.
- `documents-public-fill` — public endpoint the recipient hits via the token to fetch + submit fields and signature; flips status sent → opened → filled → signed.

### 5. Public signing route

`/sign/:token` (PublicRoutes) — bare champagne page, same template renderer, missing fields editable, signature-pad component (already used by `useScanSignDocuments`), submit returns to "Thank you" + emails the final PDF to client + `contact@jbj.ae`.

### 6. CRM integration

- In `CRMLeadDrawer` / `useActiveLead`, add **"Send Agreement"** button → opens `PAAFiller` pre-filled with `full_name`, `email_lower`, `phone_e164`.
- New document gets `client_lead_id` linked; resulting status appears as a timeline event in the lead profile.

### 7. UI rules (locked to project memory)

- White paper card, champagne hairlines (`border-[#B89555]/40`), black titles, body `text-[#1A1A1A]`, no gold fills (memory: `no-gold-fills`).
- Inter font only (memory: typography standard).
- All icons via `<IconTile />`.
- Buttons: `variant="gold"` (champagne) for primary, `secondary` for ghost, never raw blue/red/purple.
- Status pills use semantic palette from `crmStatusPalette.ts` (champagne/amber/emerald/blue/red).

### 8. Out of scope (keep existing behaviour)

- Existing rich-text Documents editor stays — this only **adds** a structured filler alongside it.
- Existing Form Builder, Scan & Sign, Exclusive Documents are untouched.
- No removal of any current template.

---

## Technical file list

```text
NEW
  src/templates/jbj-paa.ts                              # branded HTML template + token list
  src/pages/owner/DocumentsFormsHub.tsx                 # tabs shell
  src/pages/owner/forms/PAAFiller.tsx                   # split-pane filler
  src/pages/owner/forms/SentDocumentsTable.tsx
  src/pages/owner/forms/SignedDocumentsTable.tsx
  src/pages/owner/forms/UploadedDocumentsList.tsx
  src/pages/owner/forms/StampsAndSignaturesPanel.tsx    # wraps useOwnerSignatureAssets
  src/pages/PublicSignDocument.tsx                      # /sign/:token
  src/hooks/useCrmDocuments.ts
  supabase/functions/documents-render-pdf/index.ts
  supabase/functions/documents-send/index.ts
  supabase/functions/documents-public-fill/index.ts
  supabase/migrations/<ts>_crm_documents.sql

EDITED
  src/pages/Documents.tsx                # add JBJ PAA template object
  src/pages/ContractForms.tsx            # add card linking to filler
  src/routes/OwnerRoutes.tsx             # /owner/documents/forms + children
  src/routes/PublicRoutes.tsx            # /sign/:token
  src/components/owner-dashboard/OwnerSidebarNav.tsx   # secondary "Forms & Agreements" under Documents
  src/pages/CRMLeadsInbox.tsx (lead drawer) — Send Agreement button
```

No new dependencies. jsPDF, DOMPurify, Tailwind tokens, Resend, Twilio, Supabase storage are all already wired.

---

## After implementation — quick tour

1. **Where it lives:** Owner sidebar → **Documents → Forms & Agreements** (`/owner/documents/forms`). Also surfaced from `/contract-forms` and from any CRM lead's "Send Agreement" button.
2. **New PAA:** Templates tab → "Property Advertising Agreement" → "Use template" → pick CRM client (or fill manually) → live preview → Save Draft / Export PDF / Send Email / Send WhatsApp / Request Signature.
3. **Stamp & signature:** Stamps & Signatures tab → upload → background auto-removed → drag onto document → "Save as default".
4. **Email send:** "Send by Email" → uses Resend, BCCs `contact@jbj.ae`, recipient gets a champagne-branded message with signed link.
5. **WhatsApp send:** "Send by WhatsApp" → opens Twilio template with the same signed link prefilled to `client.phone_e164`.
6. **Final signed PDF:** once recipient signs at `/sign/<token>`, the system burns the signature+stamp, stores PDF in the `documents` bucket, marks status **Signed/Completed**, emails copies to client + `contact@jbj.ae`, and the file appears under **Signed Documents**.

---

## Clarifying questions before I implement

1. **Single template vs. full template family in this PR?** I can ship just the JBJ PAA now and reuse the same filler shell for the next 6 contracts later — recommended — or wire MOU + NOC + Tenancy + Form F together with the PAA in this same change.
2. **Signing flow:** in-app token link only, or do you also want **DocuSign / SignNow** as an option? (current code has neither — staying in-app keeps zero new vendor cost).
3. **WhatsApp channel:** use the existing **Twilio WhatsApp Business** sender already in `useCrossChannelSend`, or fall back to a `wa.me` deep link if Twilio isn't approved for this template yet?
4. **Footer requirement:** show `+971 5471 67107` and `contact@jbj.ae` on **every page** of the PDF, or just the cover page?

Tell me anything you want adjusted and I'll implement on approval.
