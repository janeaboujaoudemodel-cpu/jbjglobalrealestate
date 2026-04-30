I found the current issues in the Relationships Hub:

- The database currently has 807 developer registry rows, but only 774 distinct developer names, so duplicates exist.
- The 24 `pending_application` rows have already been emailed, so the current logic moves them to Sent History. You asked for these to be merged back into Not Started/Outreach Queue, with no duplication.
- The master developer catalog has 631 visible developers, but the registry has multiple imported aliases like `aldar`, `aldar-properties`, and `developed-by-aldar-properties`, which is why counts and cards drift.
- Brokerages are empty right now.
- Developer cards do not show logos and currently use `emirate` as the “Office” display instead of a full clickable office/maps location.
- Registered developers are intentionally routed to Sent History by the current pool logic, which is why clicking Registered in the queue area can show confusing results.
- Email preview is iframe-based, but it needs a safer full-width wrapper to prevent the “one character per line” bug.

Plan to fix it:

1. Correct Outreach Queue logic and pending applications
- Update developer pool rules so `pending_application` is included in the Outreach Queue as requested.
- Make Not Started count include Pending Application visually, or convert those 24 rows to `not_started` during cleanup so they merge directly.
- Keep pools mutually exclusive so no developer can appear twice.
- Add tests for:
  - pending_application stays in queue even after outreach
  - registered appears in the registered/history section and remains clickable
  - duplicate rows are excluded from visible lists

2. Deduplicate developer registry safely
- Add a cleanup migration/script that consolidates duplicate developer rows by normalized developer name.
- Preserve the “best” row per developer using priority:
  - registered status wins
  - rows with email/phone/website/office win
  - rows with outreach history win
  - newest/most complete row wins as fallback
- Merge useful fields from duplicates into the keeper row.
- Remove or archive duplicate rows only after their useful fields are merged.
- Ensure future imports use normalized slug/name matching so aliases like `damac`, `damac-properties`, and `developed-by-damac-properties` do not create duplicates.

3. Auto-load all developers without needing “Import all developers”
- Replace the manual-only import workflow with an automatic sync on Developer Registry load for the owner.
- Keep the manual button as “Sync missing developers” for recovery, but the page should no longer depend on you clicking it.
- Optimize queries and render flow so status chips respond faster.

4. Show complete developer cards
- Join registry rows to the master `developers` table by slug/name where possible.
- Display developer logo on every card using `logo_url_processed`, `logo_url_dark`, or `logo_url` fallback.
- Add visible fields on cards:
  - logo
  - developer name
  - email
  - phone/contact number
  - website
  - emirate
  - full office/location
  - Google Maps directions link
- Update the edit form to include full office/location and map URL fields.
- If a map URL is missing, generate a Google Maps directions/search link from the office address + developer name.

5. Add exact office/maps data structure
- Add columns to developer registry if needed:
  - `office_location` text
  - `office_map_url` text
  - `logo_url` text or derive logo from master catalog
- Extend enrichment to fill office address and Google Maps link where possible.
- Use sources in `field_sources` so owner can tell whether data came from master catalog, AI research, website scrape, or manual edit.

6. Fix registered filter/card wiring
- Make Registered a first-class visible section/filter rather than a dead queue chip.
- If the Registered chip is clicked, show the registered cards immediately even if they live in the history/registered pool.
- Ensure every status card/chip changes the visible list and does not appear unclickable.

7. Fix email preview and test-send flow
- Update `TemplateEditorDialog` and `BulkSendDialog` so “Send test” is always available before broadcast.
- Default test recipient to the registered owner email from auth, then fallback to the saved owner test email.
- Wrap iframe `srcDoc` with a responsive HTML shell:
  - viewport meta
  - `box-sizing:border-box`
  - `table-layout:auto`
  - `max-width:100%`
  - `word-break:normal`
  - `overflow-wrap:break-word`
- This should stop the vertical one-character-per-line email preview.
- Keep preview full-height and readable.

8. Build brokerage directory and emirate filtering
- Seed/populate `crm_brokerages` with UAE brokerage firms grouped by emirate.
- Add brokerage fields if needed:
  - emirate
  - office location
  - Google Maps link
  - email
  - phone
  - website
  - logo if available
- Add Emirates filter for both Developers and Brokerages so selecting Umm Al Quwain, Ajman, Dubai, etc. filters to offices in that emirate.
- Ensure only real developers appear in Developer Registry and only brokerage companies appear in Brokerage section.

9. Add owner export center with preview and selectable content
- Add an export dialog that lets you choose:
  - Developers only
  - Brokerages only
  - Both
  - Selected rows only
  - Filtered rows only
  - All rows
  - Include/exclude columns like logo, office, maps link, phone, email, website, status, emirate, notes
- Show a preview table before download.
- Support downloads:
  - CSV
  - Excel `.xlsx`
  - PDF
  - Google Sheets export via connected Google Sheets gateway if configured
- Add proper file names like `JBJ-Developer-Brokerage-Directory-2026-04-30.xlsx`.

10. Test in browser after implementation
- Navigate to `/crm/relationships`.
- Open Developer Registry.
- Verify Outreach Queue count includes pending applications or pending rows have been merged into Not Started.
- Click Not Started, Pending Application, Registered, and Emirates filters.
- Open Send dialog and Template dialog.
- Verify test-send button is visible and preview renders normally.
- Verify logos, office, email, phone, and maps links appear on developer cards.
- Open Brokerages and verify seeded brokerage cards + emirate filters.
- Test export preview and at least CSV/XLSX/PDF download UI.

Technical files likely to change:
- `src/pages/CRMRelationships.tsx`
- `src/lib/crm/developerPools.ts`
- `src/lib/crm/developerPools.test.ts`
- `src/hooks/useCRMRelationships.ts`
- `src/components/crm/BulkSendDialog.tsx`
- `src/components/crm/TemplateEditorDialog.tsx`
- New export helper/component for relationship exports
- `supabase/functions/enrich-developer-registry/index.ts`
- New/updated database migration for fields, dedupe/sync logic, and brokerage seed data

I will preserve existing features and only fix/extend the Relationships Hub workflow.