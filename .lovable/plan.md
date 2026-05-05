You are right to call this out. I verified in the live preview and backend that parts exist in the code, but the work is not complete end-to-end:

- The Agency Activity Log page exists and routes load, but it shows empty because the `crm_brokerage_actions` RLS only allows `admin`, while the current owner user is `owner`; Remind-created actions are therefore blocked/invisible for owner usage.
- The unified Export dropdown exists on the brokerage toolbar and Activity Log, but needs verification after the page is stable and the dropdown opens/exports correctly.
- The brokerage editor additions exist in the page code, but I need to verify the actual Add/Edit dialog in preview after fixing the blank-screen/runtime state.
- The AI screenshot/contact extractor function exists, but needs hardening and deployment/testing.
- Quick action tiles exist for Contract Vault and Agency Activity, but the global shortcut catalog was not updated, so pinned/search shortcuts can still feel incomplete.
- There is a blank-screen state in the browser session that must be checked and fixed if reproducible.

## Implementation plan

### 1. Fix Activity Log backend permissions and action types
- Add a new database migration for `crm_brokerage_actions` that gives authenticated owners the same owner/admin access pattern already used for `crm_brokerages`.
- Keep role validation server-side via existing role helpers; no client-side role checks.
- Expand allowed activity action types to match the UI and sending workflow, including `outreach_sent` and `call` if the current constraint only permits `message_sent`.
- Add/update indexes for owner/date lookups if missing.

Expected result: owner can create and read brokerage activity rows, and Remind records appear in Agency Activity Log.

### 2. Make Remind prove itself in the UI
- Update `useBrokerageRemind` so after a successful Remind it invalidates both brokerages and agency activity queries.
- Add a toast action/link or clear text telling you where the activity went: `/owner/crm/relationships/activity`.
- Ensure failed inserts are not silently ignored: if creating the activity log fails, show a real error instead of a misleading success.

Expected result: clicking Remind creates visible activity and does not claim success if logging failed.

### 3. Finish Agency Activity Log as a real CRM activity report
- Replace the one-off load with a query key (`crm-brokerage-actions`) so the page refreshes reliably.
- Add visible counters: total activity, reminders, notes/calendar, outreach sent.
- Add filters for search/type/date where practical.
- Keep one unified Export dropdown on the page.
- Export the currently filtered activity log to CSV/XLSX/PDF.

Expected result: the page is a usable activity report for company leadership, not an empty placeholder.

### 4. Verify and polish the unified Export dropdown
- Confirm the brokerage toolbar shows a single `Export` button only.
- Confirm dropdown options are `Export as PDF`, `Export as Excel (.xlsx)`, and `Export as CSV`.
- Confirm exports include CRM-style columns: rank, agency, emirate, office, phone/WhatsApp/email, status, outreach, last message, next follow-up, attempts, deals, agents, rating, notes.
- Ensure top/famous agencies remain sorted at the top through the existing ranking utility.

Expected result: no separate “Export PDF / Export Excel / Export CSV” buttons remain in the brokerage CRM toolbar.

### 5. Finish Add/Edit Brokerage and remove RERA license from the form
- Remove the visible `RERA license` field from the Add/Edit Brokerage dialog per your instruction that agencies are assumed licensed.
- Keep admin contact fields always visible: admin name, role, phone, WhatsApp, email.
- Keep brokers-under-agency editor visible.
- Keep WhatsApp/contact screenshot importer visible.
- Ensure saved agents are persisted under `crm_brokerage_agents` and loaded again when editing.

Expected result: Add Brokerage behaves like a CRM agency profile with admin + brokers, not a license-entry form.

### 6. Harden and deploy the AI screenshot/contact extractor
- Deploy `extract-brokerage-contacts` so the function is live.
- Add stricter input validation for `paths` and safe error messages.
- Confirm CORS headers are returned for success and error responses.
- Keep owner-only validation inside the function.
- Test the deployed function with an empty/invalid request and confirm it returns a controlled validation error, not a crash.

Expected result: the importer can upload screenshots and call the deployed AI extraction function safely.

### 7. Fix Send Outreach UX end-to-end
- Ensure every agency card has a checkbox, including directory rows.
- If selected agency has no email, open the editor to add admin email before sending.
- Keep the button label as `Email Selected Agencies`, not `Send Outreach`.
- Add/verify sticky selection summary: `N selected · Email selected · Clear`.
- Ensure the dialog clearly explains who receives the email and what happens.
- Confirm outreach events log into the Agency Activity Log where the sending hook supports it.

Expected result: outreach selection is obvious and cannot send to “nothing”.

### 8. Fix shortcut/catalog gaps
- Add `Contract Vault` and `Agency Activity Log` to `src/config/shortcutsConfig.ts` under Owner Command Center/CRM so search/pinned shortcuts can use canonical routes.
- Preserve the route alias `/owner/crm/brokerage-actions` redirecting to `/owner/crm/relationships/activity`.

Expected result: old brokerage-actions shortcuts stop 404’ing, and new shortcuts are discoverable.

### 9. Diagnose preview blank screen and runtime warnings
- Reproduce the blank screen seen after navigation.
- Check console/network for the actual runtime error if it happens again.
- Fix the underlying component import/render issue if reproducible.
- Avoid touching generated backend client/type files manually.

Expected result: CRM pages load reliably after navigation/refresh.

### 10. Verification report with screenshots
After implementation I will provide a concise completion report with:

- Backend proof:
  - `crm_brokerage_actions` policies include owner access.
  - `crm_brokerage_agents` table exists.
  - `admin_contact` column exists.
  - `brokerage-contact-photos` bucket exists.
- UI proof screenshots:
  - Before/current state: Activity Log empty/disabled export.
  - After: brokerage toolbar showing one Export dropdown and agency checkboxes.
  - After: Add/Edit Brokerage dialog showing admin contact, brokers editor, and AI screenshot importer.
  - After: Agency Activity Log route working.
  - After: Owner quick actions/shortcut access showing Agency Activity / Contract Vault.
- Edge-function proof:
  - Deployed/tested `extract-brokerage-contacts` with controlled validation response.

Important: I’m currently in read-only plan mode, so I cannot apply the fixes until you approve this plan. Once approved, I will implement the migrations/code changes and then give you the report with screenshots.