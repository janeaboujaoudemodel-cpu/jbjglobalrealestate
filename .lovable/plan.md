
## Why "unable to load document"

Your project has two parallel signing engines:

- **Engine A — DocuSign-style (existing, mature):** `esign_envelopes` + `esign_recipients` + `esign_fields` + drag-drop `DocumentFieldPlacer` + adopt-signature/stamp + Contract Vault + public route `/sign/:token` (`SignDocument.tsx`) + edge functions `esign-send-for-signature`, `esign-process-signature`, `esign-complete-envelope`, `apply-adopt-signature`.
- **Engine B — PAA HTML (built last turn):** `crm_documents` table + HTML template + public route `/documents/sign/:token` (`PublicSignDocument.tsx`) + edge functions `documents-send`, `documents-public-fill`.

The link you opened is `/sign/:token` (Engine A) but the token belongs to a `crm_documents` row (Engine B). Engine A queries `esign_recipients` → no row → **"unable to load document"**.

## Decision (you approved)

Merge Engine B into Engine A. Drop the parallel `crm_documents` flow. The PAA becomes a first-class **template** that produces a real `esign_envelope` with placed fields, sent via the existing pipeline. This gives you:

- Drag-drop / edit / add / remove fields anytime.
- Adopt-stamp, adopt-signature (already saved per user via `owner_signature_assets`).
- Auto-fill **Date** field with today on placement; auto-fill **Owner Signature** + **Owner Stamp** from your saved defaults.
- Client signs at `/sign/:token` (the existing branded flow) — no second route.
- Signed PDF auto-archived in Contract Vault (`signed_contracts`) — already wired by `apply-adopt-signature`.
- Email/WhatsApp delivery from your domain via existing `esign-send-for-signature` (Resend) + Twilio.

## What you already have (keep, no changes)

```text
Engine A (full DocuSign workflow)
├─ Tables       esign_envelopes, esign_recipients, esign_fields,
│               signed_contracts, owner_signature_assets
├─ Editor       src/pages/e-signature/CreateEnvelope.tsx
├─ Field placer src/components/e-signature/DocumentFieldPlacer.tsx
│               (signature, initials, date, text, checkbox, stamp)
├─ Sign pad     src/components/e-signature/ESignaturePad.tsx
├─ Adopt studio src/pages/owner/sign/AdoptSignatureStudio.tsx
├─ Public sign  src/pages/e-signature/SignDocument.tsx  →  /sign/:token
├─ Vault        src/pages/owner/contracts/ContractVault.tsx
└─ Edge fns     esign-send-for-signature, esign-process-signature,
                esign-complete-envelope, esign-auto-detect-fields,
                esign-send-reminder, apply-adopt-signature
```

## What's missing / broken (this PR fixes)

1. **Templates are HTML-only** — no path from PAA → envelope. `Documents & Forms Hub` saves to `crm_documents`, which Engine A can't sign.
2. **No Leasing/Selling categories.**
3. **Date / Stamp / Signature fields don't auto-populate on placement** — the placer drops empty fields; the owner must re-sign each time even though the asset is saved.
4. **No client-side editor for the PAA fields** before sending.
5. **`crm_documents` flow + `/documents/sign/:token` route are dead-ends.**

## Plan

### 1. Database migration

```sql
-- Add category + template metadata to envelopes
ALTER TABLE public.esign_envelopes
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IN ('leasing','selling','other')) DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS template_key text,            -- e.g. 'jbj-paa'
  ADD COLUMN IF NOT EXISTS template_html text,           -- editable HTML body
  ADD COLUMN IF NOT EXISTS template_field_values jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS client_lead_id uuid;

-- Reusable template library (owner-editable)
CREATE TABLE IF NOT EXISTS public.esign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  key text NOT NULL,                 -- 'jbj-paa', 'jbj-tenancy', ...
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('leasing','selling','other')),
  html_body text NOT NULL,           -- editable HTML
  field_schema jsonb NOT NULL,       -- [{key,label,type,page,x,y,w,h,role}]
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_user_id, key)
);
ALTER TABLE public.esign_templates ENABLE ROW LEVEL SECURITY;
-- RLS: owner-only read/write (admin/founder via has_role).

-- Deprecate Engine B (keep table for audit, stop writing)
-- crm_documents stays; new sends go through esign_envelopes.
```

### 2. Template registry

- Seed two system templates owned by founder:
  - `jbj-paa` (Property Advertising Agreement) → category `leasing`.
  - `jbj-listing-authorisation` (sales listing authorisation) → category `selling`.
