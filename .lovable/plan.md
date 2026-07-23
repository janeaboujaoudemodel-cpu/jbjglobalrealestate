# JBJ Hub — Brokerage/Developer Portal Overhaul + Deals Ledger

Large scope split into 6 sequential phases. Each phase ends with Playwright screenshot proof before moving on.

## Phase 1 — Contrast & UX fixes (Brokerage + mirror to Developer)

Applies to `BrokeragePortal.tsx`, `DeveloperPortal.tsx`, `BrandedEmailsPanel.tsx`, `BrandedEmailsLauncherCard.tsx`.

- Active pill "All / Sent / Opened / Responded": force emerald bg (#064E3B) + pure white text/icons, kill any green-500 fallback.
- Search-sent-emails input: fix icon overlap (absolute-positioned icon inside padded input, no floating outside field).
- Branded Emails sheet:
  - Add persistent X close button (top-right, emerald on white, keyboard Esc also closes).
  - Google Calendar booking section: white text on emerald active tabs, white "Save & use" button text/icon, white check icon.
  - Kill slow open: pre-warm template + audience on hover (already partial), lazy-load preview iframe only after sheet is visible.
  - Preview iframe: keep `window.open` interception for Drive/Calendar (already added), verify not regressed.
- Brokerage cards: replace "Briefing status" label with dual field — **Agency status** (Active / Inactive) + Briefing status kept as secondary.
- Individual broker cards: same card style as brokerage; add **Registration** (with CITI Developers / with JBJ Global) + **Broker status** (Active/Inactive) instead of "Pending group".

## Phase 2 — Search overhaul

- Global command palette (Cmd/Ctrl-K "Search records"): add scope filter chips — **All / Sidebar / Properties / Brokerages / Brokers / Developers / Deals**. "Sidebar" restricts to nav items only.
- Brokerage search inside portal: switch to trigram/ILIKE across `name_en`, `name_ar`, `dld_number`, `email`, `phone`, `area`. Currently misses partial matches — fix with `%q%` on all fields + debounce 200ms + backend RPC `search_brokerages(q text)`.

## Phase 3 — Developer campaign dashboard (mirror of brokerage)

- Add "Emails sent + replies" tab in Developer Portal identical to brokerage: Sent / Opened / Responded / Auto-skip counts, sent-emails search, dashboard cards.
- Wire counts to real `crm_email_send_log` + `crm_relationship_events` rows scoped to `channel='developer'` (fix "still shows 0" — root cause: query filtered by wrong channel or missing developer_id join; will audit + repair).
- Add campaign-tracking Activity section to sidebar under Portal Hub → **Activities**.

## Phase 4 — Auto-fill developer profile from email replies (Lawyer Mode)

Extend `comm-inbound-sync` AI extractor to parse developer replies and split fields into:

**Public (front-end safe)** → stored on `developer_profiles`:
- Company name, logo, website, project portfolio names, brand tagline, general regions of operation.

**Private (back-end only)** → stored on new `developer_profiles_private` (RLS: owner_id only, no anon/public grants, view exposes only public fields):
- Direct phone numbers, personal emails, WhatsApp numbers, office address, contact person names/titles, commission terms, RERA numbers, bank details, marketing folder URLs.

Front-end developer cards read from the public view; back-end drawer reads both. Migration adds the private table + view + RLS.

## Phase 5 — Deals Ledger ("My Deals")

New sidebar entry under Core: **Deals Ledger** (`/owner/crm/jbj/deals`).

Two tabs:
1. **CITI Developers deals** — sales rep role (Jane at CITI).
2. **JBJ Global deals** — brokerage role (owner).

Each deal row:
- Client (name, contact — private), project, developer, brokerage/broker attribution, deal value, commission % + auto-calculated commission amount, status (`draft → signed → invoiced → commission_received`), close date.

Insights strip: MoM revenue, MoM commission, YTD totals, top developer, top broker, avg deal size, pending commissions.

Wired to Overview page as new cards.

Schema: `crm_deals` table with owner-only RLS + GRANTs for authenticated/service_role.

## Phase 6 — Pending/Responded task & AI drawer

- Click any status pill (Pending / Responded) on brokerage or developer campaign dashboard → opens right-side drawer.
- Drawer shows:
  - AI thread summary (per contact) via `inbox-ai-command` model.
  - "Next step" recommendation + editable AI draft reply.
  - Quick actions: Create Task, Schedule Meeting, Add to Calendar, Add Note, Set Reminder, Set Alert.
- Tasks/meetings/notes persist to `crm_tasks`, `crm_meetings`, `crm_notes` (existing or new — will audit first).

## Technical notes

- All new tables get GRANT + RLS in the same migration; private tables deny anon.
- No blue anywhere; emerald #064E3B + champagne #B89555 tokens only.
- Playwright proof after each phase saved to `/mnt/documents/phase-{n}-proof/`.
- Sender/signature rules unchanged: brokerage side = CITI Developers / Jane, developer side = JBJ Team / company-only.

## Delivery order

I'll implement Phase 1 first (fastest visible wins + unblocks your live-send frustration), then 2 → 6. Confirm and I start with Phase 1.
