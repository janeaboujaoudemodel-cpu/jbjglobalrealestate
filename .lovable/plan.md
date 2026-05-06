## Capitalize email addresses in outreach sign-offs

Currently, brokerage and developer outreach emails render the sender address in lowercase in the sign-off block (e.g. `jane@citideveloper.com`). Per the user's directive, all email addresses shown in the email body must render in **UPPERCASE** for an institutional look — matching `CONTACT@JBJ.AE` already used in the shared support footer.

### Scope

Display only. The actual `mailto:` link, `From`, `Reply-To`, and recipient addressing remain lowercase (RFC requirement). Only the **visible text** is uppercased.

### Files to change

1. **`supabase/functions/crm-send-brokerage-outreach/index.ts`**
   - In the inline-fallback HTML (line ~474), wrap the displayed `replyTo` in `.toUpperCase()` while keeping the `mailto:` href lowercase.
   - In `varsMap` (line ~407), add `reply_to_display: replyTo.toUpperCase()` so stored templates that render `{{reply_to}}` show uppercase. Keep `reply_to` itself uppercased for display since templates use it as visible text.

2. **`supabase/functions/crm-send-developer-registration/index.ts`**
   - Same treatment: uppercase any visible `replyTo` text in the rendered HTML and template variables.

3. **CRM email templates stored in DB** (`crm_email_templates`)
   - Audit any `{{reply_to}}` usage. Where it's rendered as visible body text, switch to display-uppercase; where it's used inside a `mailto:` href, keep lowercase.
   - Implementation: introduce a paired variable — `reply_to` (lowercase, for href) and `reply_to_display` (uppercase, for visible text), and update template HTML to use `reply_to_display` in visible spans.

4. **`supabase/functions/_shared/email-html.ts`**
   - Already uses `CONTACT@JBJ.AE` uppercase — no change needed. Verifying consistency only.

### After deploy

Redeploy `crm-send-brokerage-outreach` and `crm-send-developer-registration`. Send a TEST email from the Bulk Send dialog and confirm the sign-off shows the email in capitals.

### Out of scope

- Changing the actual sender mailbox.
- Reformatting any other UI areas (CRM cards, settings) — those still display the email in its native case as a configuration value.