- Template `field_schema` enumerates default field positions: Owner Signature, Owner Stamp, Auto-Date, Client Signature, Client Initials, plus text fields (price, address, etc).

### 3. New unified hub: replace `DocumentsFormsHub`

`src/pages/owner/DocumentsFormsHub.tsx` becomes:
- Tabs: **Templates · Drafts · Sent · Signed · Stamps & Signatures**.
- Filter chips: `All · Leasing · Selling`.
- "Create from template" → opens `CreateEnvelope` pre-loaded with the template HTML rendered to a single-page PDF (jsPDF) and `field_schema` placed onto that PDF.

### 4. Wire auto-fill into `DocumentFieldPlacer`

Edit `src/components/e-signature/DocumentFieldPlacer.tsx`:
- On field drop, if `recipient.role === 'owner'`:
  - `type==='date'` → set `field.value = today` (locked, re-evaluated at send).
  - `type==='signature'` → preload `field.value = defaultSignatureAsset.image_url`.
  - `type==='stamp'` → preload `field.value = defaultStampAsset.image_url`.
- New `FieldContentRenderer` already handles image rendering — just pass the asset URL.
- Owner can still click any field to swap.

### 5. Client signing — keep `/sign/:token` (Engine A)

No new route. `SignDocument.tsx` already:
- Loads document from `esign_recipients` by token.
- Renders PDF via `pdfjs`.
- Shows only fields assigned to the client.
- Submits via `esign-process-signature` → triggers `esign-complete-envelope` → writes to `signed_contracts` → emails sender + recipient with the final PDF.

### 6. Send by Email / WhatsApp

Already done by `esign-send-for-signature` (Resend, BCC `contact@jbj.ae`). Extend it to accept `channel: 'whatsapp'` and call Twilio (gateway) or fall back to `wa.me?text=...&url=signing_link`.

### 7. CRM link

Add "Send Agreement" button in `CRMLeadDrawer`:
- Pre-fills client name / email / phone.
- Opens template picker (filtered to user's category context).
- Creates envelope with `client_lead_id` set; logs activity on lead timeline.

### 8. Decommission dead routes

- Remove `/documents/sign/:token` from `StandaloneRoutes`.
- Delete `PublicSignDocument.tsx`.
- Delete `documents-send` and `documents-public-fill` edge functions.
- Keep `crm_documents` table (audit) but stop inserting into it; redirect old PAA tokens to a migration helper that creates an envelope on the fly.

### 9. Token migration / fix the broken link

For your already-broken link, add a one-shot redirect: if `/sign/:token` doesn't find an `esign_recipients` row, look up `crm_documents.recipient_token`, build an envelope from the PAA template + saved field values, then redirect to the new envelope's signing URL. This rescues any links you already shared.

### 10. Redeploy

```text
esign-send-for-signature   (extended for WhatsApp)
esign-process-signature    (no change but redeploy)
esign-complete-envelope    (no change but redeploy)
apply-adopt-signature      (no change but redeploy)
+ delete documents-send, documents-public-fill
```

## Where you'll find it after merge

```text
Sidebar → Documents → Forms & Agreements
  ├─ Templates    [Leasing | Selling | All]
  │     "Property Advertising Agreement"  → Use template
  ├─ Drafts       envelopes status='draft'
  ├─ Sent         envelopes status in (sent,opened,partially_signed)
  ├─ Signed       envelopes status='completed'  (also in Contract Vault)
  └─ Stamps & Signatures  (existing AdoptSignatureStudio)
```

### How to use

1. **Create PAA**: Forms & Agreements → Templates → Leasing → "Property Advertising Agreement" → fill owner/property fields → opens field-placer with date/signature/stamp pre-positioned and pre-filled from your saved assets → set recipient (client email + phone) → Send.
2. **Upload stamp/signature**: sidebar → Documents → Adopt Signature Studio (or Stamps & Signatures tab inside the hub). Marked default is auto-injected into every future envelope.
3. **Email**: choose `email` channel on send — Resend, BCC `contact@jbj.ae`.
4. **WhatsApp**: choose `whatsapp` — Twilio if configured, else opens `wa.me` with prefilled signing link.
5. **Export signed PDF**: appears in Contract Vault → Download. Also auto-emailed to both parties on completion.

## Risks / notes

- The PAA HTML currently lives in `src/templates/jbjPropertyAdvertisingAgreement.ts`. We'll convert it to a one-page jsPDF render at envelope-creation time so the existing PDF-based field placer works unmodified.
- Owner default signature/stamp must already exist; if missing, the placer prompts to adopt before sending (existing `AdoptSignatureStudio` flow).
- CI has a "no removal" policy — `crm_documents` table is preserved (audit only).
