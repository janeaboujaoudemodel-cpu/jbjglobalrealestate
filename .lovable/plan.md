
## What already exists (the tool I'll upgrade — no new tools)

- **Public landing page**: `src/pages/BookMeetingLanding.tsx` mounted at `/book` (see `src/routes/StandaloneRoutes.tsx`). This is the canonical public booking surface.
- **Database**:
  - `public.meeting_bookings` (visitor name/email/phone/company, language, location, duration, etc.)
  - `public.meeting_booking_tokens` (prefill tokens for branded outreach)
  - `public.owner_calendar_events` (drives the founder calendar + the reminder engine)
- **Server validation**: trigger `validate_meeting_booking_slot()` enforces hours/day rules in Dubai time.
- **Reminder engine**: `supabase/functions/process-meeting-reminders` (cron) reads `owner_calendar_events.metadata.reminders` and emails attendees 24h / 30m / 15m before start.
- **Owner agenda email**: `supabase/functions/send-meeting-agenda` (manual trigger).
- **Lead capture**: `supabase/functions/capture-lead` + `src/hooks/useLeadCapture.ts`.
- **Owner inbound notification**: `supabase/functions/send-inquiry-email` (already used in old MeetingBookingModal).

**Duplicate to retire (no new tools rule):** `src/components/MeetingBookingModal.tsx` is a *second* booking surface used only on `/contact`. It posts to `send-inquiry-email` but never writes a row to `meeting_bookings`, so bookings made through it are invisible to the calendar and reminders. I'll repoint `Contact.tsx` to open `/book` and stop rendering the modal. The file itself stays for now (no removals), just unwired.

---

## Where to find it (so you can locate everything later)

| Surface | Path / file |
|---|---|
| Public landing | `/book` → `src/pages/BookMeetingLanding.tsx` |
| Route mount | `src/routes/StandaloneRoutes.tsx` (line 76) |
| Booking table | `public.meeting_bookings` |
| Token prefill | `public.meeting_booking_tokens` |
| Slot rules | DB function `public.validate_meeting_booking_slot()` |
| Calendar feed | `public.owner_calendar_events` |
| Reminder cron | `supabase/functions/process-meeting-reminders` |
| Lead capture | `supabase/functions/capture-lead` |

---

## What's changing on `/book`

### Form fields (required vs optional)

Required:
- Full name
- Email
- Phone (international, validated)
- Nationality (searchable country list — already used elsewhere)
- Preferred language
- Company name
- Date + time slot
- **Meeting duration** (30 / 45 / 60 / 90 min — new selector; backed by existing `duration_min` column)
- Location (office / online) + online platform if online

Optional:
- Company website URL
- Social media link(s) (LinkedIn / Instagram / X — free text, validated as URLs)
- Company profile upload (PDF / DOCX / image, up to 10 MB) → uploaded to a new public Storage bucket `meeting-booking-attachments`, signed URL stored on the booking row
- Notes / discussion topic

### Visual

Champagne palette, ink text, 1px gold hairlines, cream `#EFE6D6` highlights for selected day/slot pills. Two-column on desktop (calendar+slots | details), single column on mobile. No gold fills.

---

## Availability change

Today's trigger allows **Mon–Fri 10:00–17:00 Dubai**. You said "first availability Tuesday 11:00 AM–5:00 PM". I'll interpret this as:

- **Weekly window: Tuesday → Friday, 11:00–17:00 Dubai time** (Tuesday is the first day of the week; Saturday/Sunday/Monday closed).
- Minimum lead time stays ≥ 1 day in advance.

If you actually meant something different (e.g. *only* Tuesday, or Tue–Sat, or different end time per day), tell me before I push the migration and I'll adjust the trigger.

The change is a single migration that updates `validate_meeting_booking_slot()`:
- replace the `dow BETWEEN 1 AND 5` check with `dow BETWEEN 2 AND 5`
- replace `hr < 10 OR hr >= 17` with `hr < 11 OR hr >= 17`
- enforce that `booked_for_at + duration_min` does not exceed 17:00 Dubai

The frontend's day picker + time slots will reflect the same rules (`["11:00","12:00","13:00","14:00","15:00","16:00"]`, skipping Sun/Mon/Sat).

---

## Schema additions (single migration)

