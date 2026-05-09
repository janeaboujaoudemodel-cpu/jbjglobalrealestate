I will fix the CRM as a full owner command workspace, not a nested page inside the old broken CRM.

## What will be rebuilt

1. **Make the sidebar CRM entry open the real unified hub**
   - Keep `/owner/crm` as the single CRM route.
   - Fix legacy links so Calendar, Tasks, Campaigns, Relationships, Brokers, Notes, Inbox, Notifications, and Contracts open inside `/owner/crm` instead of 404 or old `/crm` pages.
   - Update sidebar/quick-action links that still point to `/crm/...` or old standalone pages.

2. **Replace the broken nested CRM layout**
   - Stop rendering the old full `CRM.tsx` page inside the unified hub, because it brings its own sticky header, gradients, dashboard, tabs, overlays, and duplicated navigation.
   - Create a clean CRM shell with:
     - top CRM command header,
     - compact KPI strip using real counts only,
     - primary tabs: Overview, Leads, Relationships, Developers, Dev Sales Reps, Brokers, Brokerage Agencies, Employees, Campaigns, Tasks, Calendar, Notes, Inbox, Notifications, Contracts, Automation.
   - Use contained panels with proper spacing, no overlapping sticky headers, and no cards inside cards.

3. **Fix the leads table visual problems**
   - Remove blue hover/text styling from email/status interactions.
   - Replace raw browser `<select>` dropdowns with controlled champagne popovers/selects so dropdowns don’t look ugly or overlay incorrectly.
   - Make status dropdowns compact and scrollable; no huge “all stages/percent” looking display.
   - Keep all actions: WhatsApp, call, email, send agreement, assign, delete, VIP, bulk merge.

4. **Clean dummy/self-test data safely**
   - Remove the visible Jane/self-test records and dummy/example/sample rows from `crm_leads`.
   - Rename/display `self_registration` as a professional label: **Account Registration** or **Portal Registration** in the UI.
   - Do not remove real leads such as `Brandlio Ai / aibrandlio@gmail.com` unless it is clearly dummy by name/email/source.
   - Keep real names, emails, phone numbers, broker/developer/agency records intact.

5. **Relationships must be visible from the CRM header**
   - Add first-class relationship tabs directly in the CRM hub:
     - Investors
     - Developers
     - Dev Sales Reps
     - Brokers
     - Brokerage Agencies
   - Reuse real data from existing CRM relationship tables/components, but present it inside the same CRM frame.
   - Keep relationship views up, but also make those entities manageable from the CRM table-style sections.

6. **Integrate operational modules into CRM**
   - Calendar: render inside CRM, not 404, and connect to existing calendar/call/event data.
   - Tasks: render inside CRM and preserve add/update/delete.
   - Notes: add a CRM Notes section using existing `crm_notes`/notes page where available.
   - Inbox: route to the existing owner inbox/communication panel inside CRM.
   - Notifications: show CRM notification/activity feed from real activity/task/reminder records.
   - Contracts signed: show signed/contract records from existing contract tables, with no fake placeholders.

7. **Fix route consistency**
   - `/crm`, `/crm/*`, `/owner/crm/tasks`, `/owner/crm/calendar`, `/owner/crm/notes`, `/owner/crm/reminders`, `/owner/crm/brokers`, `/owner/crm/network`, `/owner/crm/campaigns` all redirect into the correct CRM tab URL.
   - Avoid standalone CRM pages unless they are detail pages like a lead detail or company hub.

8. **Keep security and data rules**
   - Keep CRM owner-only behind `OwnerGuard`.
   - Do not expose private emails publicly; this is owner/admin CRM only.
   - Do not delete features; only reorganize and replace broken presentation.
   - Preserve all real data and existing database-backed functionality.

## Technical implementation notes

- Create a new `UnifiedCRM` structure that uses URL params like `?section=leads` and `?section=relationships&sub=developers`.
- Add small CRM panel wrappers for Calendar, Tasks, Notes, Inbox, Notifications, Contracts, and Automation so old pages can render without their standalone headers breaking layout.
- Update `OwnerRoutes.tsx`, `AdminRoutes.tsx`, `OwnerSidebarNav.tsx`, and internal CRM quick links.
- Update `CRMLeadsTableV2`, `InlineStatusSelect`, and source-label formatting.
- Use a database migration for safe deletion/soft-deletion of confirmed dummy Jane/test/example rows from `crm_leads`.