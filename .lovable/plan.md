
# JBJ Hub — Full DLD + Portal Cleanup Plan

Big request, so I'm splitting it into 7 phases and asking you to confirm before I ship. Nothing here touches raw DLD data — location/contact enrichment is stored in **separate columns** so the "never touch the database" rule is preserved.

---

## Phase 1 — Global icon contrast lock (fast, visual only)

- Force **pure white** fill/stroke on every `+` (add) button and every "send" (paper-plane) arrow button that sits inside an emerald pill/box, across:
  - JBJ Hub top bar (`+`, search, notifications, calendar)
  - Branded Emails "Save" button next to booking link
  - Branded Emails "Send test" arrow
  - "Send live to N brokerages/developers" CTA arrow (kept gold background, but arrow forced white)
  - Broker/Developer portal toolbar `+` buttons
- Enforcement via a single CSS lock in `src/index.css` targeting `[data-emerald-icon-lock]` + patching the offending components (no per-page tweaks).

## Phase 2 — Card layout + status dropdown

- Rebuild the brokerage/developer card grid so every card has the **same row heights** (Not Registered / group status / dld_register / Specialty / Email / Phone / Contacts / Status). Uses CSS grid with fixed row tracks, so 100 KEYS and 100 YARDS line up perfectly.
- Replace the single **"Mark briefing done"** button with a status dropdown offering:
  - **None / Pending** (default — no status)
  - **Scheduled**
  - **Postponed**
  - **Briefing done**
  - **Declined**
  - **Rejected**
  Clicking always re-opens the menu; selecting **None** clears the status. Same control on Broker Portal, Developer Portal, and inside the pending-approval list.
- New column `briefing_status` on `crm_brokerages` and `crm_developer_registry` (enum, nullable). Migration includes GRANTs + RLS.

## Phase 3 — Location + logo enrichment (backend-only, never rendered on public site)

- New edge function `crm-enrich-brokerage` and `crm-enrich-developer`:
  - Reads company website (or Googles the company name via Firecrawl `/search`) → scrapes `/contact` / homepage → extracts **office address, phone, website, logo URL**.
  - Writes to `enriched_location`, `enriched_phone`, `enriched_website`, `enriched_logo_url` **new columns** — raw DLD fields stay untouched.
  - Skips rows where the field is already present.
- Runs nightly after the DLD sync, plus an owner-only "Enrich now" button on the Relationships Hub.
- **Frontend rules (locked):**
  - Public site: brokers/brokerages → **never show** location or contact.
  - Public site: developers → show everything **except** location + contact (unchanged from your earlier rule).
  - Owner backend only: enriched fields are visible in the card.
- Developer logo fallback replaced: dropdown pulls `enriched_logo_url` first, then falls back to a subtle emerald monogram (no generic building icon).

## Phase 4 — DLD brokers (individuals) scrape

- Fully activate the individual-brokers DLD source (`.../licensed-real-estate-brokers-list/`) that you paused earlier.
- Ingested into `crm_brokers_individual` and split into **Sale** / **Lease** (per your earlier rule — no off-plan/secondary split for individuals).
- Dedup logic: match by (full name + DLD license #). New rows go to pending approval; conflicts (same person, new phone/email) flag into `dld_scrape_conflicts` as you already have wired.
- Nightly cron already covers this; I'll just enable the module and add the two segment tabs in the hub.

## Phase 5 — Branded Emails cleanup

- **Brokerage panel:** remove the Google Drive link field entirely (it's a developer-only field).
- **Developer panel:** remove the Google Drive link field from the send panel — the Drive link is already saved once in Developer Contracts; the send function reads it from there. One canonical Drive link per developer, no re-paste.
- "10,262 eligible selected" summary chip → emerald→black gradient with white text (matches Send Live gold CTA rhythm).
- Save-booking-link button arrow forced white on emerald.

## Phase 6 — Google Calendar connector (real setup, no API key)

Root cause of `calendar.google.com is blocked`: you were pasting the **calendar.google.com/calendar/appointments/schedules/...** internal edit URL (which Google refuses to iframe/redirect). The public booking URL is `https://calendar.app.google/...` — different host, no block.

Fix in three parts:
1. **Connector auto-open:** on first visit to Branded Emails (brokerages) with no saved link, auto-launch the App User Connector flow for `google_calendar` so the owner grants access once.
2. **Auto-fetch public booking URL:** after consent, `crm-fetch-calendar-booking-url` edge function calls `GET /calendar/v3/users/me/calendarList` + `appointmentSchedules` and stores the public `calendar.app.google/...` URL into `crm_owner_settings.google_calendar_booking_url` automatically. No manual paste required.
3. **Two-way sync (already wired via `breakfast-calendar-sync`) is extended:** every booking on that schedule → creates a row in `crm_meetings`, sends the owner an email reminder 1h before, adds a task to your daily schedule, and triggers a reminder email to the brokerage 24h before.

Also: WhatsApp `+971 54 716 7107`, website `citideveloper.com`, and office address links are all pre-validated with a redirect check so they never open a blocked page.

## Phase 7 — Kill the old backend, once and for all

**Root cause:** two shells exist — the "Owner Panel/Overview" legacy shell and the emerald JBJ Hub. Some cards (Relationships Hub, DLD sync alert) were mounted **inside the legacy shell's `/owner/*` routes** instead of the emerald hub's `/owner/crm/jbj/*` namespace. When you click from the emerald sidebar it links into the correct route; when you land via an old bookmark or from an older link it lands on the legacy shell.

Fix:
- Add a **route guard** at the `<App />` level: any hit on the legacy `/owner/panel`, `/owner/overview`, `/owner/backend/*` paths **301-redirects** to the matching emerald `/owner/crm/jbj/*` route.
- Delete the legacy sidebar entries (`Owner Panel`, `Overview`, etc.) — the emerald shell becomes the only entry point.
- Every card/component the legacy shell used to render is re-mounted under the emerald hub. `RelationshipsHub`, `DldSyncStatusAlert`, `PendingBrokerageImportsSection`, `BrandedEmailsPanel` are re-verified to render only inside the emerald shell.
- Add a **route-registry lint rule** that fails CI if any component renders under a `/owner/panel|/owner/overview|/owner/backend` route — this is what will actually prevent recurrence.

---

## E2E validation (Playwright, screenshots posted back)

Once each phase lands I'll drive Playwright headless against localhost and post screenshots for:
1. Emerald hub `+` and send buttons (white icons).
2. Brokerage cards aligned side-by-side.
3. Status dropdown open on a card, selecting **Scheduled** then reverting to **None**.
4. DLD sync run completing with brokers-individual segment populated.
5. Enriched location + logo showing in the owner card but **not** on the public brokerage listing.
6. Google Calendar booking auto-URL populated + a test booking flowing into `crm_meetings`.
7. Old `/owner/panel` URL redirecting to `/owner/crm/jbj/home`.

---

## Confirm before I start

Reply "**go**" and I execute phases 1→7 in that order (each phase is independently shippable). If you want me to change ordering (e.g. start with the Google Calendar fix), tell me which phase to run first.

One question on Google Drive: you asked whether to **merge** the new file into the existing Developer Contracts Drive folder. My recommendation is **merge** — one canonical `/JBJ/Developer Contracts/<developer slug>/` folder per developer, no duplicate links to maintain. Confirm and I'll wire the merge in Phase 5.
