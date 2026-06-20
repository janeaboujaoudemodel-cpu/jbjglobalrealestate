# Brochure Readability + Real-Source Lock + AI Presentation Generator

## 1. Fix wordmark clipping on brochure card

Problem (your screenshot): the brand pill on the brochure mockup shows only "JBJ GLO" because the wordmark at 14px + 0.2em tracking + 40px monogram + pill padding overflows the 380px card.

Changes in `src/components/project-detail/PremiumBrochureCard.tsx`:
- Shrink the monogram tile from 40×40 → 32×32 inside the pill.
- Drop wordmark letter-spacing 0.18em → 0.10em (gold "JBJ") and 0.20em → 0.12em ("Global Real Estate"); keep weights 800 / 600.
- Reduce font-size to 12.5px so the pill fits the card with ~16px breathing room on the right.
- Constrain pill: `max-width: calc(100% - 56px)` and `right: 16px` fallback so it can never clip behind the lock icon.
- Bump scrim to `rgba(6,10,18,0.95)` + 1.5px gold hairline for crisper contrast.
- Verify by re-rendering the project page and confirming full "JBJ GLOBAL REAL ESTATE" reads on a 380px card.

## 2. Lock brochure download to developer-uploaded files only

Already partly in place — harden it:
- Download handler accepts ONLY `projects.brochure_url` OR `projects.fact_sheet_url` set by owner/developer, or files persisted by `brochure-auto-fetch` with `source_kind ∈ ('developer_direct','fact_sheet','provident')`.
- If neither exists → button label flips to **"Request official brochure"** and opens the existing lead-capture modal. No generated/AI PDF is ever offered as a brochure.
- Label is dynamic: "Download Brochure" when `brochure_url` exists, "Download Fact Sheet" when only `fact_sheet_url` exists, "Download Brochure + Fact Sheet" when both (two buttons stacked).
- Add a tiny ink caption under the button: *"Official document from {developerName}"* when present.

## 3. Project Presentation Generator (Reelly-style, per-project)

Visible on `/project/:slug` ONLY for **broker | owner | developer** modes (hidden for investor + anonymous, enforced via `useUserMode` + `ActionGate`).

### Entry point
A new "Generate Presentation" card next to the brochure card — gold-hairline champagne panel, ink title, gold "Generate" CTA.

### Wizard (`PresentationBuilderDialog`) — 4 steps

**Step 1 — Units**
- Multi-select up to 5 units from `project_units` (bedrooms, size, price, floor).
- "Skip / use whole project" option for a generic project deck.

**Step 2 — Presenter card** (all fields optional; empty fields are silently omitted from the deck)
- Photo upload (cropped circle, stored in `presentation-assets` bucket).
- Name, Title, Phone, Email, WhatsApp, Company logo override.
- "Save as my default presenter profile" toggle → persists to `user_presenter_profiles` so next time it's pre-filled.

**Step 3 — Sections** (all on by default; toggle off to skip)
- Cover, Project overview & USPs, Location & connectivity, Master plan, Amenities, Gallery, Unit cards (one per selected unit with floor plan), Payment plan, Handover, Developer profile, Presenter contact, Brochure & Fact Sheet appendix link.

**Step 4 — Preview & Export**
- Live HTML preview at 1920×1080 with brand palette (champagne/gold/ink, AI purple banned from this output).
- Export: PDF (print pipeline), PPTX (via `pptxgenjs`), Share link (signed URL to PDF in storage, 30-day expiry).
- "Save to my presentations" → row in `user_presentations` for re-export later.

### Data sources (all auto-pulled, no fabrication)
- `projects` (name, USPs, status, handover, location, payment_plan)
- `project_images` (gallery + cover)
- `project_amenities`
- `project_units` (selected ones) + their `floor_plan_url`
- `developers` (profile, logo)
- `projects.brochure_url` / `fact_sheet_url` → linked as appendix (not re-rendered)
- Presenter inputs from Step 2

Empty/missing fields/sections are skipped entirely — never "N/A" or fake placeholders (per brand rule).

### Files

**New**
- `src/components/presentation-builder/GeneratePresentationCard.tsx` — entry card
- `src/components/presentation-builder/PresentationBuilderDialog.tsx` — 4-step wizard
- `src/components/presentation-builder/steps/{UnitPicker,PresenterDetails,SectionsToggle,PreviewExport}.tsx`
- `src/components/presentation-builder/slides/*.tsx` — Cover, Overview, Amenities, Gallery, Unit, PaymentPlan, Developer, Contact, Appendix
- `src/components/presentation-builder/buildProjectDeck.ts` — assembles slide list from project + selections
- `src/components/presentation-builder/exportDeck.ts` — PDF (print) + PPTX (pptxgenjs)
- Migration: `presentation-assets` bucket (private, owner-read), `user_presenter_profiles` table, `user_presentations` table

**Edited**
- `src/components/project-detail/PremiumBrochureCard.tsx` — wordmark fix + source lock
- `src/components/project-detail/ProjectDetailLayout.tsx` — mount `<GeneratePresentationCard />` next to brochure (gated by user mode)

### Out of scope (v1)
- Inline slide editing (deck is read-only preview; v2)
- Emailing the deck from inside the wizard (Share-link covers this)
- Investor mode access

Reply **Approve** to build, or tell me what to change.