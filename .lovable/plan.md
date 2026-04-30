
## Goal

Wire the UAE Registry outreach to send from `CONTACT@JBJ.AE` via Resend (using your already-verified root domain `jbj.ae`), and cleanly disable Lovable Emails so there is no infrastructure overlap.

## Why root domain is fine

Resend verifies domains via TXT (SPF) + CNAME/TXT (DKIM) records — never NS. Since you've already verified `jbj.ae` at the root in Resend, sending `from: "JBJ Global Real Estate <CONTACT@JBJ.AE>"` works directly. No subdomain, no NS records, no Lovable delegation required.

The earlier setup was scaffolded against Lovable Emails (which uses NS-delegated subdomains) — that's the system that needs the `notify.jbj.ae` NS records, not Resend. We're abandoning that path entirely.

## Steps

### 1. Capture and remove Lovable Emails delegation
- Run `email_domain--check_email_domain_status` to capture the exact NS records currently delegated (so you have them on file before they're orphaned).
- Call `email_domain--toggle_project_emails` with `enabled: false` to disable Lovable Emails.
- Tell you the exact NS records to remove at your DNS provider (the `notify.jbj.ae NS ns3.lovable.cloud` and `ns4.lovable.cloud` entries). Removing them is optional but recommended for cleanliness — leaving them only delegates an unused subdomain, it does not affect `jbj.ae` root mail.

### 2. Verify Resend connector secrets
- Confirm `RESEND_API_KEY` and `LOVABLE_API_KEY` are present via `secrets--fetch_secrets`.
- If `RESEND_API_KEY` is missing, link the Resend connector via `standard_connectors--connect`.

### 3. Confirm `uae-registry-send` is correctly wired
The edge function at `supabase/functions/uae-registry-send/index.ts` already targets the Resend gateway. Verify:
- Endpoint: `https://connector-gateway.lovable.dev/resend/emails`
- Headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${RESEND_API_KEY}`
- `from: "JBJ Global Real Estate <CONTACT@JBJ.AE>"` (root domain, no subdomain)
- Hard-block on any sender other than `CONTACT@JBJ.AE` (including the forbidden `janeaboujaoudemodel@gmail.com`)
- Owner-only auth + verification-status gate retained
- Logs writes into `uae_registry_log`

If anything still references `send-transactional-email` or `notify.jbj.ae`, replace it.

### 4. Test send
- Owner triggers a test send from `/owner/uae-registry/...` to your own inbox.
- Confirm delivery, headers show `From: CONTACT@JBJ.AE`, SPF/DKIM pass via Resend.
- Verify the row lands in `uae_registry_log` with status `Test Sent`.

### 5. Optional cleanup
- Decide whether to delete the now-unused Lovable email scaffolding (`send-transactional-email` function, email queue tables) or leave them dormant. Recommendation: leave dormant — they don't cost anything and may be useful later for auth emails.

## Out of scope
- DNS changes at your registrar (you control those — I'll just tell you which records to remove).
- Reply-ingestion, Firecrawl source verification, CSV import, sidebar nav entry — still pending your earlier approval as separate follow-ups.

## Deliverables
- Lovable Emails disabled.
- `uae-registry-send` confirmed sending via Resend from `CONTACT@JBJ.AE` on root `jbj.ae`.
- Clear list of NS records you can remove from your DNS provider.
- Successful test send logged in `uae_registry_log`.

Approve and I'll execute.
