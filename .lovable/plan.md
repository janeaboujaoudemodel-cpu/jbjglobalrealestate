## Goal

Every signer must receive a premium "Thank you for signing" email **the moment they finish signing** — not only after the very last party signs. The email must include links to view/download the signed document, and the dashboard status badge must reliably reflect the live envelope state (Pending Partial → Signed/Completed) right after signing.

## What exists today

- `supabase/functions/esign-process-signature/index.ts` updates the signer's row to `signed`, flips the envelope to `partially_signed`, and only calls `esign-complete-envelope` once *all* recipients have signed.
- `esign-complete-envelope` builds the signed PDF + audit certificate, uploads them to storage, sets `esign_envelopes.status = completed`, and *then* sends a premium champagne/gold thank-you email and an owner notification via Resend.
- Result: in multi-signer envelopes, intermediate signers receive nothing, and single-signer envelopes only get the email after the final-PDF build finishes (which already works, but is hidden behind the completion branch).
- Dashboard (`ESignatureDashboard.tsx`) reads `status` directly and maps `completed → "Signed"` badge, so as long as the backend status is correct the UI is correct.

## What changes

### 1. New edge function: `esign-send-signer-thanks`
A small, focused function called immediately after a signer submits. Responsibilities:
- Look up envelope + that one recipient.
- Render the same premium champagne/gold HTML shell already used in `esign-complete-envelope` (extracted into `supabase/functions/_shared/esignEmailShell.ts` so both functions share it — no duplication).
- Send a "Thank you for signing" email to that signer via Resend / `quotaGuardedFetch`.
- Include:
  - Document name + doc number
  - Date/time signed
  - Button: **View document** → `${SITE_URL}/e-signature/${envelope_id}`
  - If the envelope is already completed (single-signer case) and a signed PDF URL exists, add **Download signed PDF** and **Download audit certificate** buttons.
  - If still awaiting others, a short note: "We're now collecting the remaining signatures and will send you the fully executed copy once everyone has signed."
- Insert one `esign_audit_log` entry: `signer_thanks_sent`.
- Idempotency: skip if a `signer_thanks_sent` audit row already exists for that recipient.

### 2. Wire the thank-you into the signing flow
In `esign-process-signature/index.ts`, right after the recipient row is updated to `signed` and before/around the completion check, fire-and-await `esign-send-signer-thanks` for the current recipient. Failures are logged but do not block the response.

### 3. Refactor shared email shell
Extract `premiumShell()` + `buttons()` from `esign-complete-envelope/index.ts` into `supabase/functions/_shared/esignEmailShell.ts`. Both functions import it. No visual change.

### 4. Status sync hardening
- Keep current logic: after every signer, envelope flips to `partially_signed`; after the final signer, `esign-complete-envelope` sets `completed`.
- Add a tiny safety net in `esign-process-signature`: if `allSigned` is true and the call to `esign-complete-envelope` fails, the function still sets `esign_envelopes.status = "completed"` and `completed_at = now()` directly so the dashboard never gets stuck at `partially_signed`.
- `SignDocument.tsx` already shows the "thank-you" confirmation card; no UI change required there. The dashboard already maps `completed` → green "Signed" pill.

### 5. Deploy
Deploy `esign-send-signer-thanks`, `esign-process-signature`, and `esign-complete-envelope` together.

## Files touched

- `supabase/functions/_shared/esignEmailShell.ts` (new)
- `supabase/functions/esign-send-signer-thanks/index.ts` (new)
- `supabase/functions/esign-process-signature/index.ts` (invoke thank-you + status safety net)
- `supabase/functions/esign-complete-envelope/index.ts` (use shared shell; existing completion email kept as the "fully executed" follow-up)

## Out of scope

- No DB schema changes.
- No frontend visual changes (dashboard already renders `completed → Signed`).
- Owner/contact notifications remain only on full completion (unchanged).
