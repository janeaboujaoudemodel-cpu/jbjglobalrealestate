## Decision
Keep the Resend free-plan caps as configured (100/day, 2,900/30d, 2 req/s). No code changes to limits.

## How to confirm an email was sent via Resend (not Lovable)

Three independent checks — any one is sufficient, all three together is conclusive.

### 1. Resend dashboard (ground truth)
- Open https://resend.com/emails
- A successful send appears within seconds with: recipient, subject, status (Delivered / Bounced), and the message ID.
- If the email is NOT in this list, it did not go through Resend.

### 2. Email headers in the recipient's inbox
- Open the test email in Gmail → "Show original" (or equivalent in other clients).
- Look for these headers — all three confirm Resend:
  - `Return-Path: <bounces+...@...resend.com>` or your verified domain
  - `Received: from ... .resend.com`
  - `X-SES-...` will be ABSENT (Lovable Email uses SES); Resend uses its own infra.
- The `Message-ID` will end in `@resend.dev` or your sending domain managed by Resend.

### 3. In-app quota counter (proves our gateway ran)
- On `/owner/crm/relationships`, the Email Quota card shows "Today X / 100".
- Send one test email → refresh → counter increments by exactly 1.
- If the counter does NOT move, the send bypassed `quotaGuardedFetch` (i.e., it was not routed through Resend via our wrapper) — that's a bug to fix.

## Recommended test procedure
1. Note current "Today" count on the Email Quota card.
2. Trigger a real send from one of the funnels we refactored, e.g.:
   - CRM Relationships → send a developer outreach email to your own address, OR
   - Owner Inbox → "Send test email" to yourself, OR
   - Support ticket → resend confirmation.
3. Within ~10 seconds:
   - Quota card increments by 1 ✅
   - Email appears in Resend dashboard ✅
   - Email arrives in your inbox; headers show `resend.com` in Received/Return-Path ✅
4. If all three pass → confirmed: Resend, not Lovable.

## Optional: agent-side verification I can run for you
After you trigger a test send, I can:
- Query `email_send_log` for the most recent row and show `status`, `message_id`, `template_name`.
- Tail the relevant edge function logs (e.g. `send-owner-email`) to show the `quotaGuardedFetch` → `api.resend.com` call and the 200 response from Resend.

Just tell me which send you triggered and to which address, and I'll pull the logs.

## No files changed
This is a verification plan only — no code edits.
