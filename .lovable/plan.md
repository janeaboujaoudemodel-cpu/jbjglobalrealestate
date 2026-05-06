# Brokerage Briefing — Email, Booking & Schedule Upgrade

## 1. Email template rewrite (`crm-send-brokerage-outreach`)

Replace every "your brokerage" / "your team" with the resolved `brokerage_name` (Provident, Farm, etc.) — already wired via `varsMap.brokerage_name`, but the fallback `brk.company_name || "your team"` becomes `brk.company_name || "[Brokerage]"` and we hard-block sends with no resolved name on bulk.

New body copy (channel‑partner + breakfast variant):

- Salutation: `Dear <Brokerage Name> team,`
- Intro: `This is Jane from Citi Developers, Sales & Training.`
- WhatsApp line (replaces current "add to channel" text):
  > "If <Brokerage Name> already has an internal WhatsApp group for project updates, please add me so I can keep you posted on launches, inventory and commissions. If not, I'll create a dedicated WhatsApp group with your team."
- Registration line:
  > "Could you confirm whether <Brokerage Name> is **already registered with Citi Developers**? If not, simply **reply to this email** and our Channel Partner Department will follow up with the registration documents."
- Reply‑to instruction (visible block):
  > "Please reply to **jane@citidevelopers.com** and CC **info.jane@gmail.com** so both inboxes stay in sync."
- Project CTA button label: `Open <Project> e‑catalogue →`
- Briefing CTA button label: `Reserve a seat for <Brokerage Name> →` (synchronizes per recipient)
- Both buttons restyled to **champagne gold**:
  `background:#EFE6D6; color:#1A1A1A; border:1px solid #B89555` (replaces the current cream `#F7F2EA` look that reads yellow on some clients). Hover/visited safe inline styles, 12px radius, 14/28 padding.

Signature block adds Jane's full coordinates pulled from one constant `HOST_CARD`:
```
Jane Bou Jaoude — Sales & Training, Channel Partner Activation
Citi Developers · Sales & Experience Center, Dubai
+971 54 716 7107 · jane@citidevelopers.com
Map: https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18
```

CC list automatically appends `info.jane@gmail.com` when not already present.

## 2. Booking link must open the calendar (fix "please enable JavaScript")

Root cause: the `{{booking_url}}` currently renders a static SSR shell on social previewers/WebView; the React route is fine but some recipients open it in an in‑app browser that pre‑fetches and shows the noscript banner.

Fix:
- `BreakfastBooking.tsx`: render a server‑safe `<noscript>` block that says "Loading your calendar… open in your browser if this doesn't auto‑load" with a direct anchor to the same URL — instead of the global noscript message.
- Add `<meta http-equiv="refresh">` fallback only inside the noscript.
- Auto‑scroll to the slot picker on mount and pre‑select the first open slot so the calendar is visible immediately (no extra click).
- Add `?calendar=1` deep‑link handled in `useEffect` to open the slot grid expanded.

## 3. Booking form — attendees + consent

In `BreakfastBooking.tsx` add:

- **Attendee mode toggle** (radio):
  - "Just give a head‑count" → numeric `attendeeCount` (existing).
  - "Add each broker" → repeater rows `{ name, phone, email }` (all optional per row, min 1 row).
- Attendees list stored as JSON in new column `meeting_requests.attendees jsonb`.
- **Consent block** (required checkbox before submit):
  > "I confirm <Brokerage Name> will attend the private breakfast on the selected date. I understand this is a private catered event and I am responsible for cancelling **at least 2 days in advance** by contacting Jane Bou Jaoude (+971 54 716 7107 · jane@citidevelopers.com)."
- On submit we snapshot `{ text, checked: true, signedAt, ip, userAgent, brokerageName, slotAt }` into `meeting_requests.consent_snapshot jsonb` so it can be previewed later as a signed record.

## 4. Owner notifications when a slot is booked

`breakfast-booking-confirm` edge fn additions:
- Insert a row in `owner_alerts` (or existing notifications table — will detect at implementation) with type `breakfast_booked`, payload `{ brokerageName, slotAt, contact, attendees }`.
- Send a host email via the existing transactional pipeline to `jane@citidevelopers.com` (cc `info.jane@gmail.com`) with brokerage name, slot, attendee list, contact phone/email, and a deep link to the new Schedule section.
- Realtime publish `meeting_requests` so the dashboard pops a toast.

## 5. New "Schedule" section in CRM Relationships

New tab `Schedule` (lazy) inside `CRMRelationships`:
- Calendar grid + list of upcoming booked breakfasts (reuses `BreakfastBookingsSection` + `EventsCalendar`).
- Click row → drawer with: brokerage, contact, attendee list, signed consent preview (rendered from `consent_snapshot`), buttons to email/call host, and "Mark cancelled" (enforces 2‑day rule warning).
- In‑app toast + bell badge for any new booking via realtime channel on `meeting_requests`.

## 6. Database migration

```text
alter table meeting_requests
  add column if not exists attendees jsonb,
  add column if not exists consent_snapshot jsonb;
```

(No RLS change — existing policies cover it; Schedule section reads via owner role.)

## Files touched

- `supabase/functions/crm-send-brokerage-outreach/index.ts` — copy + button styles + per‑brokerage CTA + cc list
- `supabase/functions/breakfast-booking-confirm/index.ts` — alert + host email + consent persistence
- `src/pages/BreakfastBooking.tsx` — attendee repeater, consent, noscript fix, auto‑open calendar
- `src/components/crm/BreakfastBookingsSection.tsx` — drawer + consent preview
- `src/pages/CRMRelationships.tsx` — add Schedule tab
- New migration for `attendees` + `consent_snapshot`

## Out of scope

- Changing Gmail sender identity, OAuth, or Google Calendar sync (booking already lands in `meeting_requests`; we surface it in‑app).
- Marketing/bulk newsletter flows.
