# CRM Restructure — Private vs Shared Workspaces + Broker Profile Hub

## What changes for you (the owner)

You will have two clearly separated workspaces inside the CRM, plus a per-broker profile view:

1. **My Leads (Private)** — the existing CRM you already use. Anything you edit here stays private. Even if the lead has been shared with a broker, your edits do NOT reach the broker. This is your private workspace for notes, status changes, internal scoring, etc.
2. **Shared with Brokers** — a new section listing only leads that have an active broker share. Edits made HERE go live to the assigned broker immediately. This is where you collaborate.
3. **Brokers → Profile** — clicking any broker opens their full profile: every lead they own or were given, every status change, every note, every call/whatsapp/email log, every action they have taken. Read-only audit for you.

The broker always sees what they see today: only the fields/rows the share grants them, and only the version that was published to them from the Shared workspace.

## How it works under the hood

```text
crm_leads (one row per lead — single source of truth)
    │
    ├── owner-private view: src/pages/owner/crm/Leads.tsx (existing, untouched)
    │       writes go straight to crm_leads
    │       trigger does NOT enqueue (privacy = on)
    │
    ├── shared workspace:  src/pages/owner/crm/SharedWithBrokers.tsx (NEW)
    │       lists leads JOIN crm_lead_shares WHERE active = true
    │       writes go straight to crm_leads AND immediately publish
    │       (auto-fan-out to all broker shares for that lead)
    │
    └── broker view: existing BrokerCRM, reads through crm_lead_shares
            sees only fields allowed by visible_* grants
            sees only diffs that were published
```

The plumbing from the previous phase (`crm_lead_publish_queue`, `crm_capture_owner_lead_edit` trigger, `crm_publish_lead_diffs` RPC) is reused — we just change WHO triggers publication:

- Edit from `/owner/crm/leads` (private) → trigger captures diff but `auto_publish = false`. Diff sits in queue, hidden, never delivered. Effectively private.
- Edit from `/owner/crm/shared-with-brokers` → same write, but the page calls `crm_publish_lead_diffs(lead_id)` right after the mutation succeeds. Diff is delivered instantly.

To know which view an edit came from, we add a request-scoped flag (`x-crm-context: 'private' | 'shared'`) that the page passes when calling the update RPC. The trigger reads it from `current_setting('crm.context', true)` and decides whether to enqueue, auto-publish, or skip.

## Broker Profile Hub

New route `/owner/crm/brokers/:brokerId` showing:

- Header: avatar, name, email, status (active/suspended), date granted access, 2FA status, last login, last IP.
- Tabs:
  - **Leads** — every `crm_lead_shares` row + every lead the broker created themselves (`crm_leads.created_by = brokerId`). Inline status, stage, last activity.
  - **Activity** — chronological feed from `crm_broker_activity_log` (calls, whatsapps, emails, status changes, file opens, exports).
  - **Performance** — count by stage, conversion %, response time, won/lost.
  - **Access** — which databases they can see, which fields, which files. Edit/revoke inline.
  - **Sessions** — active sessions + Revoke All kill switch (reuses Phase 6 SecurityCenter primitives).

Reachable from the existing Brokers list at `/owner/crm/brokers` by clicking any row.

## Database changes

```sql
-- 1. Per-edit context flag (no schema change — just a session GUC the trigger reads)
--    Set by the client per request: SELECT set_config('crm.context','shared', true);

-- 2. Auto-publish helper used by the Shared workspace page
CREATE OR REPLACE FUNCTION public.crm_publish_lead_diffs_for_lead(p_lead_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE crm_lead_publish_queue
     SET published_at = now()
   WHERE lead_id = p_lead_id AND published_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- 3. Update existing trigger crm_capture_owner_lead_edit:
--    - Read GUC crm.context (default 'private')
--    - If 'private'  → do NOT insert into queue (privacy preserved)
--    - If 'shared'   → insert into queue AND set published_at = now() (live)

-- 4. Broker activity audit (already partly exists as crm_broker_activity_log;
--    ensure it captures: lead_create, lead_edit, status_change, call, whatsapp,
--    email, file_open, export, login, ip)

-- 5. View vw_crm_broker_profile aggregating per-broker counts for the hub
CREATE OR REPLACE VIEW public.vw_crm_broker_profile AS
SELECT b.id AS broker_id, b.full_name, b.email,
       (SELECT count(*) FROM crm_lead_shares s WHERE s.shared_with = b.id AND s.active) AS leads_shared,
       (SELECT count(*) FROM crm_leads l WHERE l.created_by = b.id) AS leads_created,
       (SELECT max(occurred_at) FROM crm_broker_activity_log a WHERE a.broker_id = b.id) AS last_activity_at
  FROM crm_brokers b;
```

RLS: only the owner (Jane) can read `vw_crm_broker_profile` and `crm_broker_activity_log`. Brokers see nothing change.

## UI work

| File | Action |
|------|--------|
| `src/pages/owner/crm/Leads.tsx` (or current `LeadsPage`) | Wrap update calls so they `set_config('crm.context','private')` first. No visual change. |
| `src/pages/owner/crm/SharedWithBrokers.tsx` | NEW. Same lead table component, filtered to shares-only. Updates set context = `'shared'`. Top banner: "Edits here go live to brokers". |
| `src/components/crm/SidebarNav.tsx` | Add "Shared with Brokers" item between "Leads" and "Pipeline". |
| `src/pages/owner/crm/BrokerProfile.tsx` | NEW. The 5-tab hub. |
| `src/pages/owner/crm/Brokers.tsx` | Each row now links to `/owner/crm/brokers/:id`. |
| Remove the `LeadPublishQueue` panel from `DatabasesHub` — no longer needed since publishing is contextual and automatic in the Shared workspace. |

## Risk callouts

- **R1**: Existing in-flight queued diffs (from the previous phase) will never be auto-published under the new model. Confirm I should bulk-publish them once on migration, or discard them all.
- **R2**: Brokers who currently see live owner edits will stop seeing them unless the owner switches to the Shared workspace to edit. This is the desired privacy behavior but is a behavior change.
- **R3**: The `crm.context` GUC is per-transaction. Any owner edit that bypasses the page (CLI, future webhook, etc.) will default to `'private'` — safer default.

Reply approve to proceed. Phase order will be: (1) DB trigger + helper + view, (2) Shared workspace page + sidebar entry, (3) Broker Profile hub, (4) wire context flag everywhere, (5) cleanup of old LeadPublishQueue UI.
