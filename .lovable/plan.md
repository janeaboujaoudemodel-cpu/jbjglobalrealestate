# Forms & Agreements Hub — Unification + PAA Polish + Signature Workflow

Big scope, so I'm grouping into 7 focused workstreams. After approval I'll execute them in order, then return to Phase 6/7 + bulk-select reflection + AI Suggestions tab redesign from the previous plan.

## 1. PAA preview rendering — kill the blank page + hairline gap

**Problem:** In `/owner/documents/forms/:id` the preview iframe shows a giant blank page under the footer that "self-heals" after a moment, and even after, a ~2cm white strip remains. Download/email outputs are perfect — only the on-screen preview is broken.

**Fix (preview-only, zero changes to PDF/email pipeline):**
- In the form preview component, switch the iframe sizing from fixed `100vh`/A4-multiplied math to a `ResizeObserver` that measures the rendered document body and sets the iframe height to `scrollHeight` after fonts + images load.
- Add `onLoad` + `document.fonts.ready` + image `decode()` await before final height set (eliminates the "big blank → snaps back" flash).
- Remove the trailing `min-height` / `padding-bottom` on the preview wrapper that produces the 2cm white strip.
- Keep print/PDF CSS untouched (scoped under `@media print` and the existing PDF render path).

## 2. "Send Test Email" — premium download CTA + no-block hosted page

**Problem:** Test email itself is good. But:
- "Download PDF" button in the email shows a download-arrow icon — user wants it removed and styled premium.
- Direct Supabase Storage link is `ERR_BLOCKED_BY_CLIENT` on desktop (ad-blockers block `*.supabase.co`) and on mobile opens an ugly `about:blank` with "From: mdafrewypkkrildjgtey.supabase.co".

**Fix:**
- In the transactional email template (`send-paa-test-email` / corresponding template): replace the icon button with a premium gold-bordered CTA `Click here to download your document` (no icon, champagne fill, gold hairline, ink text — matches brand standard).
- Stop linking directly to the raw Supabase Storage URL. Instead link to a new branded route `/d/:token` served from our own domain (`jbj.ae`).
- New edge function `document-download-proxy`:
  - Validates a signed short-lived token (HMAC, 7-day TTL).
  - Streams the PDF back with `Content-Disposition: attachment; filename="JBJ-PAA-...pdf"` and `Content-Type: application/pdf`.
  - Sets `Referrer-Policy`, proper CORS, and a friendly `From:` filename so mobile Safari shows "From: jbj.ae" instead of the supabase host.
- New public page `/d/:token` (`PublicDocumentDownload.tsx`):
  - Branded JBJ header (logo, "JBJ GLOBAL REAL ESTATE L.L.C S.O.C").
  - Headline: "Your document is ready" + subline + big gold "Download PDF" button that hits the proxy.
  - Fallback "Open in new tab" link.
  - Eliminates the blank-page experience on mobile and the ad-blocker block on desktop.

## 3. Send-via-Email signature picker — gold, not blue + per-signature isolation

**Problem:** In the Send-via-Email flow:
- Hover/active state on signature cards is blue.
- The JBJ signature field border is blue and shows blue on hover.
- Clicking "JBJ Front Desk" inserts ALL signatures (front desk + help desk + support) at once instead of just the selected one.

**Fix:**
- In `SignaturePickerDialog` / `SignatureField`: replace `border-blue-*`, `ring-blue-*`, `hover:bg-blue-*` with the standard champagne tokens (`border-[#B89555]/40`, `hover:bg-[#EFE6D6]`, `ring-[#B89555]`).
- Audit `useSignatures` selector — currently it returns the whole signature group. Change selection logic so each row (`front-desk`, `help-desk`, `support`) is an independent `signature_id` and only the clicked one is attached to the outgoing email.

## 4. Default subject + body for PAA send-for-signature

**Problem:** Default subject + email card both say "Please sign — Signature Required". User wants:
- Subject line by default: a real subject (e.g., `Property Advertising Agreement — Signature Required · JBJ-PAA-LEASING-####`).
- Card body retains "Signature Required" as the visible CTA section.
- Per-document override stays available, but the saved fallback template for PAA must always start with this subject.

**Fix:**
- Add a `default_subject_template` and `default_body_template` to the PAA template config (DB row in `document_templates` or constant in `paaTemplate.ts`).
- `PAASendDialog` initializes Subject from `default_subject_template` interpolated with `{doc_number}` / `{recipient_name}`.
- Body card keeps the "Signature Required" headline; subject is independent.

