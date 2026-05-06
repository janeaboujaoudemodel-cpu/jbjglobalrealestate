# Activity Log + CRM Quick Actions (Note / Calendar / Reminder)

Two problems to fix:

1. In **Agency Activity Log**, the KPI tiles (Total, Reminders, Notes, Calendar, Outreach) are not clickable filters and there is no way to add a new note/calendar/reminder directly from the page.
2. Across **Brokerages, Clients, Developers, and individual Brokers/Agents**, there is no inline way to add a Note, Calendar event, or Reminder (with a chosen delivery channel) without opening Edit.

## What to build

### 1. Agency Activity Log — make tiles work + inline creators
File: `src/pages/owner/crm/AgencyActivityLog.tsx`

- Convert the 5 stat tiles into real filter buttons. Each click sets both `view = "all"` and `typeFilter` to its corresponding action_type:
  - Total → `typeFilter = "all"`
  - Reminders → `reminder`
  - Notes → `note`
  - Calendar → `calendar_event`
  - Outreach sent → `outreach_sent` (also matches `message_sent` via filter logic update)
- Highlight the active tile (reuse existing `active` styling) based on current `typeFilter`.
- Add a small `+` button next to each of: **Reminders**, **Notes**, **Calendar** tiles (and a "+ New" pill in the toolbar for outreach jumps to brokerage list). Clicking opens a unified `QuickActivityDialog` that lets the user:
  - pick an Agency (searchable Select over `crm_brokerages`)
  - pick type (Note / Calendar event / Reminder)
  - title + body
  - due date (for Calendar / Reminder)
  - **delivery channel** for Reminder: Email, WhatsApp, SMS, Push (in-app)
- On submit:
  - Note → insert into `crm_brokerage_actions` (action_type=`note`)
  - Calendar → insert into `crm_brokerage_actions` (action_type=`calendar_event`, due_at)
  - Reminder → insert into `crm_relationship_reminders` with `metadata.delivery_channel` and mirror to `crm_brokerage_actions` (calendar_event + note) for activity log visibility.
- Invalidate `["crm-unified-activity"]` and `["crm-reminders"]`.

### 2. Inline quick actions across CRM rows
A new shared component `src/components/crm/QuickActivityActions.tsx` rendering three small icon buttons (Note, Calendar, Reminder) and reusing the same `QuickActivityDialog`. Props: `entityType: "brokerage"|"client"|"developer"|"broker_agent"`, `entityId`, `entityName`, optional `brokerageId` for nested broker agents.

Insert it into:
- `BrokeragesTab` brokerage card action row in `src/pages/CRMRelationships.tsx` (next to existing Remind/Deals buttons; replaces the current bare `Bell→Remind` quick action with the richer Reminder dialog while keeping a "Quick 7-day remind" via the existing button).
- `ClientsTab` and `DevelopersTab` action rows in the same file (parity).
- Individual broker/agent rows rendered inside `BrokerageAgentsEditor` (or wherever agents render in the brokerage detail) — add the trio after the agent name.

For non-brokerage entities, persistence targets:
- Reminder: `crm_relationship_reminders` with `client_id` / `dev_registry_id` (already supported by hook).
- Note + Calendar: insert into `crm_brokerage_actions` only when entity is a brokerage (existing schema). For clients/developers/brokers, store as a `crm_relationship_reminders` row with `kind = "note"` / `kind = "calendar"` so they show up in their reminder lists. (No schema migration required.)

### 3. Reminder delivery channel
Add a `Select` in the dialog with values: `email`, `whatsapp`, `sms`, `push`. Persist to `crm_relationship_reminders.metadata.delivery_channel`. Display the channel as a small badge in the activity log row metadata column. (Actual outbound delivery is out of scope here; backend already routes reminders.)

## Out of scope
- No DB migrations — using existing tables (`crm_brokerage_actions`, `crm_relationship_reminders`, `crm_brokerages.metadata`).
- No edge function changes.
- No changes to existing Remind quick button (still creates 7-day follow-up bundle).

## Files touched
- `src/pages/owner/crm/AgencyActivityLog.tsx` — wire tiles, add `+` buttons, mount dialog.
- `src/components/crm/QuickActivityDialog.tsx` (new) — unified Note/Calendar/Reminder modal with channel select.
- `src/components/crm/QuickActivityActions.tsx` (new) — icon-button trio used in cards.
- `src/pages/CRMRelationships.tsx` — embed `<QuickActivityActions />` in Brokerages, Clients, Developers, and agent rows.
