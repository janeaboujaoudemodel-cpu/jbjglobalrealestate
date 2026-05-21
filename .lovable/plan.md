# Plan — Finish Remaining Broker/CRM Tasks

Audit confirms Phases 1–4 and 6 are already largely in place:
- `crm_brokers`, `crm_database_grants` (with `visibility_direction`, `date_window_mode`, `lead_ids`, `status_filter`, `suspended_at`, `revoked_at`), `crm_broker_sessions`, `crm_broker_blocked_devices`, `crm_audit_logs`.
- Edge functions: `crm-broker-invite`, `crm-broker-invite-status`, `crm-broker-activate`, `crm-broker-verify-otp`, `crm-broker-grant-manage`, `crm-broker-session-track`, `crm-grant-broker-access`.
- Owner-side UI: `GrantBrokerAccessDialog`, `BrokerGrantsManagerDialog` (sessions, devices, suspicious-first sort, recent activity), `UnifiedBrokerPicker`.
- Cron auto-expire of stale invites; impossible-travel + new-device detection.

What is genuinely missing maps to Phases 5, 7-partial, 8, 9, 10.

---

## Pass 8 — Commission Split & Agreement System (Phase 5)

New tables:
- `crm_broker_commission_agreements` — id, owner_id, broker_user_id, deal_ref (nullable text/uuid), splits jsonb (array of `{party, role, percent}`), agreement_html, agreement_pdf_path, status (`draft|sent|signed|void`), sent_at, signed_at, signature_payload jsonb, ip, user_agent, created_at.
- `crm_broker_commission_signatures` — append-only signature events linked to agreement (party, name, email, signed_at, ip, ua, hash).
RLS: owner full; broker read/sign only own agreement rows.

Edge functions:
- `crm-broker-commission-create` (owner): validates split totals = 100, renders JBJ-letterhead HTML via existing brand templates, stores draft, optionally emails broker via existing `sendViaResend`.
- `crm-broker-commission-sign` (broker, JWT): records signature, locks agreement, writes `crm_audit_logs` + `crm_broker_commission_signatures`.

UI:
- `CommissionSplitDialog.tsx` (owner) — multi-row split editor with live % total guard, presets 50/50, 70/30, 20/20/60.
- `BrokerAgreementSignPage.tsx` at `/broker/agreement/:id` — preview + click-to-sign with typed name + checkbox, calls sign function.
- Tab inside `BrokerGrantsManagerDialog` → "Agreements" listing per broker.

PDF: reuse existing `jsPDF` institutional letterhead utility (`institutional-pdf-reporting-standard`).

---

## Pass 9 — Broker Account Lifecycle (top-level) (gap in Phase 1/6)

Today suspend/revoke is per-grant or per-device. Add account-level state.

Migration:
- Add `account_status text default 'active'` + `account_status_reason text` + `account_status_changed_at` to `crm_brokers`.
- Trigger: when status flips to `suspended|deleted`, mark all `crm_database_grants.suspended_at = now()` and revoke all `crm_broker_sessions` for that broker.

Edge function `crm-broker-account-state` (owner) — set active/suspended/deleted with audit + session revoke.

UI: top-of-row "Suspend broker" / "Reactivate" / "Delete broker" in `BrokerGrantsManagerDialog` with confirm modal; status pill in `IndividualBrokersTab`.

---

## Pass 10 — CRM Feature Gap (Phase 7, broker-scoped)

Scope to what's missing for the broker access story (full CRM parity is out of scope of "continue missing tasks"):
- **Broker analytics tab** in grants dialog: leads viewed, leads edited, last activity, conversion %, derived from `crm_audit_logs` + `crm_leads.assigned_to`.
- **Smart reminder**: cron `crm_broker_inactivity_check()` emails owner if a broker has zero sessions for 14d and grants are still active — surfaces in existing `BrokerInactivityMonitor`.
- **Duplicate-lead detection during import**: re-use existing md5 fingerprint on `crm_leads` (Advanced Kanban memo) — wire warnings into `UploadDatabaseDialog`.

