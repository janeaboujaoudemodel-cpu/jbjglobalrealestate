I’ll fix the CRM as one stable owner command workspace without removing existing data or modules.

Plan:

1. Stop the pending-task popup from repeating
- Change `OwnerTasksPopupAlert` so closing it or clicking “View Tasks” stores a user-specific 24-hour dismissal timestamp.
- Suppress the popup entirely on `/owner/crm` so it never covers CRM work.
- Keep the underlying pending-task data intact; only change the alert frequency/visibility.

2. Fix the access-verification blinking
- Harden the owner verification flow so repeated auth/session events do not cause repeated “Verifying access…” flashes.
- Keep cached owner verification stable during transient refreshes.
- Make the CRM wait for a valid user/owner state before loading CRM panels.

3. Rebuild the CRM layout shell so content never overlaps
- Replace the current wrapped/flex tab bar with a boxed CRM command layout: fixed CRM header area, scroll-safe tab strip, and one content container per section.
- Make every CRM section render inside a bordered champagne panel with `overflow-x-auto`, stable min widths, and no nested top padding/header collisions.
- Strip legacy embedded page headers/sticky bars more aggressively inside the CRM embed wrapper.

4. Reorganize CRM tabs and sub-sections
- Primary CRM sections: Overview, Leads, Relationships, Employees, Campaigns, Tasks, Calendar, Notes, Inbox, Notifications, Contracts, Automation.
- Relationships sub-sections: Investors, Developers, Dev Sales Reps, Brokers, Brokerage Agencies.
- Ensure each section updates via `/owner/crm?section=...&sub=...` without 404s.

5. Fix sidebar navigation under correct headers
- Move CRM-related entries into a dedicated CRM section in the owner sidebar.
- Add reliable links for Leads, Investors, Developers, Dev Sales Reps, Brokers, Brokerage Agencies, Employees, Tasks, Calendar, Notes, Inbox, Contracts, Automation.
- Make active highlighting include query-string tabs so the correct sidebar item is highlighted.

6. Fix relationship panel mapping
- Make Developers, Dev Sales Reps, Brokers, and Brokerage Agencies open the correct CRM sub-view instead of all pointing to the same default network page.
- Pass the requested relationship sub-section into the network view so the correct tab is selected immediately.

7. Remove blue/raw dropdown styling in CRM controls
- Replace raw select styling in leads filters with champagne/ink controls.
- Keep status dropdowns compact, scrollable, and boxed so menus do not visually spill over CRM content.

8. Route cleanup
- Update legacy `/crm/*` and `/owner/crm/*` redirects to land on the correct unified CRM tab/sub-tab.
- Keep detail pages that must remain standalone, such as individual lead detail and company hub.

9. Verify in preview
- Open `/owner/crm` at the current viewport.
- Confirm no pending task popup appears on CRM.
- Confirm no verifying-access blink loop.
- Click CRM tabs and relationship sub-tabs and confirm content stays inside boxes without overlap or 404s.