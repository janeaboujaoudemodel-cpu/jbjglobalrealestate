## What's still broken (from screenshots)

1. **Header title "Relationships Hub"** renders in gold/champagne — global heading CSS is overriding my inline `color: #FFFFFF`. Same for subtitle.
2. **"Back" and "Refresh" pills** — icons/text look faded/dark against emerald. Global icon-lock isn't winning specificity.
3. **Active segment tile ("Brokers · Secondary")** — label + sub-text render dark on emerald (invisible). Global rules are forcing dark ink.
4. **Segment labels wrap vertically** ("Bro / kera / ges", "Deve / lopers") because the icon column + Cormorant 18px + padding overflow a narrow flex row when the preview is split.
5. **KPI cards** — values are emerald on white (OK) but the "TOTAL/UNTOUCHED" eyebrow labels are muted; user wants them clearer. Also the empty-state values need contrast pass.
6. **Wiring gaps**: sending a branded email must increment per-record `emails_sent`, log to activity feed, and update status; Google Calendar bookings must flip status to `briefing_booked` automatically.

## Fix plan

### Phase 1 — Kill contrast overrides on the Hub (frontend only)

Wrap the entire page in `<div data-relationships-hub data-no-contrast-guard>` and add a scoped CSS block in `src/index.css` that wins by specificity + `!important` on the properties that global rules keep flipping:

- `[data-relationships-hub] .rh-header *` → `color: #FFFFFF !important` (title, subtitle, back/refresh text + svg).
- `[data-relationships-hub] .rh-tile-active` → force white text/icon on emerald; inactive tiles → ink `#0F1A16` on white.
- `[data-relationships-hub] .rh-tile-label` → `white-space: nowrap; font-size: clamp(15px, 1.2vw, 18px)` so labels never wrap. Give the icon column `flex-shrink: 0` and the label `min-width: 0; overflow: hidden; text-overflow: ellipsis`.
- Restructure each tile as a two-row layout (icon + label on row 1, sub on row 2) instead of icon+label competing for horizontal space with the sub-copy — matches the mockup and stops the "Bro/kera/ges" wrap at any viewport.

### Phase 2 — Header pills

Rebuild Back/Refresh as `.rh-pill` with:
- background `rgba(255,255,255,0.12)`, hover `0.20`
- 1px border `rgba(255,255,255,0.45)`
- text + icon locked to `#FFFFFF !important`
- consistent padding/height so they read as buttons, not chips

### Phase 3 — KPI strip polish

- Eyebrow labels: `#0F1A16` at 10px/700 uppercase tracking-widest (currently `#4B5D55` — too faded).
- Value: Cormorant 28px `#064E3B`. When `0`, render `—` in `#8A9891` so empty states read as "no data yet" instead of a stark zero.

### Phase 4 — Email → record wiring (already partly in place, verify + patch)

Confirm and, where missing, add:
- `crm-send-brokerage-outreach` and `crm-send-developer-registration` write a row to `crm_relationship_activity` (`kind='email_sent'`, target segment + record id, subject, template) and `UPDATE crm_brokerages / crm_developer_registry SET emails_sent = emails_sent + 1, last_email_at = now(), status = CASE WHEN status='untouched' THEN 'needs_follow_up' ELSE status END`.
- `comm-inbound-sync` on reply: append `kind='email_reply'` activity, set status to `engaged` (or `registered` if AI extracts a registration link + confirmation phrase).
- Hub table gets an "Emails / Last contact / Last reply" column so the outreach loop is visible per row.

### Phase 5 — Google Calendar booking → `briefing_booked`

Root cause of the "Calendar is blocked" flow:
- The Google Calendar Appointment Schedule link (`calendar.app.google/...`) is being wrapped by Resend click-tracking → the wrapped URL fails Google's referrer check → Chrome shows "refused to connect".
- Fix already partially done via `data-no-link-tracking="true"`; confirm the Resend send config also disables click tracking for that specific anchor, or move the CTA to a plain `https://calendar.app.google/...` link with `rel="noopener"` and no wrapper.

Booking → status wiring (no Google API key required):
- Add `google_calendar_webhook_secret` (Cloud secret). In your Google Calendar Appointment Schedule, enable **"Add a description"** and instruct booker email to include `[JBJ-REL:{record_id}]` (auto-appended via query param `?prefill_description=...` in the CTA URL).
- Google Calendar sends a confirmation email to `helpdesk@jbj.ae` / `infoo.jane@gmail.com`. `comm-inbound-sync` already reads that mailbox — extend the parser to detect Google Calendar confirmation subjects (`New booking: ...`) and the `[JBJ-REL:xxx]` token, then update the matched record `status = 'briefing_booked'`, insert `crm_relationship_activity kind='briefing_booked'`, and store the meeting time.
- Optional upgrade (later, only if user wants deeper sync): connect the **google_calendar App User Connector** and mirror events to a `crm_calendar_events` table so bookings show inside the Hub without email parsing.

### Phase 6 — E2E validation

Playwright script at `/tmp/browser/rh-e2e.mjs`:
1. Load `/owner/crm/jbj/owner-relationships-activity`; screenshot header, all 4 tiles, KPI strip at 1280 and 900 viewports (split-screen simulation).
2. Assert computed `color` on `.rh-header h1`, back/refresh buttons, and active tile label is `rgb(255,255,255)`.
3. Assert active-tile label has `white-space: nowrap` (no wrap).
4. Click "Send test" from Branded Emails panel to `infoo.jane@gmail.com`, then confirm a new row appears in the Hub activity feed and the target record's `emails_sent` bumped.
5. Post a fake Google Calendar confirmation email into the inbound webhook fixture; assert record flips to `briefing_booked`.
6. Save screenshots + a pass/fail summary.

## Technical files touched

- `src/pages/owner/crm/RelationshipsHub.tsx` — restructure header, tiles, KPI strip; add `.rh-*` class hooks; add per-row emails/last-contact columns.
- `src/index.css` — new scoped `[data-relationships-hub]` block (Phase 1/2/3 rules).
- `supabase/functions/crm-send-brokerage-outreach/index.ts` and `crm-send-developer-registration/index.ts` — ensure activity row + counter bump.
- `supabase/functions/comm-inbound-sync/index.ts` — Google Calendar confirmation parser + `[JBJ-REL:xxx]` token handling.
- `supabase/migrations/*` — add `emails_sent`, `last_email_at`, `last_reply_at` columns on the three tables if missing, and a `crm_calendar_bookings` audit table.
- `tests/e2e/relationships-hub.spec.ts` (new) — the Playwright checks above.

## What I need you to confirm before I build

1. **Google Calendar link** — do you already have your Appointment Schedule public URL (something like `https://calendar.app.google/xxxxx`)? If yes paste it and I'll wire it as the canonical CTA. If not, I'll leave the CTA disabled until you paste it in CRM Settings.
2. **Deeper Google Calendar sync** — do you want me to also connect the **google_calendar App User Connector** now (event mirror + reminders inside the Hub), or start with the email-parsing approach and add the connector later?