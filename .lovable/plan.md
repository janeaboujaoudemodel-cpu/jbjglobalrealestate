# CRM Relationships — UI cleanup pass

Five focused changes scoped to the CRM Relationships page and the directory widget. All in presentation code — no schema or business-logic changes.

## 1. Developer tab → same Outreach dropdown + Upload list

In `src/pages/CRMRelationships.tsx` (developer toolbar, ~lines 1856–1929):

- Replace the standalone `Edit Template` button with `<OutreachActionsMenu />`, wired to:
  - `onSendSelected` → existing `setBulkOpen(true)` (guarded if `selected.size === 0`)
  - `onEditTemplate` → existing `setTplOpen(true)`
  - `onSendTest` → open existing TestSendDialog (add `testSendOpen` state, mirror brokerage tab)
  - `onActivityLog` → `navigate("/owner/crm/relationships/activity")`
  - `sendLabel="Send to Selected Developers"`
- Add an `Upload list` button + `<BulkUploadDialog kind="developer" />` (already implemented, just needs to be mounted on this tab).
- Remove the now-duplicated `Send to Selected` button at line ~1950–1957 (moved into menu) — keep `Reset to Not Started` and selection helpers as-is.

## 2. Collapse Outreach Queue / Sent History panels by default

Currently the queue's filter/toolbar block always renders. Wrap the inner content of both sub-tabs in `<Collapsible defaultOpen={false}>` with a header showing the count badge:

- `Outreach Queue (N)` — collapsed header at line ~1818, body = lines 1819–retain through end of queue block
- `Sent History (N)` — collapsed header wrapping `<SentHistoryView />` at line ~1811

Persist open state per tab to `localStorage` keys `crm.dev.queue.open` / `crm.dev.history.open` (default `false`). The existing `queueCollapsed` localStorage flag already exists — extend pattern.

Same treatment for the brokerage tab's `Outreach Queue` / `Sent History` sub-views if they share the structure (verify; they currently do not have explicit panels — skip if absent).

## 3. Contracts chip + panel next to Expired/Rejected

In the developer status chips row (lines 1963–1999):

- Add a synthetic `Contracts` chip after `Expired`. It is not a `status` value but a derived view: developers with `contract_signed_at` set OR `status === "registered"` AND `contract_url` present.
- Selecting the chip sets a new local state `view === "contracts"` and filters `queueIndexed` to that subset.
- Render a small "Contracts" panel above the cards listing each developer's contract link (download button) and signed date when the chip is active. If no contract field exists in DB, fall back to filter-by `outreach_stage === "contract_sent"` / `contract_signed`. Verify column names against `developer_registry` types before wiring; if missing, use `notes` substring fallback and add a TODO to introduce a real column later.

## 4. Single-line "Filters" popover

Compact the brokerage toolbar (lines 815–928) and developer toolbar (lines 1835–1930):

- Keep `Search`, `Outreach`, `Add` buttons inline.
- Move `Emirate`, `Region`, `Status`, `Email status`, `Exclude`, `View mode (Cards/Excel)` into a single `<Popover>` triggered by a `Filters (n active)` button. Reuse shadcn `Popover` already imported.
- Show a small chip strip below the bar listing each active filter with an `×` to clear individually.

## 5. Split UAE directory widget

`DirectoryToolsPanel` currently mixes brokerage + developer jobs. Split into:

- `BrokerageDirectoryPanel` — renders only `brokerage_seed` + `brokerage_enrich` jobs. Mounted on Brokerage tab.
- `DeveloperDirectoryPanel` — renders only `developer_enrich` jobs. Mounted on Developer tab.

Implementation: parameterize `DirectoryToolsPanel` with a `kinds: string[]` and `title` prop, then export two thin wrappers. The "Refresh now" button calls the same edge function but passes `{ action: "cron", kinds }` so the runner only triggers the relevant jobs (server already supports filtering — confirm; otherwise filter client-side display only and keep server behavior).

Replace the single `<DirectoryToolsPanel />` mount on the Brokerage tab with `<BrokerageDirectoryPanel />`, and add `<DeveloperDirectoryPanel />` to the Developer tab top.

## Files touched

- `src/pages/CRMRelationships.tsx` — toolbar restructure, collapsibles, contracts chip, two directory panel mounts
- `src/components/crm/DirectoryToolsPanel.tsx` — split into base + two wrappers
- `src/components/crm/CRMFiltersPopover.tsx` *(new)* — single-line filters popover, used by both tabs

## Verification

- Visit `/owner/crm/relationships`, switch to Developer tab → confirm Outreach dropdown + Upload list visible, queue/history panels start collapsed.
- Click Contracts chip → only contract-bearing developers shown.
- Open Filters popover → all secondary filters live there; toolbar stays one line at 1028px viewport.
- Brokerage tab shows brokerage-only directory widget; Developer tab shows developer-only widget.
- Run the project's a11y + contrast checks (already wired in CI) to ensure no regressions on the new popover/collapsibles.
