## Goal

Polish the CRM into the "international big-CRM" feel the user expects: redesign the leads filter bar (no cramped boxes, no native blue-hover dropdowns), add inline Calendar/Notes/Tasks per lead, add quick status chips for hot/interested/junk/already-bought/closed-won, add bulk delete-all/restore-all in Lead Mgmt, expand the contract vault into typed contract folders with developer drill-down, kill the "Verifying access…" flash on intra-CRM navigation, and confirm the entity bar (Leads · Investors · Developers · Sales Reps · Brokers · Agencies · Employees) renders as the primary header.

## 1. Leads filter bar redesign

In `src/components/crm/CRMLeadsTableV2.tsx`:

- Replace all four native `<select>` (Stage / Source / Owner / Tag) with the shadcn `<Select>` component so dropdowns no longer overlay with the OS blue hover.
- Lift them into a 2-row toolbar inside a single champagne card:
  - Row 1: search input (full-width) + clear-filters button.
  - Row 2: Stage · Source · Owner · Tag · Date range — each `min-w-[160px]`, `h-10`, even `gap-3`, never touching borders. `bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#F7F2EA]`.
- Above the filters, add a horizontal "quick chips" strip with one-click pre-built filters: Hot · Interested · VIP · Already Bought · Deal Closed · Negotiation · Junk · No Response. Clicking a chip sets the matching `stageFilter`/`tagFilter` so the user does not need to open a dropdown.
- Group the Stage dropdown options under category labels (Positive / Neutral / Negative) using `<SelectGroup>` so the 20-stage list scans cleanly.

## 2. Inline Calendar / Notes / Tasks per lead row

In `CRMLeadsTableV2.tsx` row actions:

- Add three icon buttons next to the existing actions: `CalendarPlus`, `StickyNote`, `ListTodo`.
- Each opens a small popover (`<Popover>`) anchored to the row:
  - Calendar: title + datetime-local + duration; inserts into `crm_calendar_events` with `lead_id`.
  - Notes: textarea; inserts into `crm_notes` (or `crm_activities` typed `note`) with `lead_id`.
  - Tasks: title + due date + priority; inserts into `crm_tasks` with `lead_id`.
- Show counts on each icon (small badge) when items exist for that lead.
- Keep existing per-lead detail drawer untouched — these popovers are quick-add only.

## 3. Lead Mgmt — bulk Delete All / Restore All

In `src/components/crm/RecentlyDeletedLeads.tsx`:

- Add a sticky toolbar with: `Select all on page` checkbox, `Select across all results` link, then two buttons:
  - `Restore selected` (green) → bulk update `deleted_at = NULL`.
  - `Permanently delete selected` (red, requires typed-confirm "DELETE") → bulk delete row.
- Add `Restore all (N)` and `Empty trash (N)` buttons that operate on the entire filtered set, not just current page.
- Confirm modals always show the count and warn that `Empty trash` is irreversible.

## 4. Contract Vault — typed folders + developer drill-down

In `src/pages/owner/contracts/ContractVault.tsx`:

- Replace the single "All Developers" dropdown with a left-side rail of contract types (champagne pills, vertical):
  - All
  - Developer Registration
  - Developer–Agency (A↔A)
  - Client Sales Contracts
  - Client Reservation / Booking Forms
  - Leasing Contracts
  - Property Advertising Agreements
  - NDAs
  - Service / Consulting Agreements
  - Other
- Folder taxonomy stored in a column `contract_type` on the existing contracts table; if missing, infer from `template`/`title` patterns until a migration adds it. Default to `Other`.
- When the user picks `Developer Registration`, the right pane shows a developer-name dropdown (searchable combobox) listing only developers who have at least one registration contract; selecting a developer filters the list to that developer's contracts.
- When the user picks any other type that has a natural sub-key (e.g. Client Contracts → client name, Leasing → property), expose the matching searchable combobox in the right pane header.
- Performance fix for "stuck on click": defer the heavy developer list to a separate query, render the type pane immediately, and load the developer combobox lazily when its tab is opened. Cache developer list with React Query (`staleTime: 5min`).

## 5. Stop the "Verifying access" flash on intra-CRM nav

Root cause: `OwnerGuard` re-shows the splash whenever `ownerLoading` flickers on route/search-param change.

Fix in `src/components/OwnerGuard.tsx` (and `useAuth`):

- Cache the verified `isOwner === true` result for the session in a ref. Once we have ever resolved owner=true for this user, never show the splash again — only show it on the very first verification.
- Bump the grace period from 250 ms to 600 ms but only on the very first check.
- Ignore `ownerLoading` toggles caused by `refreshOwnerVerification` calls triggered by intra-page navigation (don't reset `showSplash`).
- Verify by clicking Leads → All Leads → Flagged → VIP repeatedly: no splash should appear.

## 6. Entity bar visibility

Confirm `UnifiedCRM` renders these tabs at the top header on `/owner/crm`: Leads · Investors · Developers · Dev Sales Reps · Brokers · Brokerage Agencies · Employees. If the user still does not see them, hard-refresh and verify in the running preview. If they remain hidden behind the global app header, increase the title row's top padding so the entity bar is not occluded by the 88px fixed header.

## 7. Update memory

Refresh `mem://features/crm/unified-owner-hub-standard` to describe the new toolbar, quick chips, inline lead actions, contract folders, and the once-per-session owner verification cache.

## Verification

After implementation, navigate to `/owner/crm` in the preview and confirm:
- Filter dropdowns are roomy, champagne-themed, and never overlay with blue.
- Quick-status chips filter the table instantly.
- Each lead row exposes Calendar / Notes / Tasks popovers that persist data.
- Lead Mgmt has bulk Restore/Empty-trash with confirmation.
- Contracts section opens immediately; type pills + developer combobox work; no spinner stall.
- No "Verifying access" splash when switching tabs inside the CRM.
- Entity bar (Leads · Investors · …) is visible above the context bar.

## Out of scope

- No changes to lead schema beyond optional `contract_type` inference helper.
- No backend logic changes to authentication itself — just the splash gating in `OwnerGuard`.
- Existing CRM features, panels, and routes remain — restyled and reorganized, never deleted.
