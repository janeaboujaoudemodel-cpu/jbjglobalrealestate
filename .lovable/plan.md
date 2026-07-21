# Broker/Developer Portal Automation & Truthful Feedback

Fixes eight related issues from your message. Grouped into phases so each ships verifiable.

## Phase 1 — Kill fake success messages (platform-wide)

Rule: no toast/pop-up says "success / pulled / synced / sent / verified" unless the backend response actually returned a non-zero, verified action.

- Broker Portal `Run now` (DLD daily sync): only toast success when the edge function returns `rowsInserted + rowsUpdated > 0`. If zero, show "No new records from DLD" (neutral, not green).
- Developer Portal same rule.
- `Sync now` (Gmail): only success when `messagesFetched > 0`; otherwise neutral "Inbox is up to date".
- Distribute / Send email / Verify / etc.: audit `src/components/**/*.tsx` and `src/pages/owner/**/*.tsx` for `toast.success(...)` calls that fire before/without checking the response payload — gate every one on the real result.

## Phase 2 — Auto-sync (no manual clicks)

- **Gmail inbox**: pg_cron job every 10 min → invokes `gmail-sync` edge function for the owner's connected mailbox. Uses existing `CRON_SHARED_SECRET` if present.
- **DLD brokerage sync**: pg_cron job daily at 06:00 GST → invokes `dld-brokerage-sync`. Removes need to press Run now (button stays for manual override).
- Both write to `sync_runs` audit table so the UI can show real "Last run" + real counts.

## Phase 3 — Replace "Sync now" with "Inbox" button

Next to "Gmail Inbox · infoo.jane@gmail.com":
- Primary button: **Inbox** → opens `/owner/mailbox` (in-page, emerald shell), listing latest ingested messages with search, filter by developer/brokerage, and click-through to the original Gmail thread.
- Manual "Sync" moved to a small refresh icon (secondary).

## Phase 4 — Email → status automation

Edge function `email-status-reconciler` runs after every Gmail sync:
- For each new inbound/outbound message, match `From/To/Subject/Body` against `developers.name`, `developers.website`, `brokerages.name`, `brokerages.email_domains`.
- On match, update the card:
  - Inbound reply → status `responded`, append note `"Replied on {date}: {subject}"`.
  - Outbound with no prior send → status `contacted`.
  - Bounce/complaint → status `bounced`.
- Writes `activity_log` row so you see the audit trail on the developer/brokerage profile.

## Phase 5 — Clickable portal stat cards

Total Agencies · Total Brokers · Uploaded · Updated cards become buttons:
- `Total Agencies` → in-page drawer listing every agency (paginated, search).
- `Total Brokers` → in-page drawer of brokers.
- `Uploaded` → filtered list `uploaded_at IS NOT NULL`.
- `Updated` → filtered list where `updated_at > created_at` (real edits only).

All drawers open inside the JBJ Hub shell — no navigation to legacy backend.

## Phase 6 — Truthful "Updated brokers" count

Current count (32,651) reflects any row touched by seed/import, not real edits. Fix:
- Recompute `Updated brokers` as `COUNT(*) WHERE last_manual_update_at IS NOT NULL`.
- Add `last_manual_update_at` column; populate only on genuine field edits (not bulk imports, not cron reconciler unless it changed a field).
- Backfill: set NULL for all existing rows so the count starts at 0 and grows only when you or the auto-reconciler actually change something.

## Phase 7 — Answer on CRON_SHARED_SECRET

I asked to delete it earlier because during owner-auth-middleware cleanup I mistakenly treated it as orphaned. It is **not** orphaned — the new cron jobs in Phase 2 use it. I'll regenerate it now and keep it. Skip the delete approval you saw.

## Technical notes

- New tables: `sync_runs(id, kind, started_at, finished_at, rows_inserted, rows_updated, error)`, `activity_log(id, entity_type, entity_id, kind, payload, created_at)`.
- New column: `brokerages.last_manual_update_at timestamptz`, `developers.last_manual_update_at timestamptz`.
- Cron: `pg_cron` + `pg_net` with `CRON_SHARED_SECRET` header check inside each edge function.
- No changes to Zoho-mirrored pages.

Reply "go" to execute, or tell me which phases to reorder/skip.
