## Goal

Make `/owner/inbox` the only place email lives. Hostinger emails must actually appear, and the existing Gmail connection must feed the same Unified Inbox (no separate Gmail/Email Center page).

## What's wrong today (verified)

1. **Hostinger** — channel row exists, `sync_status = synced`, **5 threads, 0 messages**. The IMAP branch upserts messages with `ignoreDuplicates: true` and never surfaces insert errors, so messages silently fail to land. That's why "messaging are not reflecting".
2. **Gmail** — the Google Mail connector is linked and 18 emails live in the standalone `email_inbox_items` table (used by the old `EmailCenter` page). There is **no `email_gmail` row in `owner_comm_channels`**, so the Unified Inbox Gmail tab is permanently empty even though Gmail is connected.
3. **Two parallel email systems** — `EmailCenter` (uses `email_inbox_items` + `gmail-inbox-sync`) lives outside the inbox, while Unified Inbox uses `owner_comm_threads/messages` + `comm-inbound-sync`. The user wants only one.

## Plan

### 1. Auto-provision a Gmail channel into Unified Inbox

- On Owner Inbox load, if the Google Mail connector is linked but no `owner_comm_channels` row of `channel_type = 'email_gmail'` exists for the owner, create one (identifier = Gmail address from Gmail `users/me/profile`, display_name = "Gmail").
- New edge function `comm-gmail-autoconnect` (mirrors `comm-hostinger-autoconnect`) — idempotent insert.
- Trigger it from `useCommChannels` once per session and from the Inbox "Sync inbox" button.

### 2. Fix Hostinger message persistence

- Stop using `ignoreDuplicates: true` on `owner_comm_messages` upsert; switch to a pre-check + plain insert and **log + propagate** any insert error to `last_error` on the channel.
- Verify `owner_comm_messages` has a unique index on `(user_id, external_message_id)`; if missing, add it via migration so dedup is real.
- After the fix, "Sync inbox" must populate the 5 existing Hostinger threads with their messages and add new ones.

### 3. Make Unified Inbox the single Gmail surface

- Extend `comm-inbound-sync` Gmail branch to fetch a richer body snippet (already partial), so the message list looks the same as Hostinger.
- One-time backfill: inside `comm-inbound-sync`, when a Gmail channel has `last_sync_at IS NULL`, also import existing rows from `email_inbox_items` (subject, snippet, from, received_at, gmail_message_id) into `owner_comm_threads/messages`, so the 18 historical emails immediately show up in `/owner/inbox`.
- Keep `email_inbox_items` as the AI-classification store (used by recommendations), but **stop showing it as its own page**.

### 4. Retire the standalone Gmail / Email Center page

- Redirect `/owner/crm/email-center` (and any sidebar/tile that links to it) to `/owner/inbox?channel=email_gmail`.
- Remove the "Email Client" / "Email Center" entries from the Owner CRM sidebar so there is exactly one email surface.

### 5. UX polish on `/owner/inbox`

- Show the connected Gmail address as the tab label (e.g. `janeaboujaoude@gmail.com`) instead of generic "Gmail", same treatment Hostinger already gets.
- "Sync inbox" button now invokes `comm-gmail-autoconnect` → `comm-inbound-sync` in sequence and toasts the imported count per channel.
- If a channel fails, surface `last_error` inline on the channel tab (red dot + tooltip) so "synchronize failed / reconnect" states stop flickering between tiles.

## Out of scope

- No design/restyling beyond the existing Unified Inbox.
- No changes to outbound send pipeline, locked-send, or quotas.
- No changes to AI classification / `email_inbox_items` schema (only consumed for backfill).

## Files touched

- `supabase/functions/comm-inbound-sync/index.ts` — fix message insert, add Gmail backfill from `email_inbox_items`.
- `supabase/functions/comm-gmail-autoconnect/index.ts` — **new**, idempotent Gmail channel provisioning.
- `src/pages/OwnerInbox.tsx` — call autoconnect on mount; richer "Sync inbox" handler; per-channel error chip; Gmail tab labelled by address.
- `src/hooks/useCommChannels.ts` — invoke Gmail autoconnect alongside Hostinger.
- `src/routes/OwnerRoutes.tsx` (+ CRM sidebar component) — redirect `/owner/crm/email-center` → `/owner/inbox?channel=email_gmail`, drop the duplicate menu item.
- DB migration: ensure unique index on `owner_comm_messages(user_id, external_message_id)`.
