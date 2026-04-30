I found the issue: the database already has exactly 24 `pending_application` developers and 236 `not_started` developers, but the UI hides the 24 pending developers because the Outreach Queue is currently defined as only records with no `last_outreach_at`. All 24 pending developers have `last_outreach_at`, so they are pushed into Sent History and disappear when you filter Pending Application in the queue.

Plan:

1. Fix the Outreach Queue logic in `src/pages/CRMRelationships.tsx`
   - Change the queue pool from “no last outreach date” to “all non-registered developers”.
   - This will make the queue show:
     - 236 Not Started
     - 24 Pending Application
     - Total: 260 non-registered developers
   - The 1 Registered developer will remain outside the queue.

2. Fix the email filter so it cannot hide pending developers unexpectedly
   - Keep “All emails” as the default.
   - Make “Not sent yet” show only unsent non-registered records.
   - Make “Email sent” show sent non-registered records, including the 24 Pending Application records.
   - Keep “Confirmed registered” in history/registered handling, not mixed into the outreach queue.

3. Update the empty-state message
   - Replace “No developers match. Click Pre-fill...” with a clearer message explaining that no developers match the current filters.
   - This prevents the app from wrongly telling you to use Prefill when records already exist.

4. Protect Prefill / Import from changing what is visible
   - Ensure the list is always driven by the actual `crm_developer_registry` records, not by whether Prefill was opened or clicked.
   - Keep Prefill as an optional seeding tool only; it must not be required to see pending applications.

5. Align bulk send eligibility
   - Include pending application records in the eligible non-registered outreach flow where appropriate, instead of only `not_started` and `documents_required`.

No database migration is required for the visibility bug because the data is already present: `236 not_started`, `24 pending_application`, `1 registered`. The fix is in the frontend filtering/count logic.