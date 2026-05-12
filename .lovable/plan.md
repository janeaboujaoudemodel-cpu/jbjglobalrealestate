## What's wrong right now (Omar Allam test envelope)

I dug into the envelope `810df24a-145b-48f2-8e5a-f18e44e0c576` ("JBJ Property Advertising Agreement — Leasing", recipient *Omar Allam Niazi Shadid*). In the database it is currently `status = completed`, `signed_at = 2026-05-09 20:14`, with a `signature_data` blob saved on the recipient. That's why the rendered PDF looks "signed" — the system thinks it really was signed during your test.

On top of that the template has three real bugs that make the document look fake even when nobody has signed:

1. **Autofilled landlord name** — `EnvelopeDetail.tsx` (line 160) and `jbjPropertyAdvertisingAgreement.ts` (line 450) fall back to `landlord_name` for the printed *Name* under the Landlord signature block, rendered in a script/cursive font. So Omar's name appears in handwriting even though he never typed it.
2. **Autofilled signature date** — `EnvelopeDetail.tsx` (line 161) writes today's date into `landlord_signature_date` whenever the recipient row is `signed`. That's also a fabrication.
3. **Footer collapses vertically** — `footerHtml()` uses `display:grid; grid-template-columns: 1.3fr 1fr 1.1fr`, but the wrapper sits inside a flex column that drops to a single track on certain widths / when rendered for PDF. The licence line `LIC 1591031 · DCCI 666113 · CR 2789619` is also unlabelled, so it reads as random codes.

The phone number `+971 56 591 1000` is hardcoded in ~25 places; it needs to become `+971 54 716 7107` everywhere it's surfaced.

---

## Plan

### 1. Reset the Omar Allam test envelope to "not signed"

SQL migration (one-shot, scoped to that envelope):

- `esign_envelopes`: `status = 'sent'`, `completed_at = NULL`, `signed_document_url = NULL`.
- `esign_recipients` for that envelope: `status = 'sent'`, `signed_at = NULL`, `signature_data = NULL`, `viewed_at = NULL` (so the signing link is fresh).
- Insert one `esign_audit_log` row noting "test envelope reset by owner".

### 2. Stop the template from ever inventing a name or date

- `src/templates/jbjPropertyAdvertisingAgreement.ts` line 450: render only `landlord_signature_name` (no fallback to `landlord_name`). If empty, leave the line blank — the signer's typed name will fill it on real signing.
- `src/pages/e-signature/EnvelopeDetail.tsx` lines 157-163: drop the autofill of `landlord_signature_name` (no `signedClient.name` fallback) and the autofill of `landlord_signature_date`. Only the captured `signature_data` image is rendered in the *Signature* column when truly signed. If you ever want the printed name back, the signer must type it on the sign page.
- Keep `clientSignatureUrl` rendering (real captured pad signature) — that's the only authentic mark.

### 3. Make the unsigned PDF downloadable to send to the client manually

On `EnvelopeDetail.tsx`, add a new action button **"Download blank PDF (to send manually)"** next to the existing download. It calls the existing HTML→PDF path (the same renderer used for the signed copy) but with `renderMode: "final"`, no `clientSignatureUrl`, and `landlord_signature_name`/`landlord_signature_date` left blank — producing a clean, printable PDF the client can sign by hand or on DocuSign. Filename: `JBJ-PAA-<docNumber>-unsigned.pdf`.

### 4. Fix the footer

In `footerHtml()` (`jbjPropertyAdvertisingAgreement.ts` lines 213-232) for the `three-column` style:

- Replace `display:grid` with `display:table; width:100%; table-layout:fixed;` and three `display:table-cell` columns. Tables print and PDF-render reliably and never collapse.
- Left cell: monogram + `J B J GLOBAL REAL ESTATE L.L.C S.O.C` on one line, office address on the next.
- Centre cell: email + website.
- Right cell: phone on top, then licence line **with proper labels**: `Trade Licence No. 1591031 · Dubai Chamber 666113 · CR 2789619` so it reads as institutional credentials, not random codes.
- Add `min-width:0; word-break:break-word;` on cells so long strings never push to a new line.

### 5. Replace the phone number site-wide

Single source of truth: change `COMPANY_CONTACT.phone` in `src/config/companyLegal.ts` to `+971 54 716 7107`. Then sweep and update every hardcoded occurrence so call/WhatsApp links and AI prompts stay in sync:

- `src/constants/stats.ts` — `phone`, `phoneRaw`, `whatsappNumber`
- `src/config/master-lock.ts` — `PRIMARY_PHONE`
- `src/config/compliance-engine.ts`
- `src/config/ai-personalities.ts`
- `src/config/ai-role-specific-training.ts`
- `src/components/AdvancedBrokerToolkit.tsx` (tel link + display)
- `src/components/BrokerCircleSection.tsx` (tel link + display)
- `src/components/PropertyReportModal.tsx` (`WHATSAPP_NUMBER`)
- `src/components/SEOHead.tsx`
- `src/pages/usePresentations.ts` (two strings)
- `src/pages/AIPersonalShopper.tsx`
- `supabase/functions/vapi-webhook/index.ts`
- `supabase/functions/ai-chat-support/index.ts` (display + the `565911000` allow-list)
- `supabase/functions/ai-chat-stream/index.ts` (same)
- `supabase/functions/submit-support-ticket/index.ts` (WhatsApp link)

The two old SQL migrations that contain `+971565911000` will be left as-is (historical), but a new migration will update any live row that still references the old number in `crm_contacts.phone`, `crm_companies.phone`, `email_templates.body_html`, `ai_response_templates.response_text`, and the welcome-broker email template, replacing `971565911000`/`+971 56 591 1000` with the new number.

### 6. Sanity check after deploy

- Re-open the Omar envelope at `/e-signature/810df24a-…` → status badge says "Sent", no name/signature/date appear in the Landlord block, footer renders as three horizontal columns with labelled credentials and the new phone.
- Click **Download blank PDF** → verify the PDF has empty signature row.
- `rg "565911000|56 591 1000"` returns only the historical migration files.

### Technical notes

- No schema change beyond a one-row reset. No new tables, no RLS edits.
- `renderTemplateHtml` already accepts `clientSignatureUrl: null` — the unsigned download path just passes the existing renderer with empty signature inputs; no new template variant needed.
- The footer change is HTML/CSS only inside `footerHtml()`; PAA layout version can stay at 10 (semantics unchanged).
