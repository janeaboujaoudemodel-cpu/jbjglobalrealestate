I audited the actual code and database instead of relying on previous summaries. Several items were only partially done, and some claims were wrong. This plan completes the unfinished CRM + document/e-signature work and includes proof steps before anything is marked done.

## Current audit findings

### Completed or mostly completed
- E-signature dashboard has advanced filters and document cards, but this was the **E-Signature dashboard**, not the CRM dashboard.
- PAA leasing template has JBJ monogram header/footer and removed the “Awaiting signature” placeholder.
- Send-for-signature dialog exists with editable subject/body, CC/BCC, WhatsApp, copy link, and `jbj.ae` signing links.
- CRM fake-data guard exists in frontend, and some cleanup was attempted.
- Excel export styling was improved.

### Not completed / still broken
- CRM still has active suspect data: audit found `crm_leads` has **29 active rows**, including **3 legacy-source rows** and **8 suspect/fake-name rows** still visible at database level.
- CRM Network is still a separate route with table tabs; it is not merged into the main CRM workspace as requested.
- CRM Network filters are still chip-style/source filters, not clean dropdowns for Country / Database / Campaign / Source / Role.
- CRM cards/rows do not yet have full per-lead action buttons for **Notes, Calendar reminder, Task assignment, Send Agreement** in the unified network view.
- Investor toggle logic is not implemented: a lead cannot yet be cleanly marked/unmarked as Investor while preserving status.
- Category report configurator is not implemented: brokerages/developers/investors reports cannot yet select date range, included metrics, or saved presets.
- Documents hub `/owner/documents/forms` still lists drafts by generic envelope title only; it does not summarize client name, abbreviation, doc number, property details, category, and filters strongly enough.
- Legacy document functions still exist in the repo (`documents-send`, `documents-public-fill`) despite earlier claim they were deleted.
- Existing Omar / older drafts may still need regeneration to the current PAA layout and card metadata.
- The send email template still exposes the merge tag label `{{owner_name}}`, which is ambiguous. It should be renamed/reworded to company/sender signature and default to **JBJ GLOBAL REAL ESTATE** / **Jane Bou Jaoude** where needed.
- No screenshot proof has been produced yet.

## Implementation plan

### 1. CRM data cleanup and permanent fake-data protection
- Run a precise cleanup migration to soft-delete remaining active fake/legacy/test/encrypted CRM lead rows.
- Keep only real records moving forward.
- Tighten `crmFakeDataGuard.ts` so UI never displays:
  - legacy/test/import demo rows
  - encrypted/redacted placeholder names
  - example/test emails
  - fake source/database labels
- Add a small owner-only CRM data-audit banner/count so we can prove how many rows are real vs filtered.

### 2. Merge CRM Network into the main CRM workspace
- Add a unified CRM section inside `/owner/crm` with clear tabs/cards:
  - Leads
  - Investors
  - Developers
  - Brokers
  - Brokerage Agencies
  - Partners
  - Employees
- Stop presenting “CRM Network” as a separate hidden/duplicate experience.
- Keep one canonical CRM entry point.

### 3. Replace broken chip filters with dropdown filters
- Build compact dropdown filters for:
  - Role/category
  - Country
  - Database/source
  - Campaign
  - Status
  - Assigned user
  - Date range
- Hide empty categories and stop filters from triggering homepage flashes or route changes.
- Add a reset button and active-filter summary.

### 4. CRM action buttons per row/card
- Add visible actions beside each CRM person/company:
  - Notes
  - Calendar reminder
  - Assign task
  - Send agreement
  - Open detail drawer
- Wire them to existing tables/components where available; if a missing table is required, add it with owner-safe access rules.
- Keep UI compact so the main CRM list is immediately visible.

### 5. Investor label toggle
- Add an `Investor` toggle/action on leads.
- When enabled, the same CRM record appears in Investors without duplicating data.
- When disabled, it returns to Leads while preserving pipeline/status history.
- This should update tags/intent safely and invalidate CRM caches.

### 6. CRM layout minimization
- Keep KPIs visible at the top: calls, WhatsApp messages, inquiries, hot leads, follow-ups, calendar, messages.
- Keep AI insights, team communication, and activity timeline minimized by default behind clean buttons.
- Add a header above the main tabs so “All Leads / Flagged / VIP / Management / Employee Hub” is not floating without context.

### 7. Premium CRM exports and category report configurator
- Upgrade relationship exports to use the same premium Excel style: wide columns, readable headers, generated date, source date range, frozen rows, autofilter.
- Add report dialog for Brokerages / Developers / Investors with:
  - week / month / quarter / custom date range
  - selectable metrics: meetings, briefings, breakfast events, inquiries, registered companies, sent emails, groups created, follow-ups
  - saved report presets
  - default “include all” behavior

### 8. Documents/forms card identity
- Upgrade both `/owner/documents/forms` and `/e-signature` cards to show:
  - document number/code
  - client name
  - client initials/abbreviation
  - agreement type: Leasing / Selling
  - property summary: type, building/community, unit, bedrooms, BUA, reference number
  - status badge with correct wording
- Fix “draft” wording for generated templates: use **Ready for review** when the agreement has client/property data but has not been sent.
- Add filters by document type, client, nationality, location, bedrooms, property type, status, and doc number.

### 9. Existing envelope regeneration and Omar validation
- Identify Omar’s existing envelope and any stale PAA drafts.
- Regenerate the PDF using the current Property Finder-style PAA layout without deleting the envelope.
- Confirm Omar’s card shows his name, doc number, and property summary outside the document.

### 10. Send-for-signature email wording and test email
- Replace ambiguous “owner name” wording in the editor UI with **Sender signature** or **Company signature**.
- Default email signature to:
  - **JBJ GLOBAL REAL ESTATE**
  - sender name **Jane Bou Jaoude** only where a personal sender is required
- Default test recipient to `infoo.jane@gmail.com` as requested.
- Send one real test “send for signature review” email after implementation and capture proof: function response/message id or email log entry.

### 11. Legacy document engine cleanup
- Remove or fully quarantine old `documents-send` / `documents-public-fill` paths so the UI cannot route users into the wrong signing engine.
- Preserve old data for audit only; no active UI should use the legacy engine.

### 12. Proof and end-to-end checks before marking done
I will not mark tasks complete until verified. Proof package will include:
- Screenshot of CRM unified workspace showing cleaned counts and dropdown filters.
- Screenshot of CRM row/card with Notes, Calendar, Task, Investor toggle, and Send Agreement actions.
- Screenshot of upgraded documents/forms card showing Omar/client + doc number + property summary.
- Screenshot of PAA preview with monogram header/footer and aligned signature row.
- Screenshot of send-for-signature dialog showing `infoo.jane@gmail.com`, editable subject/body, and no ambiguous owner-name label.
- Database proof queries showing fake/legacy active CRM rows are zero.
- Test email proof: edge function success and message/log identifier.

## Technical notes
- Use existing Lovable Cloud tables where possible: `crm_leads`, `crm_brokerages`, `crm_developer_registry`, `crm_clients`, `esign_envelopes`, `esign_recipients`.
- Any new persistence needed for tasks/report presets will use owner-scoped tables with access rules.
- Keep all styling on the champagne/gold/ink design system and avoid adding new visual themes.
- Do not delete real CRM data; fake/legacy rows will be soft-deleted for audit safety.