# Rewrite the recreation prompt in `.lovable/plan.md`

Replace the current contents of `.lovable/plan.md` (the old "Fix Pending Tasks popup" notes) with a single, self-contained **Master Recreation Prompt** the user can paste into a fresh Lovable project to recreate the Relationships + Revenue + Bulk Email system.

The prompt will cover, end-to-end:

1. **Two-sided Relationships Hub** — Developers section + Brokerages section, each with full CRUD, logos, filters, and Emirate segmentation.
2. **Developer Registration Outbound Flow** — bulk email to every developer with my brokerage's company profile + KYC docs (Google Drive link pre-filled), so I become eligible to sell their projects and earn commission.
3. **Brokerage Registration Inbound Flow (Citi Developers side)** — bulk email to every UAE brokerage inviting them to register and sell Citi Developers projects, including private events / breakfasts / launches.
4. **Pre-seeded UAE Database** — every major developer and every major brokerage in UAE pre-populated with website, office address, Emirate, agent count, Instagram, key contacts.
5. **Revenue & Commission Ledger** — per-developer and per-brokerage: closed deals, gross commission, paid amount, pending balance, aging.
6. **Email Automation Engine** — segment by Emirate / type / activity, pre-filled merge fields, "Jane from Sales — on behalf of Citi Developers" sender persona, scheduling, deliverability log.

## File to edit

- `.lovable/plan.md` — overwrite entirely with the new prompt below. No other files change.

## Content to write into `.lovable/plan.md`

```markdown
# Master Recreation Prompt — Brokerage ⇄ Developer Relationships, Revenue & Bulk Email Automation

Paste the prompt below into a new Lovable project. It rebuilds the full
two-sided Relationships system (developers + brokerages), the registration
outbound flows (with my company KYC pack), the revenue/commission ledger,
the pre-seeded UAE database, and the segmented bulk email engine.

---

## PROMPT START

Build a production-grade **Relationships + Revenue + Outreach** workspace
for a UAE real estate company. The company has two sides:

- **Brokerage side** — we sell other developers' projects and earn commission.
  We must register our brokerage with every developer in the UAE.
- **Developer side** — we are also Citi Developers (C-I-T-I), a developer.
  We must onboard every UAE brokerage so they sell our projects.

Enable Lovable Cloud. Use React + Vite + Tailwind + shadcn/ui. All data in
Supabase with strict RLS. All outbound email via a single edge function
using Resend (or Lovable Emails when available). No mock data — seed with
real UAE companies.

### 1. Navigation

Add a top-level route `/relationships` with two tabs:

- **Developers** (people whose projects we sell)
- **Brokerages** (people who sell our Citi Developers projects)

Each tab is a filterable directory + per-record detail drawer with sub-tabs:
**Profile · Contacts · Registration · Deals · Commission · Email History**.

### 2. Database schema (Supabase)

Tables (all with `id uuid pk`, `created_at`, `updated_at`, RLS enabled,
owner-only write, authenticated read):

**`developers`**
- name, legal_name, slug, logo_url, website, instagram, linkedin
- hq_emirate (enum: Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ)
- hq_address, google_maps_url, phone, primary_email
- registration_status (enum: not_started, submitted, approved, rejected)
- registration_submitted_at, registration_approved_at
- commission_terms_pct, payment_terms_days, notes

**`brokerages`** (mirror of developers)
- name, legal_name, slug, logo_url, website, instagram, linkedin
- hq_emirate, hq_address, google_maps_url, phone, primary_email
- agent_count, active_agents_count, rera_number
- onboarding_status (enum: not_invited, invited, registered, active, paused)
- our_active_agents (text[] — names of their agents currently selling our projects)
- notes

**`developer_contacts`** / **`brokerage_contacts`**
- parent_id fk, full_name, role (CEO, Sales Director, Broker Registration, Marketing…)
- email, phone, whatsapp, is_primary, last_contacted_at

**`deals`** — universal commission ledger
- counterparty_type (enum: developer, brokerage)
- counterparty_id (uuid, fk to either table)
- project_name, unit_reference, client_name (encrypted)
- gross_value_aed, commission_pct, commission_amount_aed
- closed_at, status (enum: closed, invoiced, partially_paid, paid, disputed)

**`deal_payments`**
- deal_id fk, amount_aed, paid_at, method, reference, notes

**`email_campaigns`**
- name, audience (enum: developers, brokerages, custom)
- segment_filter jsonb (Emirate, status, tags…)
- subject, body_html, body_text, attachments_json
- sender_persona (default `Jane Smith — Sales, on behalf of Citi Developers`)
- scheduled_at, sent_at, status

**`email_sends`** — per-recipient log
- campaign_id fk, recipient_email, recipient_name, recipient_company
- merge_data jsonb, message_id, status (queued, sent, delivered, bounced, opened, clicked, replied)
- error, sent_at

### 3. Pre-seeded UAE database (REQUIRED — no empty tables)

Seed via migration with the real UAE market:

**Developers (≥ 40)** — Emaar, DAMAC, Nakheel, Aldar, Sobha Realty, Meraas,
Dubai Properties, Select Group, Ellington, Danube, Binghatti, Azizi,
Deyaar, Union Properties, MAG, Tiger Group, Reportage, Bloom Holding,
Imkan, Eagle Hills, Iman Developers, Object 1, Samana, Arada, Modon,
RAK Properties, Sharjah Holding, Tilal Properties, Wasl, Meydan, Citi
Developers, etc. For each: real website, HQ Emirate, HQ address,
Google Maps URL, primary sales/broker-registration email if publicly known.

**Brokerages (≥ 80)** — Betterhomes, Allsopp & Allsopp, Driven, Espace,
Provident, fäm Properties, hausandhaus, Engel & Völkers Dubai, Metropolitan,
Luxhabitat Sotheby's, Haus & Haus, D&B Properties, Banke, AX Capital,
Savills Dubai, Knight Frank UAE, CBRE UAE, Chestertons, McCone, Aeon &
Trisl, White & Co, Unique Properties, Strada, Asteco, MD Properties, etc.
For each: real website, Emirate, office address, Instagram handle if
public, approximate agent count.

All seeded rows must have `slug`, `hq_emirate`, `website`, and a
`google_maps_url` derived from the office address.

### 4. Directory UX

Both Developers and Brokerages tabs render as a dense, scannable table +
optional card grid with these filters in a sticky toolbar:

- **Emirate** chip filter (multi-select: Dubai · Abu Dhabi · Sharjah · …)
- **Status** chip filter (registration_status / onboarding_status)
- **Has deals** toggle, **Has active agents** toggle (brokerages only)
- Free-text search across name, website, address, contact emails
- Bulk-select checkboxes → "Send Email Campaign" / "Export CSV" / "Mark Invited"

The website cell renders the **clean domain** (strip `https://` and trailing
slash) as the clickable text — never the literal word "Website".

