Plan to fix the CRM sections properly:

1. Data source and counts
- Keep brokers powered by `crm_brokers`; verified live count is 32,649 rows, so the Brokers count/pagination will show the real total instead of “1,000”.
- Keep agencies powered by `crm_brokerages`; verified live count is 10,613 rows.
- Replace any visible `LD` label with `DLD` and normalize DLD source display so it never shows raw underscores or internal enum strings.
- Add a safe formatter for empty/null values so the UI does not show broken placeholders, underscores, `keep`, or raw database codes.

2. Developer section cleanup
- Rework the developer registry cards/table so the title, status, email, phone, website name, office/location, contact person, notes, tasks/calendar actions, and source are clearly labeled.
- Let location/address wrap naturally instead of forcing one long line.
- Add thin champagne/gold dividers between identity, contact, status, metrics, notes, and actions.
- Show website as a readable domain name plus icon, not only an external-arrow/global icon.
- Replace raw status text like `pending_application` with premium labels like “Pending application”.
- Keep the card style aligned with the existing Relationship Hub display.

3. Brokerage agency section cleanup
- Rework the brokerage agency cards/table to show agency name, DLD office number/RERA, emirate/country, wrapped office location, phone, email, website domain, source = DLD where applicable, status, outreach stage, admin contact, and notes.
- Fix the Agency/Status/RERA column labels so they do not split awkwardly across lines.
- Remove score/internal placeholder display where real DLD fields exist.
- Improve source tabs, filters, upload/import buttons, and pills: tighter borders, less-rounded premium segmented controls, no cropped labels, no arrows touching borders.
- Add proper dividers between directory status, source filters, search/actions, and results.

4. Individual broker section
- Keep the individual broker list server-side paginated over the full 32,649-row table.
- Show every broker card with: name, photo/avatar if available, company, RERA license, broker type/status/specialty, phone on one line, email on one line, WhatsApp, LinkedIn/Property Finder/Bayut/Instagram links, DLD/source label, and editable note.
- Add filters for agency, country, broker type/status/source, and imported/DLD records.
- Add broker activity/scoring derived from existing deal data where possible: deal count, last deal date, per-period rollups, and top-broker ranking by closed deals/commission.
- If the database lacks a dedicated broker status column, add a small schema migration for broker CRM status/relationship status and keep RLS protected.

5. Lead section remaining fixes
- Fix lead status rendering so “New” appears as one clean premium chip, not a blue pen plus separate rectangle.
- Replace the contact action colors with a consistent champagne/ink system; trash/delete stays red.
- Fix quick stage chips: Hot orange, Junk red, Interested green, Deal Closed green, No Response dark red, Already Bought blue, Lost red, VIP yellow/gold star.
- VIP toggle behavior: always show a visible “VIP off” state when inactive, and full gold/yellow active styling when enabled.
- Replace “Pool/Assigned broker” wording: if unassigned show “Unassigned”; if assigned show “Assigned: {broker name}”.
- Show lead created timestamps with AM/PM.

6. Dropdowns, filters, and navigation performance
- Upgrade All stages, All sources, All owners, All tags dropdowns to champagne surfaces with complete options, visible counts, and clear selected chips.
- Add VIP star in gold inside tags.
- Ensure tabs/buttons use `cursor-pointer`, not arrow cursor, and reduce section-switch lag by avoiding unnecessary remounts/refetches where possible.
- Tighten the CRM header from Leads to Employees: remove wide side gaps, connect pills visually, add premium dividers, and keep horizontal scroll inside the section.

7. Notes/tasks/calendar integration
- Ensure developer, agency, and broker cards expose quick actions for note, task, calendar/reminder, and deal/ledger where relevant.
- Persist small per-record notes inline, and keep main searchable Notes section available through the CRM side rail.

8. Verification
- Run targeted checks against the affected components and live database counts.
- Manually verify in the preview: Developers, Brokerage Agencies, Individual Brokers, Imported brokers, filters/dropdowns, lead chips/actions, VIP toggle, DLD source labels, AM/PM dates, and horizontal navigation behavior.
- Provide a concise proof checklist of what was tested and confirmed.