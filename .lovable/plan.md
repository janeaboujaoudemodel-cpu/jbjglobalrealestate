## What's wrong and what we'll do

### 1. Brokers tab shows "no broker yet" (0 of 32,649)

`IndividualBrokersTab` queries `crm_brokerage_agents` (empty). The real broker database is `crm_brokers` (**32,649 rows**, all rich fields: name, emails, phones, WhatsApp, nationality, country, city, languages, specialty, department, position, seniority, RERA, LinkedIn/Bayut/PF/Instagram, birthday, experience_years, broker_type, current_brokerage_id…).

Fix:
- Rewrite the tab's queries (and its mutations) to read/write `crm_brokers`.
- Render **every** column the DB has (group into Identity / Contact / Company & Role / Source / Notes). No field hidden.
- Keep existing brokerage join (now via `current_brokerage_id`) and existing "Add to outreach" buttons.
- Paginate (50/page) + server-side search across `full_name / email_lower / phone_e164 / current_company / rera_license`.

### 2. Sidebar "CRM" only expands, doesn't navigate

In `OwnerSidebarNav`, the top-level "CRM" row currently behaves as a disclosure when it has `children`. Update behaviour: clicking the **label/icon** navigates to `/owner/crm` **and** expands the group; only the dedicated chevron toggles open/close without navigating. Same fix for any other parent row that has both a `path` and `children`.

### 3. Developers / Brokerages / Brokers / Reps look different in CRM vs Relationship Hub

`/owner/crm?entity=developers|agencies|brokers|sales-reps` renders thin "Directory" components. `/owner/crm/relationship-hub` renders the rich `DeveloperRegistryTab`, `BrokeragesTab`, `IndividualBrokersTab`, `DevSalesRepsDirectory`.

Fix in `src/pages/owner/crm/UnifiedCRM.tsx`: swap the four directory renders to use the **exact same** rich tab components that the Relationship Hub uses. Deprecate `DevelopersDirectory` and `BrokerageAgenciesDirectory` (keep files; replace imports). Result: identical UI, fields, filters, exports, drawers — wherever the user lands.

### 4. Test email "Reserve a seat" button is not clickable

`crm-send-brokerage-outreach` already builds a `{{booking_url}}` placeholder that should resolve to `/breakfast-booking?token=…`. The test-send path skips token creation, so the button renders without an href. Fix:
- In the test-send branch, mint a real preview token via `crm-create-breakfast-invite-token` (mark `preview=true`) before rendering the locked payload, so the **test email is byte-for-byte identical** to the live email and the CTA opens the public booking page.
- Verify `/breakfast-booking` page handles `preview=true` tokens (show slots, allow submit → store under a `preview_bookings` flag so it doesn't pollute real bookings).

The existing `breakfast_slots` table, `BreakfastBooking.tsx` page, and confirm/lookup edge functions are kept exactly as they were.

### 5. New public meeting-booking landing — `/book`

Standalone landing page (no header circulation, no sidebar). Owner uses it for any meeting (clients, friends, brokers, developers, agencies).

Rules:
- **Mon–Fri only**, 10:00–17:00 Dubai time, 60-min slots.
- **One day in advance** — cannot book for today or earlier (cutoff = end of today).
- Visitor enters: name, email, phone, language, location preference (Office = Citi Developers / Online = Zoom or Google Meet), notes.
- On submit:
  - Insert row in a new `meeting_bookings` table.
  - Mirror into existing `meeting_requests` so it appears in Owner Inbox / Tasks / Calendar (already wired there).
  - Send confirmation email to **visitor** (template: `meeting-booking-confirmation`).
  - Send confirmation email to **owner** with one-click "Add to Google Calendar" + ICS attachment-style download.
  - Auto-create CRM action log entry.
- Public route, SEO-friendly (`<SEOHead>`), single H1, indexable.

### 6. Branded Email composer — Book-a-Meeting + language + location

Extend `BrandedEmailComposer.tsx`:
- **Language selector** (16 languages): preview pane shows **two columns** (English + selected). Locked payload sent in selected language only. AI brief is sent to `compose-branded-email` with `target_language`; function returns `{ subject_en, body_html_en, subject_local, body_html_local }`.
- **Insert "Book a Meeting" block** button: appends a styled CTA pointing to `/book?ref=<short-token>` (the token lets us attribute the booking back to the contact).
- **Location selector** for the meeting block:
  - `office` (default) → label "Citi Developers Sales and Experience Center, Dubai" + map link.
  - `online` → sub-select Zoom / Google Meet (link generated when booking is confirmed via existing video meeting infra).
- Save-as-template now stores language + location + has-book-meeting-block flags.

## Database changes

1. **`meeting_bookings`** new table:
   - `id`, `created_at`, `booked_for_at` (timestamptz), `duration_min` (default 60)
   - `visitor_name`, `visitor_email`, `visitor_phone`, `visitor_company`
   - `language`, `location_type` (`office | online`), `online_platform` (`zoom | google_meet | null`), `meeting_url`, `notes`
   - `source` (`public_landing | branded_email`), `ref_token` (nullable, FK to a new `meeting_booking_tokens`)
   - `status` (`scheduled | cancelled | completed | no_show`), `owner_confirmed_at`
   - RLS: insert open to anon (rate-limited via `api_request_log`); select/update owner-only via `has_role('owner')`.

2. **`meeting_booking_tokens`** for attribution from Branded Email links:
   - `token` (PK), `email`, `name`, `created_by` (owner), `expires_at`, `consumed_at`.

3. Add `is_preview boolean default false` to `crm_breakfast_invite_tokens` so test-send tokens can be filtered out of real bookings.

4. Add `current_brokerage_id` index if missing (already there).

## Edge functions

- `compose-branded-email` — extend to accept `target_language`, return both English and local subject/body.
- `send-meeting-booking-confirmation` (new) — sends visitor + owner confirmation (uses Lovable Emails / transactional pipeline).
- `crm-create-breakfast-invite-token` — add `preview` parameter.
- `crm-send-brokerage-outreach` — in test branch, mint preview token before locking payload.

## Files we will touch

```text
src/components/crm/IndividualBrokersTab.tsx          ← rewrite to crm_brokers
src/components/owner-dashboard/OwnerSidebarNav.tsx   ← click parent navigates + expands
src/pages/owner/crm/UnifiedCRM.tsx                   ← use rich Relationship Hub tabs
src/components/crm/BrandedEmailComposer.tsx          ← language, location, book-a-meeting block
supabase/functions/compose-branded-email/index.ts    ← bilingual output
supabase/functions/crm-send-brokerage-outreach/index.ts ← preview token in test branch
supabase/functions/crm-create-breakfast-invite-token/index.ts ← preview flag
src/pages/PublicMeetingBooking.tsx                   ← NEW /book landing
supabase/functions/send-meeting-booking-confirmation/index.ts ← NEW
src/routes/StandaloneRoutes.tsx                      ← register /book
+ migration: meeting_bookings, meeting_booking_tokens, breakfast preview flag
```

## Out of scope (next pass)
- Two-way Google Calendar push (we'll send the owner an ICS link, not OAuth sync).
- Multi-host availability (only Jane for now).
- Editing/cancelling bookings from the public page (will be a follow-up if needed).

Approve and I'll implement.