Skip (already shipped or not in user's "missing" set): AI summaries, kanban, automation rules, AI lead scoring — all already exist in `AILeadScoring.tsx`, `AutomationRules.tsx`, `CRMAINextActions.tsx`.

---

## Pass 11 — Champagne UI Sweep (Phase 8)

Script-driven audit, not a manual rewrite:
- Add `scripts/contrast/check-no-blue-states.mjs` — scans `src/**/*.{tsx,css}` for `blue-`, `ring-blue`, `focus:ring-blue`, `border-blue`, `bg-blue`, `data-[state=active]:bg-blue`, `accent-blue`, raw hex `#3b82f6|#2563eb|#1d4ed8|#60a5fa` etc.
- Replace hits with semantic tokens from the Champagne-Gold standard: `ring-[#B89555]/40`, `border-[#B89555]/30`, `bg-[#EFE6D6]`, `data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40`.
- Fix shadcn primitives once: `calendar.tsx`, `date-picker`, `popover`, `select`, `command`, `tabs`, `toggle`, `radio-group`, `checkbox`, `switch`, `input` focus rings.
- Add CI guard so blue cannot regress.

Datepicker UX: ensure `<Calendar />` selected day uses gold hairline + champagne fill, supports type-to-input via existing `Input` masked field in `GrantBrokerAccessDialog` expiration row.

---

## Pass 12 — Database Import Engine Hardening (Phase 9)

`crm-broker-bulk-import` + `UploadDatabaseDialog` fixes:
- Preserve every original column: write unmapped fields to `crm_leads.extra_fields jsonb` instead of dropping.
- Block any rename without explicit user confirmation in the column-map step (already partial, enforce).
- Stamp `upload_source`, `upload_filename`, `uploaded_by`, `uploaded_at` on every imported row + parent `crm_source_databases` row.
- Show import progress + per-row error list (currently silently truncated on large files).
- Dedup against md5 fingerprint, surface "X duplicates skipped" in result toast.

---

## Pass 13 — QA Matrix (Phase 10)

Deliver a backend-driven QA report (mailbox/Outlook screenshots remain user-side as established last turn):
- Script `scripts/qa/broker-lifecycle.mjs` runs against preview backend with service role:
  1. invite → assert row in `crm_broker_invitations` + `email_send_log` sent.
  2. simulate activate via direct RPC → assert auth user + session.
  3. session-track twice with different IPs within 10 min → assert `suspicious` flag.
  4. revoke session → assert `revoked_at`.
  5. block device → assert next session-track rejected.
  6. suspend broker account → assert all grants suspended + sessions revoked.
  7. commission agreement create → sign → assert status `signed` + audit row.
  8. import sample CSV → assert all columns preserved in `extra_fields`.
- Output a markdown report to `/mnt/documents/broker-qa-report.md` with pass/fail per step.

---

## Technical Details

### Files to add
- `supabase/migrations/<ts>_broker_commission_agreements.sql`
- `supabase/migrations/<ts>_broker_account_state.sql`
- `supabase/functions/crm-broker-commission-create/index.ts`
- `supabase/functions/crm-broker-commission-sign/index.ts`
- `supabase/functions/crm-broker-account-state/index.ts`
- `src/components/crm/CommissionSplitDialog.tsx`
- `src/pages/broker/BrokerAgreementSign.tsx` + route in `StandaloneRoutes.tsx`
- `scripts/contrast/check-no-blue-states.mjs`
- `scripts/qa/broker-lifecycle.mjs`

### Files to edit
- `src/components/crm/BrokerGrantsManagerDialog.tsx` (Agreements tab + Suspend/Delete + analytics strip)
- `src/components/crm/IndividualBrokersTab.tsx` (status pill)
- `src/components/crm/UploadDatabaseDialog.tsx` + `crm-broker-bulk-import` (preserve extras + dedup feedback)
- `src/components/ui/calendar.tsx`, `tabs.tsx`, `select.tsx`, `command.tsx`, `popover.tsx`, `input.tsx`, `radio-group.tsx`, `switch.tsx`, `checkbox.tsx` (focus/active → champagne+gold)

### Constraints honored
- No new tables that duplicate existing CRM (commission tables are net-new and not present).
- Owner controls remain unrestricted via existing `requireOwnerAuth` middleware.
- All new edge functions log to `crm_audit_logs`.
- All new UI uses Champagne-Gold tokens; no blue, no gold fills.
- "No Removal" — existing features (per-grant suspend, automation rules, AI scoring) untouched.

### Sequencing
Run passes in order 8 → 9 → 10 → 11 → 12 → 13. Each pass ends with a typecheck + targeted backend smoke test; Pass 13 produces the final QA report.
