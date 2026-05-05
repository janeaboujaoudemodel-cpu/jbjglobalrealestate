## Scope
Five connected fixes around the Brokerage Outreach Pack and the Private Breakfast booking flow, plus a new Breakfast Bookings section inside the Command Center.

---

## 1. Brokerage Outreach Pack — show Primary + CC + Template inline

In `src/pages/CRMRelationships.tsx` (the Brokerages tab section starting at line 601), restructure `DocumentPackPanel` so for `context="brokerage"` it always renders:

- **Drive URL row** (already there)
- **From name + Primary sender (Reply-to)** — `PrimarySenderEditor` always visible
- **CC emails** — `CcListEditor` always visible
- **Template editor block** (currently only opened via a button) — embed the brokerage template editor inline as a collapsible card pre-expanded, using the existing `TemplateEditorDialog` content extracted into a reusable `<BrokerageTemplatePanel />` (or render the dialog body inline). Shows both `brokerage_partnership_intro` and `brokerage_breakfast_invite` variants, side-by-side with subject + HTML preview and Save.
- **Send Test** button at the bottom of the card.

Goal: everything Amra needs (sender, CCs, template, test) is in one visible place — no hidden dialogs, no scrolling required to locate the primary email.

---

## 2. Test Send — remove "Sample / TEST / ACAEA", use real names

In `supabase/functions/crm-send-brokerage-outreach/index.ts`:

- **Drop the `[TEST]` subject prefix** when `isTest`. Send the real subject.
- **Sample contact name**: when `isTest`, derive `contact_first_name` from the recipient email's local-part (e.g. `jane@…` → "Jane"), and `brokerage_name` from `body.testBrokerageName` (default to a clean value like the recipient's domain — never "Sample Brokerage Group").
- **Group status label**: never emit the raw key (this is the "ACAEA"-looking text user is seeing — likely the uppercase status code leaking through). Force it to a clean label like "Channel Partner" for tests, never the enum string.
- **Greeting**: render as `Dear {first_name} from {brokerage_name},` — pass through to the template fallback HTML at lines 416–431.

In `TestSendDialog.tsx`:
- Remove "Sample brokerage name" placeholder defaulting to `"Sample Brokerage Group"`. Default to empty; if empty at send time, the edge function uses the email-derived value.

---

## 3. Unified Briefing + Breakfast email with premium background layer

Replace the two separate variants (`brokerage_partnership_intro`, `brokerage_breakfast_invite`) usage path so the **single email Amra sends** includes:

- Briefing intro (current intro copy)
- Featured project (AMRA by default) card
- Inline **Private Breakfast invitation** with the booking CTA (`{{booking_url}}`)
- Calendar slot summary block (uses `{{preferred_event_time_label}}` if set)
- Premium background: wrap the body in a champagne layered background
  ```
  <body style="background:linear-gradient(180deg,#FDFBF7 0%,#F7F2EA 100%); padding:40px 0">
    <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #B89555;border-radius:14px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
      …
    </div>
  </body>
  ```
- Migration: update the stored HTML for `brokerage_partnership_intro` in `crm_email_templates` to include both briefing + breakfast sections in one premium layout. Delete/deprecate the standalone breakfast variant in the UI (still kept in DB for compatibility).

---

## 4. Breakfast slots from 11:00 to 17:00

Migration to refresh `breakfast_slots`:

- Deactivate existing 12:30 / 13:30 slots
- Insert hourly active slots `11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00` (Asia/Dubai → stored as UTC) for the next 8 weeks on the same weekdays already used (Tue/Thu)

Update `BreakfastBooking.tsx` slot label formatter — already uses `format(..., "HH:mm")`, no UI change needed.

---

## 5. Booking confirmation — premium card + contact details + calendar integrations

In `src/pages/BreakfastBooking.tsx`, replace the current `confirmed` view with a richer success card:

