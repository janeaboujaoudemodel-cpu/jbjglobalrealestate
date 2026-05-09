## Trade-license values (locked from your PDF)

I'll write these into `src/config/companyLegal.ts` as the single source of truth for the PAA, Listing Authorisation, and any legal surface:

```text
TRADE_LICENSE_LEGAL_NAME   = "J B J GLOBAL REAL ESTATE L.L.C S.O.C"
TRADE_LICENSE_BRAND        = "JBJ GLOBAL REAL ESTATE"
TRADE_LICENSE_OFFICE       = "Office SM1-195, Port Saeed, Deira, Dubai, UAE
                              (Owned by Mohammed Saeed Hareb, Parcel 129-417)"
TRADE_LICENSE_NUMBER       = "1591031"           // DED License
TRADE_LICENSE_DCCI_NO      = "666113"
TRADE_LICENSE_REGISTER_NO  = "2789619"
TRADE_LICENSE_ISSUE_DATE   = "2026-01-13"
TRADE_LICENSE_EXPIRY_DATE  = "2027-01-12"
TRADE_LICENSE_LEGAL_TYPE   = "Limited Liability Company - Single Owner (LLC-SO)"
TRADE_LICENSE_OWNER_NAME   = "JANE ABDALLAH BOU JAOUDE"
TRADE_LICENSE_OWNER_NATIONALITY = "Lebanese"
TRADE_LICENSE_ACTIVITIES   = ["Leasing Property Brokerage Agents",
                              "Real Estate Buying & Selling Brokerage"]
COMPANY_CONTACT.phone      = "+971 56 591 1000"
COMPANY_CONTACT.email      = "Contact@JBJ.AE"
COMPANY_CONTACT.website    = "www.jbj.ae"
```
I will not ask for these again.

---

## 1. CRM · Developers (JBJ CRM → Developers tab) — institutional upgrade

Replace the current sparse table with a developer command‑center, sourced first from `public.developers` and enriched on demand.

**Per‑row card / drawer fields (clickable wherever sensible):**
- Logo · Name · Slug · Founded · Headquarters · Office address (opens Google Maps)
- CEO · License # · Parent company · Specialization · Rank · Portfolio worth
- Completed / Off‑plan / Total units / Upcoming units · Notable projects (chips)
- Website (↗) · Instagram (↗) · LinkedIn (↗) · Admin email (mailto:) · Office phone (tel:) · WhatsApp (wa.me) · Office location (maps)
- Notes · Registration status · Source pill (database/uploaded/manual/scraped)
- Tasks · Calendar events · Reminders (assignable to me / Amanda / any employee)
- Brokers working at this developer (count + list) — derived from `crm_brokers.current_brokerage_id` join + `current_company` fallback

**Schema additions (migration 1):** add to `public.developers` —
`instagram_url`, `linkedin_url`, `office_phone`, `whatsapp`, `admin_email`, `office_address`, `google_maps_url`, `registration_status`, `notes`, `last_enriched_at`, `enrichment_source`.

**Enrichment edge function `developer-enrich`:** for any developer row missing one of {`logo_url`, `headquarters`, `ceo_name`, `license_number`, `founded_year`, `website_url`, `instagram_url`, `linkedin_url`, `office_phone`, `admin_email`}, scrape Google + the developer site via Lovable AI Gateway (Gemini Flash) and persist results. Triggered on row open and via a "Refresh from web" button. Rate‑limited; logs to `developer_enrichment_log`.

**Tasks / calendar / notes integration:** drawer gets three native tabs that read/write `crm_tasks`, `calendar_events`, `crm_notes` with `entity_type='developer', entity_id=<id>`. Assignee picker = me + active employees from `employees`.

---

## 2. CRM · Brokers — registry rework

**Rename + clean tabs.** Drop the misplaced "Registered / External" split. New tabs:
`All · Sales · Leasing · Pending` (the *registration / verification* concept stays inside Brokerage Agencies, where it belongs).

**Schema additions (migration 2)** to `crm_brokers`:
`personal_email`, `company_email`, `personal_phone`, `company_phone`, `whatsapp`, `birthday DATE`, `experience_years`, `broker_type` ('sales'|'leasing'|'both'), `linkedin_url`, `bayut_url`, `pf_url`, `instagram_url`.