## 5. Signed-back contract intake + Application status

**Problem:** Client signs and emails the PDF back — owner receives nothing in the dashboard. There's no place in Forms to see "Pending application / Contract submitted / Approved".

**Fix:**
- Add `application_status` column to `document_send_records` (`sent | viewed | signed_returned | approved | rejected`) + `signed_pdf_url`, `signed_returned_at`, `reviewed_by`, `reviewed_at`.
- Inbound hook: when `comm-inbound-sync` (Gmail) ingests a reply on a thread tagged with a `document_send_id`, and the reply has a PDF attachment, auto-attach the PDF to that send record, set `application_status = 'signed_returned'`, and notify the owner (in-app toast + thank-you transactional email back to the client).
- New "Applications" tab inside the form detail page (`/owner/documents/forms/:id`):
  - Lists every send record for this document with status chips.
  - "Signed Returned" rows show the signed PDF inline + Approve / Reject buttons.
  - On Approve: status → `approved`, archived in form record. No further client email is sent (per user instruction).
- Thank-you transactional email to client when signed PDF is detected (template: `paa-signed-thank-you`).

## 6. Unified "Forms & Agreements" hub — absorb e-Signature + Owner Forms + Tools

**Problem:** E-signature, owner form, and the three tools are separate destinations. User wants one hub: Forms & Agreements, with E-Signature as an inline section (no redirect).

**Fix:**
- Promote `/owner/documents/forms` to the canonical hub at `/owner/forms-agreements` (keep old routes as redirects to preserve memory).
- Subheader sections: `Templates` · `My Documents` · `E-Signature` · `Applications` · `Archive`.
- "E-Signature" section renders the existing E-Signature page contents inline (Upload & Sign / Signature Studio / Blank Letter AI / Contract Lawyer AI / Stats / Recent Documents) — no navigation.
- Owner Forms (PAA, NDAs, etc.) appear as Templates in the same hub.
- Sidebar item "Documents" stays, but its child "E-Signature" link becomes `?section=e-signature` inside the hub (matches Unified Owner Hub Standard).

## 7. Responsive overflow audit (Recipients & CCs "Viewed" badge bug)

**Problem:** When the chat is open and the preview width shrinks, "Viewed" badge spills out of the Recipients card. Same pattern occurs on multiple pages → also breaks on phone.

**Fix:**
- In `RecipientsCard`/`RecipientRow`: switch row from `flex` with fixed columns to `flex-wrap` + `min-w-0` on the name/email column with `truncate`, and let the status badge wrap to a new line under the email when width < ~280px.
- Add `overflow-hidden` to the parent card and `min-w-0` to all flex children that contain truncatable text.
- Sweep the form preview surrounding panels (`Document` card, action button grid, `Bulk paste` textarea) for the same pattern: every `flex` row gets `min-w-0` + `flex-wrap` where relevant; absolute-positioned chips switch to inline.
- Verify at 1041px (current preview), 768px, 414px (mobile).

## Technical notes

```text
DB migration
  - documents/document_send_records: + application_status, signed_pdf_url,
    signed_returned_at, reviewed_by, reviewed_at
  - document_templates: + default_subject_template, default_body_template
  - signed_documents bucket: private, RLS owner-scoped
Edge functions
  - document-download-proxy        (new) — branded streaming download
  - paa-signed-intake              (new, called from comm-inbound-sync) — attaches PDF, flips status
  - send-transactional-email       — new template paa-signed-thank-you
Frontend
  - PublicDocumentDownload.tsx     (new public route /d/:token)
  - FormsAgreementsHub.tsx         (new unified shell, replaces split routes)
  - ApplicationsTab.tsx            (new inside form detail)
  - SignaturePickerDialog.tsx      — gold tokens, per-row selection
  - PAAFormPreview.tsx             — ResizeObserver height, kill bottom strip
  - PAASendDialog.tsx              — default subject template
  - RecipientsCard.tsx + sweep     — min-w-0 / flex-wrap responsive fix
Email template
  - paa-test-email / paa-signature-request: replace download arrow with
    premium gold CTA, link to /d/:token instead of raw storage URL
```

After this lands, I'll resume Phase 6 (AI command chat panel) + Phase 7 (follow-up intelligence + fully wired bulk actions), then Bulk-select / Gmail-modify reflection and the AI Suggestions tab redesign from the prior plan.
