## Goal

Three things:
1. Make **Approve & Send** (and the Send-for-Signature dialog) feel snappy.
2. Make sure that once Approve & Send fires, the envelope/recipient correctly moves into "Pending Signature" on the dashboard immediately — not stuck at 0.
3. Auto-detect when the client emails the signed copy back, mark the envelope/recipient as **signed** (with name + date/time), surface it in the Signed Contracts section, and stamp the generated PAA form with "Signed by {name} on {dd/mm/yyyy hh:mm}".

## Root causes

### 1) Slow Approve & Send

`supabase/functions/esign-send-for-signature/index.ts` runs everything sequentially per recipient:
- `fetchEmailAttachment(attachment_url, ...)` downloads the PDF from storage **before** every Resend call (≈500‑2000 ms).
- For each extra attachment another sequential fetch.
- After each Resend call: per-recipient `update esign_recipients`, then `insert esign_audit_log` (each its own round trip).
- Finally a second envelope `update` + a second `insert esign_audit_log`.

For a typical 1-recipient PAA send that's ~6‑8 sequential round trips. The dialog also `await`s a metadata `update esign_envelopes` and an `update esign_recipients` (for phone) **before** the send call.

### 2) "Pending" stays at 0 after sending

Dashboard `stats.pending` counts envelopes whose `status ∈ {sent, viewed, partially_signed}`. The edge function does set `status='sent'`, but:
- `EnvelopeDetail.tsx` and `ESignatureDashboard.tsx` don't `refetch()` after Send-for-Signature dialog returns. The user only sees the new status after a hard reload.
- If the edge function 500s mid-loop (any one Resend failure throws), the envelope status update at the bottom never runs and the recipient row is left as `draft`/`sent` partially. There's no transactional guarantee.

### 3) Signed‑back never syncs

There is **no** glue between the Gmail inbox classifier (`classify-jbj-inbox`) and the e‑signature tables. When the client replies "signed" with a PDF attached we tag the inbox thread `category=contracts, status=signed`, but we never:
- Match the reply to an `esign_envelopes` row.
- Update `esign_recipients.signed_at` / `status='signed'`.
- Move the envelope to `completed`.
- Save the returned signed PDF to `esign_envelope_files` so it appears in the Signed Contracts section / generated PAA form.

That's why the doc still says "Pending — 0 signed" even after Omar replies.

## Fixes

### A. `supabase/functions/esign-send-for-signature/index.ts` — make it fast and resilient

1. Hoist the attachment fetches **out of the per-recipient loop** — fetch once, reuse for all recipients.
2. Run the per-recipient block in parallel with `await Promise.all(recipients.map(...))`.
3. Inside each recipient block, fire the recipient `update`, the audit-log `insert`, and the Resend POST **in parallel** (`Promise.allSettled`) — they don't depend on each other.
4. After the loop, do the envelope `update` + final `audit_log insert` as a single `Promise.all`.
5. If Resend fails for one recipient, mark **only that recipient** as `failed` and continue, then return 207-style `{ ok: true, failures: [...] }` instead of throwing 500. The envelope still flips to `sent` so the dashboard reflects reality.
6. Return the new envelope row in the response so the client can update its cache without a refetch.

### B. `src/components/e-signature/SendViaEmailDialog.tsx` and `SendForSignatureDialog.tsx`

1. Drop the pre-send `await supabase.from("esign_envelopes").update({ metadata: ... })` — fold cc/bcc into the same edge-function payload (already supported); persist metadata server‑side in the same loop.
2. Fire the optimistic UI immediately: close dialog + `toast.success("Sending…")`, then `await` the response and replace toast with success/failure. Users perceive ≤200 ms instead of 1.5–4 s.
3. After the send promise resolves, call the parent `onSent?.()` which already invalidates `esign_envelopes` queries. Add `qc.invalidateQueries({ queryKey: ["esign_envelopes"] })` and `["esign_recipients", envelopeId]` to make the dashboard's **Pending Signature** counter update instantly.

### C. New edge function `esign-sync-from-inbox` + classifier wiring

Create `supabase/functions/esign-sync-from-inbox/index.ts`:

Input (called from `classify-jbj-inbox` whenever it tags `category=contracts, status=signed`, or from a new "Mark as signed reply" button on the inbox thread):
```ts
{ thread_id, message_id, from_email, sender_name, subject, attachments:[{name,url,content_type}], received_at }
```

