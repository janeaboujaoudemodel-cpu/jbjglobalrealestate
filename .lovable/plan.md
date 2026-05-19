
# Broker Access Stabilization Plan

Halts all new feature work (no Batch 4). Goal: take the existing Broker Access surfaces from "functionally wired" to "production-stable, unified, responsive, on-brand". Work is grouped into 7 stabilization passes; each pass is self-contained, verifiable, and reversible.

Scope is **frontend + minimal schema additions for unified broker sourcing and lifecycle state**. No new business modules.

---

## Pass 1 — Responsive Frame (CRM-wide)

Target surfaces: `BrokersRegistry`, `DatabasesHub`, `GrantBrokerAccessDialog`, `BrokerGrantsManagerDialog`, `UnifiedCRM`, `CRMLeadsTableV2`, all `*Hub` pages.

- Introduce a shared `<CRMToolbar>` primitive: flex-wrap, gap-2, overflow guard, collapses overflow buttons into a "More" menu below 768px and when AI sidebar is open (detect via existing sidebar context).
- Replace fixed-width action button rows ("Give Access", "Manage", "Insights", "Export") with `flex flex-wrap min-w-0` containers; long labels switch to icon-only at <1024px.
- All cards/tables wrapped with `min-w-0 overflow-hidden`; tables use `overflow-x-auto` only at the table boundary, never the page.
- Add container queries (`@container`) on Broker cards so they reflow inside the narrower viewport produced by the open AI sidebar.
- QA matrix: 1440 (MBP), 1280 (small laptop), 1024 (iPad landscape), 820 (iPad portrait), 414 (iPhone), 360 (Android). Both AI-sidebar open and closed. Zero horizontal page scroll.

## Pass 2 — Calendar / Expiration Picker Fix

- Replace the current expiration popover with a single shared `<DatePopover>` built on shadcn `Calendar` + `Popover` (per project standard) with `pointer-events-auto`, controlled `month` state, and `onMonthChange` so prev/next arrows advance correctly.
- Fix duplicate-month render: caused by uncontrolled `defaultMonth` + remount on width change. Lift `month` to parent, memoize.
- Lock panel width (`w-[300px]`) so it does not resize across breakpoints. One calendar instance per popover; old portal leaks removed.
- Champagne/gold tokens for selected/today/range; no blue.

## Pass 3 — Complete No-Blue Sweep

- Static lint: extend `scripts/contrast/` with a new `check-no-blue.mjs` that bans `blue-`, `sky-`, `indigo-`, `#3B82F6`, `#2563EB`, `ring-blue`, `focus:ring-blue`, native `accent-color: blue` across `src/components/crm/**`, `src/pages/owner/crm/**`, `src/pages/broker/**`. Wire into pre-commit + CI.
- Manual replacements in: dropdowns (`Select`, `Command`, `Popover`), focus rings (`focus-visible:ring-[#B89555]/40`), selected rows (`data-[state=selected]:bg-[#EFE6D6]`), checkbox/radio (`accent-[#1A1A1A]`), `:hover` highlights, native browser `::selection`.
- Override Radix data attributes globally in `index.css` under a `.crm-scope` class: `[data-highlighted], [data-state=checked], [data-state=on]` → champagne/ink only.

## Pass 4 — Unified Broker Ecosystem (architecture)

**Schema** (single migration, additive only):

- New view `vw_crm_brokers_unified` UNION-ing broker records from: `crm_brokers`, `crm_leads` (role=broker), `broker_subscriptions`, uploaded sources (`crm_broker_uploads`), AI Home Finder leads, chat support leads, website submissions, developer-portal brokers, referral brokers, manually created brokers. Each row carries `source`, `source_id`, `origin_label`, `relationship_tags[]`.
- New column `crm_brokers.source_tags text[]` + `crm_brokers.origin text` for canonical records.
- New table `crm_broker_relationships (broker_id, related_broker_id, relation_type)` for hierarchy (manages / reports_to / referred_by / team_member).

**UI**:

- Rewrite `BrokerCombobox` → `UnifiedBrokerPicker`: searches the unified view, shows `source` chip per row, supports multi-source filter pills (CRM / Upload / AI Finder / Chat / Website / Developer / Referral / Agency / Manual), free-text fallback preserved.
- Add origin badge on broker rows in `BrokersRegistry`.

## Pass 5 — Brokerage / Company Structure Cleanup

**Schema** (additive):

- `crm_brokerages` add: `parent_company_id uuid`, `branch text`, `department text`, `team text`, `referring_company_id uuid`. Deprecate generic `current_company` text (kept as fallback, no removal — per No-Removal policy).
- Seed/import UAE brokerage list into `crm_brokerages` (one-time idempotent migration using existing uploaded data; no duplicates via `lower(company_name)` unique index, partial).

