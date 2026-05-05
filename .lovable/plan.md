## Goal

Three deep fixes inside `/owner/crm/relationships`:

1. **Add Document Pack & Outreach Settings to the Brokerages tab** (same UI as Developer Registry).
2. **Make the entire Relationships Hub feel instant** — tabs, sub-tabs, enrichment, agency extraction, opening Edit forms, filtering.
3. **Audit + clean the Brokerages view**: remove the redundant "UAE Real Estate Agency" badge, and confirm no developer-only data leaks into the Brokerages tab.

---

## 1. Brokerage Document Pack & Outreach Settings

`DocumentPackPanel` is currently only mounted at the top of `DeveloperRegistryTab`. It already reads/writes `crm_owner_settings` (Drive link, From name, saved sender emails, saved CC emails) — these settings are **already shared** with the brokerage send pipeline (`crm-send-brokerage-outreach` reads `active_cc_emails`).

Action:

- Mount `<DocumentPackPanel />` at the top of `BrokeragesTab` (above `DirectoryToolsPanel`), wrapped in a small "Outreach settings" header so it reads as: *"Set this once — used for every developer + brokerage outreach"*.
- Tweak the panel copy slightly: change the lead sentence from "Trade Licence + RERA + MOU pack" to "Used for both developer registration and brokerage partnership outreach" so it doesn't feel developer-only.
- No schema change — same `crm_owner_settings` row drives both tabs.

---

## 2. Speed audit — Relationships Hub feels slow

Findings from the current code:

| Area | Current behavior | Why slow |
|---|---|---|
| Brokerages ↔ Developer Registry tabs | Already `forceMount` + CSS hide. Good. | OK. |
| Outreach Queue ↔ Sent History sub-tabs | Already CSS-toggled. Good. | OK. |
| Filtering brokerages | `filtered` recomputes + sorts on every keystroke against full list (often 1k+ rows). Search input is debounced 220ms — but `sortBrokeragesForDirectory` runs every recompute. | Heavy sort on each pass. |
| Brokerage cards | All filtered cards render in a flat list (no virtualization). Each card has KPI strip, contact links, AI star, etc. | Hundreds of cards mounted at once → slow scroll + slow filter updates. |
| `openEdit(r)` on a brokerage | Opens the dialog **then** awaits `crm_brokerage_agents` over the network before the form is interactive. | Dialog feels frozen for ~500ms. |
| Status dropdown change | `useQuickStatusUpdate` invalidates `crm-brokerages`, `crm-clients`, `crm-dev-registry` together → full refetch of all three lists. | Every status flick reloads ~thousands of rows. |
| Enrichment buttons | Mutations re-`invalidateQueries(['crm-brokerages'])` / `['crm-dev-registry']` → full pagination loop runs again. | Re-pulls every row even when one row changed. |
| `useDeveloperRegistry` | Paginates 1000-by-1000 with no `keepPreviousData`; first refetch re-renders the empty state. | Switching feels like a reload. |

Fixes:

1. **Memoize sort separately from filter** in `BrokeragesTab`: do the heavy `sortBrokeragesForDirectory(data)` once per `data` change (not per keystroke), then filter the sorted array.
2. **Virtualize long card lists** with a lightweight windowing approach (`react-virtual` is already in lockstep deps; otherwise render only first 60 rows + a "Show more" sentinel that grows on scroll). Apply to both Brokerages card list and Developer Registry card list.
3. **Optimistic `useQuickStatusUpdate`**: write directly into the React Query cache for the affected entity (`setQueryData`) instead of invalidating all three relationship caches. Drop the cross-entity invalidation entirely.
4. **Optimistic + targeted invalidation in enrichment hooks** (`useEnrichDeveloperRegistry`, `useEnrichUaeBrokerageDirectory`, `useUpsertBrokerage`, `useUpsertDeveloperRegistry`): merge returned rows into the cached array via `setQueryData` instead of full `invalidateQueries`. Keep `invalidate` only as a fallback if the response doesn't carry the row.
5. **Open-Edit responsiveness**: open the dialog with whatever data we already have (cached agents from a new `useBrokerageAgents(brokerageId)` query with `staleTime: 60_000`); show a skeleton row while it loads; never block the dialog on the network.
6. **`useDeveloperRegistry`** — add `keepPreviousData: true` and a `placeholderData` of the previous value so tab/sub-tab switches do not flash an empty list. Same for `useBrokerages`.
7. **Memoize `BrokerageCard` / `RegistryRow`** as `React.memo` components so a single status change does not re-render the whole list.
8. **Defer non-critical chrome**: `RegistryDebugBanner` already early-returns when not enabled — confirmed fine.

Result: filtering, status flips, opening Edit, switching sub-tabs all stay sub-100 ms even on the full data set.

---

## 3. Brokerages tab — content audit

- **Remove "UAE Real Estate Agency" pill** (line ~756 of `CRMRelationships.tsx`) on each brokerage card. The whole tab is brokerages already; we keep the existing "Verified Match" / "My Addition" badges since they convey new info.
- **Audit "developer" leakage**: confirmed — the Brokerages card uses `r.represented_developer_name` only inside the search haystack and nothing developer-specific renders on the card itself. We will leave `represented_developer_name` searchable (useful) but will **not** render any developer-pill/label on brokerage cards. No other developer data flows in.
- Tighten contrast of small captions and KPI labels (`text-[#1A1A1A]/70` is fine; spot-fix any `/60` we find).

---

## Files to touch

- `src/pages/CRMRelationships.tsx` — mount `DocumentPackPanel` in `BrokeragesTab`, remove "UAE Real Estate Agency" pill, refactor `filtered` (sort outside filter), wrap rows in `React.memo`, add simple windowing, make `openEdit` non-blocking.
- `src/hooks/useCRMRelationships.ts` — optimistic `setQueryData` updates in `useQuickStatusUpdate`, `useUpsertBrokerage`, `useUpsertDeveloperRegistry`, `useEnrichDeveloperRegistry`, `useEnrichUaeBrokerageDirectory`; add `placeholderData` to `useDeveloperRegistry` & `useBrokerages`; new `useBrokerageAgents(id)`.
- `src/components/crm/EmailListEditor.tsx` — no change.
- No DB migration needed.

---

## Out of scope

- No changes to actual outreach email content / templates.
- No changes to the Activity Log page (already unified in earlier work).
- No new tables or RLS edits.
