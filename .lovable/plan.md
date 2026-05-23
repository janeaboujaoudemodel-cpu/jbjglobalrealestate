
# Meeting Booking — Phase 2 Upgrade

Building on top of the existing `/book` page + `submit-meeting-booking` edge function. **No duplicate tools.** Everything below extends what already exists.

---

## 1. Database (single migration)

`public.meeting_bookings` additions:
- `status text` — `received → pending → approved | declined | rescheduled`, default `received`. Trigger auto-flips `received → pending` 30 s after insert (mimics the "received then pending" status update you described).
- `service_type text` — `general_inquiry | general_meeting | partnership | investment_briefing | off_market_access | other`. **Required.**
- `meeting_topic text NOT NULL` — what they want to discuss. **Required.**
- `proposal_text text` — optional typed proposal (alternative to / alongside attachment).
- `social_links jsonb` — restructured to `[{platform: 'instagram', url: '…'}]`.
- `phone_country_code text`, `phone_national text` — captured from the new phone picker.
- `owner_action_token text unique` — signs Approve / Decline / Reschedule deep-links in the owner email.
- `owner_response_message text`, `owner_responded_at timestamptz`, `reschedule_proposed_at timestamptz`.

No existing columns dropped.

---

## 2. Frontend — `/book` rewrites

- **Phone**: `react-phone-number-input` with country flag + dial-code picker (default flag = 🇦🇪). Replaces the plain input.
- **Country / language pickers**: every option renders with a flag (UAE flag default for nationality). Globe icon banned.
- **Service type**: required pills — General inquiry · General meeting · Partnership · Investment briefing · Off-market access · Other.
- **Meeting topic**: required textarea, label "What would you like to discuss?" with red asterisk.
- **Proposal**: tabbed control — *Attach proposal* (file) **or** *Type proposal* (textarea). Either accepted, both optional unless `service_type = partnership` where one of them is required.
- **Company website / social links**: every link gets `platform` dropdown (LinkedIn, Instagram, X, TikTok, Facebook, YouTube, Other) + URL input. Rendered/clickable in owner email.
- **File upload UI**: premium document-style card (icon + dashed gold border + "Drop your company profile or click to browse · PDF/DOC/JPG up to 10 MB").
- **Date grid**: every day between today and the first bookable Tuesday is rendered with a **"Booked"** chip (disabled, faded gold). First bookable day onward is selectable.
- **Header**: `Jane Bou Jaoude` everywhere — purge `Abou Jaoude`. Remove the old photo (it was being pulled from an old avatar field; will be replaced with the JBJ monogram only).

---

## 3. Edge functions

### `submit-meeting-booking` (existing — extended)
- Accepts the new fields above.
- Generates `owner_action_token` (32-byte URL-safe).
- Sends two **premium** HTML emails (see §5).

### `meeting-booking-action` (NEW)
Public endpoint, no JWT, validated by `owner_action_token`:
- `?action=approve` → status `approved`, sends visitor "✅ Confirmed" email with `.ics`.
- `?action=decline` → status `declined`, sends visitor "Unable to meet at this time" email.
- `?action=reschedule&new=<ISO>` → status `rescheduled`, sends visitor "Reschedule proposal" email.
Each accepts an optional `owner_response_message` so you can type a custom note, otherwise the template auto-fills from `meeting_topic` + `service_type`.

### `suggest-meeting-reply` (NEW)
POST `{bookingId, action}`. Calls Lovable AI (`google/gemini-2.5-flash`) with system prompt seeded by booking details to produce a tone-matched suggested message for the owner to edit before send. Returns `{subject, body}`.

### `process-meeting-reminders` (existing — patched)
- Sends reminders to **both** visitor and owner.
- Cadence updated to **24 h before** and **30 min before** (per your spec). The previous 1 h slot is removed.

---

## 4. Owner backend — new page `/owner/meetings`

