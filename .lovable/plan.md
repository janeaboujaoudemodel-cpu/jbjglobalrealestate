## Plan — Lead UX polish + Email Center roadmap continuation

### 1. Investor mark — visual + filter wiring
- When a lead's `is_investor` is true:
  - **Crown icon lights up gold** (`#B89555` fill + soft glow ring) in `LeadQuickActions` (already partially there; make it brighter + persistent across the row).
  - **Row gets a thin gold left border** + a small "Investor" gold pill next to the name in every lead list (CRM Leads, Kanban card, Email Center sender chip).
- Wire to filters:
  - In CRM Leads top bar, the existing **Investors** sub-tab (and `ContactTypeFilter` "Investors" option) will read `is_investor = true` in addition to category, so any lead marked from anywhere instantly appears under Investors.
  - Add `is_investor` to the `vw_crm_contacts` view payload so the Relationships → Investors tab also picks it up.

### 2. Lead-aware quick actions (Calendar / Note / Task / Reminder)
Today the popovers only carry `leadId`. Change to carry the full lead context (`full_name`, `phone`, `email`) so every artifact is auto-stamped:
- **Calendar event**: title prefilled `Meeting with {full_name}`, description includes phone + email, `metadata.lead = { id, full_name, phone, email }`.
- **Note**: body header auto-inserts `— re: {full_name} ({phone} · {email})` so notes are searchable without joins.
- **Task / Reminder**: title prefilled `Follow up with {full_name}`, `metadata.lead_contact` carries phone/email; due reminder uses lead's preferred channel.
- Source of truth: pass the full lead object from `crm_leads` row down into `LeadQuickActions` (currently only `leadId` + `leadName`).

### 3. Clickable lead names → CRM detail
- Every place a lead's name renders (Leads list, Kanban cards, Email Center sender, Tasks list, Calendar event card, Notes panel, Dashboard widgets) becomes a `<Link>` to `/owner/crm?section=leads&leadId={id}` which auto-opens the **Lead Detail drawer** with status editor, notes, tasks, email thread.
- Add a tiny `useOpenLead(id)` hook that pushes the query param so we don't duplicate routing logic.
- Style: keep ink color, underline-on-hover with a 1px gold hairline (no faded gold text).

### 4. Email Center — archive previously misclassified items
Context: When we tightened the real-estate filter, ~older emails that no longer match the strict rules are still in `email_inbox_items`. Plan:
- Add a column `is_archived boolean default false` + `archived_reason text` to `email_inbox_items`.
- On next **Sync inbox now**, run a one-shot reclassification: anything that fails the new `RE_SIGNALS` test AND isn't already linked to a contract/registration gets `is_archived = true, archived_reason = 'non_real_estate'`.
- UI: archived items hidden from all category tabs by default; a small "Archived (N)" link in the Email Center toolbar opens a read-only drawer so you can review what was hidden and restore any false-positive with one click.
- **Nothing is deleted.** This is a soft archive — full audit trail preserved.

### 5. Continue the roadmap (from prior plan, still pending)

**5a. Registration reconfirmation loop (7-day)**
- New table `developer_registration_confirmations` (developer_id, sent_at, confirmed_at, reminder_count, status).
- Edge function `check-registration-confirmations` runs daily via cron:
  - If no reply after 7 days → auto-fire reminder #1.
  - After 14 days → reminder #2 + flag lead as `needs_attention` in CRM.
  - On any inbound reply detected by `classify-jbj-inbox` matching the developer's domain → mark `confirmed_at`, flip developer record `registered = true`.

**5b. Email → Project listing pipeline**
- In `classify-jbj-inbox`, when category is `new_launches` or `projects_inventory`:
  - Extract attached PDFs/links into `extracted_documents jsonb`.
  - Try to match an existing project by name + developer; if match → attach docs and bump `last_updated_from_email`.
  - If no match → create a **draft listing** (status=`pending_review`) and queue deep-research enrichment.
  - Surface in Email Center as a "Project detected → Attach / Create draft" pill.

**5c. Commission email → ledger**
- Category `commission` triggers attaching the email + any PDF to the developer's commission ledger entry (best-match by deal reference in subject/body).

**5d. Communication Hub dedup**
- Replace the generic "Email" tab inside Communication Hub (owner role) with a link card → "Open Email Command Center". Other channels (WhatsApp, Slack, Telegram, etc.) stay in the Hub.

### 6. Order of work
1. Investor crown gold + filter wiring (frontend only, ~15 min)
2. Lead-aware quick actions + clickable names (frontend, ~25 min)
3. Migration: add `is_archived`, `archived_reason` to `email_inbox_items` + `developer_registration_confirmations` table
4. Reclassify-on-sync (archive purge) inside `classify-jbj-inbox`
5. `email-side-effects` edge function (project attach/create, commission ledger, registration confirm flip)
6. Cron `check-registration-confirmations` (7/14-day loop)
7. Communication Hub dedup card
8. End-to-end test against `infoo.jane@gmail.com`

### Technical notes
- All DB writes RLS-scoped to `requireOwnerAuth`.
- Crown gold uses existing token `#B89555` (1px hairline + 6% glow ring — no solid gold fill on the row, per design rules).
- Lead name links use existing `/owner/crm` route with `?section=leads&leadId=` param already supported by `UnifiedCRM`.
- No new dependencies.

Approve and I'll execute steps 1→8 in sequence.
