
## Goal

Implement the Semrush On-Page SEO Checker brief for primary keyword **"real estate"** (UAE) by shipping a new pillar article and applying every actionable On-Page idea Semrush surfaces across its seven categories: Strategy, SERP Features, Content, Semantic, Backlinks, Technical, User Experience.

## 1. New pillar article

**Route:** `/insights/future-of-real-estate-2026` (also aliased via `/news/future-of-real-estate-2026` redirect so news-hub linking still works).

**File:** `src/pages/insights/FutureOfRealEstate2026.tsx` (lazy-loaded in `PublicRoutes.tsx`).

**Head (via `SEOHead`):**
- Title: `The Future of Real Estate: 5 Trends to Watch in 2026 | JBJ`
- Meta description (verbatim from brief, 155 chars): "Discover the future of real estate with key trends for 2026, including sustainable practices and the growth of luxury properties. Learn more!"
- Canonical: `https://jbj.ae/insights/future-of-real-estate-2026`
- OG + Twitter card, article-type
- Breadcrumb items: Home → Insights → Future of Real Estate 2026

**Body structure** (matches brief exactly — single H1, five H2 trends, two H3 sub-sections each, intro + conclusion):

```
H1  The Future of Real Estate: 5 Trends to Watch in 2026
    Introduction
H2  Trend 1: Rise of Sustainable Real Estate
  H3  Importance of Green Building Practices
  H3  Impact on Property Values
H2  Trend 2: Growth of Luxury Real Estate
  H3  Market Analysis
  H3  Demographic Shifts Driving Luxury Demand
H2  Trend 3: Increase in Digital Real Estate Brokerage
  H3  Technology in Real Estate Transactions
  H3  Virtual Tours and AI in Property Management
H2  Trend 4: Emerging Markets in Commercial Real Estate
  H3  Opportunities in Untapped Areas
  H3  Future of Retail Spaces in Urban Areas
H2  Trend 5: Shift Towards Remote Work & Residential Impact
  H3  Demand for Larger Homes
  H3  Transformation of Urban and Suburban Living
H2  Conclusion
  H3  Summary of Key Trends
  H3  Call to Action for Investors & Homebuyers
H2  FAQ (8 questions, powers FAQPage schema)
```

**Word count target:** 1,800–2,200 words (Semrush Content ideas typically recommend matching top-10 SERP average, which sits ~1,900 for this term).

**Secondary-keyword coverage:** naturally weave in every keyword from the brief (real estate, dubai real estate, real estate companies in dubai, real estate agents in dubai, luxury real estate, sustainable real estate, commercial real estate, property management services, property investment, investment properties, real estate valuation, real estate development, real estate brokerage, residential properties, first-time homebuyers, real estate consultants, dubai real estate news, dubai real estate centre + registration-trustee terms cited in context of DLD flow).

## 2. Semrush On-Page ideas — the 7 categories

| Category | Action |
|---|---|
| **Strategy** | Pillar article targets one high-intent head term ("real estate") plus 24 secondaries. Internal link hub from `/news`, `/buyer-guide`, `/investor-hub`, and homepage insights strip. |
| **SERP Features** | FAQPage JSON-LD (8 Q&A), Article JSON-LD with `author`, `datePublished`, `image`, `publisher`. BreadcrumbList JSON-LD. HowTo-worthy sub-section for "How to buy Dubai real estate in 2026" → HowTo schema. |
| **Content** | 1,800+ words, ≥1 image per H2, semantic keyword coverage, TL;DR box at top, jump-to-section TOC, updated `datePublished` = 2026-07-05. |
| **Semantic** | Include LSI terms: RERA, DLD, Oqood, off-plan, freehold, yield, cap rate, ROI, Golden Visa, PropTech. |
| **Backlinks** | Article is the anchor asset for the Tier-2 press pitches already listed in `.lovable/backlink-prospects.md`. Note the URL in that file. |
| **Technical** | Preload hero image, `loading="lazy"` on below-fold images, `<link rel="canonical">`, hreflang via existing `CanonicalAndHreflang`, add to `scripts/generate-sitemap.ts` (priority 0.9, changefreq monthly), regenerate `public/sitemap.xml`. |
| **User Experience** | Sticky TOC on desktop, reading progress bar, 60ch line length, champagne/ink palette per design system (no new tokens), CTA card to `/contact` and `/properties`. |

## 3. Files to change

- **Create** `src/pages/insights/FutureOfRealEstate2026.tsx` — full article component
- **Create** `src/data/insights/futureOfRealEstate2026.ts` — content + FAQ + HowTo data (keeps component lean)
- **Edit** `src/routes/PublicRoutes.tsx` — lazy route + `/news/future-of-real-estate-2026` redirect alias
- **Edit** `scripts/generate-sitemap.ts` — add new entry
- **Edit** `public/sitemap.xml` — regenerate
- **Edit** `.lovable/backlink-prospects.md` — reference the pillar URL as anchor asset

## 4. Validation (E2E before signing off)

Playwright script (`/tmp/browser/rank/`) will:
1. Visit `http://localhost:8080/insights/future-of-real-estate-2026`
2. Screenshot hero + mid-article + FAQ
3. Assert:
   - single `<h1>` matches brief title
   - `<title>` and `meta[name=description]` match brief
   - `link[rel=canonical]` = `https://jbj.ae/insights/future-of-real-estate-2026`
   - JSON-LD blocks: `Article`, `FAQPage`, `BreadcrumbList`, `HowTo` all parse and pass `@type` checks
   - Every secondary keyword from the brief appears at least once in visible text
   - No console errors, no broken images
4. Fetch `/sitemap.xml`, assert the new URL is present.

Only mark complete after all assertions pass and screenshots are visually verified.

## 5. Out of scope

- No changes to unrelated pages, routing, or design tokens
- No new components beyond the article + data file
- No AI-generated hero image unless the user asks — will use an existing dubai-skyline asset already in `src/assets`
