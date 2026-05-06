## Continue Brokerage Outreach Fix — Steps 1–5

Using the confirmed contact: **jane@citideveloper.com** (primary sender + reply-to), website **https://citideveloper.com/**, and office map **https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18**.

### Step 1 — Apply branded template migration (DB)
Push the prepared `UPDATE public.crm_email_templates` for `brokerage_partnership_intro` and `brokerage_breakfast_invite`:
- Replace footer with Citi Developers branded block (logo, website button, map button, WhatsApp button, jane@citideveloper.com reply link, office address).
- Remove `{{reply_to_lower}}` / `{{reply_to}}` raw placeholders from body.
- Set `reply_to` default = `jane@citideveloper.com`.

### Step 2 — Fix template preview iframe
In the brokerage template preview component:
- Render only sanitized email HTML in `srcDoc` (sandbox = `allow-same-origin` only — no `allow-top-navigation`, no `allow-popups-to-escape-sandbox`).
- Rewrite all `<a>` links to `target="_blank" rel="noopener"` so Gmail/maps never embed inside the iframe.
- Strip any link that points to `mail.google.com/...` and replace with a plain `mailto:jane@citideveloper.com`.

### Step 3 — Two-step Send Test confirmation
Update the Send Test dialog (used from `OutreachActionsMenu` → Send test):
1. **Step A — Review:** show editable Primary recipient (defaults to `jane@citideveloper.com`) using `PrimarySenderEditor`, editable CC list using `CcListEditor`, template variant selector, sample brokerage name. Persist saved recipients in `localStorage`.
2. **Step B — Confirm:** show final summary (To / CC / template / sample) with **Send Test** + **Back** buttons. Sending only fires from this confirm screen.

### Step 4 — Backend hardening (`crm-send-brokerage-outreach`)
- Inject brand variables server-side with safe fallbacks:
  - `developer_name = "Citi Developers"`
  - `developer_website = "https://citideveloper.com/"`
  - `developer_map = "https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18"`
  - `developer_office = "Sales and Experience Center: Villa no 1 & 2 - 625 Jumeira St - Umm Suqeim 1 - Dubai"`
  - `developer_phone_primary = "80044440"`, `developer_phone_secondary = "044031000"`
  - `reply_to = "jane@citideveloper.com"`, `whatsapp_url` from owner number
  - `developer_logo_url = "<site>/brand/citi-developers-gold.png"`
- Honor CC overrides from test sends.
- Strip stray `reply_to_lower` tokens before render.
- Redeploy.

### Step 5 — Verification
- Open `/owner/crm/relationships` → Brokerages → Outreach menu.
- Verify preview renders branded footer, no Gmail embed, links open new tab.
- Trigger Send Test → confirm two-step flow → send to `jane@citideveloper.com`.
- Capture screenshots of: preview, review step, confirm step, delivered test (or backend response).

### Files expected to change
- `supabase/migrations/<new>_brokerage_brand_footer.sql` (Step 1)
- `src/components/crm/BrokerageTemplatePreview.tsx` or equivalent preview iframe (Step 2)
- `src/components/crm/SendTestEmailDialog.tsx` (or create if missing) (Step 3)
- `supabase/functions/crm-send-brokerage-outreach/index.ts` (Step 4)
- `.lovable/plan.md` (mark complete)
