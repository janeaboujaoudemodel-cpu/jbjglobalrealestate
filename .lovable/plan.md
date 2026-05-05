# Relationships Hub — Brokerage parity + perf + redirect fixes

## What's actually wrong (verified in code)

1. **Document Pack invisible in Brokerages tab** — `<DocumentPackPanel />` IS mounted at `CRMRelationships.tsx:597` (top of `BrokeragesTab`), but its caption only mentions "developer registration" prominently and its container looks identical to the directory tools card right under it, so it visually disappears. There is no separate "Brokerage Outreach Settings" header.

2. **Slow tab switching** — both tabs use `forceMount` + `className="hidden"` (lines 1914-1915). That mounts `BrokeragesTab` AND `DeveloperRegistryTab` at the same time, each fetching its own 1000-row dataset, sorting, rendering 60 cards, plus mounting `DocumentPackPanel` twice. Tab switch is fast but **first paint** of the page is heavy and every cache invalidation re-renders both trees.

3. **"Kicked out → Media Ingestion" redirect** — there is a prominent gold `Media Ingestion` button at `CRMRelationships.tsx:1885-1892` placed right next to the page title. No auto-navigation in code; the button is being mis-clicked because it sits on the main header strip with the same gold styling as primary CTAs.

4. **`AdvancedFilterPanel` ref warning** — unrelated to CRM but spamming the console: `HorizontalUtilityBar` wraps `AdvancedFilterPanel` (a function component) inside a Radix `Tooltip`/`asChild` parent that forwards refs. Need `forwardRef` on the panel or wrap in a `<span>`.

## Plan

### A. Brokerage Document Pack — make it impossible to miss
In `CRMRelationships.tsx` `BrokeragesTab`:
- Wrap `<DocumentPackPanel />` in a labeled section: header `"Brokerage Outreach — Document Pack & Senders"`, sub-caption `"Same pack used for developer registrations. Edit once here or in the Developer Registry tab — they share one source of truth."`
- Pass an optional `context="brokerage" | "developer"` prop to `DocumentPackPanel` so the inside copy reads "brokerage outreach" first when mounted on the Brokerages tab.
- Add a collapsible (`open by default`) so once configured the user can collapse it to focus on the directory.

### B. Performance — stop double-mounting
- Replace `forceMount` + `hidden` with **lazy-then-keep-alive**: track `mountedTabs: Set<string>` in `CRMRelationships`. A tab mounts on first activation and stays mounted afterwards (so subsequent switches stay instant, but initial page load only mounts Brokerages).
- Extract `<BrokerageCard />` out of `BrokeragesTab.map(...)` and wrap in `React.memo` keyed by `r.id + r.updated_at` so quick status flips don't re-render the whole list.
- Same for `<RegistryRow />` in `DeveloperRegistryTab`.
- Memoize `BrokerageContactLinks` and the KPI strip (currently rebuilt every render).
- Add `useTransition` around `setQ` / `setStatusFilter` / `setEmirateFilter` / `setSourceTab` so typing/filter changes don't block the main thread.
- In `useCRMRelationships.ts`: confirm `useDeveloperRegistry` and `useBrokerages` use `placeholderData: (prev) => prev` (already done) and add `refetchOnWindowFocus: false` to both — currently they refetch on focus and trigger full re-sort.

### C. Ghost redirect to `/admin/media-ingestion`
- Move the `Media Ingestion` button **out** of the page header into the Brokerages tab toolbar, demoted to `variant="outline"` with a smaller footprint. It will no longer be the first thing under the H1.
- Add `onClick` confirm only when there are unsaved Document Pack edits (so the user is never silently navigated away mid-edit).
- Also audit `MainLayoutWrapper` / `AdminBypass` / `ActionGateContext` for any effect that could call `navigate("/admin/media-ingestion")` — none found in the current grep, so the fix is purely UX placement.

### D. Console noise — `AdvancedFilterPanel` ref warning
- Convert `AdvancedFilterPanel` to `forwardRef` (accept and ignore the ref, or attach to the outer Dialog wrapper). This silences the React warning seen on every render of `HorizontalUtilityBar`, which currently bloats every navigation.

## Files to touch
- `src/pages/CRMRelationships.tsx` — sectioned Document Pack on Brokerages, lazy-keep-alive tabs, memoized cards, `useTransition`, relocated Media Ingestion button.
- `src/hooks/useCRMRelationships.ts` — `refetchOnWindowFocus: false` on both list hooks.
- `src/components/filters/AdvancedFilterPanel.tsx` — `forwardRef` wrap.
- (No DB migration, no edge function changes.)

## Out of scope
- No changes to send pipelines (already share `crm_owner_settings`).
- No changes to brokerage data model.
