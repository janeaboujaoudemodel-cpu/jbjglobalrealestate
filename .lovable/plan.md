# JBJ CRM — Broker Access, Permissions & CRM Upgrade

A pragmatic, audit-first plan covering the 10 phases in the brief. No duplication, no deletion, no blue accents. All work merges into the existing `crm_*` / `crm_brokers` ecosystem already in place (138 related tables found in audit — most of what you need already exists; the gaps are wiring, UX, and permission semantics).

---

## Audit Snapshot (what already exists, what is missing)

Already in DB / code (must be REUSED, not recreated):

- Brokers: `crm_brokers`, `broker_profiles`, `crm_brokerages`, `crm_brokerage_agents`, `jbj_brokers` (legacy)
- Access / invites: `broker_access_requests`, `crm_database_grants`, `vw_crm_database_access`, `crm_broker_sessions`, `crm_broker_blocked_devices`
- Leads & visibility: `crm_leads`, `crm_lead_shares`, `crm_lead_assignments`, `crm_lead_access_logs`, `crm_field_permissions`, `crm_lead_state_per_user`
- Commission: `crm_broker_commission_agreements`, `crm_broker_commission_signatures`, `commission_rates`, `referral_commissions`
- Security: `crm_audit_logs`, `crm_security_events`, `crm_action_logs`, `user_sessions`
- Import: `crm_imports`, `crm_import_batches`, `crm_broker_import_staging`, `crm_source_databases`, `crm_source_database_rows`
- Unified Broker Picker + `vw_crm_broker_overview` (per memory)
- Edge fns: `account-lifecycle`, broker invite/grant pipeline already partially scaffolded

Confirmed gaps (this plan fills them):

1. "Give Broker Access" dialog doesn't load existing brokers, no real invite send, no OTP/first-login reset.
2. Owner→Broker propagation is automatic — needs an explicit **manual publish/visibility gate**.
3. No clean date-window / scope filter UI for grants ("today / 7d / from April / custom").
4. No grouped multi-database hierarchy per broker (Jessica → DB A/B/C/D) with move/duplicate/archive.
5. Commission split UI exists in DB but no agreement generator with letterhead + e-sign.
6. Session/device/2FA visible to owner but no one-click revoke + emergency kill switch.
7. Residual blue focus/hover/datepicker rings on shadcn defaults.
8. Database import preview drops/renames columns silently.

---

## Phased Plan

### Phase 1 — Owner Master Role (guardrail, not a new role)
- Confirm `has_role(uid,'owner')` short-circuits every RLS policy on `crm_*` tables. Add missing `OR has_role(auth.uid(),'owner')` clauses where absent.
- Add `OwnerOverrideBanner` shown only to owner inside broker-scoped views ("Viewing as Owner — full access").
- No new role table.

### Phase 2 — Broker Access & Invitation (fix "Give Broker Access")
- Rebuild `GiveBrokerAccessDialog` as a 3-step wizard backed by the existing Unified Broker Picker:
  1. **Pick broker** — searches `crm_brokers` + `vw_crm_broker_pre_invite_leads` (existing). "Create new" inline form writes to `crm_brokers` with `status='invited'`.
  2. **Scope** — databases, leads, modules, date window, expiry (writes to `crm_database_grants` + new `crm_grant_scope` JSONB column).
  3. **Send** — calls existing/extended edge fn `crm-broker-invite` which: generates signed invite token, temp password, sends branded email via Lovable Emails (transactional template `broker-invite`), logs to `crm_audit_logs`.
- First-login flow on `/broker/activate`: force password reset, optional TOTP enroll (`broker_2fa_secrets` new table), then land in `BrokerDashboard`.

### Phase 3 — Visibility Gate (the critical change)
- New column `crm_lead_shares.publish_mode` = `'auto' | 'manual'`. Default for owner→broker shares becomes `'manual'`.
- New table `crm_lead_publish_queue (share_id, lead_id, field_diff jsonb, created_at, published_at)` — every owner edit on a shared lead writes a pending diff instead of being visible.
- Owner UI: `LeadPublishQueue` panel with bulk "Publish to broker" + filters: Today / Yesterday / 7d / 30d / Custom range / From {date} / Selected leads / Selected statuses / Selected DBs / Entire DB.
- Broker→Owner stays fully transparent (already the case — just confirm no filter strips broker edits from owner views).
- Add explicit grant fields: `visible_notes`, `visible_files`, `visible_statuses`, `visible_activities` (boolean flags on `crm_database_grants`).

### Phase 4 — Multi-Database Hierarchy per Broker
- Reuse `crm_database_grants` + `crm_source_databases`. Add `crm_broker_database_groups` view grouping grants by broker.
- New `BrokerDatabasesTree` UI under each broker profile: list of attached DBs with actions Move / Duplicate-permission-only / Archive / Disable / Merge / Reassign. All actions write audit rows; "duplicate" only copies the grant, never the source DB.

### Phase 5 — Commission Splits & Agreements
- Extend `crm_broker_commission_agreements`: `splits jsonb` (array of {broker_id,pct}), `template_id`, `pdf_url`, `signed_at`.
- New edge fn `generate-commission-agreement` → renders JBJ letterhead PDF (reuse existing `institutional-pdf-reporting-standard` jsPDF pipeline) → uploads to storage → creates row in `crm_broker_commission_signatures` with signature token → broker signs in-app (canvas) → PDF re-stamped + locked.

