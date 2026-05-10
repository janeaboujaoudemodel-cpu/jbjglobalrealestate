## Plan

1. **Replace the fragmented calendar with one owner calendar system**
   - Use `owner_calendar_events` as the shared source for `/ai-calendar`, `/owner/crm?entity=leads&view=calendar`, and shortcut calendar links.
   - Build one reusable calendar UI that works full-page and compact, so shortcut/calendar surfaces render the same structure instead of separate broken versions.
   - Remove the default selected-day panel text like “Sunday, May 10 / No events scheduled” until the user clicks a day.
   - Color any calendar day that has events and keep the day text black/gold on the bright theme.

2. **Make event creation/editing work properly**
   - Add an “Add Event” action to the CRM calendar and shortcut flow.
   - Event form fields: meeting subject, agenda/description, date, time, duration, location, meeting person name, phone number, attendee email.
   - Default reminders: 1 day before, 30 minutes before, and 15 minutes before.
   - Allow editing/removing those reminders and adding more reminder offsets.
   - Prefill date/time from shortcut URL params so adding an event for tomorrow works directly.

3. **Add automated meeting email logic**
   - Store attendee details and reminder settings inside calendar event metadata.
   - When an attendee email is provided, send the attendee an automated meeting agenda email with subject, agenda, date/time, location, direct map link, and signature: “JBJ Global Real Estate Executive Office”.
   - Add a reminder-processing backend function that sends attendee reminder emails at the configured reminder offsets and marks reminders as sent to avoid duplicates.
   - Use the existing owner calendar table and secure owner-only access; add only the minimum required scheduling/reminder metadata columns if needed.

4. **Fix shortcut routes so calendar always opens the unified calendar**
   - Update shortcut config and quick calendar widget links to route into the canonical owner CRM calendar where appropriate.
   - Remove the calendar item from the owner vertical sidebar, since it already exists in shortcuts/main pages as requested.

5. **Reorganize CRM sidebar hierarchy**
   - CRM top-level children become: Leads, Brokers, Brokerage Agencies, Developers, Developer Sales Representatives, Employees, Investors.
   - Under Leads, move lead-specific views: All Leads, Flagged, VIP, Management, Tasks, Notes, Inbox, Notifications, Contracts, Campaigns, Automation.
   - Remove direct Calendar from the CRM vertical sidebar.
   - Ensure clicking CRM expands the group and clicking Leads expands only the Leads subcategory.

6. **Unify CRM directory styling across relationship entities**
   - Make Developers, Brokers, Brokerage Agencies, Developer Sales Representatives, Employees, and Investors follow the same relationship-hub layout pattern.
   - Replace horizontally cramped card/list layouts with visible table headers and non-hidden columns.
   - Fix developer table/header visibility so status, contact, founded, office/location details are readable without being covered by a layer.
   - Reuse the same actions where applicable: contact, email/test-send, subject/template details, full drawer/hub access.

7. **Validation**
   - Verify calendar month grid, selected day behavior, event creation for May 11/tomorrow, colored event days, and edit/delete reminders.
   - Verify attendee email payload includes agenda, location map link, time, and the required signature.
   - Verify CRM sidebar expansion and the reorganized entity hierarchy.
   - Verify developer/broker/agency/sales-rep directory views are readable and consistent with the relationship hub style.