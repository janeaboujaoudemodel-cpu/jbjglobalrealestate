## Goal

Every action button on real-estate surfaces (project, area, developer, properties, resale) renders in the **one approved emerald** (`#0E8A66`) with **pure white** text and **pure white** icons — no champagne fills, no ink text, no gold borders on these CTAs.

## Scope (pages swept in one pass)

- `/project/:slug` — all selected CTAs in the screenshot:
  Read More, Download Images, gallery prev/next arrows, +14 overlay, Download All Photos, View All Projects by Developer, Open in Maps, Describe with AI, Payment Plan tab CTA, Brochure download, Request Mortgage Introduction, Contact our team, Request a Call Back Now, Report an issue, Download Report.
- `/area/:slug` (AreaDetail) — same hero/section CTAs.
- `/developer/:slug` (DeveloperDetail) — "View Projects", contact, brochure CTAs.
- `/properties` & `/resale` listing pages — primary CTAs on cards' overlays and detail panels (price pill stays orange — locked, not touched).
- `/compare` primary action CTA.

Out of scope (locked by other standards, untouched):
- Price pill (orange).
- Developer name link (DeveloperLink).
- Sidebar / header chrome.
- Card cover arrows (banned by Card Arrows rule — stay banned, not re-added as emerald).
- Sale-status rectangular gold badge (owner opt-in).

## Approach

1. **Centralize via the locked primitive.** All in-scope CTAs route through `EmeraldButton` (or `.jj-pill-emerald-metallic` for pill shape). Both already carry `data-no-contrast-guard` + the emerald foreground lock added in the previous turn, so text and `<svg>` glyphs render pure white at idle, hover, focus, and active.

2. **Replace champagne / ink / outline CTAs in scope** with `<EmeraldButton>` (rectangular) or `.jj-pill-emerald-metallic` (pill). Icon-only buttons (gallery arrows, X, close) get `bg-[#0E8A66] text-white` + `data-no-contrast-guard`, matching the profile-prompt pattern just shipped.

3. **Keep "Maybe later" / secondary** as champagne-with-emerald-text (already standard per CTA Hierarchy memory) — not touched unless visibly wrong.

4. **Visual validation (mandatory).** Drive Playwright against the live preview at 1280×1800, screenshot each page:
   - `/project/distrikt-majid-al-futtaim-city-of-arabia` (top, gallery, developer card, location, payment, brochure, mortgage, AI analyzer, contact form, report-issue).
   - `/area/tilal-al-ghaf`
   - `/developer/majid-al-futtaim-properties`
   - `/properties`
   - `/resale`
   - Profile-prompt popup (`?completeProfile=1`) to confirm the X + Trophy + Take me there are emerald/white as already fixed.

   For each screenshot, sample CTA pixels and assert R<40, G in 100-160, B in 90-130 for the fill, and >240/240/240 for the inner text/icon. Save shots to `/tmp/browser/emerald-sweep/` and report.

5. **Report back** with a side-by-side of before / after screenshots and the list of files changed.

## Files likely to change

- `src/pages/ProjectDetail.tsx` (or composing layout in `src/components/project-detail/ProjectDetailLayout.tsx`)
- `src/components/project-detail/`: `PremiumBrochureCard.tsx`, `DeveloperInfoCard.tsx`, `ProjectLocationMap.tsx`, `GeneratePresentationCard.tsx`, `ReportIssueButton.tsx`, `ProjectInquiryForm.tsx`, `CallToActionSection.tsx`, `ProjectMediaSection.tsx` (Download Images / +14 / arrows), `ProjectAIAnalyzer.tsx` (Contact our team), `PaymentPlanVisualization.tsx`.
- `src/components/MortgageCalculator.tsx` (Request Mortgage Introduction, Download Report).
- `src/components/area-detail/` equivalents.
- `src/pages/AreaDetail.tsx`, `src/pages/DeveloperDetail.tsx`.

No CSS rules added — the emerald foreground lock is already in `src/index.css`. This is a component-level normalization, not a theme change.

## Risks / guardrails

- Do **not** convert anything currently champagne by spec (Maybe later, secondary outline pills) unless the screenshot shows it next to an emerald primary and the user wants both emerald — they don't.
- Do **not** touch card cover arrows (banned).
- Do **not** widen the emerald contract — same one CSS rule already shipped.
- Preserve all existing handlers, hrefs, aria-labels, and `data-` attributes.

## Deliverable

- Updated components.
- Playwright screenshots at `/tmp/browser/emerald-sweep/*.png` showing every in-scope CTA emerald + white.
- Short diff summary in the response.