- Headline: "Thank you for booking your private breakfast with JBJ Global Real Estate"
- Confirmation card showing:
  - Date · Time · Attendees
  - **Location**: Citi Developers Sales and Experience Center, Dubai
  - **Your host on arrival**: Jane Bou Jaoude — `+971 54 716 7107` (tel: link)
  - "When you reach the building, call/WhatsApp Jane on the number above and she'll meet you."
- Action row (4 buttons):
  - **Add to Google Calendar** — open `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=…&details=…&location=…` with full details
  - **Add to Apple / Outlook (.ics)** — uses existing `downloadIcs()` enriched with `ORGANIZER`, full address, phone in DESCRIPTION
  - **Download invitation card (PNG)** — render the confirmation card to a canvas via `html2canvas` and download as `jbj-breakfast-invitation.png`
  - **Copy invitation text** — copies a clean plaintext summary (date, time, location, contact, agenda) to clipboard
- All copy + .ics now include `LOCATION:Citi Developers Sales and Experience Center, Dubai`, organizer Jane + phone in DESCRIPTION.

Add `html2canvas` dependency for the PNG export.

---

## 6. Booking notifications — email Jane + in-app notification + Command Center section

### Edge function `breakfast-booking-confirm`
After the existing update at line 134:

1. **Email Jane**: send via Gmail (reuse the same gateway pattern as `crm-send-brokerage-outreach`) to `janeaboujaoudenails@gmail.com` (and any saved owner CCs) with subject `Breakfast booked — {brokerage_name} · {date} {time}` and a premium HTML summary (brokerage, contact name/email/phone, attendee count, slot, briefing topics, partnership focus).
2. **In-app notification**: insert into `notifications` table (or whatever table `useNotifications` reads — confirm by reading `src/hooks/useNotifications*`) with type `breakfast_booked`, linking to `/owner/crm/relationships?tab=breakfast`.
3. Already inserts into `crm_relationship_email_log` ✅

### New Command Center "Breakfast Bookings" section

Add a new tab/section inside `CRMRelationships.tsx` (Brokerages tab) labelled **"Breakfast & Briefings"** — a dense table reading from `meeting_requests WHERE booking_kind='brokerage_breakfast' AND status IN ('pending','completed')` joined with `crm_brokerages`:

| Date · Time | Brokerage | Contact | Phone | Email | Attendees | Briefing Topics | Status | Actions |

Includes: realtime updates (subscribe to `meeting_requests` via Supabase realtime), filter by upcoming/past, export.

Wire a small badge in the existing brokerage tab header showing count of upcoming bookings.

---

## 7. Files

**Edits**
- `src/pages/CRMRelationships.tsx` — restructure `DocumentPackPanel` (brokerage), add Breakfast Bookings section
- `src/components/crm/EmailListEditor.tsx` — minor visibility tweaks (always-show label even with empty saved list)
- `src/components/crm/TestSendDialog.tsx` — drop "Sample" defaults
- `src/components/crm/TemplateEditorDialog.tsx` — extract reusable `<TemplatePanel mode="brokerage" />` for inline render
- `src/pages/BreakfastBooking.tsx` — premium confirmation card, html2canvas PNG, Google Calendar URL, enriched .ics
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — drop `[TEST]`, derive contact name from recipient email, premium gradient wrapper, unified briefing+breakfast body
- `supabase/functions/breakfast-booking-confirm/index.ts` — send Jane email + insert notification

**New**
- `src/components/crm/BreakfastBookingsSection.tsx`
- `src/components/crm/BrokerageTemplatePanel.tsx` (extracted from dialog)

**Migrations**
- New migration: refresh breakfast slots to 11:00–17:00 hourly
- New migration: update `crm_email_templates` row for `brokerage_partnership_intro` HTML/subject to unified premium layout
- New migration: ensure `notifications` table accepts `breakfast_booked` type (if enum exists)

**Dependency**
- `html2canvas`

---

## Out of scope
- No changes to UAE Brokerage Directory minimization (already handled previous turn)
- No changes to Developer Registration pack
- Sender/Reply-to remains Amra/JBJ as currently configured
