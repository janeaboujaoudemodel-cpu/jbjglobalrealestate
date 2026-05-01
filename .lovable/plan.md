## Goal

Today the brokerage breakfast outreach offers only a `mailto:` RSVP — partners cannot see availability or confirm a time. We will add a per-brokerage **booking link** to both outreach variants, a dedicated **public breakfast booking page** that lists curated breakfast slots, captures briefing/partnership notes, and writes a real meeting request that the owner can manage in the existing Meeting Center.

Nothing existing is removed: the `mailto:` RSVP stays as a secondary option, all current registration checks and audit logging continue to run.

## What changes

### 1. Database — extend `meeting_requests` for breakfast bookings (migration)

Add nullable columns to the existing `meeting_requests` table (no new table — keeps the owner's Meeting Center as the single inbox):

- `booking_kind text` (e.g. `"brokerage_breakfast"`, default `null` = standard meeting)
- `brokerage_id uuid` references `crm_brokerages(id)` on delete set null
- `brokerage_name text` (denormalised for display if brokerage row is later renamed)
- `invite_token text unique` — opaque token embedded in the outreach email link
- `briefing_topics text` — what the partner wants briefed at breakfast
- `partnership_focus text` — what they want to discuss re. partnership
- `attendee_count int` — how many people from their side
- Index on `invite_token` and `brokerage_id`

RLS: keep current policies. Add one extra anon policy: `anon` may `SELECT` a row only when filtering by `invite_token` (used by the booking page to pre-fill brokerage details). All inserts continue to use the existing anon insert policy.

A second small table tracks the slot inventory so the owner controls it:

- `breakfast_slots(id uuid pk, slot_at timestamptz unique, capacity int default 1, is_active bool default true, notes text, created_at, updated_at)` — owner-only RLS (`janeaboujaoudenails@gmail.com`) for write; public `SELECT` of `is_active = true AND slot_at > now()`.

We seed it with a handful of upcoming Tuesday/Thursday 8:30/9:30 AM slots so the page is usable immediately; the owner can edit later.

### 2. Edge function — `crm-create-breakfast-invite-token` (new, owner-only)

Given a `brokerageId`, mints an `invite_token`, pre-creates a placeholder `meeting_requests` row in status `invited` with `booking_kind='brokerage_breakfast'`, returns `{ token, bookingUrl }`. Idempotent: if a non-cancelled token already exists for that brokerage + variant, it returns the existing one.

### 3. Edge function — `crm-send-brokerage-outreach` (edit)

Before rendering the template, call the token function for the current brokerage and add two new template variables:

- `booking_url` — `https://<site>/breakfast-booking?token=<token>`
- `booking_url_short` — same URL, used as the visible link label

Test sends (`isTest`) get a sandbox token that points at a preview row marked `is_test=true` so they never pollute the real meeting list.

### 4. Email templates — `brokerage_breakfast_invite` and `brokerage_partnership_intro` (data update)

Replace the single `mailto:` CTA with a primary **"Reserve your breakfast time"** button linking to `{{booking_url}}` (gold button, matches existing template styling), and keep the `mailto:` line below as "or reply directly to {{reply_to}}". The partnership-intro variant gets the same button labelled **"Schedule the partnership briefing"** so both touchpoints lead into the same scheduler.

### 5. New public page — `/breakfast-booking` (route + component)

- Reads `?token=` from the URL.
- Calls a new public edge function `breakfast-booking-lookup` that returns the brokerage display name + already-chosen slot (if any) using the token (no PII beyond company name).
- Lists active future `breakfast_slots` (grouped by date) with remaining capacity.
- Form fields: attendee name, email, phone, attendee count, briefing topics, partnership focus, notes, consent checkboxes (reusing the patterns from `MeetingBookingModal` but tailored to the breakfast event — single-step, no nationality/service dropdowns).
- On submit, calls `breakfast-booking-confirm` edge function which:
  1. Validates token + that the slot is still available (capacity check, race-safe via `select … for update`).
  2. Updates the placeholder `meeting_requests` row with the chosen `preferred_date` / `preferred_time`, briefing fields, status `pending`.
  3. Updates the linked `crm_brokerages` row: `outreach_stage = 'meeting_booked'`, `last_reply_at = now()`.
  4. Logs an inbound entry in `crm_relationship_email_log` (`direction='inbound'`, `body_snippet='Confirmed breakfast slot …'`) so the relationship timeline shows the booking.
  5. Sends two transactional confirmations via the existing Gmail outreach pathway (reusing `crm-send-brokerage-outreach`'s Gmail transport in a small shared helper, or — simpler — invoking the existing `send-transactional-email` infra if email domain is configured): one to the partner, one to Jane.
- Success screen: confirms time, shows add-to-calendar `.ics` download generated client-side, and a button back to the JBJ home.

### 6. Owner UI — Meeting Center + CRM Relationships

- `MeetingCenter` already lists `meeting_requests`. We add a **"Breakfast bookings"** filter chip and surface the new fields (brokerage name, briefing topics, partnership focus, attendee count) in the detail drawer. No removal of existing UI.
- In `BulkSendDialog` review step, show a small "Booking link will be included" badge on the breakfast variant so the owner knows what the partner will see.
- In `CRMRelationships` brokerage row, add a "Copy booking link" action (calls `crm-create-breakfast-invite-token` and copies the URL) for ad-hoc sharing outside the email flow.

### 7. Slot management (light)

A new owner-only mini panel inside Meeting Center → "Breakfast slots" tab to add / disable slots (full CRUD on `breakfast_slots`). Keeps the feature self-serve without building a heavy admin screen.

## Files

```text
supabase/migrations/<timestamp>_breakfast_bookings.sql                (new)
supabase/functions/crm-create-breakfast-invite-token/index.ts         (new)
supabase/functions/breakfast-booking-lookup/index.ts                  (new, public)
supabase/functions/breakfast-booking-confirm/index.ts                 (new, public)
supabase/functions/crm-send-brokerage-outreach/index.ts               (edit — inject booking_url)
src/pages/BreakfastBooking.tsx                                        (new public page)
src/routes/PublicRoutes.tsx                                           (edit — add /breakfast-booking)
src/components/crm/BulkSendDialog.tsx                                 (edit — booking-link badge)
src/pages/CRMRelationships.tsx                                        (edit — copy-link action)
src/pages/MeetingCenter.tsx + src/hooks/useMeetingCenterData.ts       (edit — booking_kind filter, new fields)
src/components/meeting-center/BreakfastSlotsPanel.tsx                 (new, owner-only)
DB data update: brokerage_breakfast_invite + brokerage_partnership_intro templates  (replace mailto CTA with booking button, keep mailto fallback)
```

## Out of scope

- No Google Calendar event creation in this pass (we keep the existing `calendar_event_id` column but leave it null; can be wired later).
- No payment / deposit collection.
- No SMS reminders.

## Approval

Approve and I'll implement everything above end to end, including the migration, edge functions, template update, public page, and owner UI hooks.