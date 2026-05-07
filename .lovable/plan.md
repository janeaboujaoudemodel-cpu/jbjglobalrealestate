## Root cause of preview vs sent mismatch

`supabase/functions/crm-send-brokerage-outreach/index.ts` lines 462–533 contain a **silent fallback rewriter**. It runs whenever the locked DB template does NOT contain `{{project_name}}` (currently the case for `brokerage_breakfast_invite`). It throws away the approved HTML/subject and generates a brand-new email server-side.

That fallback is the source of every symptom:

- `subject = "${project.name} — Private Briefing & Breakfast for ..."` (≠ approved subject) and the body line `This is <strong>${ownerFirstName}</strong> from <strong>${representedDeveloperName}</strong>` plus `${ownerFirstName} Bou Jaoude` produce **"This is Citi from Citi Developer"** and **"Citi Bou Jaoude"** as soon as `settings.brokerage_from_name` resolves to `"Citi Developer"` (then `firstName(...)` = `"Citi"`).
- Footer line `${representedDeveloperName} · Sales & Experience Center, Dubai` is what you want removed.
- Booking button uses whatever `settings.google_calendar_booking_url` returns — if blank it falls back to the in-app `breakfast/...` page, which is what currently redirects to your site.

The preview (`BulkSendDialog.renderPreview` and `TemplateEditorDialog`) renders the **DB template directly**, so it always shows the approved version. The send path silently swaps it out. That is the entire mismatch.

## Plan

### 1. Kill the silent rewrite (the actual bug)

In `crm-send-brokerage-outreach/index.ts`:

- Delete the entire `if (!refsProject) { ... }` block (lines 462–533).
- Always send `renderTemplate(template.html, varsMap)` and `renderTemplate(template.subject, varsMap)` — i.e. exactly what preview shows.
- Add a strict pre-send validator: after `renderTemplate`, if the rendered HTML or subject still contains any `{{...}}` token, return HTTP 400 `LOCKED_TEMPLATE_MISSING_VAR` with the missing variable names. No "best guess" substitution.

### 2. Fix identity (Jane Bou Jaoude / Citi Developer)

Still in the send function, harden owner-name resolution so "Citi" can never become a first name:

- `ownerFirstName` resolution order becomes: `settings.brokerage_owner_first_name` → first token of `settings.brokerage_owner_full_name` → hardcoded `"Jane"`. Stop deriving it from `brokerage_from_name` (that field is the company brand, not a person).
- Add new `varsMap` keys: `owner_full_name` (default `"Jane Bou Jaoude"`), `owner_last_name` (default `"Bou Jaoude"`), `owner_department` (default `"Sales & Channel Partner Activation"`).
- Templates use `{{owner_full_name}}` for sign-off — never concatenate `${ownerFirstName} Bou Jaoude` again.
- DB migration: rewrite both `brokerage_*` rows in `crm_email_templates` so the body says exactly `This is {{owner_first_name}} from {{represented_developer_name}}, {{owner_department}}.` and the sign-off is `Warm regards, {{owner_full_name}}` — matching the approved wording.

### 3. Fix sender email (remove janeaboujaoudemodel from this workflow)