**Drawer fields** (everything optional, fill anytime):
Photo · Full name · Nationality · Languages · Experience · Birthday · Personal email · Company email · Personal phone · Company phone · WhatsApp · LinkedIn · Bayut/PF profiles · Current company (typeahead — see below) · Position · Tier · RERA · Notes · Source pill (database name + upload file + manual marker) · Broker type (Sales / Leasing).

**Company typeahead.** When typing in "Current company", show a live dropdown of nearest matches from `crm_brokerages.name` ∪ `developers.name`. Selecting a match writes both `current_company` (text) and `current_brokerage_id` (FK) so the broker appears under that company everywhere.

**Bidirectional company ↔ broker visibility:**
- Inside a developer or brokerage drawer → "Brokers" tab lists every broker with that company.
- Inside a broker drawer → "Companies worked for" timeline (already exists via `broker_company_history`) is preserved.
- Counts (total brokers, brokers per company) are derived live.

**LD database backfill.** Run a one‑time idempotent import (edge function `brokers-ld-backfill`) of the 33k+ LD source rows into `crm_brokers` with `database_source='LD'`, deduped on `(lower(email_lower), phone_e164)`. Source pill displays "LD database". I'll run it once you approve the migration.

---

## 3. Birthday automation (workflow)

**New table `birthday_workflow_runs`** (date, audience kind, sent count). **Edge function `birthday-dispatcher`** runs daily via pg_cron at 08:00 Asia/Dubai and:

1. Pulls everyone with `birthday = today` from `crm_brokers`, `crm_leads`, `developer_sales_reps`, `crm_clients`, `employees`.
2. Renders the "Happy birthday from JBJ" template (champagne‑gold, signature from Jane, monogram).
3. Sends through the existing Resend pipeline (respects `email_quota_try_claim`).
4. Posts a daily morning briefing card on the owner dashboard listing today's birthdays — even before send.

Single editable template at `src/templates/birthdayEmail.ts`. End‑to‑end test will run with a synthetic `birthday=today` row to confirm enqueue + delivery + log row.

---

## 4. Trade-license values flow into the document

Beyond the constants above, the PAA + Listing Authorisation will print:
- Header legal name in spaced form `J B J GLOBAL REAL ESTATE L.L.C S.O.C` (exact dotting from the license).
- Footer: License #, DCCI #, Register #, Issue/Expiry dates, office line.
- Activities listed in compliance footer.

---

## 5. UI / UX bug sweep (the small but visible stuff)

- **Vertical letters**: every place a long word is used as a stat label inside a flex/grid card with `min-w-0` missing — apply `min-w-0`, `whitespace-nowrap`/`break-words`, `truncate` and a guaranteed `flex-1` on the text column. Audit `BrokersRegistry` stat strip (visible bug), `IconTile` rows, dashboard KPI cards. Container queries on the body so the visual‑edit sidebar opening can't compress cards into one‑letter stacks.
- **Fake email**: remove any rendering of the auth user's email next to the brokers area / next to "owner" badge. Where an email is shown, replace with role label "Owner" only.
- **Upload / Legacy backfill / database / campaign chips** in BrokersRegistry: wire each to its real action (Upload → ImportBrokersDialog; Legacy backfill → backfill edge function; Database → source filter; Campaign → campaign attribution). Today they only clear filters — that's the bug.
- **JBJ Brokers chip**: make it filter `database_source='JBJ'`, not no‑op.
- All cards in BrokersRegistry become click‑through to the broker drawer (currently only the row is).

---

## What runs vs what waits

| # | Step | Type |
|---|------|------|
| 1 | Write `companyLegal.ts` from license | code edit |
| 2 | Migration: developers + crm_brokers columns + birthday workflow table + indexes | DB migration (needs your approval) |
| 3 | Developer drawer rebuild + enrichment edge fn | code |
| 4 | Brokers drawer + tabs + typeahead + chip wiring + UI bug sweep | code |
| 5 | LD 33k backfill | edge fn invocation after migration |
| 6 | Birthday cron + template + tested end‑to‑end | code + cron |

Out of scope this round: redesigning Investors / Sales Reps / Agencies (they are not broken in this brief) and modifying Lovable's visual‑edits sidebar itself (we only protect against its width).

After approval I push the migration immediately, then proceed through 1 → 6 without further questions.
