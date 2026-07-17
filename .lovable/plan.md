I will stop adding new feature slices and focus only on making the existing Developer Portal flow work end-to-end.

## Plan

1. Fix the broken AI extraction functions
- Make `ai-developer-profile-extract` return a normal success response with a clear `status` when the AI gateway fails, so the UI never shows a raw edge-function error toast.
- Reduce worker-memory risk by avoiding full-file base64 processing for large PDFs and returning a clear owner-facing message when a file cannot be processed in the function.
- Fix `developer-intel-extract` so website/link extraction writes to the actual enrichment-review schema and does not depend on removed columns.
- Improve the prompt/source flow so official website + uploaded company profile can fill CEO, founder, parent company, LinkedIn, founded year, signature projects, and notable projects when source material supports it.

2. Remove the two unwanted cards from the developer profile page
- Completely remove the `Needs verification` warning card above the tabs.
- Completely remove the `Internal only` privacy card above the tabs.
- Keep the actual editable fields; only remove the two visual cards the user identified.

3. Fix Company Profile uploader UX
- Add a minimize/collapse control for the `Owner · Company Profiles` section.
- Make the `Extract intel` button text pure white on emerald, including disabled/loading states.
- Auto-save edited developer profile fields when leaving the page or switching away, instead of relying only on the manual Save button.
- Stop showing “Missing — please add manually” as the main outcome when the system should attempt website/profile enrichment first; show extracted/found fields and actionable failure messages instead.

4. Fix Enrichment Review display
- Make the pending-count pill use pure white text on emerald.
- Ensure newly created website/link extraction drafts appear in the review queue when status is pending.
- If company-profile extraction is auto-applied, show it as applied/history instead of incorrectly implying there are pending drafts.

5. Put Sales Reps and Briefings inside the developer profile tabs
- Keep Sales Reps out of the global vertical sidebar.
- Add/repair a proper developer-scoped `Contacts & Reps` tab that shows sales reps for the current developer.
- Add a developer-scoped `Briefings` tab inside the same developer profile page, filtering briefing logs to the current developer and showing broker survey/rep rating entries.
- Keep media/files scoped inside the developer profile tabs as requested.

6. Add Amra/signature-project enrichment guardrails
- Update the extraction instructions and post-processing so signature projects found in sources are preserved in `notable_projects`.
- Add deterministic support for Citi Developers sources mentioning Amra, so a valid source mention is not dropped.

7. Validate with proof before reporting done
- Deploy the changed backend functions.
- Test the function calls directly against the backend.
- Run a browser E2E pass on the preview for:
  - developer profile page loads,
  - company-profile section collapses/expands,
  - extract button has white text,
  - no raw edge-function error toast appears,
  - removed cards are gone,
  - Sales Reps and Briefings tabs are visible inside the profile,
  - Enrichment Review shows correct readable pill styling.
- Capture Playwright screenshots and only then summarize the fix.