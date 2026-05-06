## Plan: Fix Brokerage Outreach Email Workflow

### What is broken now
- The brokerage template preview is rendering inside a sandboxed iframe, so any Gmail-style link or embedded external mail page can show “mail.google.com refused to connect.” I will make preview links safe and open externally instead of trying to load blocked pages inside the preview.
- The template is exposing awkward placeholders like reply-to lower/reply-to display in the email body instead of showing polished contact CTAs.
- The current “Send test” flow sends too quickly from some places and does not force a final review of primary recipient + CC before sending.
- Citi Developers branding is not fully applied: the uploaded logo, official website, office address, maps link, WhatsApp link, and footer need to be integrated consistently.

### Batch 1 — Citi Developers brand asset + contact constants
- Copy the uploaded `Citi_Developers_Gold.png` into the project assets.
- Add a small shared brokerage-email brand configuration for:
  - Developer name: `Citi Developers`
  - Website: `https://citideveloper.com/`
  - Contact page: `https://citideveloper.com/contact-us`
  - Office: `Sales and Experience Center: Villa no 1 & 2 - 625 Jumeira St - Umm Suqeim - Umm Suqeim 1 - Dubai`
  - Official map redirect: `https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18`
  - Citi phone: `80044440` and `044031000`
  - WhatsApp deep link generated with `https://wa.me/...` for the owner direct contact number already used in the system.

### Batch 2 — Fix the branded email template HTML
- Replace the brokerage template footer with a polished footer containing:
  - Uploaded Citi Developers logo
  - Website button
  - Map/location button
  - WhatsApp contact button
  - Email reply contact
  - Office address
- Remove visible technical placeholders like `reply_to_lower` from the rendered email body.
- Ensure all external links use normal `target=_blank` behavior in app previews and absolute HTTPS links in real emails.
- Keep the app’s champagne/ink/gold hairline style, but avoid heavy gold fill buttons.

### Batch 3 — Fix preview so Gmail/blocked pages do not break the UI
- Update the template preview iframe behavior so clicks do not navigate inside the iframe to Gmail or other external sites.
- Add link rewriting/sanitization for preview mode: external links open in a new tab, while `mailto:` and WhatsApp links remain clickable but never embedded.
- Use `srcDoc` preview only for the email HTML, not external mail pages.

### Batch 4 — Fix “Send test email” confirmation flow
- Replace instant test send with a two-step confirmation:
  1. Edit/review primary test email and CC list.
  2. Confirm and send.
- Show a clear final summary before sending:
  - Template variant
  - Primary recipient(s)
  - CC recipients
  - Sample brokerage name
- Allow add/remove/edit of CC emails before sending.
- Keep saved test recipients persistent for next time.

### Batch 5 — Backend sender hardening + redeploy
- Update `crm-send-brokerage-outreach` to render the new brand/contact variables server-side.
- Add safe fallback values if a template is missing the new variables.
- Ensure test sends accept CC overrides properly.
- Redeploy the updated brokerage outreach edge function.

### Batch 6 — Verification
- Test the route `/owner/crm/relationships` brokerage outreach/template flow in preview.
- Verify the template preview no longer tries to embed Gmail.
- Send/attempt a test email through the app flow and inspect any backend error if the connector rejects it.
- Provide screenshot proof after implementation using the browser preview screenshot tool.