### 5. Detail drawer

Clicking a row opens a right-side drawer with sub-tabs:

- **Profile** — logo, all fields, edit-in-place
- **Contacts** — list of contacts with role, primary toggle, last contacted
- **Registration** — status timeline, our submitted KYC pack link, their approval letter upload, commission terms
- **Deals** — table of deals with counterparty filter applied
- **Commission** — KPI tiles: Total Closed (AED), Invoiced, Paid, **Pending (AED + days aging)**; payments table; "Record payment" action
- **Email History** — every campaign and 1:1 email sent to this counterparty with status (sent/delivered/opened/replied)

### 6. Developer Registration Outbound Flow

A button **"Send Registration Pack to All Developers"** on the Developers
tab launches a campaign wizard pre-filled with:

- **Audience**: all developers where `registration_status = not_started`
- **Sender persona**: `Jane Smith <jane@cit idevelopers-style sender>` —
  presented as *"Jane from the Sales department, on behalf of [Our Brokerage]"*
- **Subject**: `Brokerage registration request — [Our Brokerage Legal Name]`
- **Body** (HTML, editable, with merge fields):

  > Dear {{developer.name}} team,
  >
  > I'm Jane from the Sales department of **[Our Brokerage Legal Name]**,
  > one of the UAE's active real estate brokerages. We would like to
  > register with {{developer.name}} so our agents can market and sell
  > your current and upcoming projects across {{developer.hq_emirate}} and
  > the wider UAE.
  >
  > Please find our full company KYC and registration pack here:
  > **[Our KYC Pack on Google Drive](https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing)**
  >
  > The folder includes: Trade License, RERA Broker Card, MOA, Passport
  > copies of partners, Emirates IDs, VAT certificate, company profile
  > deck, and signed broker registration form.
  >
  > Could you confirm:
  > 1. Your standard commission % and payment terms
  > 2. The next available project launch we may attend
  > 3. The dedicated broker-registration contact at {{developer.name}}
  >
  > Looking forward to a long partnership.
  >
  > Warm regards,
  > **Jane Smith**
  > Sales Department · on behalf of **[Our Brokerage Legal Name]**
  > [phone] · [email] · [website]

