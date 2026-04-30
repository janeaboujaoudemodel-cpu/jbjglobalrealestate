
# Brokerage Hub v2 — Full Parity, Visibility Fix, Deal Intelligence & Per-Lead AI

This plan does five things in one pass. They're tightly related so we ship them together.

---

## 1. Fix the white-on-white readability bug (immediate)

**Problem:** On the Brokerages tab, several cards/badges/tabs render white text + white icons on a champagne/white background — directory rows, source sub-tabs, AI suggestion banner, and the contact line are unreadable on first paint and on hover.

**Fix (no removal of any existing element):**
- Audit `CRMRelationships.tsx` Brokerages tab + `BulkSendDialog.tsx` for any `text-white`, `bg-white`, `bg-purple-50`, low-alpha gold text, and unstated hover states. Replace with the locked tokens: ink `#1A1A1A` on champagne `#F7F2EA / #FDFBF7`, gold `#B89555` only as solid fill with white text, no faded gold, no white-on-light.
- Replace the purple AI suggestion strip with the project's standard AI purple tile (`IconTile tone="purple"` + ink text) so it stays readable on champagne.
- Wrap every brokerage status pill, source pill, and action button in the existing `<IconTile />` / `Button variant="gold|secondary"` primitives so they inherit the contrast guard.
- Add a one-time visual sweep test: `scripts/contrast/check-rendered.mjs` run against `/crm/relationships` (Brokerages tab) so this regression can't ship again.

This is the first thing we do so the rest of the work is reviewable.

---

## 2. Brokerage record gets full developer-style profile

Today `crm_brokerages` already has `office_location`, `office_address`, `phone`, `email`, `logo_url`, `primary_contact (jsonb)`, `secondary_contact (jsonb)`. We extend the **UI** (not the schema, mostly) to surface and capture all of it, plus add what's missing.

**Schema additions (one migration):**
- `crm_brokerages.active_broker_count int default 0`
- `crm_brokerages.inquiry_count int default 0` (auto-incremented when an inbound message arrives)
- `crm_brokerages.deal_count_cached int default 0` and `total_deal_value_cached numeric default 0` — refreshed by trigger on `crm_brokerage_deals` (table below).
- `crm_brokerages.position_titles jsonb` — already covered by `primary_contact.role` / `secondary_contact.role`, no change needed.

**Brokerage card / edit dialog gets:**
- Logo upload (uses the existing `<DeveloperLogo />` allow-list rules, mirrored as `<BrokerageLogo />`) — falls back to `Building2` icon, never a substitute photo.
- Office address + map link (already in DB, just expose), website, phone, primary email.
- **Primary contact** + **Secondary contact** rows: name, **position/role**, phone, email, WhatsApp.
- KPI strip on every card: **Active Brokers · Inquiries · Deals Closed · Total Value · Last Deal Date**.

---

## 3. UAE Brokerage Directory — explanation + expansion to full UAE

**What "UAE Directory" means today:** The 73 rows tagged `entry_source = 'directory'` are pre-loaded reference companies (RERA-licensed brokerages we seeded). They're read-only reference data so you can find a company quickly, then either contact them or convert them into a "My Addition" (your own CRM record). The other two sub-tabs are:
- **My Additions** — companies you added yourself.
- **Existing Matches** — your additions that match a directory entry (so you can dedupe).

**Expansion to ~30,000+ brokerages:**
- Add an admin-only **"Sync UAE Directory"** edge function `crm-brokerage-directory-sync` that pulls from the **Dubai Land Department / RERA public broker registry** + Abu Dhabi DMT registry on demand and upserts into `crm_brokerages` with `entry_source = 'directory'`. The function is idempotent (matches on normalized RERA license + normalized name) and writes to `crm_brokerage_sync_log` so we can see what changed.
- Source URLs are stored in `partner-governance.ts` so you control them. First sync is run once; after that there's a "Refresh Directory" button on the page (admin only, rate-limited to once/24h).
- The bulk-select + bulk-outreach already built keeps working — directory entries with an email become eligible for outreach.

**Filter UX you asked for:**
- Emirate filter already exists. We add a live count next to each option ("Dubai · 1,842", "Abu Dhabi · 612", …) computed from the current dataset so when you pick an emirate you immediately see the agency count.
- Add filters: status, has-email, has-phone, has-deals, last-contacted range, RERA active/expired.
- Add `7 / 30 / 90 day` activity filter to find dormant agencies.

---

## 4. Brokerage outreach reply handling + AI suggestions

The outbound flow we just built (Jane → Private Breakfast Briefing) already records sends in `crm_relationship_email_log`. We close the loop:

- **Inbound capture:** the existing Gmail watcher writes replies into `crm_brokerage_notes` and increments `inquiry_count`. Each inbound message becomes a thread on the brokerage card.
- **AI reply suggestions:** for every inbound message, an edge function `crm-brokerage-reply-suggest` runs through Lovable AI Gateway (`google/gemini-3-flash-preview`) and produces:
  1. A 1-line summary of what they said.
  2. 2–3 suggested replies (warm / direct / qualifying), each with the JBJ template tone.
  3. Recommended next step ("Schedule breakfast", "Send commission sheet", "Mark do_not_contact", "Move to qualified").
  4. The exact email template to send (pulled from `crm_email_templates` — same `brokerage_partnership_intro` / `brokerage_breakfast_invite` / a new `brokerage_followup` variant).
  5. Auto-CCs you (founder email) and the assigned account owner.
