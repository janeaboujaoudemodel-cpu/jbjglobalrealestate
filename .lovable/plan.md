# Amra Project Page — Comprehensive Fix Batch

Everything below gets shipped in this single batch. Each item ends with a Playwright screenshot proof saved to `/mnt/documents/amra-batch2/`. No partial completion — every item validated visually before finishing.

---

## 1. Brochure header card (top of project page)

- **Remove circular border/frame** around the JBJ monogram in the emerald brochure card.
- **Card background:** switch from the current mid-green to the full emerald→black ombre (`#064E3B → #042c1c → #000000`) — same standard as other primary cards.
- **Title:** replace "Amra The First" with **"Amra Resort"** in the card headline (data patch on the Amra project record: `name_short` / display title override).
- **Location line format:** always **Emirate first, then area** → `Umm Al Quwain · Al Raudah`. Global helper: when emirate is UAQ show "Umm Al Quwain", when RAK + Al Marjan show "Ras Al Khaimah · Al Marjan Island", etc.
- **Remove "Al Raudah" area label from the brochure card body** — move it into the project meta strip below (Specs/Location area).
- **Fix truncation:** remove `line-clamp` / `truncate` on the card title so no "…" appears. Allow 2 lines and wrap.
- **"70/30" pill in payment plan header:** stop wrapping the `0` onto a second line — set `white-space: nowrap` and widen the pill min-width.

## 2. Payment plan visualization

- **Label alignment:** "During Construction" must sit centered under the **60%** segment (not overlapping "On Booking"). Compute label `left: %` from the cumulative midpoint of each segment, not from the dot position.
- **"On Handover" → "Post-Handover (36 months)"** everywhere the Amra plan is rendered (header, timeline end label, stage card title). The final label is pinned to the right edge (`right: 0; text-align: right`).
- **Phase support:** if the project has `phases: [{name, payment_plan, handover_date}, ...]` (or files named `phase-1`, `phase-2`), render **two stacked payment-plan sections** with phase headings and separate handover dates. If only one plan, keep single section (current behavior).
- **Ingest rule:** owner uploader — filenames containing `phase 1` / `phase-1` / `p1` are parsed as phase 1, same for phase 2. Store on `projects.phases` jsonb.

## 3. Mortgage rule copy (never say "not available")

Change the ineligibility panel wording. For off-plan / non-tier-1 projects, show:

> **Mortgage financing will be available on handover.** Once the project is officially marked completed, you'll be able to finance up to 70% (buyer keeps the 30% already paid during construction and mortgages the remaining 70% over up to 25 years).

Add an **auto-flip cron** (Supabase scheduled edge function, daily):
- For every project with `sale_status='off_plan'`, check `handover_date <= today` OR (later) a webhook from construction-progress source; if handed over, set `sale_status='ready'` automatically. Mortgage tab then reappears without manual intervention.
- Log the flip in `project_status_history`.

## 4. Map — correct Amra coordinates + smooth zoom

- Patch Amra record with precise coords: **Al Raudah, Umm Al Quwain** (`25.5450, 55.6350` — Siniya-adjacent coastal band; will refine with a real geocode call via Google Maps connector during implementation).
- Map: enable smooth wheel-zoom (Leaflet `zoomSnap: 0.25`, `zoomDelta: 0.5`, `wheelPxPerZoomLevel: 90`).
- "Open in Google Maps" already coordinate-based — verified.

## 5. "Other projects" / area intelligence rebuild

Split the sidebar into three tabs, each backed by real data (no fake competitors):

1. **Same developer (Citi Developers):** Allura, Aveline, Agua, Arya — pulled from `CITI_PROJECTS` catalogue. Al Borr + Dubai Islands entries added as placeholders flagged `pending_upload:true` (rendered greyed with "Coming soon" until uploaded).
2. **Same area (Al Raudah):** query `projects` where `area_name = 'Al Raudah'`. Include Aldar's Al Raudah project once ingested.
3. **Same emirate (Umm Al Quwain):** query where `emirate = 'Umm Al Quwain'`. Show Sobha Siniya Island, UAQ Downtown, etc. **Only if verified in `dev_registry`** — no AI-hallucinated names.

Each card shows: developer, project, price/sqft, delivery year.