Route added to `OwnerRoutes`. Tabs:
1. **Received** (just submitted, awaiting auto-flip)
2. **Pending** ← default, awaiting your action
3. **Approved**
4. **Declined**
5. **Rescheduled**

Each row card shows: visitor name + flag, company, when (Dubai), duration, location, service type, **meeting topic**, proposal preview / attachment link, website + socials (all clickable), phone with country code, notes.

Three buttons per pending row: **Approve** · **Decline** · **Reschedule**. Each opens a dialog with the AI-suggested email pre-filled (editable) → "Send" calls `meeting-booking-action` with the final body.

Side panel: alerts list (today + next 7 days), notes field per booking (persisted to `owner_calendar_events.metadata.notes`).

---

## 5. Premium email templates

All booking emails replaced with a branded template containing:
- **Header**: champagne band with the JBJ monogram (already uploaded to storage) + "JBJ GLOBAL REAL ESTATE" wordmark.
- **Status ticket block**: pill showing current status (`RECEIVED`, then `PENDING`, then `APPROVED` etc.) — uses gold/ink colours per spec, never grey.
- **Body**: ink on champagne, mirrors site palette.
- **Footer**: gold rule + "Warm regards, **JBJ Global Real Estate Team**" in gold (`#B89555`), then NAP block (address, phone, www.jbj.ae).
- All inbound links point to `https://www.jbj.ae/...` — no `lovable.app` URLs anywhere.

Visitor sequence:
1. **Received** (instant): "Greetings from JBJ Global Real Estate — we have received your request. Our team is reviewing it. Status: RECEIVED."
2. **Pending** (30 s later, auto): "Your request is now with Jane. Status: PENDING."
3. **Approved / Declined / Rescheduled** (on owner action): full ticket with new status.

Owner email: full booking dossier + three big Approve / Decline / Reschedule buttons (signed with `owner_action_token`).

---

## 6. Identity & link hygiene

- Replace every `lovable.app` / `lovable.dev` link in user-facing files (`Contact.tsx`, footer, emails) with `https://www.jbj.ae`.
- `OWNER_EMAIL` constant and any `aboujaoude*` string is normalised to `Jane Bou Jaoude` (display) and the canonical Gmail address kept only as the inbox target — never displayed publicly.
- Old avatar reference on `/book` removed; only the JBJ monogram appears.

---

## 7. Files touched (no duplicates created)

```text
src/pages/BookMeetingLanding.tsx       # rewritten
src/pages/Contact.tsx                  # any remaining lovable.app links → jbj.ae
src/pages/owner/OwnerMeetings.tsx      # NEW page
src/routes/OwnerRoutes.tsx             # +1 route
src/components/booking/PhoneInput.tsx  # NEW (wraps react-phone-number-input)
src/components/booking/SocialLinksField.tsx  # NEW
src/components/booking/PremiumFileDrop.tsx   # NEW
supabase/functions/submit-meeting-booking/index.ts        # extended
supabase/functions/meeting-booking-action/index.ts        # NEW
supabase/functions/suggest-meeting-reply/index.ts         # NEW
supabase/functions/process-meeting-reminders/index.ts     # cadence patched + owner recipient
supabase/migrations/<ts>_meetings_phase2.sql              # NEW
```

---

## 8. Out of scope (won't touch this pass)

- Google Calendar sync (separate request).
- Auth-walling `/book` (must stay public).
- Replacing the reminder cron itself.

---

## Open questions before I push

1. **`react-phone-number-input`** is the lightest flag+code picker — OK to add it as a dep?
2. **Auto-flip Received → Pending after 30 s**: matches your spec. Confirm 30 s is right (vs e.g. 1 min)?
3. **For Partnership service type**: is the proposal (typed *or* attached) **required**, or always optional?
4. **Decline / Reschedule emails**: should they auto-send when you click the button, or always open a dialog with AI-suggested copy that you review first? (I'm planning the latter — confirm.)

If you reply "go" I'll proceed with the defaults above (yes / 30 s / required for partnership / always open dialog).