### Phase 6 — Security & Cybersecurity
- Owner `SecurityCenter` page aggregating existing `crm_broker_sessions`, `crm_broker_blocked_devices`, `crm_security_events`, `user_sessions`. Actions: Revoke session, Block device, Suspend broker, **Emergency Revoke All** (rotates broker JWT version → forces global logout via existing `requireOwnerAuth` middleware).
- Login alerts: edge fn `broker-login-notify` on `auth.sign_in` webhook → email + audit row + impossible-travel check (reuse `authentication-hardening-and-anomaly-detection` memory).
- 2FA optional via `broker_2fa_secrets` (TOTP) — required for accessing exports.
- File security: storage RLS already owner-locked; add `crm_file_grants` for explicit per-broker file unlocks.

### Phase 7 — CRM Feature Gap (no UI break)
Add only what's missing vs. Salesforce/Zoho/HubSpot:
- Automation rules UI on top of existing `crm_automation_rules`.
- Smart reminders (cron edge fn `crm-reminder-tick`).
- Lead scoring column + `ai-lead-qualification` wired into list view.
- Duplicate detection (md5 already in `advanced-kanban-and-ai-intelligence`).
- Auto-assignment using `broker_assignment_rules`.
- Analytics tab reusing `vw_crm_broker_stats` + `broker_daily_stats`.

### Phase 8 — UI/UX Pass (kill all blue)
- Global override in `src/index.css`: redefine `--ring`, `--accent`, `--primary` focus/hover for inputs, selects, datepickers, command menus, calendar day cells → champagne `#EFE6D6` bg + ink text + 1px gold hairline (matches Champagne-Gold memory & No-Gold-Fills rule).
- Patch shadcn primitives: `calendar.tsx`, `select.tsx`, `command.tsx`, `popover.tsx`, `input.tsx`, `button.tsx` variant `outline`.
- Datepicker UX: clickable input + typeable + popover calendar + expiration helper ("In 7d / 30d / 90d / Custom").

### Phase 9 — Database Import Engine
- Rewrite `DatabaseImportWizard`:
  - Step 1: Drop file → parse via `papaparse`/`xlsx` (already vendored).
  - Step 2: **Preserve every column verbatim** — show detected schema, allow optional mapping but never auto-rename. Renames require explicit confirm.
  - Step 3: Write raw rows to `crm_source_database_rows` (JSONB `raw`) + normalized fields where mapped. Store `source_file`, `uploaded_by`, `uploaded_at`, `row_count`, checksum.
  - Step 4: Background enrichment job (`ai-bulk-enrich`) marks rows ready; broker visibility still gated by Phase 3.

### Phase 10 — QA Matrix
Manual + scripted checklist run end-to-end before sign-off:
- Invite new broker → email received → activate → reset password → enroll 2FA → login.
- Owner edits lead → broker does NOT see until Publish.
- Broker edits lead → owner sees instantly.
- Date-window filter (From April → today) publishes correct subset.
- Move DB between brokers, duplicate grant, archive, merge.
- Commission agreement: generate → sign → PDF locked.
- Revoke session → broker logged out within 30s.
- Import 5 sample sheets (CSV/XLSX, messy headers) → all columns preserved.
- Zero blue pixels (visual regression on Login, CRM list, Lead detail, Calendar, Date picker, Select dropdown).

---

## Technical Details (engineering reference)

New DB objects (single migration, additive only):

```text
ALTER TABLE crm_lead_shares ADD COLUMN publish_mode text DEFAULT 'manual';
ALTER TABLE crm_database_grants ADD COLUMN scope jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN visible_notes bool DEFAULT false,
  ADD COLUMN visible_files bool DEFAULT false,
  ADD COLUMN visible_statuses text[] DEFAULT '{}',
  ADD COLUMN visible_activities bool DEFAULT false,
  ADD COLUMN date_window jsonb,  -- {mode:'range'|'preset', from, to, preset}
  ADD COLUMN expires_at timestamptz;
CREATE TABLE crm_lead_publish_queue (...);
CREATE TABLE broker_2fa_secrets (broker_id uuid pk, secret text, enabled bool, ...);
CREATE TABLE crm_file_grants (file_id, broker_id, granted_by, expires_at);
ALTER TABLE crm_broker_commission_agreements ADD COLUMN splits jsonb, pdf_url text, signed_at timestamptz;
```

New / extended edge fns:
- `crm-broker-invite` (extend), `broker-login-notify`, `generate-commission-agreement`, `crm-reminder-tick`, `crm-publish-diffs`.

New / refactored frontend:
- `GiveBrokerAccessDialog` (rewrite, wizard)
- `LeadPublishQueue`, `BrokerDatabasesTree`, `SecurityCenter`, `CommissionAgreementBuilder`, `DatabaseImportWizard`
- Global `index.css` champagne ring/hover overrides + 6 shadcn primitive patches.

Order of execution:
1. Audit-only PR confirming reuse map (no code changes) — 0.5d
2. Migration + RLS additions (Phase 1+3+4+5+6) — 1d
3. Edge fn pipeline + emails — 1d
4. Frontend wizards & panels — 2-3d
5. UI champagne sweep + datepicker — 0.5d
6. Import engine rewrite — 1d
7. QA matrix run-through — 0.5d

Risk callouts (need your decision before I start):
- **R1:** Switching default `publish_mode` to `'manual'` will instantly hide previously-auto-shared owner edits from brokers until you publish. Confirm.
- **R2:** Enforcing TOTP for exports may lock out current brokers without phones. Confirm "optional but required for exports" is OK.
- **R3:** Champagne ring override touches shadcn primitives globally — will affect non-CRM pages too (intended per memory).

---

Approve to proceed, or tell me which phases to drop/reorder.
