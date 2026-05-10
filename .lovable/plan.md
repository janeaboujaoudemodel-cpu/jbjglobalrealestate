## Goal

Turn the Branded Email composer + Relationship Hub into a real day-to-day tool: ready-made templates per scenario, reusable signatures, a normal writing experience (not raw HTML), a working "Draft with AI" flow, a clean Brokerage-Agencies view, and bulk-add for brokers (CSV / paste / AI paragraph) with optional per-broker enrichment.

---

## 1. Email Template Library (new)

### New table `email_templates`
- `id`, `owner_user_id`, `slug`, `name`, `category`, `audience` (any / broker / investor / VIP / developer_rep / client / hr_candidate / newsletter_subscriber), `subject`, `body_text` (plain text with `{{vars}}`), `body_html` (auto-rendered for preview/send), `language` (default `en`), `variables` (jsonb), `signature_id` (FK), `is_system` (seeded), `is_default_for_audience`, `tags`, `usage_count`, timestamps.
- RLS: owner sees own + `is_system=true`.

### Seed templates (all 4 packs approved)

**Sales & Leasing**
- `seller-interest-pitch` — "Interested buyer for your {{property_title}}"
- `buyer-offer-introduction`
- `leasing-offer-to-tenant`
- `leasing-contract-for-signature`
- `signed-contract-thank-you`
- `viewing-confirmation`
- `post-viewing-followup`

**Birthday & Lifecycle** (one base + audience overrides)
- `birthday-client`, `birthday-investor`, `birthday-vip`, `birthday-broker`, `birthday-developer-rep`
- `work-anniversary`, `eid-greeting`, `new-year-greeting`

**Onboarding & Newsletter**
- `newsletter-welcome` — "Thank you for joining the JBJ ecosystem"
- `ecosystem-welcome-client`
- `broker-onboarding-welcome`
- `developer-rep-onboarding`
- `investor-welcome-vip`

**Operations**
- `meeting-confirmation` (with `/book` link)
- `document-for-signature`
- `payment-reminder`
- `kyc-request`
- `referral-thank-you`
- `reactivation-checkin`

Each template uses the approved variable set:
- Contact: `{{first_name}} {{full_name}} {{email}} {{phone}} {{category}}`
- Property: `{{property_title}} {{property_url}} {{price}} {{bedrooms}} {{area}} {{location}} {{property_cover}}`
- Meeting: `{{book_meeting_url}} {{calendar_link}} {{office_address}}`
- Sender: `{{sender_name}} {{sender_title}} {{sender_signature}} {{company_legal_name}}`

A `mergeTemplate(body, ctx)` helper renders variables on the client before lock-and-send. Missing variables are highlighted in preview (yellow chip) so the user can't send a half-merged email.

### Template manager UI (`src/components/crm/EmailTemplateLibrary.tsx`)
- Grid of cards grouped by category, with audience chips.
- "Use template" → loads into composer.
- "New template" / "Save as template" from composer → opens a small form (name, audience, language, signature, tags).
- Edit / duplicate / delete / mark default for audience.

---

## 2. Signature Library (new)

### New table `email_signatures`
- `id`, `owner_user_id`, `name`, `role_label`, `name_line`, `title_line`, `company_line`, `address_line`, `phone`, `email`, `website`, `logo_url`, `socials` (jsonb), `html` (rendered), `is_default`, timestamps.

### Seeded presets (all 4 approved)
1. **Founder / CEO (Jane)** — "Jane Bou Jaoude · Founder & CEO · JBJ GLOBAL REAL ESTATE" + address, phone, email, website, social row.
2. **JBJ Executive Office** — generic exec-office signature for assistant sends.
3. **JBJ HR / Recruitment** — HR contact details, careers link.
4. **Front Desk / Help Desk / Support** — three presets sharing the same template, different role_label.

A signature picker `<SignaturePicker />` appears in the composer right rail. Selecting one re-renders the locked preview.

---

## 3. Branded Email Composer — full rebuild of `BrandedEmailComposer.tsx`

### Layout / window
- Default: **floating panel** (max-w-4xl) — not full-screen.
- Header has **Minimize**, **Expand to large**, and **Close** buttons (Minimize collapses to a 56px bottom-right pill labelled with current subject; clicking restores).
- Body uses tabbed structure: **Compose · Preview · Templates · Signature**.

### Compose tab (no more raw HTML)
- **To** (multi-chip), **Cc**, **Bcc**, **Subject**, **Language** (16 langs), **Signature** (dropdown from §2), **Template** (dropdown from §1).
- Body editor: rich-but-simple (TipTap minimal — bold, italic, list, link, image, "Insert meeting block"). No HTML textarea anywhere.
- Variables auto-fill from the selected recipient/contact when a CRM contact is loaded.
- **Draft with AI** button — fixed:
  - On click, opens an inline panel with a `Textarea` ("Short brief for AI…"), language selector, tone (Warm / Direct / Formal / VIP / Friendly), and "Generate".
  - Calls `compose-branded-email` with `{ brief, language, tone, context }` → returns `{ subject, body_text, body_html }`.
  - Inserts body into the editor and proposes the subject. If the Subject field is empty, fill it; if user already typed one, show "Suggested subject: …" with one-click Replace.
