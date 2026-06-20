## 1. Brochure wordmark legibility (PremiumBrochureCard)

- Increase wordmark size from 12px → 14px, tighten letter-spacing to 0.18em.
- Strengthen the scrim panel (solid `rgba(8,12,20,0.92)` band, no fade) so "JBJ Global Real Estate" never sits on raw photo.
- Add 1px gold hairline around the panel for brand consistency.
- Keep gold "JBJ" + white "Global Real Estate"; bump weight to 800/600.

## 2. Brochure download — developer-only source lock

Already mostly enforced via `brochure-auto-fetch` (developer-direct + Provident). Lock it further:
- Download button accepts ONLY `projects.brochure_url` or `projects.fact_sheet_url` set by the developer/owner, or a result from `brochure-auto-fetch` flagged `source_kind in ('developer_direct','fact_sheet','provident')`.
- Never fall back to a generated PDF. If none exists → opens lead-capture modal (current behavior) with copy "Request official brochure from developer".
- Label dynamically: "Download Brochure" or "Download Fact Sheet" based on which file is present.

## 3. New Project Presentation Generator (replaces ad-hoc PDF export)

### Visibility
- New `<GeneratePresentationCard />` rendered on `/project/:slug` ONLY when `userMode ∈ {broker, owner, developer}`. Hidden for investor + anonymous.

### Flow (Reelly-style)
1. Click "Generate Presentation" → opens `<PresentationBuilderDialog />`.
2. Step 1 — Unit selection: searchable list of `project_units` (unit no, type, BR, size, price, floor plan thumb). Multi-select up to 5.
3. Step 2 — Presenter details (all optional, omitted if blank):
   - Photo upload (square crop, stored in `presentation-assets` bucket)
   - Full name
   - Title / role
   - Phone, email, WhatsApp
   - Company logo override (defaults to JBJ monogram)
4. Step 3 — Sections toggle (all on by default): Cover, Project highlights, Location & map, Amenities, Gallery, Selected units (floor plans + price + payment plan), Payment plan, Developer profile, Sales offer / CTA, Presenter contact.
5. Step 4 — Preview (scaled slide deck) → Export PDF / PPTX / Share link.

### Data sources (auto-pulled, never fabricated)
- `projects` (name, location, handover, price_from, description)
- `project_images` (gallery + cover)
- `project_amenities`
- `project_units` (selected ones → floor plans, sizes, prices, payment plans)
- `developers` (logo, name, bio)
- `projects.brochure_url` / `fact_sheet_url` (linked as appendix, not re-rendered)
- Presenter inputs from Step 2

### Rendering
- Reuse the existing slide framework already in `src/pages/owner/` (presentation engine) — render at 1920×1080, scale, export via existing PDF pipeline (`jspdf` + html2canvas already in deps).
- Champagne/gold/ink palette only — no navy/teal.
- Conditional rendering: any empty field/section is skipped entirely (no "N/A" placeholders).

### Files

**New**
- `src/components/project-detail/GeneratePresentationCard.tsx` — entry card (gated by mode).
- `src/components/presentation-builder/PresentationBuilderDialog.tsx` — 4-step wizard.
- `src/components/presentation-builder/steps/UnitPickerStep.tsx`
- `src/components/presentation-builder/steps/PresenterDetailsStep.tsx`
- `src/components/presentation-builder/steps/SectionsStep.tsx`
- `src/components/presentation-builder/steps/PreviewExportStep.tsx`
- `src/components/presentation-builder/slides/*` (Cover, Highlights, Location, Amenities, Gallery, Units, PaymentPlan, Developer, Offer, Contact)
- `src/lib/presentation/buildProjectDeck.ts` — assembles slide model from DB rows + presenter inputs (skips empties).
- `src/lib/presentation/exportDeck.ts` — PDF + PPTX export.
- `supabase/migrations/<ts>_presentation_assets_bucket.sql` — creates `presentation-assets` storage bucket + owner-write RLS.

**Edited**
- `src/components/project-detail/PremiumBrochureCard.tsx` — wordmark restyle + developer-source-only label logic.
- `src/components/project-detail/ProjectDetailLayout.tsx` — mount `<GeneratePresentationCard />` under brochure section, gated by `useUserMode()`.
- `supabase/functions/brochure-auto-fetch/index.ts` — return `source_kind`; reject anything not in allowed set.

### Out of scope
- Editing slide text inline (v2 — current export is read-only WYSIWYG).
- Email-send of generated deck (handled by existing Communication Hub if user asks later).
- Investor mode access (intentionally excluded per request).

## Verification
- Screenshot brochure card: wordmark fully readable on dark and bright project photos.
- Open `/project/:slug` as broker → "Generate Presentation" card visible; as investor → hidden.
- Generate deck with 2 units, no presenter photo, no phone → those sections/fields silently omitted.
- Export PDF and confirm champagne/gold palette, no placeholder strings.
