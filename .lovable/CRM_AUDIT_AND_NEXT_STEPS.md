# JBJ CRM Audit & Phase Plan

_Updated after Phase 0 deep audit._

## Audit Summary (read-only findings)

**58 CRM tables already exist.** No new tables are required for Phases 1, 2, 3, 4, 9. Reuse map:

| Need | Existing table | Notes |
|---|---|---|
| Broker directory | `crm_brokers` (66 cols, has user_id, employment_type, join_date) | reuse |
| Database grants | `crm_database_grants` (broker_user_id, permission_level, expires_at, revoked_at) | reuse |
| Per-lead visibility | `crm_lead_shares` (lead_id, shared_with, permission_level, expires_at, revoked_at) | reuse for Phase 3 owner→broker |
| Field-level visibility | `crm_field_permissions` (crm_role, field_name, can_view, can_edit, show_masked) | reuse |
| Per-user lead state | `crm_lead_state_per_user` | reuse |
| Audit trail | `crm_audit_logs`, `crm_action_logs`, `crm_lead_access_logs`, `crm_security_events` | reuse |
| Source databases | `crm_source_databases`, `crm_source_database_rows` | reuse |
| Automation | `crm_automation_rules` | reuse |
| AI | `crm_ai_drafts`, `crm_ai_employees`, `crm_ai_suggestions` | reuse |
| Saved filters / segments | `crm_saved_filters`, `crm_segments` | reuse |
| Owner settings | `crm_owner_settings` | reuse |

**Duplication risks already on the radar:** `crm_users_profile` overlaps `profiles`/`broker_profiles` — keep `crm_brokers` as the canonical broker directory per the Unified Relational CRM Standard.

**Blue color sweep target:** ≥40 CRM files contain `bg-blue`/`border-blue`/`hover:*blue`/`focus:*blue`. Will run as its own iteration.

## Shipped this iteration
- ✅ Rebuilt `GrantBrokerAccessDialog` with two-mode wizard (Existing / New), broker autocomplete from `crm_brokers`, champagne datepicker (no blue), invitation toggle, full new-broker intake form.
- ✅ Extended `crm-grant-broker-access` edge function to persist new-broker intake fields and best-effort send recovery/onboarding email.

## Next batch (awaiting sign-off)
1. Global CRM blue sweep → cream `#EFE6D6` + ink + gold hairline (40+ files).
2. Branded transactional invitation email template (Lovable Emails).
3. Phase 3 owner→broker asymmetric visibility — wire `crm_lead_shares` into broker RLS via a `broker_can_see_lead` SECURITY DEFINER function and a "Share leads…" panel per database in the Databases hub.
4. Phase 6 quick wins: login event logging + revoke all sessions per broker.
5. CRM dropdowns / segmented controls global pass.

_Plan continues from `.lovable/plan.md` (original 10 phases) — this audit refines that plan._
