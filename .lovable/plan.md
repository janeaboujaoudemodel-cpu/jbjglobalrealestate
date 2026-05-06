I’ll fix this as a full Relationship Hub workflow update, not just small labels.

1. Correct the status model and colors
- Replace the brokerage “Agency status” options so they mean registration/onboarding status:
  - Not registered
  - Pending documents
  - Documents pending review
  - Registered
  - Registration rejected
  - Expired
- Keep “Outreach status” separate for activity/relationship state:
  - Not contacted
  - Attempted
  - Engaged
  - Active partner
  - Partially active
  - Inquiries
  - Closing deal
  - NDA pending
  - NDA signed
  - Dormant
  - Declined
  - Blacklisted
- Apply status colors immediately in the Excel view cells, card badges, filters, XLSX export, and PDF export.
- Fix the existing bug where the brokerage Excel cell is using status values but the palette/options don’t match the business meaning.

2. Add the missing brokerage Excel columns and inline editing
- Expand Brokerage Excel View with premium separated column groups:
  - Identity: Agency, country/region, emirate/city, office, website
  - Registration: Agency status, pending documents notes
  - Outreach: Outreach status, notes, last contact
  - Agents: active agents, admin name, admin number
  - Briefings: briefing attended count, last briefing attended, briefing notes
  - Metrics: inquiries, deals, rating
- Add thin champagne/gold dividers between groups so columns don’t visually run into each other.
- Make editable cells actually editable: notes, pending document notes, admin contact, phone/email fields, briefing notes, counts, last contact.
- Add a “+ Contact” action for last contact/activity that opens a small form to log contact date, contact/admin number, notes, and updates the row immediately.

3. Add the same fields to brokerage cards
- Cards will show both statuses with color, not just one.
- Cards will show active agents, admin contact/number, last contact, briefing count, last briefing date, pending document notes, inquiries, and deals.
- Keep cards premium and separated with compact labelled sections.

4. Preserve and improve agents management
- Keep the existing brokerage agents editor.
- Surface the active agents in Excel view and card view.
- Support adding/editing agents from the brokerage edit dialog and show the active/admin details in the list views.

5. Fix “send only new agencies” behavior
- Change brokerage bulk sending default from “selected visible rows” to “new/not previously sent recipients only”.
- A brokerage counts as already sent if it has matching outbound records in `crm_relationship_email_log` for the selected template/variant.
- When you click Email Selected Agencies, the dialog will show:
  - New agencies to send now
  - Already sent agencies
  - Excluded agencies
  - Final send count
- Already-sent agencies will not receive the same email again by default.

6. Add include/resend warning for already-sent agencies
- If you manually include an already-sent agency, the dialog will show the prior sent date and warning:
  “This agency already received this email on [date]. Send same email again, or change template?”
- You can approve resend per agency, or change the email template.
- This prevents accidentally resending to 500/600 old agencies when only 20 new agencies were added.

7. Replace confusing brokerage tabs
- Rename:
  - “All UAE Agencies” / “UAE Agencies” -> “All” with a region dropdown.
  - “Existing Matches” -> “Emails Sent” / “Already Sent”.
- Add region filter options:
  - All
  - UAE
  - GCC
  - MENA
  - International
- Keep the current UAE records, but structure the UI so global brokerages can be added and filtered.

8. Improve My Additions
- In “My Additions”, add clear actions:
  - Add Brokerage
  - Add Individual Broker
- Keep separate sub-sections for brokerage companies and individual brokers.
- Save added brokerages into the brokerage list and individual brokers into the agent/broker structure linked to a brokerage when available.

9. Add sent-email and new-message sections
- Add a visible “Emails Sent / Already Sent” section next to All.
- Add “New Messages” / Inbox section showing inbound replies from brokerages and developers.
- Use the existing email log table as the source of truth for sent and inbound messages.
- Show reply date, sender, matched agency/developer, subject, snippet, detected status, and linked action.

10. Wire and prove email synchronization
- The project already has a Gmail-based CRM email sync backend function and a 15-minute scheduled job.
- I will connect it properly to this page by adding a manual “Sync now” button and an inbox view.
- I will fix missing brokerage columns needed by the sync (`last_inbound_at`, `last_inbound_subject`) so replies can update brokerage records cleanly.
- I will verify the deployed function with the available backend test call/logs after implementation and show the result in the UI.

Technical changes required
- Database migration:
  - Add safe brokerage fields for registration/pending document notes, briefing count/date, last inbound fields, country/region, and individual broker support if needed.
  - Extend status enums or migrate status columns to support the requested values safely.
  - Keep RLS owner/admin protected.
- Frontend:
  - Update `crmStatusPalette.ts`, `ExcelGridView.tsx`, `CRMRelationships.tsx`, `BulkSendDialog.tsx`, `exportBrokerages.ts`.
  - Add compact components for activity/contact logging, sent history, inbox/new messages, and region/my-additions controls.
- Backend functions:
  - Update `crm-check-brokerage-registration` to classify prior sends by template/variant and return prior sent date.
  - Update `crm-send-brokerage-outreach` so it logs enough metadata and does not mutate outreach into invalid enum values.
  - Update `crm-email-sync` to record brokerage inbound replies and create visible inbox entries.
  - Deploy changed backend functions after editing.

Verification after implementation
- Open Brokerage Excel View and confirm both status columns show correct business statuses and colors.
- Change statuses and confirm the cell color updates immediately.
- Edit notes/admin/contact/briefing fields inline and confirm they save.
- Export XLSX/PDF and confirm status colors appear in exported files.
- Click Select all visible -> Email Selected Agencies and confirm only new/not-sent agencies are selected by default.
- Include an already-sent agency and confirm the prior-send warning appears.
- Run email sync manually and confirm inbound replies appear in New Messages / Inbox.
- Check console/backend logs for errors.