Logic:
1. Find the most recent `esign_envelopes` row where `status in ('sent','viewed','partially_signed')` and any `esign_recipients.email = from_email`. Tiebreaker: subject/doc_number match.
2. If found:
   - Update the matching `esign_recipient`: `status='signed'`, `signed_at=received_at`, `metadata.signed_via='email_reply'`, `metadata.thread_id`, `metadata.signer_name=sender_name`.
   - For each PDF attachment: copy to the `esign-signed` storage bucket and insert into `esign_envelope_files` with `kind='client_signed'`.
   - If all recipients of role `client` are now signed → set envelope `status='completed'`, `completed_at=now()`. Otherwise `partially_signed`.
   - Insert `esign_audit_log` `{action:'signed_by_email', actor_email:from_email, description:"Signed copy received via email reply", metadata:{thread_id}}`.
3. Trigger `esign-complete-envelope` (existing) to render the final PDF with the countersignature stamp.

Wire-up:
- Inside `classify-jbj-inbox/index.ts`, after the persist step, when `category==='contracts' && status==='signed' && attachments.length`, fire-and-forget `fetch(SUPABASE_URL+'/functions/v1/esign-sync-from-inbox', ...)` with the service-role internal token.
- Also expose a manual "Link to envelope & mark signed" button on the inbox thread that calls the same function with a chosen `envelope_id` (covers fuzzy-match misses).

### D. PAA generated form — show "Signed by Omar on dd/mm/yyyy hh:mm"

`src/pages/e-signature/EnvelopeDetail.tsx` already reads `clientRec?.signed_at` (line 866 / line 245) but the PAA template never receives the signed string. Two small touches:

1. In `useAgreementSaver`/render path, pass `signed_by_client` and `signed_at_client` into the PAA HTML build (`buildPAAHtml`) tokens.
2. In `src/templates/jbjPropertyAdvertisingAgreement.ts`, in the "Client signature" row, render the existing client signature block + below it: `Signed by {{client_signed_name}} on {{client_signed_at_human}} (received via email reply)` whenever those tokens are present. Falls back to the placeholder when not signed.

### E. Dashboard counters

`ESignatureDashboard.tsx`:
- Subscribe to `esign_envelopes` realtime (`postgres_changes`) once on mount → invalidate the query. This guarantees Pending/Completed counters move within ~1 s of any send/sign event, no manual refresh.

## Verification (end‑to‑end)

1. Open `/owner/documents/forms/<id>` (current PAA), click **Send for Signature → Approve & Send**:
   - Toast appears within ~300 ms; dialog closes.
   - Dashboard "Pending Signature" goes from N → N+1 within ~1 s.
   - Server log shows recipient row `status='sent', sent_at=now`, envelope `status='sent'`.
2. Reply from `omar@…` to the sent thread with the signed PDF attached:
   - Within one inbox‑sync cycle: classifier tags the thread, `esign-sync-from-inbox` runs.
   - Envelope flips to `completed`, recipient row `status='signed', signed_at=…`.
   - Dashboard "Pending Signature" decrements, "Completed" increments.
   - Envelope detail shows green "Signed by Omar on 14/05/2026 17:42 (via email reply)"; signed PDF appears in **Signed Contracts** + the rendered PAA shows the same line under the client signature box.
3. Negative path: Resend rate‑limits one recipient → that recipient gets `status='failed'`, others stay sent, envelope still `sent`, banner shows partial failure.

## Files touched

- `supabase/functions/esign-send-for-signature/index.ts` — parallelize, hoist attachments, partial-failure response.
- `supabase/functions/esign-sync-from-inbox/index.ts` — **new** function.
- `supabase/functions/classify-jbj-inbox/index.ts` — fire-and-forget call to the new function.
- `src/components/e-signature/SendViaEmailDialog.tsx` — drop pre-send awaits, invalidate caches, optimistic toast.
- `src/components/e-signature/SendForSignatureDialog.tsx` — same treatment for the legacy path.
- `src/pages/e-signature/EnvelopeDetail.tsx` — pass signed-by tokens, realtime subscription on detail.
- `src/pages/e-signature/ESignatureDashboard.tsx` — realtime subscription on `esign_envelopes`.
- `src/templates/jbjPropertyAdvertisingAgreement.ts` — render "Signed by {name} on {datetime}" line when present.
- `src/hooks/useEsignTemplates.ts` (or a small new `useEsignRealtime.ts`) — shared realtime subscription helper.

No DB schema changes required; all needed columns (`signed_at`, `status`, `metadata`, `completed_at`, `esign_envelope_files`) already exist.