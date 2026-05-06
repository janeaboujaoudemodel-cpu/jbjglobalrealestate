I’ll fix this as a reliability + workflow update to the Relationship Hub.

1. Fix the Exclude button crash first
- Replace the invalid empty Radix Select option in `ExcludeFilterPopover` with a safe sentinel value.
- This is the root cause of the black “Verifying access…” reset: opening Exclude throws a runtime error, React remounts the protected owner route, and the guard shows verification again.
- Keep saved filters working, but “None” will use an internal value like `__none` instead of `""`.

2. Add proper Include / Exclude review inside brokerage email sending
- In `BulkSendDialog` for brokerages, add a recipient adjustment step before final send:
  - Show selected count.
  - Show excluded count.
  - Show final send count.
  - Provide `Exclude` and `Include` controls with searchable agency names.
  - Owner can tick agencies to exclude from the selected list, or include additional agencies before sending.
  - `Save/Done` applies the adjusted list inside the dialog.
  - Final confirmation will say exactly how many brokerages are selected, excluded, added, and will be sent.
- Wire this so “Select all visible → Email Selected Agencies” does not immediately lock the owner into that exact selection.
- Do not send to excluded rows.

3. Split Developer Excel statuses into two clear status columns
- Keep developer registration tracking as `Registration Status`:
  - Not Started, Pending Application, Documents Required, Under Review, Registered, Rejected, Expired.
- Add a separate `Agency Status` / relationship activity column for how active the agency/developer is with us:
  - Not Contacted, Attempted, Engaged, Meeting Booked, NDA Pending, NDA Signed, Active Partner, Dormant, Declined, Blacklisted.
- Use the existing `outreach_stage` field for the second status where possible, so this does not duplicate data unnecessarily.
- Update Developer Excel View to show both status dropdowns with color.
- Update Developer export XLSX/PDF/CSV to include both colored columns.

4. Improve Brokerage Excel statuses and broker/inquiry visibility
- Brokerage Excel View/export will show:
  - `Agency Status` from `status`.
  - `Outreach Status` from `outreach_stage`.
  - Active broker/contact fields from the brokerage record and available brokerage agents.
  - Inquiry/contact indicators where available from existing CRM/inquiry fields.
- Add colors to every status column, not only one status.

5. Make Excel View balanced and organized
- Prevent long agency names like “East Coast Real Estate...” from expanding the row height.
- Add fixed row height, truncation with tooltip/title, consistent cell widths, and better wrapping only for Notes.
- Keep the first column sticky, but not oversized.
- Ensure both Brokerage and Developer Excel Views look like a clean spreadsheet, not uneven cards.

6. Update exports to match the view
- XLSX exports will keep the champagne/gold styling and status colors.
- Status colors will match the on-screen Excel View.
- PDF exports will color both status columns.
- CSV remains plain text, but includes both status fields.

7. Verify after implementation
- Reproduce the Exclude click after the fix and confirm no runtime error, no black verifying page, and the popover opens.
- Test “Select all visible → Email Selected Agencies → Exclude/Include → final confirmation” in preview.
- Test Excel View row balance with long agency names.
- Test changing both status columns in Developer Excel View and confirm the row updates without breaking.
- Check console for zero Select.Item runtime errors.