## 6. Price-per-sqft comparison block (Project Intelligence)

Add a **Value Justification** module below Investment Metrics:

- Pulls price/sqft for Amra + 3 nearest comparables (same emirate, same tier).
- Renders a bar chart + narrative:
  - If Amra higher → auto-generated bullets citing project.features (`serviced`, `furnished`, `beachfront`, `amenities_count`, `sea_view`) — only features actually set true on the record.
  - If Amra lower → highlight the discount + still-included premium features.
- Narrative composed via `ai-property-analyzer` edge function using **only verified project fields** — no invented competitor claims.

## 7. Owner Documents section — collapsed by default

`BookStyleDocuments` renders inside a `<Collapsible defaultOpen={false}>` with a header row "Owner Documents (N files) — Expand". Same treatment on all project detail pages.

## 8. Presentation generator — Reely.ai-style

Rebuild `Generate Presentation`:

- Fetch a public Reely.ai sample deck via `fetch_website` / direct PDF download to `/tmp/reely-sample.pdf`, parse with `document--parse_document` to understand slide structure.
- New pipeline (edge function `generate-project-presentation`):
  1. Collect all project inputs: brochure PDF, fact sheet, floor plans, payment plan, videos, images, developer profile.
  2. Extract text + images via `document--parse_document`.
  3. Compose a 12-slide deck (Cover · Developer · Location · Concept · Amenities · Floor Plans · Payment Plan · Investment Case · Comparables · Gallery · Contact · Appendix) in HTML with JBJ branding tokens.
  4. Render to PDF via existing PDF pipeline; upload to `presentations` bucket; return signed URL.
- Trigger from the existing "Generate Presentation" button; show progress toast with steps.

## 9. Validation

Playwright script drives the live preview at `/project/amra-the-first-integrative-wellness-resort-mr9hh3ia` and captures:
1. `01-brochure-card.png` — no border on monogram, full emerald→black gradient, "Amra Resort", "Umm Al Quwain · Al Raudah", no "…".
2. `02-payment-70-30-pill.png` — "70/30" on one line.
3. `03-payment-timeline.png` — labels aligned under segments, "Post-Handover (36 months)" pinned right.
4. `04-mortgage-copy.png` — new "available on handover" wording.
5. `05-map.png` — Amra pin over Al Raudah/UAQ, smooth zoom controls responsive.
6. `06-other-projects-tabs.png` — three tabs populated correctly.
7. `07-value-justification.png` — bar chart + narrative.
8. `08-docs-collapsed.png` — Owner Documents collapsed.
9. `09-presentation-pdf.png` — first slide of generated deck.

Each screenshot inspected with `code--view`; iterate until clean.

---

## Technical details

- **Files touched (edits):** `src/components/project-detail/{ProjectDetailLayout,PaymentPlanVisualization,ProjectLocationMap,BookStyleDocuments,ProjectNearbyPropertiesMap,DeveloperInfoCard}.tsx`, `src/components/project-detail/owner/DeveloperLogoUploader.tsx`, `src/utils/{paymentPlanSummary,mortgageEligibility,locationDisplay}.ts` (new: `locationDisplay.ts`), `src/index.css`.
- **New files:** `src/utils/phasesParser.ts`, `src/components/project-detail/ValueJustification.tsx`, `src/components/project-detail/PhasePaymentPlans.tsx`, `supabase/functions/auto-flip-handover/index.ts` (cron), `supabase/functions/generate-project-presentation/index.ts`.
- **DB migrations:**
  1. `ALTER TABLE projects ADD COLUMN phases jsonb DEFAULT '[]'::jsonb, ADD COLUMN name_short text, ADD COLUMN latitude numeric, ADD COLUMN longitude numeric` (skip columns that already exist).
  2. Data patch for Amra: `name_short='Amra Resort'`, coords, `emirate='Umm Al Quwain'`, `area_name='Al Raudah'`.
  3. `CREATE TABLE project_status_history` for auto-flip audit.
  4. Schedule `auto-flip-handover` via `pg_cron` daily 00:15 UTC.
- **Storage bucket:** create `presentations` (private) with signed-URL access.
- **Connectors used:** Google Maps (geocode Amra), Lovable AI Gateway (narrative).
