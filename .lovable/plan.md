## Goal
Unify card sizing across every non-hero section in Insights & Guides, Company & Legal, and Services so they match the homepage standard (JBJ Royal Tools Hub, AI Property Comparison, Mortgage Calculator, Ready to Get Started, Top Areas in Dubai). Give each page a unique hero video/photo that matches its title and content. Heroes themselves are not resized.

## Homepage Card Standard (source of truth)
- Wrapper: `<PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">`
- `width="contained"` = centered, `max-width: 1500px`, `px-4 md:px-6`
- Vertical rhythm: `py-4` between sections; hero/first section keeps its own padding
- Inner grids: `max-w-[1500px] mx-auto` with `gap-4 md:gap-6`
- Corners: 28px premium radius via PremiumSectionCard

## Pages In Scope (heroes untouched)

**Insights & Guides (17)**
- Market Intelligence: MarketOverview, AreaIntelligence, AreaDetail, MarketReports, Methodology, MonthlyMarketBrief, QuarterlyMarketReview, AnnualMarketSummary
- Guides Library + BuyerGuide, SellerGuide, InvestorGuide, RenterGuide, ExpatGuide, GoldenVisaGuide, MortgageGuide
- FAQ Hub

**Company & Legal (~10)**
- About, CompanyProfile, Contact, Careers, AcademyGraduates, Awards
- Legal: Terms, Privacy, Cookies, AmlKycPolicy, Disclaimer

**Services (~12)**
- Royal Tools Hub, AI Home Finder (Quiz), Compare Projects, Compare Units (CompareManual), Mortgage Calculator, Property Evaluator, Interior Design AI, Deep Area Analysis, Developers, Communities, AI Hub, Concierge

## Approach

1. **New shared wrapper `InsightsPageBody`** (or extend `InsightsPageScope`) that forces every direct child section to:
   - `max-width: 1500px`
   - `margin-inline: auto`
   - `padding: 16px` vertical, `16-24px` horizontal
   - 28px radius on top-level cards
   - No edge-touching (min side gutter 16px mobile, 24px desktop)
2. Convert every page above to wrap its non-hero content in this component and replace ad-hoc `container`/`max-w-*` classes on top-level sections with the standard.
3. Add CSS pass in `index.css` (PASS 175) as a safety net keyed on `[data-standard-body] > section, > div.section` for pages that still have legacy structure.
4. Swap each hero to a page-specific asset:
   - Use existing curated Unsplash/videos already in the repo where available
   - For pages without one, add a matched still image (photo) via existing hero components — no new generation unless required
   - Titles/subtitles left as-is
5. Validate with Playwright: script iterates all listed routes at 1280×1800, screenshots hero + first 3 sections, asserts:
   - top-level section width ≤ 1500 and ≥ 960 on desktop
   - left/right gutter ≥ 16px
   - no black-on-emerald contrast violations
   - hero has a `<video>` or `<img>` with a unique `src`
   Screenshots saved under `/tmp/browser/standardize/`.
6. Iterate per page group (Insights → Guides → Company/Legal → Services), fixing regressions before moving to next group.

## Technical Notes
- Do not modify `PremiumSectionCard` API; reuse `width="contained"` + `wrapperClassName="cv-auto py-4"`.
- Keep `InsightsPageScope` for palette; add layout via new `data-standard-body` attribute.
- Hero components already read `data-mi-hero-variant` / `data-guide-hero`; extend those maps with new image/video srcs per route.
- No business-logic changes; presentation only.

## Deliverables
- Updated pages (list above) with standardized card widths
- New/updated wrapper component + `index.css` PASS 175
- Per-page hero asset map
- Playwright validation script + saved screenshots proving parity with homepage cards
