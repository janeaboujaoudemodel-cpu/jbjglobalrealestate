## What is happening now

- **Verifying `jane@citideveloper.com`**: the connected Gmail account must have `jane@citideveloper.com` added and accepted as a Gmail **Send mail as** alias. The app already has a sender-status banner and send-blocker; if the alias is not accepted, outreach sending is blocked so Gmail cannot silently rewrite the sender.
- **Breakfast booking issue**: the send function only uses a Google Calendar booking link if `crm_owner_settings.google_calendar_booking_url` is saved. If that field is empty, it falls back to generating `https://www.jbj.ae/breakfast-booking?token=...`, which is the restricted website redirect you do not want.
- **Dedicated Google Calendar exists but is not linked to this project yet**: I found a workspace connection named **Jane's Google Calendar**, but it is **not linked to the project**, so backend functions cannot use it yet.

## Verification steps for `jane@citideveloper.com`

1. Open Gmail for the currently connected mailbox.
2. Go to **Settings → See all settings → Accounts and Import → Send mail as**.
3. Add `jane@citideveloper.com`.
4. Use the mailbox provider SMTP for `citideveloper.com` and complete the verification link/code sent to `jane@citideveloper.com`.
5. Return to CRM Relationships and click **Recheck** in the sender banner.

Important: Gmail must show this alias as accepted/verified. If it is missing or pending, Gmail will keep rewriting the sender.

## Implementation plan

### 1. Link the dedicated Google Calendar connection
- Link the existing **Jane's Google Calendar** connector to this project.
- Confirm the function environment has `GOOGLE_CALENDAR_API_KEY` and `LOVABLE_API_KEY` available.
- Use the Google Calendar connector server-side only; no visitor sees Google connector credentials.

### 2. Stop all breakfast invitation links from pointing to jbj.ae
- Update `crm-send-brokerage-outreach` so `brokerage_breakfast_invite` no longer falls back to `crm-create-breakfast-invite-token` / `/breakfast-booking` links.
- If no approved external Google booking link is configured, block the send with a clear error instead of inserting a restricted website URL.
- Add a guard that rejects any breakfast `booking_url` containing `jbj.ae`, `www.jbj.ae`, or `/breakfast-booking`.

### 3. Replace website booking with Google Calendar-backed booking
- Create a backend function for breakfast availability/bookings using the Google Calendar connector.
- It will:
  - read free/busy or managed slots from the dedicated breakfast calendar,
  - create a Google Calendar event when a brokerage confirms,
  - invite the brokerage attendee email,
  - store the booking record in the backend `meeting_requests` table,
  - log the booking in CRM timeline/notifications.

### 4. Keep backend sync even though users do not visit jbj.ae
- Add a backend endpoint/webhook-style confirmation path for Google booking events.
- Store Google event IDs on `meeting_requests.calendar_event_id` so records can be reconciled.
- Ensure `BreakfastBookingsSection` continues showing bookings from the backend.

### 5. Update CRM settings UI
- Replace the vague “Google Calendar booking link” field with a safer **Breakfast Calendar** setup area.
- Show whether the Google Calendar connector is linked.
- Show whether booking links are safe or blocked.
- Remove wording that implies brokerages should visit the website.

### 6. Proof after implementation
- Verify the generated breakfast invite HTML contains **no `jbj.ae/breakfast-booking` link**.
- Verify the send function blocks if a restricted jbj.ae booking URL is about to be used.
- Verify a test booking creates/saves a backend booking row and returns a Google Calendar event ID.
- Show the exact function responses/log evidence from the project tools.

## Note on “without redirecting to my website”

A pure Google Appointment Schedule link can let guests book without visiting jbj.ae, but Google does not automatically write every booking into your backend unless we either:

- create bookings through our backend and then create Google Calendar events, or
- receive/sync Google Calendar events back into the backend.

So the safe implementation is: **broker-facing booking happens through Google Calendar, backend sync happens privately server-side.**