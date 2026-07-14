## Goal
Every route in the Insights sidebar group renders with the **same structure as `/market-intelligence`**:

1. Full-screen emerald Prada hero (title + description + optional CTA row) — from `MIPageShell`
2. MI-style right-side navigator (`MarketIntelligenceTableOfContents`) that hides while in hero
3. Body sections framed by a single **champagne surface + gold hairline** card (`bg:#FDFBF7`, `border:1px solid #B89555`) — never a beige-inside-beige double card
4. Canonical `PreFooterSeparator` "Ready to Make Informed Decisions?" CTA
5. Contrast-guard rules already in `index.css` remain the only source of colors

Everything runs through `src/components/shell/MIPageShell.tsx`. Pages that already use it inherit fixes for free; pages that don't get refactored to use it.

## Card style (locked)
Single card, no nesting:
```
bg-[#FDFBF7]  border border-[#B89555]/60  shadow-none  rounded-none
```
No inner champagne panel. No `bg-muted` inner surface. No emerald tile behind the card. I will add a shared class `.jj-mi-section-card` in `index.css` and swap page-level card wrappers to use it.

## Route inventory (Insights sidebar, 26 routes)
Group A — Market Intelligence family (7): `/market-intelligence`, `/market-intelligence/overview`, `/market-intelligence/areas`, `/market-intelligence/areas/:slug`, `/market-intelligence/reports`, `/market-intelligence/reports/monthly/:period` (+ quarterly, annual), `/market-intelligence/methodology`, `/market-report`
Group B — News (2): `/news`, `/news/:id`
Group C — Insights hub + articles (2): `/insights`, `/insights/future-of-real-estate-2026`
Group D — Guides (7): `/guides`, `/buyer-guide`, `/seller-guide`, `/rent-guide`, `/tenant-guide`, `/landlord-guide`, `/guides/golden-visa-uae`, `/guides/dubai-rental-yield`, `/guides/selling-off-plan-dubai-before-handover`
Group E — FAQ (6): `/faq`, `/buyer-faq`, `/seller-faq`, `/landlord-faq`, `/tenant-faq`, `/broker-faq`
Group F — Education (1): `/investor-education`

## Execution — one PR per group
For each group I will:
1. Refactor pages onto `MIPageShell` (hero + `tocItems` + pre-footer already handled by the shell).
2. Replace body wrappers with the shared `.jj-mi-section-card` class. No emerald backgrounds behind content, no double-card nesting.
3. Run Playwright headless against localhost:8080 for **every route in the group** at 1440×1100 desktop and 390×844 mobile. Capture:
   - Hero screenshot
   - First body section screenshot (validates single-card style)
   - Pre-footer screenshot
4. Post the screenshot paths in chat. Only after all routes in the group pass do I move to the next group.

## Technical details
- `src/index.css`: add `.jj-mi-section-card { background:#FDFBF7; border:1px solid rgba(184,149,85,.6); }` and a `[data-insights-page] .jj-mi-section-card > .jj-mi-section-card { background:transparent; border:0; }` guard to auto-flatten any accidental nested cards on Insights routes.
- `MIPageShell`: no changes needed (already emerald hero + MI navigator + pre-footer). Verify `bodyClassName` defaults to `"mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24 space-y-16"`.
- Per page: strip custom hero components (`GuideHero`, `FAQHero`, ad-hoc emerald headers) and pass their content into `MIPageShell` props. Keep TOC items already defined per page.
- No business-logic changes. No data fetching changes. Presentation only.

## Out of scope (per your answer)
Services, Products/Tools, Company, Legal, Help & Support. Those come in follow-ups after Insights is green.

## Deliverable per group
A single message in chat with:
- List of routes touched
- One `code--view` screenshot per route (desktop) + one mobile
- Explicit "Group X validated — moving to Group Y" line

Reply **Approve** to start with **Group A (Market Intelligence family, 7 routes)**, or tell me to reorder.