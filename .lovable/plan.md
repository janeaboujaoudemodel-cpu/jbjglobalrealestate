## Immediate fix: email log stuck on Loading

1. Replace the broken email-log query mapping.
   - The UI currently expects fields like `recipient_email`, `template_name`, and `error_message`.
   - The actual email log table has `to_email`, `kind`, `template`, and `error`.
   - I will normalize the query result in `useEmailDeliveryStatus` so both old and new log shapes work.

2. Harden `EmailLogDialog`.
   - Add a visible error state instead of infinite Loading.
   - Normalize emails to lowercase for matching.
   - Show the real subject/template/kind/status when available.
   - If there are no log rows, show “No email log entries yet” immediately.

## Developer signed-agreement sync from Gmail

3. Extend the existing Gmail inbound sync.
   - Gmail is already connected to this project.
   - Update the inbox sync function to search for likely signed-contract messages using subjects such as:
     - signed agreement
     - signed contract
     - completed agreement
     - executed agreement
     - contract signed
     - DocuSign / Adobe Sign style completion emails
   - Pull full message metadata and attachment metadata for matching emails.

4. Attach signed contracts to developer records.
   - Match incoming signed-contract emails to `crm_developer_registry` by developer email, channel department email, developer name, or sender/domain hints.
   - Store a contract-sync audit record with source email ID, subject, sender, matched developer, confidence, attachment names, and status.
   - Update the developer’s contract fields automatically when confidence is high:
     - `contract_status = signed`
     - `contract_document_url` when an attachment/link is available
     - status notes/audit metadata for lower-confidence cases

5. Add a developer CRM action item for uncertain matches.
   - If the email looks like a signed agreement but cannot be confidently matched, create a pending action item so you can review it from the developer section instead of losing it.

## UI additions

6. Add a “Sync signed agreements” action in the developer CRM area.
   - Manual button for immediate sync.
   - Result toast showing imported, matched, and needs-review counts.

7. Show contract sync status on developer rows/detail.
   - “Signed agreement found” badge for matched developers.
   - Quick link to open the contract document/log when available.

## Technical details

- Database migration: add a small `developer_contract_sync_logs` table with owner/admin RLS and indexes for developer ID and Gmail message ID.
- Edge function: update `comm-inbound-sync` to support `mode: "developer_contracts"` and process Gmail contract-search results safely/idempotently.
- Frontend: update `useEmailDeliveryStatus`, `EmailLogDialog`, and the developer CRM controls.
- After changing the backend function, deploy it immediately so the new sync works in preview.