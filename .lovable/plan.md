## Goal

Make the CRM feel like one premium hub. Collapse the sidebar to a single "CRM" entry. Restructure the in-page navigation into two stacked subheaders: a top entity-bar (Leads, Investors, Developers, Dev Sales Reps, Brokers, Brokerage Agencies, Employees) and a contextual sub-bar that changes per entity (e.g. Leads → Overview / All / Flagged / VIP / Mgmt). Move the gold "Insights" KPI strip into a collapsible drawer pinned to the top-right of the JBJ CRM title row. Wire each entity to its real data source so brokers (~10k+ agencies, 33k staged broker individuals), developers (633), and developer registry (775) actually show. Convert "Investors" from a leads-list into a real investor profile view (portfolio, units owned, VIP, birthday). Remove owner's own email and any test rows. Harden access-verification and clean up filter dropdowns.

## Sidebar (collapse to one entry)

In `src/components/owner-dashboard/OwnerSidebarNav.tsx`:
- Delete the entire `CRM` group (All Leads, Investors, Developers, Dev Sales Reps, Brokers, Brokerage Agencies, Employees, Campaigns, Tasks, Calendar, Notes, Inbox, Contracts, Automation).
- Keep only one item under CORE: `CRM` → `/owner/crm` (no children, no sub-paths, no query strings).
- All navigation between leads / investors / brokers etc. happens inside the CRM page.

## In-page navigation (two stacked subheaders)

Rewrite the header of `src/pages/owner/crm/UnifiedCRM.tsx` into three stacked rows inside one champagne-bordered shell:

```text
┌───────────────────────────────────────────────────────────┐
│ JBJ CRM                                  [ ▾ Insights ]   │  Title row
├───────────────────────────────────────────────────────────┤
│ Leads | Investors | Developers | Sales Reps | Brokers |   │  Entity bar
│ Brokerage Agencies | Employees                            │
├───────────────────────────────────────────────────────────┤
│ Overview · All Leads · Flagged · VIP · Lead Mgmt          │  Context bar
└───────────────────────────────────────────────────────────┘
```

URL state: `?entity=<leads|investors|developers|sales-reps|brokers|agencies|employees>&view=<contextual>`. Legacy `?section=` and `?sub=` redirect to this new model on mount.

Per-entity context bar:
- Leads → Overview, All, Flagged, VIP, Lead Mgmt, Tasks, Calendar, Notes, Inbox, Notifications, Contracts, Campaigns, Automation
- Investors → Directory, VIP, Portfolio Analytics
- Developers → Registry, Project Submissions, Sales Reps
- Sales Reps → Directory, Performance
- Brokers → Directory, Imported (staging), Verifications
- Brokerage Agencies → Directory, Deals, Events
- Employees → Roster, Roles, Activity

## Insights drawer (collapsed by default)

The current gold KPI strip (WhatsApp / total / conversion etc.) currently sits above the tabs. Move it into a popover anchored to a `▾ Insights` button on the title row (top-right of "JBJ CRM"). Closed by default. Opening it slides a panel down above the entity bar without pushing content outside the boxed shell. Persist last open/closed state in `localStorage`.

## Data wiring (fix the zero counts)

Update the relationship panels to read from the actual populated tables:

- Brokerage Agencies: `crm_brokerages` (10,613 rows). Already correct in `useCRMRelationships.ts`; verify the panel renders pagination so all rows are reachable (current 1000-row Supabase cap → add range pagination).
- Brokers: switch `BrokersRegistry.tsx` to read from `crm_broker_import_staging` (33,873 rows) as the primary source, with `crm_brokers` and `jbj_brokers` merged on top. Show staging rows as "Imported" sub-tab, curated rows as "Directory".
- Developers: keep `crm_developer_registry` (775) plus `developers` (633) merged by name, deduped. Already partially done in `useCRMRelationships.ts`; confirm the result hits the UI.
- Dev Sales Reps: read from `developer_sales_reps` + `developer_representatives` + `developer_sales_contacts` (currently empty `developer_sales_reps` is why count is 0; merge the three).
- Investors: stop showing `crm_leads` here. Read from `client_investors` + `investor_intake` + `investor_documents` + `investor_analytics` joined to `crm_leads` only when a lead has been explicitly converted (lead.converted_to_investor flag or presence in `client_investors`).

