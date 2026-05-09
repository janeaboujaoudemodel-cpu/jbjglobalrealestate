## Why your last email came from `janeaboujaoudemodel@gmail.com`

The brokerage outreach edge function (`crm-send-brokerage-outreach`) does **not** use Resend at all today. It builds an RFC-2822 message and posts it to the Google Mail connector gateway:

```
POST https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send
```

Gmail rewrites the `From:` header to whichever Google account is currently connected (right now: `janeaboujaoudemodel@gmail.com`), regardless of what the function tries to set. The hard-coded `FORCED_FROM_EMAIL = "infoo.jane@gmail.com"` and the "forbidden senders" list have no effect because Gmail overrides them. Your jbj.ae domain being verified in Resend is irrelevant on this code path — the email never touches Resend.

## What I'll change

Migrate brokerage outreach (and only brokerage outreach) to Resend, locked to your verified `jbj.ae` domain.

### Identity (single source of truth)
Update `supabase/functions/_shared/outreachIdentity.ts`:

- `PRIMARY_SENDER = "CitiDevelopers@jbj.ae"`
- `PRIMARY_SENDER_NAME = "CITI Developers"`
- `DEFAULT_REPLY_TO = "CitiDevelopers@jbj.ae"`  (same as From, per your choice)
- `TEST_DEFAULTS.from_email/from_name/reply_to` updated to match
- Add `ALLOWED_SENDER_DOMAIN = "jbj.ae"` and a `enforceAllowedSender()` guard that rejects any From not on jbj.ae (prevents accidental cross-domain sends until citideveloper.com is also verified)

### `crm-send-brokerage-outreach/index.ts` — full rewrite of the send path
1. Remove the Gmail gateway call (`GMAIL_GATEWAY`, raw RFC-2822 builder, `messages/send`).
2. Import `sendViaResend` from `_shared/resendClient.ts` (already wired to the daily/monthly Resend quota).
3. Import the new identity constants — drop `FORCED_FROM_EMAIL = "infoo.jane@gmail.com"` and the legacy `WORKFLOW_FORBIDDEN_ADDRESSES` checks for Gmail addresses; replace with the `enforceAllowedSender()` guard so any non-`@jbj.ae` From returns HTTP 400.
4. Build the send payload:
   - `from: "CITI Developers <CitiDevelopers@jbj.ae>"`
   - `to: [recipientEmail]`  (test send still respects `testRecipient`)
   - `cc: ccList`  (existing brokerage CC logic preserved)
   - `reply_to: "CitiDevelopers@jbj.ae"`
   - `subject`, `html` from the locked template (unchanged)
   - `headers: { "X-JBJ-Outreach": "brokerage", "X-JBJ-Variant": variant }`
   - `tags: [{name:"variant", value: variant}, {name:"mode", value: isTest ? "test" : "production"}]`
5. Map Resend's response onto the existing send-log shape:
   - `sent_via: "resend"` (was `"gmail"`)
   - `from_email: "CitiDevelopers@jbj.ae"`
   - `message_id: data?.id`, `thread_id: null`
6. Return the same JSON shape to the client (`{ ok, messageId, …, quota }`) so `TestSendDialog.tsx` and the production button keep working untouched. Surface Resend quota state from `sendViaResend` in the response.

### Locked template defaults
The HTML template body in `crm_email_templates` doesn't hardcode a sender (sender comes from the function), but a couple of fields are stamped via the Edge Function as part of the locked payload. I'll update the brokerage rows in `crm_email_templates` (variants `brokerage_partnership_intro`, `brokerage_breakfast_invite`) so any stored `from_email` / signature-block email reads `CitiDevelopers@jbj.ae` instead of `jane@citideveloper.com` / `infoo.jane@gmail.com` (DB migration). This affects both the test-send preview and the production send because both render from the same locked record.

### What I will NOT change in this pass (per your scope answer)
- `crm-send-developer-registration` — still goes via Gmail
- `uae-registry-send`, `crm-create-breakfast-invite-token`, `crm-bulk-upload-*`, `verify-owner` — unchanged
- The Gmail connector itself — staying connected for the other flows
- Other Resend functions already in use (`documents-send`, `welcome-subscriber`, etc.)

### Visible behavior after this lands
- Test send button on a brokerage → recipient sees `From: CITI Developers <CitiDevelopers@jbj.ae>`, replies route back to the same address.
- Real outreach send → identical sender; counted against the existing Resend daily/monthly quota (100/day, 2,900/30d).
- If `RESEND_API_KEY` is missing or the From domain isn't `jbj.ae`, the function returns 400/500 with a clear error instead of silently falling back to Gmail.

### Risk / acceptance check
- The Resend quota chokepoint (`email_quota_try_claim` RPC) already exists and is in use elsewhere — no new infra needed.
- DNS for `jbj.ae` in Resend must be Verified for this to deliver. If it's still in `awaiting_dns`, sends will 4xx and I'll surface that error in the response and toast.
- `infoo.jane@gmail.com` is currently in the brokerage CC list. I'll keep it there by default (you can still see every outbound). Tell me if you'd rather drop it.
