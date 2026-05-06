
# Relationship Hub — Bulk Upload, Views, Access Fix & Performance

## 1. Bulk database upload for Individual Brokers & Brokerages

### Schema additions (one migration)
Add to `crm_brokerage_agents` and `crm_brokerages`:
- `expertise_type` text — `'leasing' | 'selling' | 'both'` (default `'both'`)
- `expertise_areas` text[] — multi-select areas (Dubai Marina, Downtown, JVC, Business Bay, Palm, etc.)
- `import_batch_id` uuid — group rows from same upload
- `import_label` text — friendly batch name shown in filters

New table `crm_import_batches`:
- `id`, `owner_id`, `target` (`brokers` | `brokerages`), `label`, `strategy` (`merge` | `separate` | `replace`), `default_expertise_type`, `default_expertise_areas[]`, `row_count`, `inserted`, `updated`, `skipped`, `status`, `created_at`.

RLS: owner-only (matches existing pattern).

### New `<UniversalImportDialog />` (replaces ad-hoc dialogs)
Step wizard:
1. **Drop files** — accepts multiple `.csv` / `.xlsx` / `.xls`, no row cap. Parsed in a Web Worker via `xlsx` (already in deps) so 33k rows don't freeze the UI.
2. **Strategy** — radio:
   - *Merge all into one batch* (default)
   - *One batch per file* (each file becomes its own labelled batch / category)
   - *Append to existing batch* (pick from dropdown)
3. **Tagging (mandatory)** — for each batch:
   - Expertise type: Leasing / Selling / Both
   - Area(s) of expertise: tag input with autocomplete from existing values
   - Optional batch label (e.g. "JVC Leasing Specialists – Oct 2026")
4. **Column mapping** — auto-detected (name, phone, email, brokerage, role, whatsapp) with manual override, preview first 10 rows.
5. **Server import** — new edge function `crm-bulk-import-brokers` (and reuse hardened `crm-import-dld-brokerages` for brokerage rows):
   - Server-side dedupe (paginated lookup, same pattern shipped last loop).
   - Inserts in 500-row batches with progress streamed back via SSE / polling.
   - Returns `{ inserted, updated, skipped, batchId }`.

Wired into:
- `IndividualBrokersTab.tsx` → "Upload database" button (next to existing Add Broker).
- `BrokeragesAgenciesView` in `CRMRelationships.tsx` → "Upload database" button.
- Single-broker "Add Broker" form also gains the **Expertise type** + **Areas** fields (mandatory).

## 2. Card view + Excel export — unified across Developers, Brokerages, Individual Brokers

New shared primitive `src/components/crm/EntityViewSwitcher.tsx`:
- Three modes: **Table** (current), **Cards** (champagne tile grid using `<IconTile />` standard), **Compact list**.
- View choice persisted per-section in `localStorage`.
- "Export to Excel" button in the header — uses `xlsx` to export the **currently filtered** rows with all visible columns + expertise fields. Filename: `{section}-{YYYY-MM-DD}.xlsx`.

Applied to:
- `IndividualBrokersTab.tsx`
- `BrokeragesAgenciesView` (in `CRMRelationships.tsx`)
- Developers tab (same page) — same switcher + export.

Cards show: avatar/logo, name, brokerage, expertise badges (Leasing/Selling), area chips, last contact, quick-actions.

## 3. Fix "Verifying access, please wait…" → kicked out bug

Root cause: `ExecutiveAccessGate` runs `has_role` RPCs while `AuthContext` is still hydrating the session after a token refresh. When the refresh races (see auth log: `bad_jwt` → `token_revoked` → re-login at 20:30:01), the RPC returns false and the gate flips to "Access denied" before `isOwner` resolves.

Fix:
- Add `useAuthReady()` hook that resolves only after `supabase.auth.getSession()` has returned **and** `onAuthStateChange` has fired at least once.
- `ExecutiveAccessGate` waits on `isReady` (no longer just `authLoading`), and treats `isOwner === undefined` as still-loading instead of denying.
- On RPC error (network / 403), retry once with backoff before showing the denied screen.
- Owner email match is checked **first** synchronously from the JWT claim, so the verified Owner never sees the gate at all.

Also fixes the related `Error creating session: 42P10` console error by adding the missing unique constraint `(user_id, session_key)` on the session-tracking table referenced by the upsert (`ON CONFLICT` target).

## 4. Performance — remove lazy loading on hot routes

- Replace `React.lazy` + `Suspense` for `/crm/*`, `/relationships`, `/admin/*` and the home shell with eager imports (kept lazy for low-traffic standalone tools).
- Add `<link rel="preload" as="fetch">` for the brokerages JSON in `index.html`.
- Move heavy CSV/XLSX parsing to a Web Worker (`src/workers/importParser.ts`) so the main thread stays at 60fps during 33k-row imports.
- Memoise table rows (`React.memo` + stable keys) in `IndividualBrokersTab` and brokerages grid; switch list rendering to `@tanstack/react-virtual` (already a sibling of installed deps) for >500 rows.
- Reuse existing paginated fetch (shipped last loop) so initial paint shows first 1k rows immediately, then streams the rest.

## 5. Verification before I confirm done

- Manually import a 33k-row sample CSV — confirm full count lands, batches tagged, no UI freeze.
- Toggle Card / Table / Excel export on all three sections.
- Sign out → sign in → reload `/crm/relationships` 5× — confirm no "Access denied" flash.
- Lighthouse on `/crm/relationships` — target TBT < 300ms, LCP < 2.5s.

## Files touched (preview)

- `supabase/migrations/<new>.sql` — schema + RLS for expertise + import batches
- `supabase/functions/crm-bulk-import-brokers/index.ts` — new
- `supabase/functions/crm-import-dld-brokerages/index.ts` — extend for expertise tagging
- `src/components/crm/UniversalImportDialog.tsx` — new
- `src/components/crm/EntityViewSwitcher.tsx` — new
- `src/components/crm/IndividualBrokersTab.tsx` — wire upload, view switcher, export, expertise fields
- `src/pages/CRMRelationships.tsx` — wire for Brokerages + Developers tabs
- `src/components/executive/ExecutiveAccessGate.tsx` — auth-ready fix
- `src/hooks/useAuthReady.ts` — new
- `src/workers/importParser.ts` — new
- `src/App.tsx` — eager import hot CRM routes

## Out of scope (won't touch)

- Filter UI (already shipped).
- DLD auto-sync (already live).
- Brokerage outreach document layout.
