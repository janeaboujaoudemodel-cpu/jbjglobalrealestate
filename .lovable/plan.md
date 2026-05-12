## Plan

### 1. Make Forms & Agreements the single canonical e-signature workspace
- Move the owner e-signature experience into the owner shell so it always uses the backend/owner sidebar, not the public/front-site vertical navigation.
- Canonical routes:
  - `/owner/documents/forms`
  - `/owner/documents/forms/:id`
  - `/owner/documents/forms/create`
  - `/owner/documents/forms/signature-studio`
  - `/owner/documents/forms/blank-letter`
  - `/owner/documents/forms/contract-review`
- Redirect legacy `/e-signature...` owner/admin paths to the matching `/owner/documents/forms...` path.
- Keep public signing routes unchanged: `/sign/:token` and `/documents/sign/:token`.
- Update every internal link from CRM, Forms & Agreements, header/footer/toolkit shortcuts, and blank-letter/create flows to the canonical owner route.

### 2. Clean and organize backend/front-end vertical sidebars
- Reorganize `OwnerSidebarNav` into clear non-duplicated divisions: Core, CRM, Documents & Agreements, Properties, Communication, AI & Automation, Creative, Admin, Security/System.
- Remove duplicate entries that open the same content under different labels.
- Make the owner sidebar active-state logic match full path + query params consistently so CRM/forms pages do not highlight or expand the wrong section.
- Keep the public/front-site vertical nav separate and ensure owner-only tools point to owner-shell routes, not public shell routes.

### 3. Fix the PAA preview logo and document dividers
- Replace the hardcoded remote logo URL in the PAA HTML with the already imported inline monogram data URI so preview, PDF export, and print/download cannot show a broken image.
- Remove the duplicate small divider under the document title and the extra title/body divider.
- Keep exactly one full-width header hairline and one full-width footer hairline.
- Remove the smaller footer divider while preserving the full-width footer border.
- Bump the PAA layout version so draft agreements regenerate with the corrected chrome.

### 4. Fix print/open behavior without popup blocking
- Keep print/download inside the user gesture chain: create object URLs synchronously after rendering and trigger a same-tab download/open flow instead of delayed `window.open` calls.
- Ensure owner e-signature pages are exempt from anti-capture/print blocker behavior for owner sessions.
- Keep the print-blocker guard defensive, but avoid overriding the PAA iframe/document preview in a way that breaks layout.

### 5. Complete CRM lead visibility and filter fixes
- Ensure `All Leads` fetches real leads even when no per-user state row exists; default missing state to `new`.
- Reset stage/tag filters for the `all` view so real leads are not hidden by stale filters.
- Add a clear “filtered out by…” message only when leads exist but current filters hide them.
- Preserve the no-fake-data guard.

### 6. Finish CRM stage/source/dropdown/assignee polish
- Stage dropdown: colored chips by status, with positive/interested/hot as green.
- Source display: no more `...`; show readable source chips and a `+N` popover for long/multiple sources.
- Dropdown/hover surfaces: champagne backgrounds, gold hairline borders, ink text.
- Replace every visible `Unassigned` label with:
  - `Me` when assigned to the current owner/user
  - broker display name when assigned to a broker
  - `Pool` when no broker is assigned
- Add `Assignee` filter options: Me, Any broker, Pool, and per-broker entries.

### 7. Add CRM distribution and AI next-actions
- Create a dedicated `LeadDistributionStrip` above the leads table showing total, with me, assigned to brokers, pool, junk, and per-broker counts.
- Create `CRMAINextActions` under the strip with actionable cards for stale leads, junk cleanup, hot follow-ups, and broker distribution imbalance.
- Add a protected backend function for AI suggestions using Lovable AI and owner authentication.
- Add a small owner-scoped cache table for suggestions with RLS so suggestions refresh safely without excessive AI calls.

### 8. Remove the inner CRM vertical sub-sidebar
- Keep the CRM experience horizontal inside `/owner/crm`.
- Replace remaining inner vertical CRM rails/sub-sidebars with horizontal pills/tabs.
- Preserve all existing CRM content and routes; only change layout/navigation presentation.

### 9. Phase 2 CRM upgrade foundation
- Introduce a cleaner lead-grid structure that can evolve toward a virtualized 2026 CRM without deleting current features.
- Consolidate overlapping lead/list/filter logic behind reusable helpers/components.
- Add mobile-safe card/table behavior for leads so the CRM remains usable on smaller screens.
- Keep changes incremental and safe: no feature removal, no fake placeholders, no role/security shortcuts.

## Technical details
- Main files: `OwnerRoutes.tsx`, `AdminRoutes.tsx`, `OwnerSidebarNav.tsx`, `GlobalVerticalNav.tsx`, `DocumentsFormsHub.tsx`, e-signature pages, `jbjPropertyAdvertisingAgreement.ts`, `useEsignTemplates.ts`, `CRMLeadsTableV2.tsx`, `UnifiedCRM.tsx`, CRM relationship/list components.
- New CRM files: `LeadDistributionStrip.tsx`, `CRMAINextActions.tsx`.
- Backend: migration for `crm_ai_suggestions` and a protected `crm-ai-next-actions` function using existing owner auth patterns.
- Verification: open `/owner/documents/forms`, open Omar’s agreement, confirm logo/dividers/print/download; open `/owner/crm?entity=leads&view=all`, confirm leads, filters, sources, assignees, distribution strip, AI cards, and no inner vertical sub-sidebar.