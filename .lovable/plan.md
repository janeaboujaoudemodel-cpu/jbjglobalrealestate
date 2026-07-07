# Amra Project Page — Fix Plan

Scope is the public project detail page (Amra) and the shared components it uses. Every fix ends with a Playwright screenshot on `/projects/amra-integrative-wellness-resort` (desktop 1280 + mobile 390) saved to `/mnt/documents/amra-fixes/`.

## 1. "Blocked by Google" on Fact Sheet, Payment Plan, Floor Plan, Map, WhatsApp

Root cause: PDFs are rendered inside `<iframe src="https://docs.google.com/gview?...">` (Google Docs viewer). Google blocks embedding when the source URL is on a domain not whitelisted, or when the file is behind Supabase signed-URL auth. Same class of issue for Maps (referrer-restricted managed key on custom domain `jbj.ae`) and WhatsApp deep links (blocked by CSP/`target=_blank` popup blocker).

Fixes:
- **PDF viewer:** replace Google gview iframe with in-app PDF.js rendering (`react-pdf` already in deps) so files stream directly from Supabase Storage — no third-party embed. Files touched: `src/components/project-detail/DocumentViewerModal.tsx`, `ProjectDocumentsSection.tsx`, `FloorPlansSection.tsx`.
- **Google Map:** the managed Maps key is restricted to `*.lovable.app`. On `jbj.ae` it returns `RefererNotAllowedMapError`, which reads as "blocked". Two-part fix: (a) surface a clear inline message with a "Open in Google Maps" fallback link built from lat/lng so the map area is never a dead grey box; (b) tell the user in the response that a custom Google Maps key is required for `jbj.ae` (managed key cannot be extended) and offer to walk them through it — cannot be code-fixed alone.
- **WhatsApp:** switch all `wa.me` links to `https://api.whatsapp.com/send?phone=...&text=...`, add `rel="noopener"` and remove the intermediate `window.open` calls that trigger popup blockers. Files: `src/components/WhatsAppCTA.tsx`, project detail contact buttons.

## 2. Price + Plot Formatting

Current: `2,900,000` shows without unit; starting price shows single value.
Fix in `ProjectHeroSpecs.tsx` / `ProjectPriceBlock.tsx`:
- Plot: label `Plot size`, value `2,900,000 sq ft` (comma-formatted via existing `formatNumber` util).
- Starting price: read `price_min` and `price_max` → render `From AED 699,000 up to AED 4.7M`.
- Backfill Amra row in DB so `price_min=699000`, `price_max=4700000`, `plot_size_sqft=2900000`, `plot_size_unit='sqft'`.

## 3. "Mixed Use" Property Type

Investigate `projects.property_type` for Amra. If auto-classified wrong, correct to `Residential Resort` (matches fact sheet). Add tooltip on the chip explaining categories so the label is meaningful.

## 4. Developer Logo Frame

- Remove the white `bg-white` box behind the logo in `DeveloperCard.tsx` / `DeveloperBadge.tsx`; use transparent PNG on the champagne/emerald frame directly.
- Re-apply the metallic-gold animated frame primitive (`.jj-metallic-frame` from `mem://ui-ux/visual-standards/metallic-gold-cta-primitive`) to every developer badge instance: project page developer section, area page developer chips, developer detail hero.
- Run through Citi Developers logo asset: ensure background is stripped (re-export via `imagegen--edit_image` with transparent bg if the stored file has white).

## 5. Standard Inclusions Missing "City Buddy" Robot

The uploaded fact sheet mentions City Buddy. Re-parse `AMRA - Fact Sheet.pdf` via `document--parse_document`, extract the standard-inclusions list, and upsert into `project_inclusions` for Amra so it renders in the Standard Inclusions section.

## 6. Floor Plan Rendering + Structured Payment Plan

- **Floor plans:** render each PDF page as an image (pdf.js `page.render` to canvas → data URL) in a gallery grid, in addition to the download link. Component: new `FloorPlanGallery.tsx` replacing the current iframe.
- **Payment plan:** parse `AMRA_Phase_2_Payment_Plan_2_Pages.pdf` into structured milestones (`{label, percent, trigger}[]`) stored in `projects.payment_plan_structured`. Render as the previous premium horizontal strip (10% / 30% / … / handover) with an info circle that opens a breakdown modal. For 100% cash plans, render a single pill "100% on booking — cash discount applicable".
- Both listing card and project page consume the structured version instead of raw text.

## 7. Contrast + Alignment Fixes

- **Payment Plan section icon** (project page + 100% cash pill icon): force `text-white` (currently inherits `text-foreground` and renders black on emerald). File: `PaymentPlanSection.tsx`.
- **"Same developer / Same area / All nearby" tabs**: rebuild as a single connected segmented control (`SegmentedTabs` primitive) with balanced padding top/bottom, separators between segments, sitting inside the section header with equal breathing room. File: `OtherProjectsInArea.tsx`.
- **Map price pill**: replace generic "1M" with `AED 699K` (from `price_min`) for own projects; on hover show tooltip `Amra Integrative Wellness Resort — JVC`. Fix the broken vertical arrow (CSS `transform: rotate` on wrong element) in `MapPricePin.tsx`. Ensure click routes to the correct project slug — currently redirects to unrelated coords because pin uses centroid instead of project geo.

## 8. Validation (mandatory)

Playwright script `/tmp/browser/amra-qa/run.py` navigates to Amra on both preview and simulated custom-domain host, screenshots: fact sheet modal, floor plan gallery, map + hover, payment plan strip, developer badge, price header, other-projects tabs. Diff against the six user-uploaded screenshots. Save proofs to `/mnt/documents/amra-fixes/` and list any remaining issues before reporting done.

## Technical notes

- New deps: none (react-pdf + pdfjs-dist already installed — verify).
- DB migration: add `payment_plan_structured jsonb`, `plot_size_sqft numeric`, `plot_size_unit text` to `projects` if not present, with `GRANT`s per the public-schema-grants rule.
- Edge function `parse-project-doc` extended to emit structured payment-plan JSON + inclusions list.
- Google Maps custom-domain key: cannot be auto-fixed. Response will call this out and offer guided setup via `standard_connectors--connect`.
