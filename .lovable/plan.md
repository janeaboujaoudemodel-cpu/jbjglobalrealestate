# Broker Portal — full build plan

Scope covers the six things you asked for, in the order you asked for them. I'll build slice by slice, take Playwright screenshots at each slice, and only mark a slice done after visual proof.

---

## 1. Inbox mailbox for branded emails → `infoo.jane@gmail.com`

- All branded / bulk / campaign emails from Broker Portal + Developer Portal use `infoo.jane@gmail.com` as the sending + reply-to identity (already the project default in `src/config/outreachIdentity.ts`).
- Replies land in that same inbox. We need Gmail read access so the AI can:
  - Match every incoming reply to the brokerage/broker it came from.
  - Auto-update status (Registered / Briefing pending / Not interested / Bounced).
  - Draft a reply per agency and store it in a **Drafts** column next to the agency card — never auto-send.
- To read that inbox, I'll ask you to connect **Gmail** via the connector picker (one click, no password shown to me). If you prefer, we can use the Zoho Mail connector instead — say the word.

## 2. Daily DLD sync (brokerages + individual broker cards)

- New edge function `dld-daily-sync` on a pg_cron schedule (03:00 GST daily).
- Pulls the DLD open dataset (agencies + broker card registry), diffs against `crm_brokerages` and `crm_brokers` by DLD licence number, and:
  - Inserts new agencies / brokers as `source = 'dld_daily'` with today's date as `first_seen_at`.
  - Never overwrites your edits — only fills blanks.
  - Logs the run in `crm_brokerage_sync_log`.
- New "DLD sync" tab in the Broker Portal shows last run, rows added, and a Run now button.

## 3. Specialty split — Secondary / Off-plan / Both

- Add `specialty` (`secondary | offplan | both`) and `specialty_focus` (`secondary_first | offplan_first | equal`) to `crm_brokerages` and `crm_brokers`.
- Portal gets three filter tabs: **Secondary**, **Off-plan**, **Both**, plus **All**.
- When adding or editing an agency/broker, a two-step chip picker: pick primary (that's the focus), pick secondary. If only one is picked, it's marked as `both = false`.

## 4. Zoho CRM two-way sync

- Every insert / update on `crm_brokerages`, `crm_brokers`, `crm_leads`, `developers` fires a Postgres trigger → `sync-lead-tri` edge function → Zoho module (Accounts / Contacts / Leads).
- Reverse direction: existing `zoho-crm-proxy` polls Zoho every 10 min for records modified since `last_synced_at` and upserts back into Lovable.
- Conflict rule: most recent `Modified_Time` wins; conflicts land in `sync_conflicts` for review.
- Adds a "Zoho: synced 2m ago" badge on every broker / brokerage / developer card (same pattern as `ZohoSyncBadge` used on leads today).

## 5. Unsubscribe → one-click Resubscribe (TDRA compliant)

- Keep the auto-appended unsubscribe footer — required by UAE TDRA for bulk email, protects deliverability.
- `/unsubscribe` already shows a **Resubscribe** button (`src/pages/Unsubscribe.tsx`). I'll:
  - Make it one-click (no reload, no form) with a large gold CTA.
  - Add the same resubscribe CTA to the confirmation email footer so people who unsubscribed by mistake can undo it from their inbox.
  - Log both events in `newsletter_events` so you see churn vs recovery.

## 6. E2E test order

I'll validate with Playwright screenshots at each step, in this order:

1. **Upload wizard** — Excel upload → dedupe preview → commit → agency cards render with logos + source chip.
2. **Add / edit** — Add brokerage, add individual broker, add multiple contacts per card (position + email + phone), specialty picker works.
3. **Bulk email** — Send test campaign to `infoo.jane@gmail.com`, confirm unsubscribe → resubscribe round-trip.
4. **Phase 2 — DLD daily sync** — Trigger `dld-daily-sync` manually, confirm new rows appear tagged `dld_daily`.
5. **Phase 3 — Zoho two-way** — Edit a brokerage in Lovable → appears in Zoho within 30s. Edit same record in Zoho → appears back in Lovable within 10 min.
6. **Phase 4 — Inbox AI** — Send a reply from a test address to `infoo.jane@gmail.com`, confirm status auto-updates and a draft reply is queued (never auto-sent).

---

## Two things I need from you before I start

1. **Gmail connection**: confirm I should open the Gmail connector for `infoo.jane@gmail.com` (read + send). If you'd rather use Zoho Mail as the inbox, say so.
2. **DLD data source**: DLD's public dataset covers agencies + broker cards but not internal statuses. Confirm you want the daily job to pull from the public dataset (free, refreshed daily) rather than a paid feed.

Once you approve this plan and answer those two, I'll start with slice 1 (upload wizard) and post screenshot proof before moving on.
