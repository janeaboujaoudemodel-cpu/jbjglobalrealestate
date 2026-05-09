## What's broken

**1. 401 "API key is invalid" → blank screen on send**
`crm-send-brokerage-outreach` calls Resend directly with `RESEND_API_KEY`. Both `RESEND_API_KEY` (user secret) and `RESEND_API_KEY_1` (connector-managed) exist; the project secret is stale/invalid, so every send returns 401 from `api.resend.com`. The frontend toast surfaces it as a generic non-2xx and the composer goes blank.

**2. "Call us" / "WhatsApp" tiles in the delivered test email don't open the dialer or WhatsApp**
The DB templates (`brokerage_partnership_intro`, `brokerage_breakfast_invite`) already have correct anchors:
```
<a href="tel:+971547167107">Call us</a>
<a href="https://wa.me/971547167107" target="_blank">WhatsApp</a>
```
The reason they don't fire is Resend's **click tracking** (enabled at the domain level on `jbj.ae`). Resend rewrites every `<a href>` to `https://*.resend-links.com/CL0/...` — including `tel:` and `wa.me/` — so the click loads an HTTPS redirect page instead of triggering the OS dialer or the WhatsApp app handler. `mailto:` is similarly broken.

Resend supports a per-link opt-out via the attribute **`data-no-link-tracking`** on the `<a>`. Once added, Resend ships the original `href` untouched and the OS handles `tel:` / `wa.me` natively.

## Fix plan

### A. Resend API key (unblocks all sends)
- Ask the user to update the `RESEND_API_KEY` secret with a fresh key from their Resend dashboard (the current one is rejected with `validation_error / API key is invalid`). I'll trigger the secret-update prompt.
- No code change needed for the key itself; `sendViaResend` already reads it.

### B. Stop Resend from rewriting tel:/wa.me/mailto: in the templates
Run a single migration that does `UPDATE public.crm_email_templates SET html = …` for the two brokerage variants, adding `data-no-link-tracking="true"` to every anchor whose `href` starts with `tel:`, `https://wa.me/`, or `mailto:`. The subject and visible copy stay byte-identical, so the locked-send + single-agency guards still pass.

Concretely the rendered tile becomes:
```
<a href="tel:+971547167107" data-no-link-tracking="true" …>Call us</a>
<a href="https://wa.me/971547167107" data-no-link-tracking="true" target="_blank" rel="noopener" …>WhatsApp</a>
<a href="mailto:CitiDevelopers@jbj.ae" data-no-link-tracking="true" …>Email</a>
```

### C. Belt-and-braces in the edge function
In `crm-send-brokerage-outreach/index.ts`, after `renderTemplate(...)`, run a tiny post-processor that injects `data-no-link-tracking="true"` into any `<a … href="(tel:|mailto:|https://wa.me/…)" …>` that doesn't already have it. This guarantees the protection even if someone re-edits the template later and forgets the attribute. No business logic, no copy change — purely an HTML attribute pass.

### D. Surface the real error instead of a blank screen
In `CampaignComposer` / brokerage outreach send handler, when `supabase.functions.invoke` returns a non-2xx, read `error.context?.body` (or the JSON `{error,message}` we already return) and show it in the toast instead of the generic "Edge Function returned a non-2xx status code". Specifically map:
- `RESEND_NOT_CONFIGURED` → "Resend API key not configured."
- HTTP 401 with `validation_error` → "Resend API key invalid — update it in Cloud → Secrets."
- `LOCKED_TEMPLATE_MISSING_VAR` → list the missing vars.

### Out of scope
- No change to subject lines, copy, layout, locked-payload pipeline, single-agency guard, or quota logic.
- No switch away from Resend.
- No change to non-brokerage templates.

## Files touched
- `supabase/migrations/<new>.sql` — UPDATE both brokerage template rows.
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — add the `data-no-link-tracking` post-processor + clearer error JSON.
- `src/components/crm/CampaignComposer.tsx` (and the brokerage outreach send hook) — better toast for 401 / known error codes.
- Secret update prompt for `RESEND_API_KEY`.
