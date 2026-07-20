## What went wrong

- The properties page is sorting by `created_at desc`, so the newest March import batch is shown first.
- That batch contains many “In Binghatti …” rows with photos and handover only, but missing price, description, and payment plan. Because those rows were bulk-published, they now dominate the top of `/properties`.
- Recent developer cleanup nulled some `developer_id` links for projects whose developer record was removed/merged, which breaks logo joins even when the project still has a developer name.
- The card component currently has the description intentionally removed, so even records with descriptions do not display them on cards.
- The listing hook fetches the full catalog in serial pages before resolving, which causes the “empty first, then loads” delay.
- Some filter controls are still visually emerald but not fully locked to white text in the rendered page.

## Fix plan

1. **Stop unstable inventory from showing first**
   - Change the default sort from raw newest import time to a quality-weighted sort:
     - complete cards first: cover image + developer/logo + price + description + handover
     - then featured/premium
     - then newest
   - Keep search relevance and user-selected sort behavior intact.

2. **Restore visible card content**
   - Put the short description back on project cards with a fixed 2-line area so card heights stay aligned.
   - Show handover and payment plan only when real fields exist; do not invent values.
   - Keep “On request” only for records that truly have no price, but prevent those incomplete rows from dominating the first screen.

3. **Recover logos safely without fake fallbacks**
   - Fix listing queries to include enough developer fields for the existing logo resolver.
   - Add a safe name-based developer join fallback in the frontend only when `developer_id` is missing but `developer_name` matches a known developer already loaded in the app.
   - No building icon fallback and no project-photo-as-logo fallback.

4. **Improve loading speed**
   - Make `/properties` fetch the first 60–120 publishable cards first and render immediately.
   - Continue loading the rest in the background so filters still work across the full catalog.
   - Avoid blocking first paint on all 1,600+ rows.

5. **Fix filter contrast**
   - Add a local properties-filter contrast lock so emerald buttons and their child text/icons are forced pure white.
   - Validate it on the exact filter bar shown in your screenshot.

6. **Backend data restoration pass — controlled, not blind**
   - Prepare a restore query that only fills blanks on `projects` from existing `pending_project_imports` when names/developers match confidently.
   - Only fill missing fields (`price_from`, `description`, `handover_date`, `payment_plan`, etc.); never overwrite non-empty project fields.
   - Relink `developer_id` only where developer name matches an existing developer confidently.
   - Before applying, produce before/after counts of how many blank prices/descriptions/payment plans/logos will be fixed.

7. **Validation proof**
   - Use Playwright screenshots for `/properties` first viewport and scrolled card grid.
   - Screenshot must show: visible descriptions, fewer “On request” cards at the top, logos visible without building fallback, and filter pills with white text on emerald.

## Guardrail going forward

- I will not bulk publish, delete, relink, or overwrite project/developer data unless the change is scoped, previewed by counts, and only fills missing fields or has your explicit approval.