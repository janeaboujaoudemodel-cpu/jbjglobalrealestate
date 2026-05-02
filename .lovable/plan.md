I’ll fix this as an urgent stabilization pass, split into four parts:

1. Restore readability across backend, Properties, popups, and AI tools
- Add a stronger global contrast patch for dark surfaces so dark sections never render black/gray/brown text.
- Add/repair `data-surface="dark"`, `data-surface="champagne"`, or `data-surface="page"` wrappers where needed, especially:
  - Properties page hero and filter/list sections, excluding the homepage.
  - Owner/backend shell, vertical sidebar, backend content cards, dialogs, tabs, and select menus.
  - Pending Tasks popup.
  - Shared AI tool layout and the AI tool pages using black/zinc backgrounds.
- Convert broken gray-on-dark and black-on-dark text to guaranteed readable white/champagne, while keeping AI elements in the vivid purple theme and prices in `--price-orange`.
- Make buttons, badges, tabs, inputs, and popovers use consistent high-contrast champagne/ink/gold states.

2. Fix the CRM Relationships brokerage directory counts and loading failures
- Repair the brokerage data hook so it reliably returns the full brokerage directory instead of showing zero, including paginated reads and exact count handling.
- Add a visible “Directory status” summary showing:
  - All brokerages
  - UAE Directory
  - My Additions
  - Existing Matches
  - Per-emirate totals
- Update the current “All” tab so it always reflects actual available brokerages, not just filtered or currently visible rows.
- Stop indefinite loading spinners: directory sync/enrichment buttons will show a timeout-safe state and a clear error if the backend call fails.
- Review the backend functions for `seed-uae-brokerage-directory`, `enrich-uae-brokerage-directory`, and `enrich-developer-registry` and fix error handling, request validation, and result summaries.

3. Add the brokerage/developer directory data and outreach features directly
- Add persistent fields needed for richer directory cards, if missing:
  - `star_rating`
  - `estimated_agent_count`
  - `directory_rank` / priority where useful
  - `last_directory_sync_at` / verification metadata where useful
- Populate/normalize the existing brokerage directory records with approximate agent counts and star ratings where known or safely inferred.
- Add a one-click message button on every brokerage card:
  - Opens a preview modal before sending.
  - Includes “send test to me” first.
  - Then supports sending to the agency when contact details are available.
- Extend the same preview/test/send flow to developer registry cards.
- Improve bulk automation so brokerages and developers support clearer select-all, preview, test-send, and confirm-send flows.
- Keep contact information protected inside owner/admin CRM only; nothing public will expose private broker/developer contact details.

4. Fix Developer Registry queue behavior
- Make Outreach Queue expanded by default and remove the unnecessary “Click to expand” requirement for that section.
- Keep collapsible “Click to expand” behavior only where requested: Document Pack and Outreach Settings.
- Ensure developer names/cards render immediately under Outreach Queue.
- Make the queue tabs and counts use high-contrast champagne/ink styling.

Technical notes
- Database/schema changes will be done through a migration only for new columns/structure.
- Existing data population/normalization will be done as data operations, not as schema migrations.
- Backend functions will continue to validate owner access server-side.
- I will not touch the homepage hero while fixing other hero sections.
- I will not remove existing features; this is a repair/restyle/enhancement pass only.