## Global Emerald + White Contrast Lock — Final Pass

Root cause of the persistent failures: previous attempts added scoped overrides on individual components, but the cascade kept losing because (a) child elements set their own `text-*` / `bg-*` classes with higher specificity, (b) the dark metallic gradient was applied as `background-color` without overriding the inner gradient layers, and (c) Tailwind arbitrary `bg-[#0E8A66]` and component-level inline styles weren't all repainted. I'll fix it with one decisive global guard plus targeted component swaps, then validate every flagged area with screenshots.

### 1. Single global emerald lock (src/index.css)

Replace the prior layered overrides with one final `@layer utilities` block, scoped under `html body` for maximum specificity, that covers every selector currently rendering as flat green or with dark text on emerald:

```css
html body :is(
  .jj-emerald-action, [data-emerald-action="true"],
  .jj-official-emerald, .jj-pill-emerald-metallic,
  .jj-cta-gold-metallic, .jj-cta-primary,
  [data-cta="primary"][data-surface="emerald"],
  [data-surface="emerald"][data-emerald-ok],
  .bg-\[\#0E8A66\], .bg-\[\#0B6F52\], .bg-\[\#064E3B\]
) {
  background-image: linear-gradient(135deg,#0A6B53 0%,#064E3B 55%,#04231A 100%) !important;
  background-color: #064E3B !important;
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  border-color: transparent !important;
}
html body :is(<same selectors>) :where(*, svg, span, strong, p, h1,h2,h3,h4) {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  fill: currentColor !important;
  stroke: #FFFFFF !important;
}
html body :is(<same selectors>) :where(svg [fill]:not([fill="none"])) { fill: #FFFFFF !important; }
```

This single block kills: gold "Expert Consultation" badge, green country-picker pills, green "View All" / "Report Issue" / "Download Report" / "Request Mortgage Introduction" / mortgage Ask chat-send / mortgage icon tiles / Recommended Projects star tile / Noticed-Something-Incorrect tile / Pros header / Dubai Market Intelligence header icon + YTD growth arrow tile / Off-Plan-vs-Secondary + Cash-vs-Mortgage bars / Recommended Projects "From AED" + handover pills.

### 2. Mark every flagged surface with the lock attribute

Add `data-emerald-action="true"` (or swap to `.jj-emerald-action`) on:

- `src/components/project-detail/RecommendedProjects.tsx` — star header tile, View-All button, **and** each card's price + handover pill
- `src/components/project-detail/PremiumBrochureCard.tsx` — Brochure label/star, "Generate Presentation" star icon
- `src/components/project-detail/ProjectMarketContext.tsx` (or wherever "Dubai Proxy" / building/pin icons + "Noticed something incorrect" + "Report an Issue" live) — header icons + report button
- `src/components/project-detail/CallToActionSection.tsx` — "Expert Consultation" pill (replace gold metallic with emerald metallic)
- `src/components/PhoneInput*.tsx` / country code trigger used by ConsultationRequestForm + Request-Callback — `button[data-phone-code-trigger]` swap
- `src/components/MortgageCalculator.tsx` — main calculator icon tile, Property/Down/Loan icon tiles, "Request Mortgage Introduction", "Ask" send button
- `src/pages/PropertyEvaluator.tsx` — "Download Report" in Live Market Data, YTD market growth arrow tile, Pros header (thumbs-up + "Pros")
- `src/components/market-intelligence/*` — Off-Plan-vs-Secondary + Cash-vs-Mortgage bars: convert active emerald segment to gradient and set the inline `%` label to `#FFFFFF`

### 3. Developer logo regression (Recommended Projects cards)

In `RecommendedProjects.tsx`, the card currently shows a building fallback icon for projects whose developer record was matched but whose `developer.logo_url` evaluated as falsy at card-build time. Restore the same resolver used elsewhere: pull from `developer_logo_url` / `developers.logo_url` and only fall back to the JBJ monogram tile when both are empty — never the building icon. No DB writes. No logo overrides.

### 4. Card alignment with collapsed sidebar

In `src/components/project-detail/ProjectDetailLayout.tsx` (and the Recommended Projects section wrapper), replace the current `max-w` + asymmetric left padding with the standard `mx-auto px-6 md:px-10` container used by `/compare`. That removes the leftward shift when the sidebar collapses.

### 5. Visual validation (mandatory)

Run Playwright at 1280×1800 on `/project/distrikt-majid-al-futtaim-city-of-arabia` and capture screenshots for each flagged area, plus `/property-evaluator`, the mortgage calculator section, and the Request-a-Callback / Consultation forms. Save under `/tmp/browser/emerald-final/` and post them in the reply. If any single surface still renders flat green or non-white text/icon, iterate before responding.

### Files to edit

- `src/index.css` (final emerald lock + repaint of arbitrary green classes)
- `src/components/project-detail/RecommendedProjects.tsx` (star, View All, price/handover pills, developer logo fallback)
- `src/components/project-detail/PremiumBrochureCard.tsx`
- `src/components/project-detail/CallToActionSection.tsx` (Expert Consultation pill)
- `src/components/project-detail/ReportIssueButton.tsx` + the buyers-by-nationality header tiles
- `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` (already partly done — verify pill swap)
- `src/components/MortgageCalculator.tsx` (all icon tiles, Ask, Request Mortgage Introduction)
- `src/pages/PropertyEvaluator.tsx` (Download Report, YTD arrow tile, Pros header)
- Phone country picker primitive used by both forms
- DLD bars component (Off-Plan vs Secondary / Cash vs Mortgage label color)
- `src/components/project-detail/ProjectDetailLayout.tsx` (container alignment)

No business logic, no DB, no logo overrides — pure visual contract fix.