- **Attachments**: same KYC pack mirrored as direct attachments where size allows.

On send: mark each developer `registration_status = submitted`, log every
recipient in `email_sends`, schedule a 7-day follow-up campaign automatically
to anyone who hasn't replied.

### 7. Brokerage Outbound Flow (Citi Developers side)

A button **"Invite Brokerages to Sell Citi Developers"** on the Brokerages
tab opens the same wizard pre-filled the opposite direction:

- **Audience**: all brokerages where `onboarding_status = not_invited`,
  segmentable by Emirate (so I can invite all Dubai brokerages to a Dubai
  breakfast, etc.)
- **Sender persona**: `Sales — Citi Developers`
- **Subject templates** (selectable):
  - `Invitation: Citi Developers private breakfast — {{brokerage.hq_emirate}}`
  - `New project launch — broker registration open`
  - `Become an authorized seller of Citi Developers projects`
- **Body**: pre-filled invite with project teaser, commission rate, event
  date/venue, RSVP link, registration form link.

On send: mark each brokerage `onboarding_status = invited` and log sends.

### 8. Email engine (single edge function)

Edge function `send-bulk-email`:

- Accepts `{ campaign_id }`, fans out to every recipient in `email_sends`
- Renders mustache merge fields against the recipient row (developer or brokerage)
- Sends through Resend (or Lovable Emails) with the configured sender persona
- Persists `message_id`, status, error per row
- Webhook endpoint `email-events` updates `email_sends.status` for delivered / opened / clicked / bounced / replied
- Rate-limits to provider-safe levels and retries 5xx with backoff

A second edge function `schedule-followup` runs daily via pg_cron and
re-sends to any `email_sends.status IN ('sent','delivered')` with no reply
after the campaign's `followup_days` window.

### 9. Revenue dashboard

Route `/relationships/revenue` with two columns:

- **Money I'm owed (from developers)** — for each developer where I have
  closed deals: gross commission, invoiced, paid, **pending**, oldest
  unpaid days. Row click → developer drawer Commission tab.
- **Money I owe / collect (brokerages selling Citi Developers)** — same
  layout for brokerages: total closed via them, paid out, pending payout.

KPI strip on top: Total pending (AED), Total collected YTD, Top 5 paying
developers, Top 5 producing brokerages.

"Record new deal" and "Record payment" actions are available everywhere
the relevant counterparty is in scope.

### 10. Security & access

- All tables RLS-protected; only authenticated owner/admin role can read/write
- `client_name` and any KYC PII columns encrypted at rest via pgsodium
- Email sender domain configured via Lovable email domain setup
- Google Drive KYC link stored as a single editable setting in
  `app_settings.kyc_pack_url` so it can be rotated without a redeploy
- All bulk-send actions require an explicit confirm modal showing recipient
  count, sender persona, and a 5-second cool-down

### 11. Acceptance criteria

- Both directories load with ≥ 40 developers and ≥ 80 real UAE brokerages
- Filter by Emirate works on both tabs and on the campaign audience picker
- Website cell shows clean domain text and links to the real URL
- "Send Registration Pack to All Developers" produces one row per developer
  in `email_sends`, with the Google Drive KYC link rendered correctly and
  the sender shown as Jane on behalf of our brokerage
- "Invite Brokerages" segmented by Emirate sends only to that Emirate
- Recording a deal + payment correctly updates the Pending KPI on both the
  counterparty drawer and the global revenue dashboard
- No table is empty on first load; no mock/placeholder rows

## PROMPT END
```

After the file is written, that's the entire change — no code edits elsewhere.
