## Plan

1. **Restore Relationship Hub as its own page**
   - Keep the sidebar item `Relationship Hub` pointing to `/owner/crm/relationship-hub`.
   - Make the standalone Relationship Hub use the previous full-page style, not the embedded Unified CRM panel.
   - Remove/avoid embedding the full Relationship Hub inside the CRM entity tabs for Developers/Brokers/Agencies so it no longer opens the same CRM screen and no longer nests a full page inside another page.
   - Update legacy redirects carefully so old URLs still land in the correct page or correct CRM entity.

2. **Fix the “This panel failed to load / stageFilter is not defined” crash**
   - Audit the CRM lead/status filter path and replace any stale `stageFilter` assumptions with the current `stageMulti` state model.
   - Add a defensive fallback so a missing/invalid status filter cannot crash the CRM body.
   - Verify all CRM tabs render without the error boundary.

3. **Make investor visibility real and consistent**
   - Ensure the Investors tab appears as a first-class CRM entity.
   - Align the Investors badge/count with the actual rows shown in `InvestorsDirectory` by counting the same real sources (`crm_leads` investor flags/tags plus `client_investors`) and excluding owner/test records.
   - Avoid the current mismatch where the tab can show a count but the directory looks empty or incomplete.

4. **Improve CRM loading performance**
   - Reduce CRM count loading from many individual head-count requests into a cheaper consolidated path where possible.
   - Keep realtime refresh debounced, but avoid heavy full reloads on every small change.
   - Prevent Relationship Hub from mounting inside Unified CRM unless it is actually needed, because it currently loads very large tables and slows the CRM page.

5. **Restyle the CRM lead UI back to champagne/ink**
   - Replace blue/green/purple/black-looking status/action treatments on the lead table with the project’s champagne surfaces, ink text, and gold hairline borders.
   - Keep semantic colors only where required by project memory, but make them restrained and not “button-like” blocks.
   - Fix faded dropdown text by enforcing solid ink text, champagne backgrounds, visible hover/active states, and no white-on-light controls.
   - Keep action buttons (mail/call/message/agreement) as one clean icon cluster with matching champagne styling.

6. **Validate and provide proof**
   - Use the browser preview after implementation to verify:
     - `/owner/crm` loads with no panel crash.
     - `/owner/crm/relationship-hub` opens the previous standalone Relationship Hub style.
     - Investors are visible from the CRM tab and count matches displayed rows.
     - Dropdowns and action buttons no longer use the ugly multi-color/faded style.
   - Capture a combined before/after proof image in one screenshot-style artifact so you can compare the broken state against the fixed state.

## Technical notes

- Primary files likely affected:
  - `src/routes/OwnerRoutes.tsx`
  - `src/components/owner-dashboard/OwnerSidebarNav.tsx`
  - `src/pages/owner/crm/UnifiedCRM.tsx`
  - `src/pages/CRMRelationships.tsx`
  - `src/hooks/useCRMSectionCounts.ts`
  - `src/components/crm/InvestorsDirectory.tsx`
  - `src/components/crm/CRMLeadsTableV2.tsx`
  - `src/components/crm/InlineStatusSelect.tsx`
  - `src/components/crm/LeadStatusBadge.tsx`
  - `src/components/crm/ExcelGridView.tsx`

- No database schema changes are planned unless validation shows the investor data source itself is missing required fields or access policies.
- The implementation will preserve existing CRM features/content under the project’s strict no-removal policy; the change is wiring, crash fix, data consistency, performance, and UI cleanup.