# Polish Breakfast Invite Email + Google Calendar Booking

Fixes to the **brokerage_breakfast_invite** template + the `crm-send-brokerage-outreach` edge function.

## 1. Subject line
- Remove the `[TEST]` prefix on test sends. Same subject for test and real sends.
- Encode the Subject header as RFC 2047 UTF-8 (`=?utf-8?B?…?=`) so unicode punctuation (`×`, `—`, `&`) no longer appears as `Ã—` / `ÃƒÆ'…` / `ACAECA` mojibake in some clients.
- Update `brokerage_breakfast_invite.subject` (DB) to a premium line (no `×`, no `—` glyphs that historically broke):

  ```
  Private Breakfast & Partnership Briefing with Citi Developers — {{brokerage_name}}
  ```

  And `brokerage_partnership_intro.subject` to:

  ```
  Citi Developers and {{brokerage_name}} — Partnership for {{project_name}}
  ```

## 2. Card structure
Currently 3 stacked cards inside the invitation block: (a) Pick-a-slot tile, (b) "Reserve a slot" CTA, (c) "Before we lock your seats" details. Restructure to **two cards**:

```
┌──────────────────────────────────┐
│ Card 1 — Pick a slot that suits  │
│ you (calendar tile + Reserve a   │
│ slot CTA inline directly under)  │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ Card 2 — Full-width details:     │
│ "Before we lock your seats" list │
│ + closing premium message        │
└──────────────────────────────────┘
```
- Move the `Reserve a slot →` CTA into the same card as the calendar tile (immediately below the tile, not a separate cream block).
- Make the "Before we lock your seats" card full-width (remove its inset, use the same outer padding as Card 1). It currently looks compressed because it's nested inside the invitation card with extra padding.

## 3. Closing message (inside Card 2)
After the existing "…48 hours in advance if you need to reschedule or cancel." line, append (same paragraph block, premium tone):

> *"Thank you for considering this partnership. We look forward to welcoming the {{brokerage_name}} team to our office and to a long, successful collaboration with Citi Developers."*

## 4. Footer logo + sender name
- Increase the footer logo: `width="180"` (matching header), wrap it with the same padded container styling as the header (18px vertical padding, divider line above only).
- Remove the line `In partnership with CITI Developers` under the footer logo.
- Replace `{{owner_first_name}} Bou Jaoude` rendering: when settings/user metadata return "JBJ", force the display name to **Jane** (hard fallback). Update the variable resolution in `index.ts`:
  ```ts
  const ownerFirstName = (settings?.brokerage_from_name && firstName(settings.brokerage_from_name))
    || firstName(user.user_metadata?.full_name)
    || "Jane";
  if (/jbj/i.test(ownerFirstName)) ownerFirstName = "Jane";
  ```

## 5. Footer 4 contact tiles alignment
The 4 tiles (Website, Visit our office, Phone, WhatsApp) currently render in 2 rows because the `wa.me` and `tel:` tiles are in a second `<div>`. Fix:
- Put all 4 anchors inside a single centered container using `display:inline-block` with consistent `min-width:160px` and equal padding.
- Add `text-decoration:underline` on hover (keep underline always visible underneath the icon-text using a 1px gold underline) to make clickability obvious.
- Increase top margin so they don't crowd the logo above and the contact lines below.

## 6. Google Calendar booking (replace in-app booking page)
Today the `Reserve a slot` button points to an internal `bookingUrl` minted by `crm-create-breakfast-invite-token` (sends recipient back to the JBJ website). Change to:

- Add an owner setting `google_calendar_booking_url` (text). Owner pastes their **Google Calendar Appointment Schedule** public link (e.g. `https://calendar.app.google/xxxxxx`). This is the standard Google-hosted booking page — when a brokerage picks a slot, Google sends the brokerage a confirmation email AND emails the calendar owner automatically. No website redirect.
- In the edge function, prefer `settings.google_calendar_booking_url` over the minted in-app `bookingUrl`. Only fall back to the old token URL if Google Calendar URL is blank.
- The internal booking page route stays in the codebase (not deleted, per "No Removal" policy) but is no longer referenced from the email.
- UI: add a single text input in the existing brokerage outreach settings panel (label: "Google Calendar booking link", helper: "Paste your Google Calendar appointment scheduling link. Used by the breakfast invite email so brokerages book directly on your calendar.").

No connector OAuth needed for v1 — pasting the public Google booking URL is the simplest premium-feeling integration. (Future: optional Google Calendar connector to create events server-side.)

## Files touched
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — RFC 2047 subject, drop `[TEST]`, force `Jane`, prefer Google Calendar URL.
- DB migration — update both template subjects + new column `crm_owner_settings.google_calendar_booking_url`.
- DB migration — update `brokerage_breakfast_invite.html` to merged 2-card layout, full-width details, premium closing line, larger footer logo, single 4-tile contact row, no "In partnership with CITI Developers".
- `src/components/crm/…` brokerage outreach settings panel — new input for Google Calendar booking URL (locate existing settings editor and append the field).

## Out of scope
- Server-side calendar event creation via Google Calendar API (handled by Google's own booking page).
- Touching `brokerage_partnership_intro` body (only its subject).
