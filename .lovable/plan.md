## Goal

Stop forcing `jane@citideveloper.com` as the outbound sender (which Gmail rewrites because the alias isn't verified) and instead send brokerage outreach directly from `infoo.jane@gmail.com` — the connected Gmail mailbox itself. No Gmail "Send mail as" verification will be needed.

## Changes

### 1. `supabase/functions/crm-send-brokerage-outreach/index.ts`
- Replace the hard-locked `FORCED_FROM_EMAIL = "jane@citideveloper.com"` with `FORCED_FROM_EMAIL = "infoo.jane@gmail.com"`.
- Remove the `REQUIRED_FROM` alias-verification gate that blocks sends when Gmail's `sendAs` list doesn't include the address as `verificationStatus: "accepted"`. Since we're now sending from the connected mailbox itself, no Send-As verification is required.
- Update the forbidden-address guard message and any error copy that references `jane@citideveloper.com`.
- Keep the single-agency rule, locked-payload pipeline, and signature/branding intact.

### 2. `supabase/functions/crm-gmail-sender-status/index.ts`
- Change `REQUIRED_FROM` to `infoo.jane@gmail.com`.
- Simplify the check: report `ok: true` whenever the connected Gmail account's primary address equals `infoo.jane@gmail.com` (case-insensitive). No alias lookup needed.
- If a different mailbox is connected, return a clear "wrong mailbox connected" message asking the user to reconnect Gmail using `infoo.jane@gmail.com`.

### 3. `src/components/crm/GmailSenderStatusBanner.tsx`
- Replace alias-verification copy with a simpler status:
  - **Green**: "Outbound sender verified — emails will be sent directly from `infoo.jane@gmail.com`."
  - **Red** (only when wrong account is connected): "The connected Gmail mailbox is `<connectedEmail>`, not `infoo.jane@gmail.com`. Reconnect Gmail using the correct account." with a button to open Connectors.
- Drop the 4-step "Send mail as" instructions entirely.

### 4. Deploy
Redeploy `crm-send-brokerage-outreach` and `crm-gmail-sender-status`.

## Out of scope
- The `citideveloper.com` e-catalogue project URLs in the email body (Amra/Allura/etc.) stay — those are content links, not the sender.
- No DB migration needed.
- No Gmail connector reconfiguration needed if `infoo.jane@gmail.com` is already the connected account.

## Verification
1. Open `/owner/crm/relationships` → banner should show green "verified, sending from infoo.jane@gmail.com".
2. Send a test brokerage outreach → recipient sees `From: infoo.jane@gmail.com` with no header rewrite.
3. Confirm `crm-send-brokerage-outreach` logs no longer reference the alias-verification block.