- **Auto-subject**: when body changes and Subject is empty, debounce 1.5s → call `suggest-subject-line` edge function, prefill suggestion (user can overwrite freely).

### Preview tab
- Identical look to the developer/agency outreach preview (locked-payload card with framed letterhead, signature, footer).
- "Send test to me" button — always reuses the same locked-payload pipeline so test = live (already locked-send standard).

### Templates tab
- Inline `<EmailTemplateLibrary />` filtered by audience of current recipient.
- "Save current as template" persists Subject + body_text + signature + language to `email_templates`.

### Signature tab
- Renders the four presets, lets user pick default + edit fields. "Add signature" creates a new one.

### Body storage
- We persist `body_text` (plain) + a rendered `body_html` (server-side via `compose-branded-email` `render-only` mode). The composer NEVER shows raw HTML to the user.

---

## 4. Edge function changes

- `compose-branded-email`
  - Accept `mode = "draft" | "render"`, `brief`, `tone`, `language`, `context` (recipient + property snippet).
  - Return `{ subject, body_text, body_html }`.
- New `suggest-subject-line` — small Gemini Flash call, returns 1 short subject ≤ 65 chars.
- `crm-send-brokerage-outreach` — pull body+subject from `email_templates` when `template_slug` is provided (already on the lock-and-send path).

All three keep the locked-send / single-agency rules from existing memories.

---

## 5. Relationship Hub — Brokerage Agencies & Brokers

### `BrokeragesTab`
- Show **agencies only** (no individual broker rows). Each card: agency name, brokers count chip, RERA, city, owner contact-gated.
- Click → drills into agency detail (existing) which lists its brokers.
- Remove the embedded "individual brokers" mini-list from this tab.

### `IndividualBrokersTab` (already wired to `crm_brokers`)
Add a single top toolbar with three add modes (all open in a dialog):

1. **Add one (form)** — current fields (name, email, phone, agency, RERA, etc.).
2. **Upload CSV / Excel** — drop zone → preview table → field-mapping step → bulk insert (chunks of 500). Shows duplicate-by-`email_lower` + `phone_e164` warning before commit.
3. **Paste text** — large textarea, accepts unstructured paragraph or list. Calls new edge function `parse-broker-paragraph` (Gemini Flash, structured output: array of `{full_name, email, phone, company?, rera?, specialty?, language?}`). Shows the parsed rows in the same preview table as CSV mode; user can edit any cell before commit.

After commit (any mode):
- Modal asks **"Add more details now?"**
  - **Yes** → opens an enrichment drawer for the first inserted broker with extra fields: birthday, specialty (sale/leasing/off-plan/secondary/commercial), seniority, languages, nationality, LinkedIn, WhatsApp, notes. Next/Previous to walk through the batch. Skippable at any time.
  - **No / Skip** → close, brokers visible immediately, all extra fields editable later in the broker drawer.

Same toolbar (Add / Upload / Paste-AI) is added to:
- `BrokeragesTab` (for agencies)
- `DeveloperRegistryTab` (for developers)
- `DevSalesRepsDirectory` (for developer reps)

All three call audience-specific parsers (`parse-developer-paragraph`, `parse-rep-paragraph`) reusing the same UI shell `<BulkAddDialog audience="..." />`.

---

## 6. Database changes (single migration)

- `email_templates` (RLS: owner + is_system read for all signed-in)
- `email_signatures` (RLS: owner-only)
- Seed system templates (24) and 4 system signatures via SQL `insert … on conflict do nothing` for the owner user.
- `crm_brokers`: ensure indexes on `email_lower`, `phone_e164`, `current_brokerage_id` (skip if present).
- Optional `email_template_usage` log for analytics later (not required now).

---

## 7. Files we will create / edit

```text
NEW  src/components/crm/EmailTemplateLibrary.tsx
NEW  src/components/crm/SignaturePicker.tsx
NEW  src/components/crm/BulkAddDialog.tsx          (CSV / Paste-AI shared shell)
NEW  src/components/crm/AIBriefPanel.tsx           (Draft-with-AI inline panel)
NEW  src/hooks/useEmailTemplates.ts
NEW  src/hooks/useEmailSignatures.ts
NEW  supabase/functions/suggest-subject-line/index.ts
NEW  supabase/functions/parse-broker-paragraph/index.ts
NEW  supabase/functions/parse-developer-paragraph/index.ts
NEW  supabase/functions/parse-rep-paragraph/index.ts
EDIT src/components/crm/BrandedEmailComposer.tsx   (full rebuild: collapsible, tabs, no HTML, working AI)
EDIT supabase/functions/compose-branded-email/index.ts  (modes + tone + context)
EDIT src/components/crm/IndividualBrokersTab.tsx   (toolbar + BulkAddDialog + enrichment walk-through)
EDIT src/components/crm/BrokeragesTab.tsx          (agencies-only, drop embedded brokers)
EDIT src/components/crm/DeveloperRegistryTab.tsx   (BulkAddDialog)
EDIT src/components/crm/DevSalesRepsDirectory.tsx  (BulkAddDialog)
+ migration: email_templates, email_signatures, seeds, indexes
```

## Out of scope (next pass)
- Auto-scheduled birthday sends (will add a cron once the templates are stable).
- Per-template A/B subjects.
- Per-broker email send history view (already partially exists in CRM action log).

Approve and I'll implement.