**UI**:

- `BrokerageCombobox` → typeahead with partial-match (`ilike '%term%'`), suggests existing on every keystroke, blocks duplicate create when fuzzy match ≥0.85.
- Replace dual Company + Brokerage fields in broker forms with a single grouped section: **Brokerage** (primary) → optional Parent Company, Branch, Department, Team, Referring Company.

## Pass 6 — Phone & Language Inputs

- New `<PhoneInput>` shared component: country selector with flags, searchable list (libphonenumber-js already viable; verify or add `react-phone-number-input`), auto E.164 formatting, nationality auto-suggest hook.
- New `<LanguageMultiSelect>`: searchable, multi-tag, predefined ISO-639 list, free custom entry fallback.
- Apply to: broker create/edit forms, lead capture forms, brokerage agent editor.

## Pass 7 — Access, Lifecycle, Revoke, Sessions, Lead↔Broker

**Roles & permissions**:

- Extend `crm_database_grants.role` enum with: `external_partner`, `internal_jbj`, `referring_broker`, `referral_view_only`, `agency_manager`, `team_leader`, `temporary_access`, `developer_partner`.
- Extend permission_level capabilities matrix (config-only, no schema change): `view_only`, `edit_only`, `full_access`, `lead_assignment_only`, `database_upload_only`, `invite_brokers_only`, `reporting_only`. Each renders a tooltip listing: *can see / can edit / hidden*.

**Unified lifecycle state**:

- Single computed column / view field `broker_lifecycle_state`: `active | pending | suspended | revoked | blocked | expired`. Derived in `vw_crm_broker_overview` (replace current dual invite/access badges).
- Single `<BrokerStatusBadge state={...}>` component with JBJ palette — replaces every black/blue badge.

**Revoke flow** (one unified action):

- `crm-broker-revoke-all` edge function: revokes all grants, invalidates invitation tokens, kills sessions, sets `lifecycle_state=revoked`, emits one audit row.
- Reason field optional (textarea, not required). Single confirm dialog. UI immediately reflects `revoked` state across registry, sheet, lead views.

**Sessions verification**:

- Confirm `crm_broker_sessions` heartbeat is firing for real brokers; add visible columns in sessions panel: device, browser, IP, city/country (via existing geo helper if present, else IP only), last_seen, suspicious flag.
- Add "Force logout" per-session and "Force logout all" — already partly wired; verify end-to-end with QA broker post-cleanup.

**Broker isolation guarantee**:

- Add Playwright/manual checklist: a broker session sees only their assigned databases, assigned leads, explicitly shared records. Nothing else. Verified via `vw_crm_database_access` + `vw_crm_broker_leads` RLS.

**Lead ↔ broker**:

- Add `crm_lead_assignments (lead_id, broker_id, assignment_type, assigned_by, assigned_at)` (many-to-many, supports multi-broker, team ownership, referral tracking).
- UI: `BrokerAssignmentPicker` on lead detail (single or multi); on database row (default assignee); hierarchy resolver uses `crm_broker_relationships`.
- "Broker account with multiple databases under them" workflow: existing `BrokerGrantsManagerDialog` already supports multi-grant — surface a clearer "Add another database" CTA inside the drawer.

---

## Sequencing & Verification

Execute passes 1 → 7 in order. After each pass:

1. Visual QA at all 6 breakpoints, both sidebar states.
2. No-blue lint passes (after Pass 3 onward, blocking).
3. Pass/fail matrix posted in chat.
4. No QA-only data left in DB.

No new feature work, no Batch 4, until Pass 7 is signed off.

## Technical Section

- Files most affected (Pass 1–3): `BrokersRegistry.tsx`, `DatabasesHub.tsx`, `GrantBrokerAccessDialog.tsx`, `BrokerGrantsManagerDialog.tsx`, `BrokerCombobox.tsx`, `BrokerageCombobox.tsx`, new `src/components/ui/crm-toolbar.tsx`, `src/components/ui/date-popover.tsx`, `src/components/ui/phone-input.tsx`, `src/components/ui/language-multi-select.tsx`, `src/components/crm/BrokerStatusBadge.tsx`, `src/index.css` (Radix data-attr overrides under `.crm-scope`).
- Migrations: 3 additive (unified view, brokerage structure columns + unique index, lead_assignments + broker_relationships + lifecycle field on view). All non-destructive.
- New edge function: `crm-broker-revoke-all` (idempotent, audit-logged).
- CI: `scripts/contrast/check-no-blue.mjs` added to `.husky/pre-commit` and a new workflow.

## Out of scope (explicit)

- No new analytics, no new reports, no new AI features.
- No removal of existing fields or modules (No-Removal policy).
- No Batch 4 items (rate-limit, auto-expire scheduler, email render diff CI, login event audit) — remain in backlog, untouched.
