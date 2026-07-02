
## Scope (from vertical nav)

**SERVICES (23 pages)** — `/services`, `/services/property-management`, `/partners/mortgage`, `/partners/legal`, `/partners/visa-services`, `/partners/company-setup`, `/sell/valuation`, `/services/selling-advisory`, `/services/short-term-rentals`, `/services/concierge`, `/services/architecture`, `/services/interior-design`, `/services/fit-out`, `/services/design-build`, `/services/law-firm`, `/services/buying-advisory`, `/services/rental-advisory`, `/services/investment-advisory`, `/services/snagging`, `/services/currency-exchange`, `/services/signature-collection`, `/services/broker-certification`, `/services/complaint-procedures`, `/services/customer-happiness-center`, `/services/testimonials`, `/referral-partner`

**INSIGHTS (6 pages)** — `/market-intelligence`, `/news`, `/market-report`, `/market-intelligence/overview`, `/market-intelligence/areas`, `/market-intelligence/reports`, `/market-intelligence/methodology`

**GUIDES (9 pages)** — `/guides`, `/buyer-guide`, `/seller-guide`, `/rent-guide`, `/tenant-guide`, `/landlord-guide`, `/investor-education`, `/guides/golden-visa-uae`, `/faq`

**Total: ~38 pages**

## Brand contract (locked, applied identically to every page)

- **Page background**: solid dark emerald `#010806` (matches footer band; no gradient).
- **Hero band**: short emerald gradient `linear-gradient(180deg, #065F46 0%, #054C39 10%, #032820 32%, #010806 100%)`, white text/icons.
- **Content cards**: champagne surface `#F7F2EA` with dark ink `#1A1A1A`, raised variant `#EFE6D6`, gold hairline `rgba(184,149,85,0.28)` — no gold fills.
- **Emerald feature cards** (metric tiles, CTA tiles): `#064E3B` background, pure white text/icons.
- **Dividers**: white `rgba(255,255,255,0.14)` on emerald, gold hairline on champagne. No gray, no gold dividers on emerald.
- **Buttons**: primary = emerald metallic pill (white text), secondary = champagne (emerald text). No focus rings on inputs.
- **Icons**: `<IconTile />`; on emerald surfaces → white FG.
- All must carry `data-surface="emerald"` (dark bands) or `data-surface="champagne"` (light cards) so the global contrast guard passes.

## Execution protocol

For **each** page, one at a time, in order:

1. Read the current page file.
2. Rewrite the page shell + section wrappers to the brand contract above (keep all copy, data, imports, features intact — no removal).
3. Run Playwright against `http://localhost:8080<route>` at viewport 1280×1800, capture `/tmp/brand/<slug>.png`.
4. Open the screenshot with `code--view` and visually verify: dark emerald page bg, no beige leak, no black-on-emerald, no gold dividers on dark, hero contrast correct.
5. Only then move to the next page.

If a page fails validation, fix in place and re-screenshot before advancing.

## Batches (grouped only for reporting cadence, still one-by-one internally)

- **Batch A — Services core (8)**: `/services`, `property-management`, `selling-advisory`, `buying-advisory`, `rental-advisory`, `investment-advisory`, `short-term-rentals`, `concierge`
- **Batch B — Services build & legal (7)**: `architecture`, `interior-design`, `fit-out`, `design-build`, `law-firm`, `snagging`, `signature-collection`
- **Batch C — Services partners & ops (8)**: `/partners/mortgage`, `/partners/legal`, `/partners/visa-services`, `/partners/company-setup`, `/sell/valuation`, `currency-exchange`, `broker-certification`, `referral-partner`
- **Batch D — Services care (4)**: `complaint-procedures`, `customer-happiness-center`, `testimonials`, `/services` polish pass
- **Batch E — Insights (7)**: `/market-intelligence`, `/news`, `/market-report`, `/market-intelligence/overview`, `/areas`, `/reports`, `/methodology`
- **Batch F — Guides (9)**: `/guides`, `buyer-guide`, `seller-guide`, `rent-guide`, `tenant-guide`, `landlord-guide`, `investor-education`, `golden-visa-uae`, `/faq`

I'll report back at the end of each batch with the screenshot filenames for spot-check.

## Technical notes

- Where a page already uses `<InsightsPageScope />` or `<PremiumSectionCard />`, only the surface tokens change — component structure preserved.
- Update the two shared scopes (`InsightsPageScope`, any `ServicesPageScope` if present; create one if missing) so guide/insight children inherit correct tokens without per-file duplication.
- Global CSS (`src/index.css`) gets one new pass keyed on `[data-brand-emerald-page]` to force emerald bg + white ink defaults for these routes, reducing per-page churn.
- No business logic, no data-fetching, no route changes — presentation only.

## Risks / trade-offs

- **Time**: 38 pages × (edit + screenshot + view) is heavy. Screenshotting each is what you asked for; I will not skip it.
- **Copy drift**: I will not rewrite any headline/body text; only surfaces, colors, dividers, buttons.
- **Regression risk on shared scopes**: changing `InsightsPageScope` will visually update all 9 guides + 6 insights at once — that's intentional and the point of the rebuild.

Approve and I'll start with Batch A, page 1 (`/services`).
