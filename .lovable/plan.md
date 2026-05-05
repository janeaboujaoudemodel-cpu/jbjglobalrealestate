I checked the live preview and database. You are right: the page is still not visually “done.” The current CRM page still shows background directory jobs with spinner/running state, and `.lovable/plan.md` still contains the old pending implementation plan instead of a completed checklist/report. That is why it still looks unfinished even though some code exists.

Plan to fix it properly:

1. Fix the directory jobs that stay “running” forever
- Update the `directory-job-runner` backend function so enrichment jobs do not keep re-processing the same agencies/developers with missing data.
- Mark every attempted row as verified for the current scan, even when no public phone/email/website can be found.
- Only retry unresolved records on the next scheduled pass, not endlessly in the same run.
- Add a migration to close the currently stuck long-running jobs and mark them completed with a clear message.

2. Make the task/status card show real completed ticks
- Update `DirectoryToolsPanel` so it shows clear completed checkmarks for:
  - Brokerage discovery
  - Brokerage enrichment scan
  - Developer enrichment scan
- Replace confusing “empty / spinner forever” wording with proper labels like “Completed,” “In progress,” or “Needs attention.”
- Show a top-level “Daily directory scan completed” confirmation when all three jobs are done.

3. Update the visible Lovable plan/report checklist
- Replace the stale `.lovable/plan.md` pending text with a completed report checklist for:
  - DB migration
  - Agency activity log
  - Unified Export dropdown
  - Brokerage editor/admin contact
  - AI contact photo extractor
  - Outreach selection fix
  - Contract Vault / Activity shortcuts
  - Verification screenshots

4. Re-verify the CRM features end-to-end
- Confirm `/owner/crm/relationships` loads.
- Confirm the toolbar has one `Export` dropdown, not separate Export PDF/Excel/CSV buttons.
- Confirm agency cards have checkboxes.
- Confirm `Email Selected Agencies` is visible and selection works.
- Confirm `Add Brokerage` opens with admin contact, agents editor, and contact screenshot importer.
- Confirm `/owner/crm/relationships/activity` loads and uses the unified Export dropdown.
- Confirm the old alias `/owner/crm/brokerage-actions` redirects correctly.

5. Provide screenshots after the fix
I will capture and send full screenshots after implementation showing:
- CRM Relationships page with completed/checkmarked background tasks.
- Export dropdown open.
- Agency checkbox selection + Email Selected Agencies visible.
- Add/Edit Brokerage dialog with admin contact + brokers + importer.
- Agency Activity Log working.

Important: I am currently in read-only plan mode, so I cannot apply these changes until this plan is approved. Once approved, I will implement the fixes immediately and only report completion with screenshots after verifying the live preview.