- **Suspend agency** action on each card: sets `do_not_contact = true` with a reason — already supported in the schema.

---

## 5. Deal tracking + leaderboard (the big one)

**New table `crm_brokerage_deals`:**
- `id`, `brokerage_id` (fk → `crm_brokerages`), `developer_id` (fk → `developers`, **defaults to City Developments / Citi Developers**), `developer_name_snapshot` (so a developer rename doesn't break history), `unit_label`, `client_name`, `deal_value_aed numeric`, `currency text default 'AED'`, `closed_on date`, `commission_aed numeric`, `notes`, `created_by`, `created_at`, `updated_at`.
- RLS: only the founder + assigned account owner can see/edit; admins can see all.
- Trigger: on insert/update/delete, recompute `deal_count_cached` and `total_deal_value_cached` on the parent brokerage.

**Register a deal UI:**
- "Register Deal" button on every brokerage card. Modal:
  - Brokerage (locked to current row)
  - Developer (`<DeveloperPicker />` — same component used in CRM, prefilled with **City Developments** but searchable across all developers)
  - Unit label, client name, value (AED), commission, closing date, notes
  - On save: insert into `crm_brokerage_deals`, update brokerage cache, log to `crm_action_log`.

**Leaderboard / rankings page** at `/crm/relationships?view=rankings`:
- Tabs: **This Month · This Quarter · This Year · All Time · Custom range**
- Table: Rank · Brokerage · Logo · # Deals · Total Value (AED) · Avg Deal · Last Deal · vs Previous Period (delta arrow).
- "Compare to my closing deals" panel: your personal totals (founder) for the same window pulled from `deals` table you already have, side-by-side.
- **Downloadable**: PDF (jsPDF, branded letterhead per Institutional PDF Reporting standard) + CSV. Files written under `/mnt/documents/` for ad-hoc exports too.

---

## 6. Per-lead AI assistant (Brokerages, Clients, Brokers, Developers, Admins)

You want one star button next to every record (across all five entity types) that opens the assistant scoped to *that lead*.

- New component `<LeadAIStar entityType="brokerage|client|broker|developer|admin" entityId={...} />` rendered on every CRM card.
- Click opens a slide-over assistant panel (reusing the existing `CRMAssistantPanel.tsx`) with the lead pre-loaded as context. Inside:
  - **Voice note input** (existing `<VoiceNoteRecorder />`) — speak "remind me Tuesday 6pm to call them", AI parses intent and:
    - Adds a note to the lead (`crm_brokerage_notes` / `crm_lead_notes` / etc.)
    - Creates a calendar event in the founder's calendar (Google Calendar connector if linked, else internal `meeting_center` table)
    - Creates a task in `web_developer_tasks` / `crm_action_log`
    - Optionally moves the lead between CRM stages
  - **Summarize this lead** — AI reads all notes, emails, deals, inquiries and produces a 5-line brief.
  - **Suggest next step** — gives 2–3 options with one-click accept.
  - Buttons: *Add to Calendar · Add Note · Move to CRM Stage · Send Email · Register Deal · Suspend*
- The assistant has read access (via edge function `crm-lead-assistant`) to:
  - the lead row
  - all notes / messages / emails for that lead
  - your calendar events
  - your task list
  - your closed deals (for "compare to my pipeline" answers)
- All actions are logged to `crm_action_log` with `actor = founder`, source = "lead-ai-star".

---

## What gets built — files

```
supabase/migrations/<ts>_brokerage_v2.sql
  - add active_broker_count, inquiry_count, deal_count_cached, total_deal_value_cached
  - create crm_brokerage_deals + RLS + trigger
  - create crm_brokerage_sync_log

supabase/functions/crm-brokerage-directory-sync/index.ts   (new)
supabase/functions/crm-brokerage-reply-suggest/index.ts    (new, Lovable AI)
supabase/functions/crm-lead-assistant/index.ts             (new, Lovable AI + calendar + tasks)

src/components/crm/BrokerageLogo.tsx                       (mirror of DeveloperLogo)
src/components/crm/BrokerageDealModal.tsx                  (Register Deal)
src/components/crm/BrokerageRankings.tsx                   (leaderboard + PDF/CSV export)
src/components/crm/LeadAIStar.tsx                          (universal star button)
src/components/crm/LeadAssistantSheet.tsx                  (slide-over assistant)

src/pages/CRMRelationships.tsx
  - contrast fixes
  - new KPI strip on each card
  - logo + secondary contact + position fields
  - Register Deal + Rankings + Refresh Directory buttons
  - LeadAIStar on every brokerage row
  - Emirate filter shows live counts

src/pages/CRMLeads.tsx, CRMClients.tsx, CRMEmployees.tsx,
src/pages/admin/AdminUsers.tsx, src/pages/developers/Developers.tsx
  - mount <LeadAIStar /> on every row

scripts/contrast/check-rendered.mjs
  - add /crm/relationships to the rendered-contrast sweep
```

## Out of scope for this turn

- Pulling all 30,000+ UAE brokerages on day one. The sync function is built; the first run pulls **Dubai (RERA)** which is ~7,500 active offices. Abu Dhabi + Sharjah follow once we confirm the Dubai sync is clean. We don't want to fill your CRM with 30k stale rows in one shot.
- WhatsApp/SMS reply suggestions (email-only for v1, exactly like the developer flow).
- A standalone mobile app for the assistant — it works inside the existing CRM today.
