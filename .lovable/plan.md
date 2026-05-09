Plan to fix the CRM now:

1. Clean fake/broken CRM data
- Remove from active CRM all clear fake/test/legacy rows I found:
  - `database_source = legacy_leads`
  - names/emails containing `test`, `fake`, `demo`, `[encrypted]`, `redacted-*`, `example.com`, or system verification sources
- Keep all real leads and future real submissions.
- Add a frontend guard so broken/redacted legacy rows never appear again if any old row remains in the database.

2. Merge CRM Network into one CRM
- Remove the separate “CRM Network” sidebar entry to stop duplicate navigation.
- Keep `/owner/crm` as the single CRM workspace.
- Add one main CRM header with categories: Leads, Investors, Developers, Brokers, Brokerages, Partners, Employees.
- Move the useful CRM Network relationship view into this page as part of the CRM instead of a separate broken page.

3. Replace broken filter chips with proper dropdown filters
- Convert Country, Database, Upload Source, Team, Campaign, City/Source-style filters from horizontal chips into compact dropdown filters.
- Add counts inside dropdown options.
- Stop filter clicks from redirecting or changing sections unexpectedly.
- Hide empty/broken categories like “database legacy leads 3” after cleanup.

4. Upgrade the main CRM layout
- Put KPI cards at the top: Calls Made, WhatsApp Messages, Inquiries, Hot Leads, Follow-ups, Calendar, Messages.
- Make Insights, Team Communication, and Activity Timeline collapsed by default behind small buttons; they expand only when clicked.
- Shrink “Pipeline by stage” and other insight widgets so they no longer consume the first screen.
- Add a clear “CRM” section header above the lead/category controls.

5. Fix lead views and actions
- Make the two view modes genuinely different:
  - Premium card view
  - Excel/CRM sheet view with proper dividers, readable columns, and sticky headers
- Show phone and WhatsApp fields correctly where permissions allow.
- Add action buttons next to each lead: Notes, Calendar reminder, Assign task, Call, WhatsApp, Email.
- Add an Investor label toggle:
  - Turning it on classifies the lead as Investor and shows it in the Investors section.
  - Turning it off returns it to Leads while preserving the lead status such as Not Interested/Dormant.

6. Fix Excel/CRM exports
- Replace the current narrow export with a premium readable XLSX:
  - Large branded title/header
  - Date range covered, download date, database/source label
  - Wide auto-fit columns so titles and values are readable without manual resizing
  - Bigger styled column headers for Lead Name, Type, Phone, WhatsApp, Email, Status, Source, Date, etc.
  - Frozen header row, filters enabled, wrapped text, editable cells.
- Apply this export standard to CRM views, CRM Network/relationship exports, brokerages/developers, and investor exports where the existing utilities are used.

7. Add report/download configurator for CRM categories
- For Brokerages, Developers, Brokers, Investors, Partners, etc., add a report download dialog with:
  - Week / Month / Quarter / Custom date range
  - Include/exclude checkboxes, all enabled by default
  - Metrics such as registered, contacted, interested, meetings, briefings, groups, inquiries, follow-ups
  - Saveable named filters and reuse of the last selected filter.

8. Broker/team data access protection
- Keep brokers isolated from your owner CRM by default.
- Use existing CRM assignments and field-permission logic so a broker only sees assigned/shared leads.
- Add per-assignment visibility controls for phone, WhatsApp, email, notes, and full database access, so you can share a lead with or without contact details.

9. Verify after implementation
- Confirm fake/test rows no longer appear.
- Confirm Country/Campaign/Database filters do not redirect or break the page.
- Confirm CRM opens from the owner sidebar as one unified page.
- Confirm Excel export opens with readable columns and premium headers.
- Confirm lead cards/sheet views, notes, calendar, and task actions are visible.