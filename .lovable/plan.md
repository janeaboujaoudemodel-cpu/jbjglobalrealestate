# JBJ CRM — Enterprise Broker Access & CRM Upgrade Plan

This is a very large scope. I'll deliver it as an **audit-first, phased rollout** so nothing existing breaks. Each phase ships independently, is tested, then approved before the next begins.

---

## Phase 0 — Deep Audit (no code changes)

Before any build, I produce a written audit covering:

- All existing CRM tables (`crm_leads`, `crm_brokers`, `crm_source_databases`, `crm_database_grants`, `crm_audit_logs`, `crm_action_logs`, `crm_lead_assignments`, `deals`, `user_roles`, etc.)
- Existing RLS policies, edge functions (`crm-grant-broker-access`, `requireOwnerAuth`), and auth flows
- Existing UI: `UnifiedCRM`, `DatabasesHub`, `GrantBrokerAccessDialog`, calendars, commission system, agreements, email infra
- Duplicates / overlaps to merge (per "Unified Relational CRM Standard" memory)
- Gap list vs. Salesforce / Zoho / HubSpot / Bitrix24

**Deliverable:** audit doc + concrete "reuse vs. build" map. You approve before Phase 1.

---

## Phase 1 — Broker Account Architecture

- Formalize roles via existing `user_roles` + `app_role` (no role on profile table)
- Owner = unrestricted (already enforced via `requireOwnerAuth`)
- Extend `crm_brokers` with: status (`active|suspended|revoked`), suspended_at, suspended_by, last_login_at, device fingerprint ref
- Owner actions: add / suspend / delete / restrict / revoke sessions

## Phase 2 — Broker Access & Invitation

Rebuild `GrantBrokerAccessDialog` into two-mode wizard:

- **Option A — Existing broker:** autocomplete from `crm_brokers` (currently broken — fix the load query + RLS)
- **Option B — New broker:** full intake form (name, email, phone, company, nationality, languages, role, brokerage, notes)

Invitation pipeline:
- Edge function generates secure invite token + temp password
- Branded auth email via Lovable Emails (`scaffold_auth_email_templates`)
- Force password reset on first login (`/reset-password` page)
- Optional 2FA (TOTP) toggle
- Log every login to `crm_login_events`

## Phase 3 — Asymmetric Visibility (CRITICAL)

This is the core data-model change.

- New table `crm_broker_visibility_rules` per (broker_id, database_id) with:
  - `direction = 'owner_to_broker'` (broker→owner is always full)
  - `date_window` (today / yesterday / 7d / 30d / custom range / from-date)
  - `lead_ids[]`, `status_filter[]`, `field_mask[]` (notes, files, activities, status…)
- RLS on `crm_leads` for brokers reads via a `SECURITY DEFINER` function `broker_can_see_lead(broker_id, lead_id, field)` that consults visibility rules
- Broker writes → owner sees everything immediately (existing realtime sync already handles this)
- Owner writes → invisible to broker until a rule includes them

## Phase 4 — Multi-Database Hierarchy

- Reuse `crm_database_grants` (already has broker_id + database_id)
- Add UI: per-broker tree view (Broker → Databases → Leads)
- Owner actions: move / copy-permission / assign-to-multiple / archive / disable / merge / track source

## Phase 5 — Commission Splits + Agreements

- New `crm_commission_splits` (deal_id, broker_id, percentage)
- Validation trigger: sum ≤ 100
- Auto-generate PDF agreement on JBJ letterhead (reuse `jbjListingAuthorisation.ts` + `letterheadChrome.ts`)
- E-signature acknowledgment stored in `user_agreements` (existing standard)

## Phase 6 — Security Hardening

- `crm_login_events` (ip, user_agent, device_hash, geo, success)
- `crm_active_sessions` with owner-revoke RPC
- Failed-login alerts → owner notification + email
- 2FA via Supabase TOTP
- File access: storage RLS keyed to `crm_database_grants` (PDFs, PAA, contracts stay owner-locked by default)
- Emergency "revoke all" button per broker

## Phase 7 — CRM Feature Parity Upgrade

Additive only (no UI removal — per "No Removal" policy):

- Workflow automation builder (triggers → actions)
- Smart reminders / cadences
- AI lead summaries + duplicate detection (reuse Lovable AI Gateway `google/gemini-2.5-flash`)
- Pipeline analytics, broker leaderboard, database health
- Lead scoring (0–100) + auto-assignment rules

## Phase 8 — UI/UX Fixes (champagne-gold only)

Site-wide sweep enforcing existing standards (`Champagne-Gold Design Standard`, `No Gold Fills`, `White-on-Light Guard`):

- Replace every `focus:ring-blue`, `border-blue`, `bg-blue` in CRM with cream `#EFE6D6` + ink + 1px gold hairline
- Fix `shadcn` Calendar / DatePicker → custom champagne theme, click-to-type, expiration date support
- Fix dropdown active/hover states across all CRM forms
- Add CI script extension to `scripts/contrast/` to ban `blue-*` classes in `src/pages/owner/crm/**`

## Phase 9 — Database Import Engine

Audit & fix `UploadDatabaseDialog`:
- Preserve ALL original columns (no silent drops)
- Auto-detect column types
- Confirmation dialog before any rename
- Store upload source / date / owner (already present — verify)
- Fix loading spinner stuck state

## Phase 10 — QA & Acceptance

For each phase, two-browser walkthrough (owner + broker), screenshots, and a checklist sign-off before moving on.

---

## Technical Details

**New tables:** `crm_broker_visibility_rules`, `crm_login_events`, `crm_active_sessions`, `crm_commission_splits`, `crm_broker_invitations`

**Extended tables:** `crm_brokers` (+ status, suspended_at, last_login_at, tfa_enabled)

**New edge functions:** `crm-broker-invite`, `crm-broker-revoke-session`, `crm-broker-suspend`, `crm-visibility-evaluate`

**New RPC:** `broker_can_see_lead(uuid, uuid, text) returns boolean` (SECURITY DEFINER)

**Reused:** `requireOwnerAuth`, `useCRMLiveSync`, `crm_audit_logs`, `user_roles`, `has_role`, `user_agreements`, Lovable Emails, Lovable AI Gateway

**Removed/duplicated:** nothing — per the "No Removal" + "Unified Relational CRM Standard" memories, everything merges into the canonical `crm_*` tables.

---

## Recommendations Before Starting

1. **Phase 0 audit is mandatory** — without it I risk duplicating tables. ~1 hour of read-only exploration.
2. **Phase 3 (asymmetric visibility) is the riskiest** — it rewrites broker RLS. I recommend doing it on a feature flag with a fallback to current behavior for 1 week.
3. **Phases 1, 2, 8, 9 are quick wins** — can ship within the first iteration and unblock current UX pain (broker dropdown, blue states, upload spinner, datepicker).
4. **Phases 5, 6, 7 are large** — each is its own multi-day effort. Confirm priority order.

## Question Before I Start

Do you want me to:
- **(A)** Run Phase 0 audit now and post results before any code, or
- **(B)** Start with the quick wins (Phases 8 + 9 + the broker dropdown bug in Phase 2) in parallel with the audit?

Reply A or B (or reorder phases) and I'll begin.
