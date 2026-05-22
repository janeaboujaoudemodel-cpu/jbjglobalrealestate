## What you'll see

1. The **"Shared w/ Brokers"** tab in `/owner/crm?entity=leads` is **removed completely**. It will no longer appear in the side nav.
2. On every row of the main Leads table, a new **shield icon** (🛡 "Access") appears next to the existing action icons (WhatsApp / Call / Email / Delete).
3. Clicking it opens an **Access dialog** for that specific lead. The dialog shows:
   - The lead's name + a privacy banner ("Sensitive data — every action is logged").
   - **Every broker who can currently see this lead**, grouped by HOW they got access:
     - **Direct share** — they were individually granted this lead.
     - **Database grant — "{database name}"** — they got access because the lead lives in a database/folder you shared with them. If the lead is visible through multiple databases, **each one is listed separately** with the database name.
   - For each broker row: their name, the date access started, expiry (if any), and current status (Active / Suspended).
4. For each row, two buttons: **Suspend** and **Restore** (whichever is relevant). Both open a **typed confirmation** ("type `SUSPEND` to confirm") before anything happens — no accidental clicks.
5. After confirmation, the change is applied **server-side via a SECURITY DEFINER RPC** (`crm_owner_set_access_status`) that:
   - Verifies `auth.email() = OWNER_EMAIL` before touching anything (defense in depth on top of RLS).
   - Sets `revoked_at`/`suspended_at` on `crm_lead_shares` for direct shares, or `suspended_at`/`revoke_reason` on `crm_database_grants` for database grants.
   - Writes one immutable row to `crm_audit_logs` + `crm_security_events` with the lead_id, broker_id, source (share / grant), old/new status, reason.
6. Live brokers lose access **immediately** — existing RLS on `crm_lead_shares` and `crm_database_grants` already checks `revoked_at IS NULL` / `suspended_at IS NULL`, so no further code changes are needed for the read side.

## Security guarantees (the bit you asked me to be careful about)

- **No client-side trust**: the dialog only DISPLAYS state; every mutation goes through one RPC that re-checks owner identity. A compromised browser cannot suspend / restore on someone else's behalf.
- **RLS untouched**: we don't loosen any existing policies. The new RPC is the only new write path and it's locked to the owner email.
- **No PII leak**: broker names come from `crm_brokers` (already-public-to-owner). Their auth emails are not shown — same rule as the rest of the app.
- **Audit-first**: every Suspend / Restore writes to `crm_audit_logs` with before/after JSON and to `crm_security_events` (the same table already used by the existing `LeadSharingPanel`). You can review the full history later in Security Console.
- **Idempotent**: re-suspending an already-suspended grant is a no-op (no duplicate audit rows for the same state).
- **Hard cap**: the RPC refuses to act on more than 1 grant per call → prevents a "suspend everyone" mass-mistake from one bad click.

## Files

- **Edit** `src/pages/owner/crm/UnifiedCRM.tsx` — remove the `"shared"` entry from `VIEWS.leads`, the lazy import, and the `case "shared"` branch. If someone hits `?view=shared`, fall through to `"all"`.
- **Delete** `src/components/crm/SharedWithBrokersView.tsx` (no other refs).
- **New** `src/components/crm/LeadAccessDialog.tsx` — the per-lead access panel + typed-confirm modal.
- **Edit** `src/components/crm/CRMLeadsTableV2.tsx` — add the shield icon in the per-row action group; wires up `LeadAccessDialog`.
- **New migration** — adds:
  - View `vw_lead_access_audit(lead_id, broker_id, broker_name, source, source_label, permission_level, started_at, expires_at, status, source_row_id)` (security_invoker, owner-only via RLS-equivalent guard inside the function).
  - RPC `crm_owner_list_access(p_lead_id uuid) returns setof vw_lead_access_audit` — owner-only.
  - RPC `crm_owner_set_access_status(p_source text, p_source_row_id uuid, p_action text, p_reason text)` — owner-only, single-row, audited.

## Technical detail (database)

```text
crm_owner_list_access(lead_id)
  → UNION ALL of:
      crm_lead_shares WHERE lead_id = $1 AND revoked_at IS NULL
        → source = 'direct_share'
      crm_database_grants g
        JOIN crm_database_folders f ON f.id = g.source_database_id
        WHERE g.revoked_at IS NULL
          AND EXISTS (
            SELECT 1 FROM crm_leads l
            WHERE l.id = $1
              AND l.source_database_id = g.source_database_id
          )
        → source = 'database_grant', source_label = f.name
  → broker_name resolved via crm_brokers.user_id = shared_with / broker_user_id

crm_owner_set_access_status(source, source_row_id, action, reason)
  - GUARD: IF auth.email() <> OWNER_EMAIL THEN RAISE 'not_owner';
  - action IN ('suspend','restore','revoke')
  - source='direct_share' → update crm_lead_shares SET revoked_at=... WHERE id=source_row_id
  - source='database_grant' → update crm_database_grants SET suspended_at=... WHERE id=source_row_id
  - INSERT into crm_audit_logs + crm_security_events
```

## Acceptance

- "Shared w/ Brokers" is gone from the nav and the route. Old bookmarks redirect to "All Leads".
- Clicking the shield on any lead opens the dialog and correctly enumerates direct shares + database grants (including the same lead appearing under multiple databases).
- Suspend requires typing `SUSPEND` to confirm; clicking outside the dialog cancels.
- After Suspend, the affected broker's CRM no longer shows that lead on next refresh (verified by RLS).
- Every Suspend / Restore appears in `crm_audit_logs` with before/after JSON.
- Non-owner accounts calling the RPC directly get `permission denied: not_owner`.