## Goal

Bring the Broker portal to parity with the Owner CRM and add three new pillars:
1. Broker **Database Sheets** (like Owner CRM) with merge-into-main-leads control.
2. Broker **email connect** (Gmail / Outlook / Company IMAP) with smart work-related filtering inside `/broker/inbox`.
3. **Internal Channel** (existing owner team-chat) wired to every broker, plus **HR Announcements Channel** (humanized persona, never branded as "AI").

Strict rules carried through everything: broker can never DELETE a lead — only mark **Junk**, which returns to the owner Junk queue for redistribute / delete. No "AI" wording or bot icons on HR or any assistant persona.

---

## Act 1 — Broker CRM = Owner CRM parity (Database Sheets + Junk return)

### DB (one migration)
- New `broker_databases` (id, broker_user_id, name, source, row_count, merged_into_main bool, color, created_at) — broker-owned scoped copy.
- New `broker_database_leads` (id, broker_database_id, broker_user_id, lead snapshot fields, source_lead_id nullable, status enum: new/contacted/qualified/viewing/negotiation/won/junk, merged_to_main bool).
- New `crm_junk_returns` (id, original_broker_id, lead_id, reason, returned_at, owner_action enum: pending/redistributed/deleted, redistributed_to).
- RPCs:
  - `broker_add_database(name, rows jsonb, merge_into_main bool)` — creates sheet; if `merge_into_main=true`, also inserts copies into `crm_leads` with `assigned_broker_id=auth.uid()` and flips `merged_to_main=true`.
  - `broker_merge_database_to_main(database_id)` — later toggle.
  - `broker_mark_lead_junk(lead_id, reason)` — flips status, inserts `crm_junk_returns` row, removes from broker's active pipeline, **never deletes**.
  - `owner_redistribute_junk(junk_id, new_broker_id)` / `owner_delete_junk(junk_id)`.
- RLS: brokers select/insert/update only their rows; junk_returns selectable by owner + the originating broker; no DELETE policy for brokers anywhere.
- GRANTs to `authenticated` + `service_role`.

### Frontend
- `/broker/crm` — extend existing `BrokerCRM.tsx`:
  - **Add database** button → `AddBrokerDatabaseDialog` (upload CSV / paste / manual) with a **"Where should these leads live?"** radio:
    - *Keep as separate database sheet only* (default)
    - *Also merge into My Leads*
  - **Assigned Databases** tab lists `broker_databases` cards (premium champagne, gold hairline). Click → opens **subsection inside the same page** (not a new route) rendering `<BrokerDatabaseSheet />` — same CRM table styling, kanban + grid, but scoped to that database only.
  - Inside the sheet: per-row **Promote to My Leads** (copies into `crm_leads`) and **Mark Junk** (calls junk RPC). Delete button is **removed** for brokers globally.
- `/owner/crm?section=leads&sub=junk` — new **Junk Returns** sub-tab listing `crm_junk_returns` pending rows. Actions: **Redistribute** (broker picker → reassign) or **Delete permanently**.
- Update `BrokerLeadsPage` action menu: replace Delete with Mark Junk (with reason textarea).

---

## Act 2 — Broker email connect + smart inbox

### Connect flow (broker portal → Settings → "Email accounts")
- Gmail OAuth via existing Google connector (per-user OAuth tokens stored in new `broker_email_accounts` table: provider, email, refresh_token_encrypted, scopes, last_synced_at).
- Outlook / Microsoft OAuth via Microsoft Graph connector.
- Generic IMAP/SMTP for company emails (host, port, username, password_encrypted).
- One broker can connect multiple accounts (company + personal).

### Smart filtering edge function `broker-email-sync`
- Runs on demand + cron every 15 min per connected account.
- Pulls last 200 messages, runs `google/gemini-2.5-flash-lite` classifier with labels: `new_launch`, `commission`, `onboarding_letter`, `warning_letter`, `termination`, `leave_approval`, `internal_jbj`, `client_lead`, `other`.
- Writes into existing `broker_messages` (or new `broker_email_messages` if needed) with `category`, `summary`, `is_work_related`, `source_account_id`.

