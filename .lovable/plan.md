## Plan: repair the Property Comparison tool properly

### What I found
- The Compare page has an early return before several hooks. That is causing the runtime error: `Rendered fewer hooks than expected` in `<Compare>`, which can make the unit view blank/crash.
- The unit toggle currently writes `?mode=units`; it should switch the visible section without a full navigation/reload feeling.
- The Unit Compare screen exists, but it depends on picking a project first, so it can look empty if the project picker has no default/demo path.
- A PDF export utility exists, but it needs to be surfaced and verified from the actual broker workflow.

### Implementation steps
1. **Fix the Compare hook crash**
   - Move all hooks in `src/pages/Compare.tsx` above conditional returns.
   - Keep unit/project branching after hook initialization so React never renders fewer hooks.

2. **Make Project/Unit toggle behave like section switching**
   - Keep the user on `/compare` while changing only the selected section state.
   - Preserve optional URL support (`?mode=units`) without triggering a page-style reload.
   - Ensure both “Compare Projects” and “Compare Units” are visible and switch instantly.

3. **Make Compare Units non-empty and broker-usable**
   - Add a clear first-screen state with project search plus quick sample/manual flow.
   - Keep the live table area visible, with guidance until units are added.
   - Ensure adding a unit immediately renders rows in `UnitComparisonTable`.

4. **Finish PDF export wiring**
   - Keep the “Export PDF” button in the live comparison toolbar.
   - Make it disabled only until a project and at least one unit exist.
   - Confirm the generated PDF includes JBJ/broker branding, project details, unit comparison table, and footer/signature-style page treatment.

5. **Validation**
   - Reproduce `/compare?mode=units` at the current 1178×891 viewport.
   - Confirm console no longer shows the hook error.
   - Click Projects → Units → Projects without reload/crash.
   - Add a unit and verify the comparison table appears.
   - Export a PDF and inspect the generated file path/output where possible.

### Files expected to change
- `src/pages/Compare.tsx`
- `src/components/compare/units/UnitCompareShell.tsx`
- Possibly small adjustments in `src/components/compare/CompareModeToggle.tsx` or `src/lib/compare/exportUnitComparisonPdf.ts` only if needed during validation.