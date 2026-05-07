## Problem

In **Send Test Email**, every time you reopen the dialog you have to retype the recipient (and there's no field at all for the subject or for "from"). You want a true **locked test profile** that survives refreshes, page changes, and reopens — only changeable when you explicitly edit it.

## Root cause

`TestSendDialog.tsx` has three issues:

1. **`quickTo` is reset to empty on every open** and only auto-filled with the logged-in user's email if no chips are saved. It never re-populates with the last-used recipient.
2. There is **no subject field** in the dialog (subject is template-only). You asked it to be editable + locked.
3. The "from" address is hard-locked in the edge function to `jane@citideveloper.com`, but the dialog never shows it as a saved, editable preference.

So the user sees an empty "Send test to" input every time and has no place to lock subject/from/company.

## Fix plan

### 1. Persist a single "Test Profile" per owner

Add to `crm_owner_settings` (one new migration):

```text
test_profile jsonb NOT NULL DEFAULT '{}'
  → { to, cc[], from_email, sample_name, subject_override }
```

Single source of truth — replaces the scattered `saved_test_to_emails` / `saved_test_brokerage_names` reads for the test dialog (kept for back-compat, but new profile wins).

### 2. Rebuild `TestSendDialog.tsx` as a locked-profile editor

- On open: hydrate **all** fields from `test_profile` with the defaults you specified:
  - **To:** `info.jane@gmail.com`
  - **From / Reply-to:** `jane@citideveloper.com`
  - **Company name (sample):** `ABC REAL ESTATE`
  - **Subject:** the locked subject you previously set (we'll read your last saved subject; if empty, fall back to the template subject)
- Show all four fields as **read-only chips** with a small "Edit" pencil. Clicking pencil unlocks the field; on blur it auto-saves back to `test_profile`.
- "Send Test" never modifies the profile unless you edit a field — exactly the behavior you described ("always saved unless I click and remove").
- Remove the auto-fill-with-current-user-email behavior so it never overwrites your locked recipient.

### 3. Wire subject + from override end-to-end

- Pass `subjectOverride` and `fromEmailOverride` in the `supabase.functions.invoke(...)` body.
- `crm-send-brokerage-outreach` and `crm-send-developer-registration` already accept `fromEmailOverride`; add `subjectOverride` handling (use it verbatim when present, still prefix with `[TEST]` in test mode).
- Brokerage's `FORCED_FROM_EMAIL` lock stays for **real** sends — override only applies in test mode (`isTest === true`).

### 4. Confirmation step shows the locked values

The "Confirm & Send" pane already lists To / CC / Sample / From — just add the Subject row so you can verify before sending.

## Files touched

- `supabase/migrations/<new>_add_test_profile.sql` — add `test_profile jsonb` column
- `src/components/crm/TestSendDialog.tsx` — full rewrite of hydration + add subject/from fields with lock+edit UX
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — accept `subjectOverride` (test mode only)
- `supabase/functions/crm-send-developer-registration/index.ts` — accept `subjectOverride` (test mode only)

## Acceptance check

1. Open Send Test → all four fields pre-filled, locked.
2. Close, refresh, reopen → still pre-filled with the same values.
3. Click pencil on "To", change to a new address, blur → saved; reopen confirms.
4. Send Test → email arrives at `info.jane@gmail.com` from `jane@citideveloper.com`, subject = your locked subject prefixed `[TEST]`, body uses `ABC REAL ESTATE` as the brokerage name.