### UI in `/broker/inbox`
- Left rail: filter by category chips (New Launch, Commission, HR, Internal, Leads).
- Connected accounts pill row at top with sync-now + disconnect.
- Quick reply uses existing tone-matched reply generator (purple AI badge — allowed in Inbox compose, not in HR).

---

## Act 3 — Internal Channel wired to brokers + HR Channel (no AI labeling)

### Internal channel
- `internal_chat_messages` already exists for owner team chat (`/team-chat`).
- Extend: add `channel` enum (`team_general`, `hr_announcements`, `direct`) and `recipient_user_id` for DMs.
- Auto-subscribe every `broker_profiles` row to `team_general` + `hr_announcements`.
- Render a new `/broker/messages` (or extend `BrokerInbox` with a "Channels" tab) showing both channels and DMs.
- Owner & colleagues can: open broker profile → **"Message"** (creates DM) or **"Email + CC Owner"** (opens compose dialog that drafts a template via Gemini, user edits, sends through Resend with owner in CC). Both deliver to broker inbox-on-site AND to their connected email.

### HR Channel (humanized, never "AI")
- New `hr_announcements` table (id, author_persona, title, body, category enum birthday/event/briefing/launch/celebration, scheduled_for, sent_at, audience).
- Persona picker uses existing `team-members.ts` config (e.g., "Amanda Clarke — Executive Assistant"). **No bot icon, no "AI" word anywhere in broker-facing UI** — channel header shows the persona's photo + human title only.
- Owner page `/owner/hr/announcements` — composer (rich text + image), schedule, audience (all brokers / all employees / specific team), preview as broker.
- Broadcast pipeline: write row → fan out into `internal_chat_messages` with `channel='hr_announcements'` for every target user → optional Resend email digest.

---

## Act 4 — Stability, intelligence, end-to-end QA

- Indexes on every new FK + `(broker_user_id, status)` + `(broker_user_id, sent_at desc)`.
- Realtime publication on `internal_chat_messages`, `hr_announcements`, `broker_database_leads`, `crm_junk_returns`.
- Audit logs: every junk return, redistribution, email connect/disconnect, HR broadcast → `admin_edit_log`.
- AI intelligence layer (Gemini 2.5 Flash):
  - Auto-suggest junk reason when broker hovers Mark Junk.
  - Auto-categorize incoming emails (Act 2 classifier).
  - Owner-side AI suggestion: "12 junk leads look re-qualifiable — redistribute to Top 3 brokers?"
- Manual QA after build (screenshots): `/broker/crm` add+open database sheet, junk flow, `/owner/crm` junk queue, `/broker/inbox` with connected Gmail, `/owner/hr/announcements` broadcast landing in a broker's channel.

---

## Out of scope (flagged, not built)
- True 2-way email sync (sent items mirror) — read-only sync first; send still goes through Resend.
- SMS / WhatsApp ingestion into broker inbox.
- Per-broker billing / paid seat gating (you said "decide later").
- Migrating historical `broker_messages` rows into new category schema (forward-only).

---

## Technical notes
- Email secrets: stored encrypted via existing `pgsodium`/encryption helpers; never returned to client.
- Google/Microsoft OAuth: use `standard_connectors--connect` for app-level send, but for per-broker mailbox read we set up per-user OAuth flow (each broker authorizes their own mailbox — connector alone won't work for multi-tenant inbox reading).
- All new public tables follow GRANT + RLS contract.
- All UI uses existing champagne tokens, PricePill, IconTile, no gray surfaces, no faded gold, navy CTAs.
- HR persona compliance enforced via a single `HumanPersonaBadge` component — banned from importing anywhere that would render "AI" or bot icons in HR/assistant contexts.

Reply **"approve"** to start Act 1, or tell me which acts to skip / reorder.