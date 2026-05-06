## Brokerage Outreach — Restore + Bug Fix Pass

Scope: `/owner/crm/relationships` (Brokerages tab) and the brokerage outreach email templates. Strict no-removal: every UI block that was previously visible (breakfast booking section, GCC / MENA / region dropdowns, "Already Sent", "Already Registered", counters) is restored, and the templates regain everything that was stripped during the previous champagne pass.

Brand truth used throughout (per your message):
- Company website: **https://www.citidevelopers.com** (note plural — replaces previous `citideveloper.com`)
- Primary phone (clickable + WhatsApp): **+971 58 589 3499**
- Reply-to / sender: **jane@citidevelopers.com**
- Logo: `public/brand/citi-developers-gold.png`
- Office map: existing Google Maps link
- Company name token: **"Citi Developers"** must replace the literal phrase "your brokerage" in invite copy.

---

### 1. Restore the Brokerage hub UI (`OwnerRelationships.tsx` + child sections)

- **Breakfast & Briefing Bookings section** (`BreakfastBookingsSection.tsx`) — re-mount on the Brokerages tab; it's still in the codebase but no longer rendered.
- **Region dropdowns** — restore the full region filter set (UAE, GCC, MENA, Asia, Europe, Africa, Americas, Oceania, Global) on the brokerages list filter bar. Verify the underlying `region` column is still queried.
- **Status counters** — fix the tab counters so they reflect real data:
  - `All` — total distinct brokerages after dedupe
  - `Already Sent` — count of brokerages with at least one row in `crm_brokerage_outreach_log` (or equivalent send log)
  - `Already Registered` — count of brokerages whose status = `registered` (Shobha currently expected = 1)
  - `Pending`, `Bounced`, etc. — preserve existing buckets
- Keep all existing controls (search, list switcher, bulk actions, OutreachActionsMenu).

### 2. Fix the RERA / ID importer (stuck at 1000, inflated 2500, duplicates)

In the brokerage import edge function + client modal:

- Remove the implicit Supabase 1000-row cap by paginating with `.range(from, to)` in a loop until the source returns fewer than `pageSize` rows.
- Stream progress to the UI via channel updates so the visible counter actually advances past 1000.
- Reconcile the "imported X" toast with the real inserted count — show `inserted / updated / skipped (duplicate)` separately so 2500 ≠ 1000 confusion goes away.
- **Dedupe key**: normalize on `(license_no || trade_name_normalized)`; upsert with `ON CONFLICT DO UPDATE` so re-imports don't create twins. Add a one-time cleanup query to merge existing duplicates by license_no.

### 3. Restore + repaint email templates (`brokerage_partnership_intro`, `brokerage_breakfast_invite`)

Patch `crm_email_templates` rows (data update, not migration):

- **Restore the Breakfast block** — invitation card with date/time picker CTA, "Reserve a slot" button linking to the public booking page, and the briefing agenda bullets that existed before.
- **Restore the inline mini-calendar visual** (static HTML calendar tile that was removed).
- **Restore the developer logo** at the top — `<img src="https://…/brand/citi-developers-gold.png" alt="Citi Developers" …>` — sized for email (max-width 180px, auto height).
- **Clickable elements** — wrap website, office address, and phone in `<a>`:
  - Website → `https://www.citidevelopers.com`
  - Address → existing Google Maps link
  - Phone → `tel:+971585893499` plus a parallel `https://wa.me/971585893499` WhatsApp button
  - "Open AMRA e-Catalogue" button → `https://citideveloper.com/e-catalogue/amra` (currently dead — make it an `<a>` not a styled `<span>`)
- **Copy fix** — replace the literal phrase `your brokerage` with `{{brokerage_name}}` and ensure the salutation reads "We would like to invite **{{brokerage_name}}**…". Default fallback to `"your team"` only if the variable is empty.
- **Champagne repaint** — drop the saturated gold (#B89555 fills) and switch to the light champagne palette already used site-wide:
  - Page bg `#FDFBF7`, card bg `#F7F2EA`, raised `#EFE6D6`
  - Text `#1A1A1A`
  - Gold only as 1px hairline border / underline (per the No-Gold-Fills memory)
  - Buttons: cream fill + ink text + thin gold border

### 4. Backend hardening (`crm-send-brokerage-outreach`)

- Update server-injected brand vars to the corrected values:
  - `developer_website = "https://www.citidevelopers.com"`
  - `developer_phone_primary = "+971 58 589 3499"` (display) / `tel:+971585893499` (link)
  - `whatsapp_url = "https://wa.me/971585893499"`
  - `developer_logo_url = "<site-origin>/brand/citi-developers-gold.png"` (resolved absolute, not relative — fixes the broken-image render)
- Format phone on a single line (`white-space: nowrap` on the phone span) so it stops wrapping.
- Strip any leftover `{{reply_to_lower}}` tokens.
- Re-deploy.

### 5. Fix "Send Test" actually sending

`TestSendDialog.tsx` + `crm-send-brokerage-outreach`:

- Wire the confirm-step `Send Test` button to `supabase.functions.invoke('crm-send-brokerage-outreach', { body: { mode: 'test', to, cc, template, sample_brokerage_name } })`.
- Surface the function's error payload in a toast so failures aren't silent.
- Default `to` = `jane@citidevelopers.com` and persist the last used CC list in `localStorage`.

### 6. Verification

- `/owner/crm/relationships` → Brokerages tab:
  - Breakfast section visible, region dropdown shows GCC/MENA/etc., counters non-zero, "Already Registered" shows Shobha = 1.
  - Run RERA import → progress passes 1000, final count matches inserted+updated, no duplicates on re-run.
- Open template preview → logo renders, calendar block present, AMRA button clickable opens new tab, phone on one line, brokerage name interpolated.
- Send Test to `jane@citidevelopers.com` → received, links work, WhatsApp deep link opens chat.

### Files expected to change

- `src/pages/owner/OwnerRelationships.tsx` — re-mount BreakfastBookingsSection, restore region filter + counters
- `src/components/crm/CRMImportModalV3.tsx` (or brokerage import modal) — paginated fetch, progress, dedupe reporting
- `supabase/functions/<brokerage-import>/index.ts` — pagination + upsert on license_no
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — brand vars, absolute logo URL, phone formatting, test mode
- `src/components/crm/TestSendDialog.tsx` — actually invoke the function on confirm
- `crm_email_templates` rows (`brokerage_partnership_intro`, `brokerage_breakfast_invite`) — restored HTML with breakfast block, calendar, logo, clickable links, champagne palette, `{{brokerage_name}}`
- `.lovable/plan.md` — mark complete

No features removed. All previous champagne/contrast memories respected (no solid gold fills, ink on champagne, clickable elements get `target="_blank" rel="noopener"`).
