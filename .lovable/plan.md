## What I found

The issue is not one single bug. The current Unified Inbox has several connected problems:

- The page tries to auto-sync Gmail and Hostinger on mount, which can make the UI look like it is blinking/reloading while long sync calls run.
- Gmail data is now present in the unified tables, but most threads still have no AI category, no AI suggestion, and the category filters therefore look empty or wrong.
- Hostinger has 5 thread rows but 0 message rows, so selecting Hostinger can show thread previews but no real conversation body.
- The thread uniqueness is currently too broad: Gmail and Hostinger threads are grouped by user + channel type + contact only, not by the specific channel account. This can cause cross-channel bleed in the future and is part of why Gmail/Hostinger separation feels unreliable.
- The detail panel is constrained to a fixed viewport-height block, so the user cannot scroll naturally to see the full Luxury Closet / AI Suggestions / Lead / Activity content.
- The sidebar still shows a duplicate “Email Client” entry even though email should live only in “Messages / Inbox”.
- The existing AI triage categories are too generic for this workflow. “The Luxury Closet - Price offer” was classified as Personal; SHEIN/Emirates NBD are not reliably classified into Marketing/Finance/Sales.
- Bulk actions and “reflect back to Gmail” require Gmail modify scope and a server-side action function; the UI currently does not have that foundation.

## Plan

### 1. Stop the blinking and make sync explicit/status-driven

- Remove the heavy automatic full inbox sync on page mount.
- Keep lightweight channel loading only.
- Make “Refresh / Sync inbox” run a bounded sync and show clear state: syncing, synced, failed.
- Scope sync calls to the active channel when the user is on Gmail or Hostinger, instead of syncing everything every time.
- Add per-channel sync error display using `last_error` so failures do not silently flicker.

### 2. Fix channel isolation so Gmail content never appears under Hostinger

- Add a database migration to enforce thread uniqueness by `user_id + channel_id + contact_identifier` for channel-specific inboxes.
- Update `comm-inbound-sync` so Gmail and Hostinger thread upserts use `channel_id` in the conflict key.
- Backfill existing thread rows safely so each thread remains tied to its real channel.
- Keep the existing message dedupe by `user_id + external_message_id`.

### 3. Fix Hostinger message persistence

- Update the Hostinger branch in `comm-inbound-sync` so each fetched Hostinger message creates a matching row in `owner_comm_messages`.
- If only headers/previews are available from IMAP, save a usable message body from subject + sender + date instead of leaving threads empty.
- If an insert fails, write the error to the Hostinger channel and show it in the UI.
- Keep Hostinger separate from Gmail in tabs, counts, selected thread, and stats.

### 4. Make category filters actually useful

- Expand categories from the current small set into business-focused filters:
  - All
  - Sales / Offers
  - Real Estate Leads
  - Real Estate Ops
  - Marketing
  - Finance / Banking
  - Developer / Documents
  - Personal
  - Spam / Promotions
  - Other
- Add deterministic pre-classification rules for obvious senders/subjects before AI runs:
  - SHEIN / creator / campaign → Marketing
  - Emirates NBD / banking / payment / tax → Finance
  - buyer / price offer / sale / closet offer → Sales / Offers
  - registration / MOU / license / Docusign / developer documents → Developer / Documents
- Update the category chips and counts to use the filtered thread set for the selected channel.
- Make stats cards reflect the current selected channel/category, not global totals.

### 5. Repair AI triage and AI Suggestions panel

- Update `comm-ai-triage` prompt/schema to include the new categories and stronger business rules.
- Add a fallback rule-based category + suggested reply when the AI gateway returns blank/invalid output.
- Auto-triage visible unprocessed threads in small batches after sync, instead of only triaging one opened thread.
- In the thread detail, make the “AI Suggestions” tab show:
  - category
  - priority
  - summary
  - suggested reply
  - next action
  - buttons to use reply, create task, schedule meeting, save note
- Remove the white blank state by showing a loading/error/empty state with a “Run AI triage” button.

### 6. Fix scrolling and layout visibility

- Replace the fixed `calc(100vh - 420px)` inbox grid height with a responsive layout that scrolls inside the page correctly.
- Make the thread list and detail pane independently scrollable without trapping the whole page.
- Ensure the detail pane header stays visible while the message body, tabs, and AI blocks can scroll.
- Add horizontal overflow handling for channel/category chips and thread actions.

### 7. Remove duplicate Email Client navigation

- Remove “Email Client” from the Owner sidebar.
- Keep `/owner/email-client` redirecting to `/owner/inbox` so old links do not break.
- Ensure CRM email links also point to `/owner/inbox` or `/owner/inbox?channel=email_gmail`.

### 8. Add bulk-action foundation

- Add selectable thread rows with:
  - select all visible
  - unselect all
  - mark read/unread
  - mark needs reply / waiting / follow-up
  - create tasks from selected
  - schedule calendar follow-up from selected
- Implement database-side updates for local inbox state first.
- For Gmail reflection, add a protected backend action that uses the Gmail connector to call Gmail modify endpoints when scope is available.
- If Gmail modify scope is missing, show a reconnect-required message instead of pretending it worked.

### 9. Wire calendar/task actions

- Use the existing `owner_comm_tasks` and `owner_calendar_events` paths for local tasks/calendar.
- Add selected-thread bulk actions that create tasks/calendar events with the thread source saved in metadata.
- Keep Google Calendar sync as a second step only if the Google Calendar connector is linked and available; otherwise local website calendar still works.

## Validation after implementation

- Confirm `/owner/inbox?channel=email_gmail&channelId=...` loads without blinking or blank screen.
- Confirm Gmail thread count/messages display from unified tables.
- Confirm Hostinger tab only shows Hostinger threads and has message rows after sync.
- Confirm category filters place examples correctly:
  - SHEIN → Marketing
  - Emirates NBD → Finance / Banking
  - The Luxury Closet price offer → Sales / Offers
- Confirm AI Suggestions is no longer blank and produces summary/reply/action.
- Confirm scrolling works on the current 1133×891 viewport.
- Confirm “Email Client” is gone from the sidebar.
- Confirm bulk selection updates local inbox state; Gmail reflection shows success or reconnect-required status.