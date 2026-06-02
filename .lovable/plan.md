# Fix, Rebuild & Restyle Plan

Scope is large but every item is concrete. I will validate each with browser screenshots at 1178×891 acting as a broker/investor before claiming done.

## 1. Property Comparison — actually finish it
- `/compare?mode=units`: confirm UnitCompareShell renders, fix any remaining blank state. Add an always-visible empty state with **Search project → Add unit** CTA so brokers see the table scaffold immediately.
- Wire **Add Unit** dialog → live `UnitComparisonTable` (verify rows appear instantly, no reload).
- **Branded PDF Export**: rebuild `exportUnitComparisonPdf.ts` with JBJ letterhead (monogram top-left, gold hairline, navy footer), project header block, full comparison table (all toggleable field groups), payment-plan schedule per unit, broker signature block on last page, gold divider. Button in toolbar, enabled when ≥1 unit added.
- Same branded export for Project Compare mode.
- E2E test as broker: pick 2 projects → add units → toggle fields → export PDF → open PDF and visually QA each page.

## 2. Property Measurement Tool — rebuild end-to-end
- Restyle the page for full readability (ink on champagne, no faded gold text, no white-on-light).
- Rebuild flow: upload photos OR video → call edge function `measure-property-ai` (Gemini vision) → returns per-room area + total in **sqft and sqm** (user picks unit: sqft / sqm / both).
- Render visual report: annotated thumbnails, room table, totals.
- **Download branded PDF** with JBJ letterhead, photo previews, measurement table, signature page.
- Redeploy edge function, test E2E by uploading sample images.

## 3. Entity-type Badges (apartment/villa/townhouse/office)
- Remove blue fill site-wide. Replace with **green→black→white ombre gradient pill** matching the existing dark CTA "off-white" text treatment (not pure white). Update icon + title contrast accordingly. Single source: locate badge component(s) and update once.

## 4. Header Icons → Gold
- Search, filter, heart icons + AED currency chevron + mode (developer/broker/investor) chevron → all stroke `#B89555` at idle, ink on hover. Keep contrast guard opt-out so they survive the universal flip.

## 5. Mortgage Calculator — neon restyle
- Page background stays champagne but card gets **neon fluo-blue → pink gradient border**, soft glow shadow, animated bubble/orb particles in background, subtle pulse on focus.
- Framer-motion entrance, animated gold-to-neon hairline, premium feel.
- Fix all input/label contrast (ink on light, no white-on-light).

## 6. News & Insights + Market Intelligence — neon premium restyle
- News: magazine-grid with neon accent borders on featured cards, animated gradient headlines, hover glow. Keep all existing articles.
- Market Intelligence: neon dashboard treatment for KPIs (electric-blue/pink accent strokes, glowing number tiles), animated chart entrances, full ink-on-champagne readability inside cards.
- Validate every section visually.

## 7. E2E user-as-broker test pass
For each tool I will navigate, interact, screenshot, and report:
- Property Measurement (upload → measure → export)
- Rental Index (search → results → export if available)
- Property Evaluator (input → valuation → export)
- Property Comparison (project + unit modes → export)
- List Your Property (full submit flow)

Bugs found during E2E get fixed in the same pass.

## Technical notes
- PDFs: jsPDF + existing JBJ branding helpers (`src/lib/pdf/jbjBrandedPdf.ts` pattern).
- Measurement AI: Lovable AI Gateway, `google/gemini-2.5-pro` (vision + reasoning), no API key needed.
- Badges: search `bg-blue|bg-sky|bg-[#` near "Apartment|Villa|Townhouse|Office" and centralize into one `<EntityTypeBadge />` primitive using the locked dark-CTA gradient tokens.
- Neon: scoped CSS classes (`.jj-neon-card`, `.jj-neon-orb`) — NOT global, so champagne system stays intact. AI-purple memory doesn't apply (these are tool pages, not AI features).
- All changes respect: no-gray, no-gold-fills, white-on-light guard, no section dividers, contact gating, no-removal policy.

## Validation checklist (per item)
1. Browser screenshot at 1178×891 before + after.
2. Click through as the target user role.
3. Open exported PDF, screenshot every page, check for clipping/contrast.
4. Console + network clean.
5. Report findings honestly — if something doesn't work, say so and fix before moving on.

Approve and I'll build it in this order: 3 + 4 (quick wins) → 1 (Compare + PDF) → 2 (Measurement rebuild) → 5 (Mortgage neon) → 6 (News + Market Intel neon) → 7 (full E2E pass).
