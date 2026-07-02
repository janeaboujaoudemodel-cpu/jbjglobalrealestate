## Goal

Rebuild every CRM page inside `/owner/crm/jbj/*` to match Zoho CRM's actual layout pixel-for-pixel (JBJ palette only), and hard-lock the entire CRM to the owner account.

## Scope (from your screenshots)

1. **Workqueue** — two-pane layout: left "My Open Activity" (Today & Overdue dropdown → Tasks / Meetings / Calls with counts) + "My Workqueue" tree grouped by Campaigns / Contacts / Leads / Deals (each with count pills). Right pane = selected queue table (Subject / Due Date / Status / Priority) with Filter + refresh.
2. **Reports** — top-left folder dropdown (All Reports / My Reports / Favorites / Recently Viewed / Shared / Scheduled / Recently Deleted / folder list / Manage Folders / Advanced Analytics footer), right-side "Search All Reports" + "Create Report". Table = Report Name / Description / Folder / Last Accessed / Created By, star + checkbox per row.
3. **Analytics** — filter bar (All / Org Overview dropdown / All Users) + Add Component + Create Dashboard + overflow. Grid of draggable KPI tiles (Leads This Month, Revenue, Deals in Pipeline, Accounts) with delta %, then chart tiles (gauge target, horizontal bar, line, pie, ranked list). Real drag-to-reorder.
4. **Leads** — top bar: All Leads tab + overflow, then Filter / Sort / view-mode icons (list, kanban, sheet, timeline, canvas, **profile view active**) + Create Lead split button. Left rail = "Filter Leads by" with Search, System Defined Filters (Activities, Campaigns, Latest Email Status, Locked, Record Action, Related Records Action, Touched Records, Untouched Records, Cadences), Filter By Fields (address fields…), Filter By Related Modules (Accounts/Calls/Campaigns/Cases/Contacts/Deals/Emails/Invitees/Invoices/Lead Product Relation/Meetings/Notes/Products/Purchase Orders…) each with `with | without` toggle + Any/All, Apply Filter / Clear buttons. Right = profile-card rows (avatar, name + status pill, Title / Company / email / phone / Lead Source / Industry, owner + created timestamp).
5. **Owner-only lock** — `/owner/crm/jbj/*` accessible only when `user.email ∈ OWNER_EMAILS`; everyone else → AccessDenied.
6. Global CRM shell chrome (top search bar, +, magic, notifications, calendar, marketplace, settings, avatar, app-switcher) reused across every page.

## Approach

- **Shell reuse**: keep `PortalShell` sidebar; move the Zoho top toolbar into a shared `CrmTopBar` used by every page under `/owner/crm/jbj/*`.
- **Design tokens (JBJ, not Zoho red/blue)**:
  - Primary emerald `#064E3B` replaces Zoho red for active tab underline, "Create" buttons, folder dropdown check.
  - Blue action links (`Create Report`, `Apply Filter`) → emerald metallic pill.
  - Champagne `#F7F2EA` panel bg, ink `#1A1A1A` text, hairline `#EFE6D6`.
  - Status pills keep semantic colors (Lost = red, Contacted = emerald, Pre-Qualified = amber, etc.) but muted to JBJ palette.
- **New files** under `src/pages/owner/crm/shell/`:
  - `CrmTopBar.tsx` (shared)
  - Rewrite `CrmWorkqueue.tsx` to two-pane Zoho layout
  - Rewrite `CrmReports.tsx` with folder dropdown + full report table
  - Rewrite `CrmAnalytics.tsx` with react-grid-layout draggable dashboard (KPI + chart tiles)
  - Rewrite `CrmModuleList.tsx` (Leads/Contacts/Accounts/Deals) with left filter rail (system + fields + related modules with with/without toggle) and profile-card rows
- **CSS**: extend `crmShell.css` with `.crm-workqueue`, `.crm-reports`, `.crm-analytics`, `.crm-filter-rail`, `.crm-profile-card` blocks.
- **Owner lock**: wrap the CRM route group in existing `<OwnerGuard>` (email-gated) so no non-owner can reach any `/owner/crm/*` route; render `<AccessDenied>` otherwise.
- **Drag-and-drop analytics**: install `react-grid-layout` (small, MIT). Tiles have handle + resize; layout persisted to `localStorage` keyed by dashboard id (no backend needed).

## Improvements over Zoho (opt-in)

- Emerald 3D metallic accents on active states + focus rings (matches JBJ system).
- KPI tiles show sparkline under the delta (Zoho only shows number + %).
- Filter rail: sticky "Apply / Clear" footer + count of active filters chip near "Filter Leads by".
- Reports table: inline star toggle animates; folder dropdown supports keyboard nav.

I'll flag each improvement in-code with `// JBJ+` so you can revert to strict Zoho parity if you prefer.

## Out of scope this pass

- Real Zoho data sync (still local fixtures; hooking to Zoho connector is a separate phase).
- Contacts/Accounts/Deals get the same shell in this pass but only Leads gets the full related-module filter catalog; the others reuse the framework with their own field lists next pass.

## Technical notes

- Route guard: add `<OwnerGuard fallback={<AccessDenied/>}>` around the CRM `<Route path="jbj/*">` block in `OwnerRoutes.tsx`.
- `react-grid-layout` CSS imported once in `crmShell.css`.
- All new components use existing `IconTile`, `SectionTitle`, `.jj-pill-emerald-metallic`.
- No changes to backend / RLS.

Confirm and I'll build Workqueue + Reports + Analytics + Leads filter rail + owner lock in this pass.
