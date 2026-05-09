## Goal

Replace the current scattered CRM (10+ separate routes: `/owner/crm`, `/crm/leads`, `/crm/employees`, `/crm/relationships`, `/crm/network`, `/crm/brokers`, `/crm/campaigns`, `/crm/tasks`, `/crm/calendar`, `/crm/notes`, `/crm/reminders`, `/admin/crm`) with **one unified Premium CRM** at `/owner/crm`, owner-only, with an in-page subheader that swaps sections without route changes.

## Single-page layout (`/owner/crm`)

```
┌─ Top bar ─────────────────────────────────────────────────┐
│ JBJ CRM · search · Reset · global add                     │
├─ Subheader (primary tabs) ────────────────────────────────┤
│ All Leads │ Flagged │ VIP │ Lead Mgmt │ Relationships │   │
│ Employees │ Campaigns │ Tasks │ Calendar │ Insights      │
├─ Secondary bar (only on Relationships) ───────────────────┤
│ Investors │ Developers │ Dev Sales Reps │ Brokers │       │
│ Brokerage Agencies                                        │
├─ Content area (no navigation, in-page swap) ──────────────┤
└───────────────────────────────────────────────────────────┘
```

All sections render inside the same shell as panels (no full page reloads). Existing components are reused — nothing is deleted, only re-mounted under the unified shell.

### Tab → component mapping (reuse existing code, no rewrites)

| Tab | Reuses |
|---|---|
| All Leads | `CRMLeadsTableV2` (default filter: none) |
| Flagged | `CRMLeadsTableV2` (filter: `is_flagged=true`) |
| VIP | `CRMLeadsTableV2` (filter: tag `VIP`) |
| Lead Management | `CRMEnhancedDashboard` + bulk tools |
| Relationships → Investors | `CRMLeadsTableV2` (filter: category=investor) |
| Relationships → Developers | `CRMNetwork` developers grid + `CompanyHub` drawer |
| Relationships → Dev Sales Reps | new view from `crm_developer_registry` contacts (already present) |
| Relationships → Brokers | `BrokersRegistry` |
| Relationships → Brokerage Agencies | `CRMNetwork` brokerages grid + `CompanyHub` drawer |
| Employees | `EmployeesHub` (DOB, leave, warnings, scoring, deals — already exists) |
| Campaigns | `CampaignComposer` |
| Tasks | `CRMTasks` content |
| Calendar | `CRMCalendar` content |
| Insights | existing analytics widgets |

### Cross-table mirroring (the user's "show same data in CRM table")

Add a unified read-only DB view `vw_crm_unified_contacts` that UNIONs:
- `crm_leads` (investors / general)
- `crm_brokerages` (as contact rows, type=brokerage)
- `crm_developer_registry` (as contact rows, type=developer)
- developer/brokerage sales reps (their `contacts` JSON columns)

The All Leads / Investors / Brokers / Developers tabs all read from this view filtered by `entity_type`, so the same contacts appear in both Relationships and the unified CRM table without duplicating storage. RLS: owner-only via existing `requireOwnerAuth` and `has_role(...,'owner')` policies.

## Fake / dummy data purge

Run one migration that deletes obvious seed/test rows from `crm_leads`, `crm_brokerages`, `crm_developer_registry` where:
- `email ILIKE '%example.com'` or `'%test%'` or `'%demo%'`
- `full_name ILIKE 'test %' or 'demo %' or 'lorem %'`
- `source = 'seed'` (if present)

Real rows visible in the screenshot (Brandlio Ai, Ubaid, minishrivastavaa17, Salim Akil, Jane Abou Jaoude, etc.) are preserved. A pre-flight `SELECT` is shown to the user for confirmation before the DELETE migration runs.

## Security

- Wrap unified `/owner/crm` shell in `<OwnerGuard>` (already used elsewhere) + `requireOwnerAuth` on every edge call.
- Add `owner_only` RLS check on `vw_crm_unified_contacts` via `security_invoker=on` + `has_role(auth.uid(),'owner')`.
- All other CRM routes (`/crm`, `/crm/*`, `/admin/crm`) become `<Navigate to="/owner/crm" replace />` so there is exactly one entrance.
- No PII exposed publicly (per existing privacy memory).

## Files touched (no deletions of features)

- **New**: `src/pages/owner/crm/UnifiedCRM.tsx` (shell + tab state)
- **New**: `src/components/crm/unified/SubHeader.tsx`, `RelationshipsSubBar.tsx`
- **Edit**: `src/routes/OwnerRoutes.tsx` — collapse all `crm/*` child routes to redirects to `/owner/crm?tab=...`
- **Edit**: `src/routes/AdminRoutes.tsx` — keep existing redirects
- **Migration**: create `vw_crm_unified_contacts` view + RLS, plus targeted DELETE of dummy rows (preview first)
- Sidebar `CRM` link already points to `/owner/crm` — no change needed

## Out of scope (kept as-is)

- All existing CRM logic, merge, filters, bulk bar, locked-send, single-agency rule, audit logs.
- Campaigns / Resend / quota system.
- Existing Company Hub drill-down at `/owner/crm/company/:type/:name` (still reachable via drawer link).

## Rollout

1. DB migration (view + cleanup) — preview SELECT first, user confirms.
2. Build `UnifiedCRM.tsx` shell with tabs wired to existing components.
3. Flip `OwnerRoutes` redirects.
4. Verify each tab renders, no data loss, owner-only access.
