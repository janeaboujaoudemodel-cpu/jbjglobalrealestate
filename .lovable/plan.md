## Fixes for the CRM header pills, leads table layout, and side rail

### 1. VIP pill shows "2" but the VIP view is empty

The badge in `src/pages/owner/crm/UnifiedCRM.tsx` reads `counts.vip` from `useCRMSectionCounts`, which queries `crm_leads` with `vip=true AND deleted_at IS NULL`. The live database has **0 VIP leads** (verified), so the displayed `2` is stale data persisted in the module-level `cache` object across navigations / hot reloads.

Fix:
- In `src/hooks/useCRMSectionCounts.ts`, drop the long-lived module `cache` for the VIP/flagged counters (or shorten TTL to a few seconds and always refetch on mount with `force=true`) so the pill reflects the real DB state.
- Make the pill self-correct: in `UnifiedCRM.tsx`, when the table-side query returns `0` for `vip`, push `0` back into the counts hook (via the existing `refresh()`) so the badge clears immediately after opening the view.
- Confirm: the VIP pill disappears when there are no VIP leads (badge already hides on `c === 0`), and the count matches what the table renders.

### 2. Horizontal scroll on the leads table shows "No leads found"

In `UnifiedCRM.tsx` the body wrapper is `<div className="p-3 md:p-5 overflow-x-auto">` *outside* the table. When the user scrolls horizontally to read columns past Email/Source, the empty-state panel (which is wider than the viewport) is what's actually being scrolled, or the inner table re-renders an empty body.

Fix:
- Move horizontal overflow onto the table container itself inside `CRMLeadsTableV2.tsx` (wrap the `<Table>` with `overflow-x-auto` and a `min-w-[1200px]` table) instead of relying on the parent.
- Remove `overflow-x-auto` from the outer body in `UnifiedCRM.tsx` so only the data grid scrolls horizontally; the empty state stays centered.
- Verify by scrolling: rows remain visible end-to-end and "No leads" only renders when the dataset is truly empty.

### 3. Big gap between Email and Source columns

The Source column header has a large fixed width while Email has `flex-1`-style growth, leaving an empty stretch.

Fix in `CRMLeadsTableV2.tsx`:
- Tighten the Email column to `min-w-[220px]` and let Source sit immediately after with `w-[140px]`.
- Add a thin champagne divider (`border-r border-[#B89555]/15`) between sibling cells so columns feel connected.
- Keep the cell content rule the user already approved: when an image/avatar is present keep the avatar tab; when missing, collapse the avatar slot so the row doesn't leave a hole.

### 4. Shortcuts rail button — icon only

In `src/components/crm/CRMSideRail.tsx` the edge dock button currently shows a `LayoutGrid` icon followed by the word "Shortcuts" on `md+` screens.

Fix:
- Remove the `<span>Shortcuts</span>` label from the dock button so only the icon is visible at every breakpoint.
- Keep the `title="Workspace shortcuts — Calendar, Notes, Tasks"` tooltip and `aria-label` for accessibility.
- Tighten padding to a square pill (`p-2.5`) so it reads as an icon button.

### Verification
- Reload `/owner/crm`: VIP pill is hidden (count = 0).
- Scroll the leads table left/right: all columns reachable, rows remain in place, no false "No leads" message.
- Inspect Email → Source spacing: tight, no large void.
- Side rail tab: icon-only square button, tooltip on hover.
