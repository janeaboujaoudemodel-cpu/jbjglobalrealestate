## Goal
Fix the date picker, require account creation to book, send fully branded JBJ emails with the meeting location link the owner pastes after approval, sweep remaining `lovable.app` links, and finish the owner-recipient reminder path.

---

## 1. Date picker fix + 30-day preview
File: `src/pages/BookMeetingLanding.tsx`

- Replace 14-day window with a true **30-day preview starting today** (`buildDayPanel(30)` but bound by 30 calendar days, not 30 bookable days).
- Render every day today→Monday as a faded **"Booked"** chip (disabled), first selectable day is the first Tue ≥ tomorrow.
- Bug fix: ensure `onClick={() => bookable && setSelectedDate(date)}` actually updates the visible "Request {time} on {date}" line — the button currently re-renders only the chip selection; add `key`-stable list and verify the "Request" button reads from the same `selectedDate` state (already does, but the disabled-day branch swallows clicks silently — make Booked days announce via aria + tooltip "Booked — first availability Tue 26 May 2026"). Year string shown as **2026** (`{ year: "numeric" }`) in the CTA label too.

---

## 2. Account-required booking + CRM source = "calendar_meeting"
- `/book` becomes auth-gated: if not signed in, show a one-screen "Create your account to book with Jane" panel (email + password + full name + phone), which:
  1. Calls `supabase.auth.signUp` (auto-confirm OFF — they receive verify email).
  2. While unverified they can still submit the booking; the booking is saved with `auth_user_id` linked.
  3. Edge function `submit-meeting-booking` upserts the lead into `crm_leads` with `source = 'calendar_meeting'` and `account_status = 'registered'` (new column) so the dashboard can count "registered users" vs "form-only".
- Owner dashboard `/owner/meetings` gains a small KPI: **Registered accounts via calendar** count.

DB migration:
- `crm_leads.account_status text default 'form_only'` (values: `form_only | registered | verified`).
- `meeting_bookings.auth_user_id uuid` (nullable, fk by id only, no FK constraint to auth.users per house rules).
- `meeting_bookings.location_link text`, `meeting_bookings.location_label text`.
- `meeting_bookings.cancel_deadline_at timestamptz` (computed by trigger from start time per rules below).

---

## 3. Cancellation / reschedule window (server-enforced)
Trigger on insert / status→approved sets `cancel_deadline_at`:
- If meeting start hour (Dubai) ≥ **14:00** → deadline = **start − 6 h**.
- Else (before 14:00) → deadline = **start − 24 h**.

`meeting-booking-action` (and a new public `cancel-meeting` action used from confirmation/reminder emails) refuses cancel/reschedule after `cancel_deadline_at` with a branded "Too late — please email contact@jbj.ae" page.

---

## 4. Location-link workflow (owner pastes, system emails)
Owner approval flow in `/owner/meetings`:
1. On **Approve**, dialog shows: AI-suggested message + a new required **Meeting location** field with two tabs:
   - **Dubai office** → preset Google Maps link + address auto-filled (editable).
   - **Custom** (online/other) → owner pastes Zoom/Meet/maps URL + optional label.
2. On send, `meeting-booking-action?action=approve` stores `location_link`/`location_label`, status→`approved`, and triggers a **branded confirmation email** to the visitor containing the live link + "Get directions" button + `.ics`.
3. Reminders (24 h & 30 m) re-use the stored `location_link`.
4. Visitor reply-to on every meeting email = **contact@jbj.ae** (not ceo@). Footer line: "Questions about the location, reschedule or assistance? Reply to contact@jbj.ae."

---

## 5. Confirm-before-submit ticket modal
On the booking form, the bottom CTA changes from instant submit to:
1. Click **Request {HH:MM} on {Day Mon Year}** → open **Confirmation ticket modal** that shows:
   - Visitor name / email / phone / nationality / company
   - Service type · meeting topic · proposal preview
   - Requested time (full date incl. **2026**) · duration · location choice
2. Checkbox **"I agree to the cancellation terms (24 h / 6 h)"** — required.
3. **Submit** button → fires the existing `submit-meeting-booking` call.

---

## 6. Sweep remaining `lovable.app` / `lovable.dev` references
- `src/pages/Contact.tsx` — replace any remaining `lovable.app` URLs with `https://www.jbj.ae`.
- `src/pages/MarketIntelligence.tsx` — replace 7 occurrences in JSON-LD with `https://www.jbj.ae`.
- `src/pages/CustomerHappiness.tsx` — replace the placeholder URL.
- Quick repo grep + fix any other stragglers in user-facing files.

---

## 7. Finish owner-recipient code path for reminders
`supabase/functions/process-meeting-reminders/index.ts`:
- Send each reminder to **both** visitor (`booking.email`) and owner inbox (`ceo@jbj.ae`, branded subject "Reminder · {visitor} {time} ({24h|30m})").
- Reminder cadence locked to **24 h** + **30 m**; remove the old 1 h cron path.
- Owner reminder email uses the same premium template, includes the location link + visitor dossier + Approve/Reschedule/Cancel deep-links.

---

## 8. Branded premium email template (single shared file)
`supabase/functions/_shared/booking-email.ts` extended so every meeting email (visitor + owner, all statuses + reminders) shares one wrapper:

- **Header**: champagne band, JBJ monogram only (no wordmark image), tagline "JBJ Executive Office · Meeting Confirmation".
- **Body**: ink on champagne, gold status pill (`RECEIVED | PENDING | APPROVED | DECLINED | RESCHEDULED | REMINDER`), summarised ticket card.
- **Signature block**: "Warm regards, **JBJ Executive Office**" in gold + "Reply to contact@jbj.ae for assistance".
- **Footer**: gold hairline, site nav links (Home · Properties · Insights · Contact), **Cookies Policy · Privacy · Terms**, NAP block, and `© 2026 JBJ Global Real Estate. All rights reserved.`
- All inbound links → `https://www.jbj.ae/...`. `Reply-To: contact@jbj.ae` on every meeting email.

---

## 9. Files touched

```
src/pages/BookMeetingLanding.tsx                       # 30-day panel, fix click, confirm modal, auth gate
src/pages/owner/OwnerMeetings.tsx                      # location-link field in Approve dialog, registered KPI
src/pages/Contact.tsx                                  # purge lovable.app
src/pages/MarketIntelligence.tsx                       # purge lovable.app (7 spots)
src/pages/CustomerHappiness.tsx                        # purge lovable.app placeholder
supabase/functions/_shared/booking-email.ts            # branded template w/ footer & contact@jbj.ae
supabase/functions/submit-meeting-booking/index.ts     # auth_user_id + account_status + cancel_deadline + confirm copy
supabase/functions/meeting-booking-action/index.ts     # location_link on approve, cancel window enforcement
supabase/functions/cancel-meeting/index.ts             # NEW public cancel endpoint (token + window check)
supabase/functions/process-meeting-reminders/index.ts  # owner CC + 24h/30m cadence + location link
supabase/migrations/<ts>_meetings_phase3.sql           # new columns + trigger
```

---

## 10. Open question before I build

For the **account gate**: do you want bookings **blocked** until the user verifies their email, or allowed immediately as `registered` (status flips to `verified` after email confirm)? Default I'll use if you say "go": **allow immediately, flip to verified on confirm** — so prospects never lose momentum at the form.

Reply **go** to proceed with the defaults above.