```text
ALTER TABLE public.meeting_bookings
  ADD COLUMN nationality        text,
  ADD COLUMN website_url        text,
  ADD COLUMN social_links       jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN attachment_url     text,
  ADD COLUMN attachment_name    text,
  ADD COLUMN lead_id            uuid,            -- back-link to crm lead
  ADD COLUMN calendar_event_id  uuid;            -- back-link to owner_calendar_events
```

Storage bucket `meeting-booking-attachments` (public read of signed URLs only; anon insert allowed, owner full access) + matching RLS policies on `storage.objects`.

No existing columns dropped. Existing rows stay valid.

---

## New edge function: `submit-meeting-booking` (single entry point)

CORS-enabled, `verify_jwt = false`, runs as service role. Replaces the direct `supabase.from('meeting_bookings').insert(...)` call in `BookMeetingLanding`. Steps:

1. **Validate** payload with Zod (name, email, phone, nationality, language, company required; date+time+duration; optional URLs/attachment metadata).
2. **Insert booking** into `meeting_bookings` (uses the trigger for slot rules → returns a clean 400 if outside window).
3. **Create matching `owner_calendar_events` row** with:
   - `title = "Meeting · {visitor_name} ({visitor_company})"`
   - `start_at`, `end_at` derived from booking + duration
   - `metadata = { attendee_name, attendee_email, attendee_phone, agenda: notes, reminders: [1440, 60, 15] }` so the existing `process-meeting-reminders` cron picks it up automatically.
4. **Capture CRM lead** via the existing `capture-lead` function with `source: "meeting-booking"`, role `client`, and the full visitor payload (name, email, phone, nationality, company, website, language, notes). Store returned `lead_id` on the booking.
5. **Send two emails** via `Resend` (the function already used elsewhere — `RESEND_API_KEY` is configured):
   - **Visitor confirmation** → "Your meeting is requested" with date/time, duration, location, what-to-expect, and a calendar `.ics` attachment.
   - **Owner notification** → to your inbox with all submitted details + the attachment link + a one-click "Confirm" link that flips `owner_confirmed_at` and emails the visitor the final confirmation.
   Both writes stamp `visitor_confirmation_sent_at` / `owner_confirmation_sent_at` on the booking row (columns already exist).
6. Return `{ ok: true, bookingId, calendarEventId }`.

Idempotency: use `crypto.randomUUID()` keyed off `email + booked_for_at` to avoid double-submit duplicates.

---

## Reminder schedule (auto, no extra work)

Because step 3 writes `metadata.reminders: [1440, 60, 15]`, the existing `process-meeting-reminders` cron will send attendee reminders **24 h, 1 h, and 15 min** before the meeting. No new cron, no duplicate engine.

---

## Files touched

- **Edit** `src/pages/BookMeetingLanding.tsx` — new required fields, duration picker, optional attachments / website / socials, Tue–Fri 11–17 day picker, switch submit to `supabase.functions.invoke('submit-meeting-booking', …)`.
- **Edit** `src/pages/Contact.tsx` — remove `MeetingBookingModal` usage, link the "Book Meeting" CTA to `/book` instead.
- **New** `supabase/functions/submit-meeting-booking/index.ts` (+ shared zod schema, .ics builder).
- **New** migration: schema additions + Tue–Fri 11–17 validation + storage bucket & RLS.
- **No changes** to: `process-meeting-reminders`, `send-meeting-agenda`, `capture-lead`, `MeetingBookingModal.tsx` (left in place but unused).

---

## Out of scope (won't be touched in this pass)

- Building a new owner-side booking dashboard (you already have one elsewhere if you need it).
- Replacing the reminder engine.
- Google Calendar / iCloud sync.
- The internal `/meeting-center` page (that's the *summaries* hub, a different tool).

---

## Open question I need confirmed before the migration runs

1. **Availability days** — Tue–Fri 11:00–17:00 Dubai? Or Tue–Sat? Or *only* Tuesday for now?
2. **Reminder cadence** — OK with 24 h + 1 h + 15 min, or do you want a different set?
3. **Attachment max size** — 10 MB OK?

If you say "go" without answering, I'll proceed with the defaults above (Tue–Fri 11–17 · 24h/1h/15m · 10 MB).
