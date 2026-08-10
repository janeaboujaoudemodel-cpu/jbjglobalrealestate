# Project page repair: data accuracy, payment plans, layout and document sections

## What is wrong today (verified)

- **AGUA record is wrong.** The database stores AGUA in Umm Al Quwain with a `10 / 40 / 50` plan and bedrooms 0–3. You state the truth is **3 and 4 bedrooms, full cash payment with an exclusive 20% discount on original price**, on Dubai Islands.
- **ARYA has no real plan** — its payment plan field is literally `TBD`, so cards fall back to generic text.
- **Allura (Citi Developers, JVC) is a shell record** — its payment plan field is the placeholder string `Payment Plan`, no bedrooms, no description. That is why "Alura" shows no project details.
- **Duplicate/ghost records exist** — unpublished scraper rows `In Arya Residences`, `In Aria`, `In Aria Heights` mirror real projects and pollute name matching and recommendation strips.
- **The mortgage note is generic.** The eligibility helper returns a fixed sentence per developer tier; the "30% post-handover balance" figure in the card is not read from the project's own plan, so it appears on projects that have no post-handover component (AGUA included).
- **Payment info now renders as a flat text label** on cards instead of the previous circular chip with an info reveal.

## What will be fixed

### 1. Data correctness
- Correct AGUA: bedrooms 3–4, Dubai Islands location, payment plan set to **100% cash with 20% discount on original price**, structured breakdown to match (single 100% on-booking stage, discount recorded as a plan note).
- Give ARYA and Allura their real plans and details; where a fact is not verifiable, leave the field empty rather than printing a placeholder — no more `TBD` or `Payment Plan` strings anywhere on screen.
- Unpublish/remove the ghost `In …` duplicate rows and add a guard so any future import that produces a near-identical name for an existing project is merged instead of inserted.
- Alura/Allura cover image: enforce building-first media selection — any cover whose image is classified as people/lifestyle is demoted and a building/render shot is promoted to cover. Applies to every project, not just this one.

### 2. Payment plan presentation (restore the circle + reveal)
- Replace the flat text label on cards with the previous **circular payment chip**: a compact circle showing the split, with an info affordance that opens the full stage-by-stage structure on click (booking / construction / handover / post-handover, with amounts).
- The reveal reads only that project's own breakdown. Projects with no verified plan show nothing — never another project's structure.
- The mortgage note's numbers are derived from the project's own post-handover portion. If the project has no post-handover portion (AGUA), the post-handover paragraph is not rendered at all.

### 3. Layout fixes
- **Recommended Projects**: give the strip the same horizontal padding/gutters as the rest of the page so cards no longer touch the container edges.
- **Expert Consultation form**: add proper inner padding so no field touches the form border on the left or right, at every breakpoint.
- **Project Documents section** (Full Project Booklet / Specs at a Glance / Layouts & Sizes): rebuilt as one aligned grid — equal tile heights, one baseline for the eyebrow label, one for the title, one for the action link, no broken or wrapping label geometry.

### 4. Brochure
- Reduce the highlight/flare overlay on the project photo in the brochure card so the building reads clearly, and correct the payment-plan block inside the brochure to use the same per-project structured plan as the page.

### 5. Validation
Full E2E pass with Playwright screenshot proof: AGUA and ARYA project pages (hero, payment section, documents, recommended strip, consultation form), Allura page, brochure render, and a mobile-width pass. Screenshots attached in the reply, with before/after for each fixed area.

## Technical notes

- Data changes go through migrations/updates on `projects` (`payment_plan`, `payment_breakdown`, `bedrooms_min/max`, `area_name`, `is_published`, cover fields).
- Card chip work lives in `src/components/ui/card-price-payment-row.tsx`, `src/utils/paymentPlanSummary.ts` and `src/utils/paymentPlanPresentation.ts`; the detail structure in `PaymentPlanVisualization.tsx`.
- Mortgage copy is generated in `src/utils/mortgageEligibility.ts` and consumed in `ProjectDetailLayout.tsx`; the post-handover figure becomes an input derived from `payment_breakdown` instead of static text.
- Layout work is confined to `RecommendedProjects.tsx`, `ProjectInquiryForm.tsx`, `BookStyleDocuments.tsx` and `PremiumBrochureCard.tsx`.