Add a server-side count query so the entity tabs can show real totals (e.g. "Brokerage Agencies · 10,613") instead of just the loaded page size.

## Investor profile view

When the user clicks an investor row, open a profile drawer showing:
- Header: name, VIP badge, lifetime portfolio value (sum of `client_investors.investment_amount` or equivalent).
- Sections: Portfolio (units owned, project, purchase date, value), Activity (calls, meetings, notes), Personal (birthday, anniversary, preferred channel), Documents, Linked deals.
- Source: `client_investors`, `investor_documents`, `investor_analytics`, `investor_behavior_insights`, plus `crm_activities` filtered by the linked lead/contact id.
- "Convert lead → investor" action on a lead row inserts into `client_investors` and tags the lead so it stops appearing under Leads/Investors duplication.

## Data hygiene

Run a one-time data cleanup migration:
- Soft-delete any `crm_leads` row whose `email` matches the owner's auth email.
- Soft-delete rows where `email ILIKE '%@example.com'` or `name ILIKE 'jane%' OR 'test%' OR 'demo%'` (already partially done — re-run to be safe).
- The owner's own email must never render in any CRM list. Add a UI filter in the leads/investors fetch hooks: `eq("is_self", false)` or filter `email !== currentUser.email` client-side as a belt-and-braces guard.

## Stability fixes

1. Verifying-access blink: in `OwnerGuard` / `AuthContext`, only show the "Verifying access…" splash when `loading === true && user === null`. Memoize the owner check so re-renders triggered by query refetches don't flip the splash back on. Add a 250 ms grace period before showing the splash to avoid flashes on fast loads.
2. Pending-tasks popup: confirm the 24h per-user dismissal added previously is honored on `/owner/crm` (already suppressed via `SUPPRESS_PATTERNS`); add `/owner` and any nested CRM query-string routes to the suppression list.
3. Filter dropdowns: in `CRMLeadsTableV2.tsx` and `FlaggedLeadsView.tsx`, replace raw `<select>` with the shadcn `<Select>` component using champagne tokens (`bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]`) and remove the blue focus ring (`focus:ring-[#B89555]/40`). Apply to status, source, owner, and date filters.
4. Network error on brokerages (`Failed to fetch` from `useCRMRelationships`): add retry with exponential backoff and a visible empty-state error card so the panel never renders blank.

## Routing

In `src/routes/OwnerRoutes.tsx`:
- `/owner/crm` → `UnifiedCRM` (only entry).
- All `/owner/crm/*`, `/crm/*`, `/owner/crm?section=...` legacy URLs redirect to `/owner/crm?entity=...&view=...` mapping (compatibility shim) so existing links keep working.

## Verification pass

After implementation, navigate to `/owner/crm` in the preview and confirm:
- Sidebar shows a single "CRM" entry (no sub-items).
- Entity bar shows the 7 entities; clicking each switches the context bar.
- Insights button on title row opens/closes the KPI drawer; default is closed.
- Brokers tab shows ~33k rows (paginated). Brokerage Agencies shows ~10k. Developers shows ~775+633 merged. Sales Reps no longer shows 0.
- Investors tab shows real investors (not the 4 leads that were there before); owner's email is absent everywhere.
- No "Verifying access" blink on refresh; no pending-tasks popup on the CRM page.
- All filter dropdowns are champagne-styled, not raw blue.

## Out of scope

- No backend logic changes beyond the cleanup migration and additional read queries.
- No edits to design tokens — uses existing champagne palette.
- Does not delete any existing CRM features; restructures their entry points only.
