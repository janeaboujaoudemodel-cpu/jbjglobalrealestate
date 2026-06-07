Plan to complete the pending work

1. Fix Compare Units so it is usable immediately
- Keep the current dark AI comparison theme and colors.
- Show a live editable comparison table as soon as one project is selected, even before units are added.
- Add default sample rows/columns for Studio, 1 BR, and 2 BR so the page is never visually empty.
- Make each unit column editable directly from the table or via an Edit action.
- Keep the selected project and developer locked as shared context for every unit.
- Add clear actions above the table: Add Unit, Manage Fields, Export PDF, Save, Share.
- Ensure Export PDF is available for the live preview/default table and for user-added units.

2. Upgrade the unit comparison table structure
- Columns: Studio / 1 BR / 2 BR / 3 BR or custom unit labels.
- Shared project rows: Project name, Developer, Location, Handover, Payment plan.
- Unit rows: Bedrooms, unit number, floor, view, size, price, price/sqft.
- Investment rows: DLD fee, down payment, monthly installment, construction total, post-handover total, installment count, estimated yield/ROI placeholders where data is unavailable.
- Highlight best value by lowest price/sqft and strongest payment-plan affordability.

3. Fix Add Unit dialog usability
- Improve the low-contrast labels/buttons in the modal while preserving the existing dark/purple theme.
- Add Edit Unit support so users can correct unit details after adding them.
- Keep manual entry simple: label, bedroom type, size, price, view, floor, unit number.

4. Fix Compare Projects metrics/table
- Keep the existing preview table style but make the real comparison table match the same metric-first layout.
- Add missing metric rows: price/sqft, estimated rental yield, handover, payment plan, AI smart rating, risk score, developer tier, location strength, service charge, DLD fee, and best-for investor profile.
- Make the preview/export actions available consistently where a table is visible.
- Fix any contrast problems in the real compare-projects table caused by white text on champagne backgrounds.

5. Complete pending Property Measurement fixes from the prior prompt
- Confirm photo upload, video upload, and Download Report are visible in the user flow.
- Fix the backend/frontend mismatch where videos are accepted in the UI but only images are sent to the AI. If video files are uploaded, extract/send supported frames or clearly handle them so the flow does not fail.
- Keep the existing green/black UI and only preserve the property-name contrast fix already requested.

6. Visual and technical validation proof
- Navigate as a user through /compare?mode=units.
- Screenshot proof at these stages:
  1. project selected and editable preview table visible
  2. add/edit unit dialog
  3. table populated with Studio/1BR/2BR-style unit columns
  4. export action available
  5. compare-projects metric table view
- Technically validate:
  - no console errors
  - project search works
  - add/edit unit updates the table
  - export PDF triggers from preview and populated table
  - measurement tool still accepts photos/videos and report download is reachable

Files expected to change
- src/components/compare/units/UnitCompareShell.tsx
- src/components/compare/units/UnitComparisonTable.tsx
- src/components/compare/units/AddUnitDialog.tsx
- src/lib/compare/unitFieldsConfig.ts
- src/lib/compare/exportUnitComparisonPdf.ts
- src/pages/Compare.tsx
- src/pages/PropertyMeasurement.tsx
- supabase/functions/property-measurement/index.ts, only if required for video handling

No changes to branding, colors, routing, access rules, or unrelated UI.