- In `crm-send-brokerage-outreach/index.ts` and `crm-create-breakfast-invite-token/index.ts`, leave `OWNER_EMAILS` for auth gating, but force the outbound `From:` and `Reply-To:` to `jane@citideveloper.com` (override `settings.brokerage_reply_to_email` only if it ends in `@citideveloper.com`; otherwise ignore and warn).
- Remove `janeaboujaoudemodel@gmail.com` from the secondary CC fallback (currently `SECONDARY_CC` on line 330). Replace with `infoo.jane@gmail.com` only (already what's there) — but document via a constant `WORKFLOW_FORBIDDEN_ADDRESSES = ["janeaboujaoudemodel@gmail.com"]` and refuse to send if any rendered address matches.
- The Gmail connector account itself is set per Google connection. We cannot rename it from code, but we will ensure the visible `From:` header is always `Jane Bou Jaoude <jane@citideveloper.com>`.

### 4. Fix wording — "registration documents"

In the DB migration that rewrites both templates, replace any "forward the registration documents" sentence with the exact approved sentence:

> Please share the best contact email so our Channel Partner Department can introduce {{brokerage_name}} directly and confirm the required registration documents to complete the registration process.

### 5. Footer fixes

In the DB template HTML:

- Remove the line `Citi Developer Sales and Experience Center, Dubai`.
- Add an `Email: jane@citideveloper.com` line immediately after the WhatsApp line, with `<a href="mailto:jane@citideveloper.com">jane@citideveloper.com</a>`.

### 6. RSVP / Reserve a Seat — point to real Google Calendar booking

- In `crm_owner_settings`, ensure `google_calendar_booking_url` is the source of truth. If blank, the send route returns 400 `BOOKING_URL_MISSING` rather than silently falling back to the website route.
- Add a dedicated UI field in the CRM Owner Settings dialog labelled "Google Calendar booking link (Reserve-a-Seat)" with validation that URL must include `calendar.app.google` or `calendar.google.com`.
- Update `breakfast-booking-confirm` to create a real Google Calendar event via the existing `google_calendar` connector (POST to `${GATEWAY_URL}/calendars/primary/events`) with:
  - `summary: "Private Breakfast for ${brokerageName}"` (test mode → `"Private Breakfast for ABC Real Estate"`)
  - `attendees: [brokerageEmail, "jane@citideveloper.com"]`
  - `conferenceData` requesting Google Meet
  - `description` carrying CRM brokerage id + RSVP token
- Persist the resulting `eventId`, `meetLink`, and RSVP status back into `breakfast_bookings` (or new column `google_event_id`) so it shows in the CRM.
- Update `src/pages/BreakfastBooking.tsx` line 207 — the hardcoded `"Private Breakfast — JBJ Global Real Estate"` becomes `Private Breakfast for ${brokerageName}` (passed via the invite token / query param).

### 7. Locked template + Test Mode UI

In `src/components/crm/TemplateEditorDialog.tsx`:

- Add a `locked_at` column on `crm_email_templates` (timestamptz, nullable) via migration. When set, the editor renders read-only and the dialog shows a "Locked — preview = sent" banner.
- Add a "Lock template" / "Unlock template" button gated to owner.

In `src/components/crm/BulkSendDialog.tsx`:

- Add a "Test mode" panel above the Send button showing, computed from the same render path the server uses:
  - Final `From:` (Jane Bou Jaoude <jane@citideveloper.com>)
  - Final recipient
  - Final subject
  - Final HTML body (already in preview iframe)
  - Final footer block
  - Final RSVP link (resolved `bookingUrl`)
  - Final calendar event title (`Private Breakfast for ${brokerageName}`)
- "Send test to me" button calls the same edge function with `testRecipient = jane@citideveloper.com` so the byte-for-byte payload is identical to the bulk send.

### 8. QA / parity check

Add a tiny dev-only edge function `crm-outreach-parity-check` that:
1. Takes `{ brokerageId, variant }`.
2. Renders the template the same way the client preview does.
3. Renders the template the same way the send route does (after step 1, identical code path).
4. Returns `{ identical: boolean, diff }`.

The Bulk Send dialog calls this before allowing "Send all" and blocks if `identical === false`.

### Files touched

```text
supabase/functions/crm-send-brokerage-outreach/index.ts        # remove rewrite, add validator, fix identity, sender, forbidden addresses
supabase/functions/crm-create-breakfast-invite-token/index.ts  # event title pattern, sender
supabase/functions/breakfast-booking-confirm/index.ts          # real Google Calendar event w/ Meet
supabase/functions/crm-outreach-parity-check/index.ts          # NEW
src/components/crm/TemplateEditorDialog.tsx                    # lock/unlock UI
src/components/crm/BulkSendDialog.tsx                          # test-mode panel + parity gate
src/pages/BreakfastBooking.tsx                                  # event title from brokerage name
supabase/migrations/<new>.sql                                   # add locked_at, rewrite both brokerage_* templates with corrected body, sentence, footer
```

### Final answers (will be true after implementation)

1. **Bug**: silent server-side rewrite block in `crm-send-brokerage-outreach` (lines 462–533) replaces the locked template whenever the subject lacks `{{project_name}}`. Removed.
2. **Sender email**: forced to `jane@citideveloper.com` in `crm-send-brokerage-outreach/index.ts` (and editable in CRM → Settings → "Brokerage reply-to email", restricted to `@citideveloper.com`).
3. **Footer**: edit in CRM → Templates → Brokerage Partnership Intro / Breakfast Invite (the locked HTML — only editable when unlocked).
4. **Test the final email**: CRM → Bulk Send → "Test mode" panel + "Send test to me" (delivers byte-identical email to jane@citideveloper.com).
5. **RSVP bookings**: CRM → Relationships → "Breakfast Bookings" section (existing `BreakfastBookingsSection`), now enriched with Google Calendar event id + Meet link.
6. **Preview = sent**: enforced at runtime by `crm-outreach-parity-check` and by removing the rewrite path; any unresolved `{{var}}` aborts the send.
