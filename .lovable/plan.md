## 1. Site-wide Reply-To = contact@jbj.ae for ALL outbound mail

Currently only the four esign edge functions set `reply_to`. Extend it to every Resend send across the project.

- Add `REPLY_TO_CONTACT = "contact@jbj.ae"` to `supabase/functions/_shared/outreachIdentity.ts` and a small helper `withReplyTo(payload)` that injects `reply_to` if missing.
- Sweep every edge function that calls `resend.emails.send` or hits `/emails` on the Resend gateway and inject `reply_to: "contact@jbj.ae"` (compose-branded-email, send-transactional-email, owner-ai-reply, broker-daily-report, submit-support-ticket, esign-*, marketing senders, ticket confirmations, etc.).
- Mirror constant in `src/config/outreachIdentity.ts` so previews show the same value.

## 2. noreply@jbj.ae auto-bounce — apply globally, not only inbound webhook

- Already implemented in `resend-inbound-email-webhook`; extract the bounce-reply HTML + send logic into `_shared/noreplyBounce.ts`.
- Any other inbound entry points (forwarder rules, support inbox handler) call this helper so a message to `noreply@jbj.ae` from anywhere returns the branded "this inbox does not receive messages — please write to contact@jbj.ae" auto-reply and is NOT ingested.
- Strip the previous catch-all routing line that mapped `noreply` → `general`.

## 3. PAA template — remove footer blank, fix header, fix tenancy field

Edit `src/templates/jbjPropertyAdvertisingAgreement.ts`:

**Header (`monogram-wordmark` branch)**
- Remove the small "JBJ GLOBAL REAL ESTATE" wordmark sitting under the monogram.
- Increase monogram size (e.g. 72→104px).
- Keep everything from the gold divider down (legal name line, "Property Advertising Agreement" title, Doc No.) **untouched**.

**Footer (`three-column` branch)**
- Keep only: office address (left), `contact@jbj.ae · jbj.ae` (centre), `+971 54 716 7107` (right).
- Delete the "Trade Licence No. 1591031 · Dubai Chamber 666113 · CR 2789619" line entirely — user did not authorise these and doesn't recognise their source.
- Remove the trailing empty wrapper / min-height that's producing the big blank band beneath the footer. Footer ends exactly after the contact row.

**Tenancy / vacancy data binding**
- The "Vacant" string is hard-coded or pulled from a stale snapshot. Wire the body to read `envelope.metadata.property.tenancy_status` (and `vacant_on` date) from the live envelope record so edits in the form ("Tenanted, vacant on YYYY-MM-DD") propagate into the rendered PDF.
- On envelope detail open, refetch the related listing/lead to ensure latest tenancy state is used at render time.

**Lock the template**
- Mark the file with a `// LOCKED TEMPLATE — do not modify without owner approval` banner and add it to `.lovable/locked-templates.json` so future agent edits require explicit unlock.
- This becomes the standard PAA — only per-recipient fields (names, property address, dates, tenancy) vary.

## 4. Reset Omar envelope after template fix

Once the template is correct:
- Re-render the document for envelope `810df24a-…`, replace stored snapshot.
- Confirm `status='draft'`, no signature, no signed PDF, ready for the real send.

## 5. Branded email composer — document-aware

In the branded compose flow opened from `EnvelopeDetail`:

- When a recipient is selected/typed, query their related documents (envelopes addressed to them or their email) and show a "Detected documents" panel.
- For each detected doc, an **Attach** toggle. When attached, the composer auto-fills:
  - **Subject** from a per-template default (e.g. "Property Advertising Agreement — {{property}}")
  - **Body** from a per-template default with the `/sign/{token}` CTA injected
  - The PDF as a Resend attachment (rendered via `renderHtmlToPdfBlob`)
- A "Write custom" toggle reverts to a blank subject/body so the owner can author freely.
- Templated subject/body strings live in `src/config/emailTemplates/esignDocumentTemplates.ts` keyed by document type so they're reusable.

## 6. "Send via Email" button on `/e-signature/:id` — preview-first flow

Currently the button jumps straight into the send path. Replace with:

1. Click → open the existing branded preview modal pre-rendered with the recipient, the attached PDF and the templated body.
2. Modal exposes three actions:
   - **Send test** → sends to `infoo.jane@gmail.com` only (uses existing `esign-send-test-email`).
   - **Approve & Send** → sends to the real recipient via `esign-send-for-signature`.
   - **Cancel**.
3. Default headers in both modes:
   - `from`: `noreply@jbj.ae` (display name "JBJ Global Real Estate")
   - `reply_to`: `contact@jbj.ae`
   - `cc`: `infoo.jane@gmail.com` (editable chip — owner can remove before send)
   - Provider: Resend
4. Show the resolved headers (From / Reply-To / CC) in the preview header strip so the owner sees exactly what will go out.

## Technical notes

- All Resend payload mutations stay server-side; client only passes the editable subject/body/cc.
- Locked template enforcement: a CI script already exists for theme/contrast — add `scripts/locked-templates-check.mjs` that fails the build if a locked template's hash changes without an `// UNLOCK:` directive.
- No new edge functions; reuse `esign-send-test-email`, `esign-send-for-signature`, `compose-branded-email`.
- Tenancy data path: `crm_listings.tenancy_status` + `crm_listings.vacant_on` → joined into envelope metadata at render time.
- Noreply bounce helper signature: `await sendNoreplyBounce({ to, originalSubject })` → returns `{ logged: true }` and writes `email_send_log` row tagged `noreply_autoreply`.
