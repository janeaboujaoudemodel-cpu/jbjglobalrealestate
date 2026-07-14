I will fix the current content-page styling by rebuilding the shared hero/CTA/page-shell rules first, then applying them page-by-page across the requested sections only.

## Scope to fix

### Insights / Market Intelligence
- `/market-intelligence`
- `/market-report`
- `/market-intelligence/overview`
- `/market-intelligence/areas`
- `/market-intelligence/reports`
- `/market-intelligence/methodology`
- `/insights`
- `/insights/future-of-real-estate-2026`
- `/news`
- `/news/:id` sample route

### Guides
- `/guides`
- `/buyer-guide`
- `/seller-guide`
- `/rent-guide`
- `/tenant-guide`
- `/landlord-guide`
- `/investor-education`
- `/guides/golden-visa-uae`
- `/guides/dubai-rental-yield`
- `/guides/selling-off-plan-dubai-before-handover`
- FAQ/help guide routes: `/faq`, `/buyer-faq`, `/seller-faq`, `/landlord-faq`, `/tenant-faq`, `/broker-faq`

### Services
- `/services`
- All direct service pages under `/services/...` currently registered in routing, including property management, snagging, buying/selling/rental advisory, law firm, company setup, concierge, short-term rentals, complaint procedures, customer happiness center, and testimonials.

### Company
- `/contact`
- `/about`
- `/founder`
- `/awards`
- `/company-profile`

### Legal
- `/terms`
- `/privacy`
- `/cookies`
- `/disclaimers`
- `/aml-kyc`
- `/intellectual-property`

## Implementation plan

1. **Stabilize the broken shared shell first**
   - Repair the current Insights/Shell mount issue so `/insights` and `/insights/future-of-real-estate-2026` no longer hang in the loading state.
   - Make the shared shell lightweight and safe: no heavy or circular imports from the market-intelligence barrel.
   - Keep the route wrappers where useful, but remove anything that creates Suspense hangs or blank screens.

2. **Lock one canonical Market Intelligence hero style**
   - Full-screen emerald/dark-black gradient.
   - White title and white supporting copy only.
   - Gold hairline/rule allowed, but no faded white overlays and no pale/washed hero text.
   - CTA buttons use the same dark emerald-black gradient as the collapsed sidebar active button, not bright green.
   - Desktop CTAs stay side-by-side; mobile can stack/wrap safely.

3. **Apply the same hero style to all requested page families**
   - Replace broken cream/white/photo/low-contrast heroes on Insights, Guides, Services, Company, Legal, and Help/Support pages with the same canonical emerald hero treatment.
   - Keep good existing body content where it is already strong, such as Area Intelligence; only replace the hero and broken contrast/layout parts there.
   - Remove black-on-white or white-on-cream hero title fragments such as the broken Seller Guide title.

4. **Standardize CTAs and buttons**
   - Hero CTAs: dark emerald-black gradient, white text/icons, matching Market Intelligence/collapsed sidebar color.
   - Champagne page CTAs: premium champagne/gold bordered style, never faded black buttons.
   - Emerald surfaces: icons/text must be pure white, never black on emerald.
   - Fix known broken areas: Market Report “Need a custom report”, Market Intelligence lower button/icon contrast, Guides “Not sure where to start?”, Services final CTA.

5. **Fix card borders and page section consistency**
   - Champagne/light cards use premium gold borders/hairlines, not green borders.
   - Emerald cards only appear when the card itself is intentionally on an emerald/black surface.
   - Normalize content widths, padding, title scale, card edge alignment, and section spacing so cards line up cleanly across pages.
   - Remove nested-card or mismatched-width effects where they visually break the layout.

6. **Targeted page rebuilds where needed**
   - Rebuild `/guides` final CTA to match the canonical “Ready to Get Started” style, removing the current faded black button.
   - Rebuild `/seller-guide` hero, because it currently has broken contrast and split black/white title text.
   - Rework `/services` cards so champagne cards use gold borders instead of green borders.
   - Adjust `/market-report` hero/CTA/card contrast to match Market Intelligence while preserving the report/book functionality.

7. **Visual validation before reporting complete**
   - Use Playwright only after code changes.
   - Capture screenshot proof for every named route family:
     - desktop hero screenshot
     - desktop lower-section/CTA screenshot
     - mobile hero screenshot for representative routes in each family
   - For long page groups like Services, validate every registered service route at least with hero + first content section screenshots, and capture additional screenshots for pages with failures.
   - Check screenshots manually before claiming completion.
   - Report with screenshot file paths and a short list of routes validated.

## Technical notes

- I will edit only frontend presentation/layout files and shared content-page components/CSS.
- I will not change backend logic, security policies, or unrelated app areas.
- I will avoid using green borders on champagne cards; champagne surfaces get gold borders.
- I will keep the Market Intelligence emerald gradient as the source of truth: `#064E3B → #042c1c → #000000`, with white foreground on dark/emerald surfaces.