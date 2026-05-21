
## Deep Audit — Findings

### What already exists (strong foundation)
- `index.html`: full title/description/keywords, canonical, 16 hreflang locales, OG/Twitter, geo meta, Google site verification, 3 inline JSON-LD blocks (RealEstateAgent + LocalBusiness + SiteNavigation ItemList).
- `GlobalSEO.tsx`: runtime-injected JSON-LD (RealEstateAgent #organization, Founder Person, etc.).
- `CanonicalAndHreflang.tsx`: per-route canonical + hreflang + og:url updater.
- `SEOHead.tsx` (287 lines): per-page title/desc/keywords/canonical/OG + optional FAQ schema.
- `SEOBreadcrumbs.tsx`, `SEOFaqSchema.tsx`, `seo/ProjectStructuredData.tsx`, `MarketIntelligenceSchema.tsx`.
- `public/sitemap.xml`: 122 static URLs with image extensions.
- `public/robots.txt`: per-bot rules, honeypots, admin blocked, sitemap declared.
- `seo/serviceSeoCatalog.ts` + `seoChecks.ts`: validator for 30+ service pages.

### Issues found (the real problems)

1. **Duplicate canonical tags** — `index.html` ships static `<link rel="canonical" href="https://www.jbj.ae">` AND `CanonicalAndHreflang.tsx` injects a per-route one. Two canonicals = invalid SEO signal.
2. **Duplicate hreflang sets** — 16 static `<link rel="alternate">` in `index.html` PLUS the same 16 re-injected per route → 32 alternates per page.
3. **Duplicate Organization/RealEstateAgent schema** — Defined in `index.html` (twice — RealEstateAgent + LocalBusiness with the same `name`) AND again in `GlobalSEO.tsx`. Three competing entities for one business.
4. **NAP (Name/Address/Phone) inconsistency** — Google's #1 local SEO killer:
   - Phone: `+971565911000` (index.html top), `+971-56-591-1000` (GlobalSEO), `+971 54 716 7107` (noscript fallback).
   - Email: `contact@jbj.ae` vs `contact@JBJ.ae`.
   - Opening hours: `Mo-Sa 09:00-18:00` (index.html LocalBusiness) vs `Mo-Su 09:00-21:00` (GlobalSEO RealEstateAgent).
   - Address: `"Downtown Dubai"` street in GlobalSEO; absent in index.html LocalBusiness.
5. **Static `<html lang="en">`** — never updated when the language switcher changes; hurts multilingual indexing.
6. **Sitemap is static and stale** — `lastmod` frozen at 2026-03-11/2026-05-13, no property URLs, no area URLs, no developer URLs, no news/blog URLs. Properties cannot be individually indexed.
7. **No generator script** — sitemap drifts from real routes; new pages aren't added.
8. **Per-page metadata gaps** — many routes use `SEOHead` but `SEOHead` and `CanonicalAndHreflang` can both write canonical (third conflict source on pages that use SEOHead).
9. **Schema gaps** — no `BreadcrumbList` injection sitewide (component exists but verify mounting), no `Product`/`RealEstateListing` schema on `/properties` list, no `Service` schema on `/services/*`, no `AggregateRating` source-of-truth.
10. **Self-referential `aggregateRating: 4.9/250`** in GlobalSEO without a verifiable Review source — Google may flag as spam.
11. **`og:image` references `og-image.jpg`** — verify dimensions (1200×630) and that file exists.
12. **`x-default` hreflang** points at `?lang=en` URL not the bare canonical (the static set is mostly fine, but the dual injection guarantees conflict).
13. **Sitemap URL host** uses `https://www.jbj.ae`; canonical in index.html uses `https://www.jbj.ae` but JSON-LD uses bare `https://jbj.ae`. Pick one canonical host.
14. **No `Sitemap:` line points to dynamic property sitemap** (none exists yet).
15. **No structured opening hours JSON-LD on home page anchored to verified GBP** — opening hours don't match Google Business.

---

## Execution Plan

### Phase 1 — Eliminate duplicate SEO sources (single source of truth)
- Remove from `index.html`: `<link rel="canonical">`, all 17 `<link rel="alternate" hreflang>` lines, the inline RealEstateAgent and LocalBusiness JSON-LD scripts (keep ItemList SiteNavigation).
- Keep `CanonicalAndHreflang.tsx` as the single per-route canonical/hreflang/og:url emitter.
- Keep `GlobalSEO.tsx` as the single Organization/RealEstateAgent emitter — and dedupe inside it (one `@type: ["RealEstateAgent","LocalBusiness"]` node with one `@id`).
- Make `SEOHead.tsx` skip writing canonical/hreflang (delegate to `CanonicalAndHreflang`); it keeps title/description/keywords/OG/Twitter/FAQ schema only.

### Phase 2 — Fix NAP and unify business identity
- Create `src/config/companyNAP.ts` with the one canonical: name, legalName, phone (E.164), display phone, email (lowercase), address (street, city, country, postalCode), geo (lat/lng), opening hours, social URLs, GBP place ID.
- All schema (`GlobalSEO`, footer, contact pages, structured-data emitters) imports from this file. Resolves issues #4, #10.
- Reconcile phone with user (which is the real public number — `565911000` or `547167107`?). Until confirmed, use the one already shown in the footer.
- Use one host `https://www.jbj.ae` everywhere (resolves #13).

### Phase 3 — Dynamic sitemap generator
- Create `scripts/generate-sitemap.ts` that pulls:
  - Static routes (home, /properties, /sell, /rent, /areas, /developers, /services/*, /about, /contact, /faq, /news, /awards, all guides).
  - All `published = true` projects from `vw_project_public` → `/project/:slug`.
  - All areas, communities, developers from public views.
  - Service catalog from `seo/serviceSeoCatalog.ts`.
- Writes `public/sitemap.xml` with real `lastmod`, image extensions per property, and hreflang alternates pointing to the same URL (matches single-URL multilingual setup).
- Wire `predev` + `prebuild` in `package.json`.
- Optional sitemap index if URL count exceeds 50K.

### Phase 4 — Per-page rich schema
- Mount `<SEOBreadcrumbs />` in `App.tsx` root (verify it runs site-wide).
- Add `Service` JSON-LD to each `/services/*` page (catalog entry already exists — derive automatically).
- Confirm `ProjectStructuredData` (already exists) is mounted on `/project/:slug`. Extend with `Place`, `priceCurrency: AED`, room counts.
- Add `BreadcrumbList` + `ItemList` to `/properties` and `/areas`.
- Inject `FAQPage` on FAQ pages (use existing `SEOFaqSchema`) — verify it's wired.

### Phase 5 — Language-aware `<html lang>`
- Update `LanguageContext` to set `document.documentElement.lang` and `dir` on every language change (Arabic/Hebrew/Persian → `rtl`). Resolves #5.

### Phase 6 — Google Business Profile alignment (off-platform checklist delivered to user)
- Generate `GBP_ALIGNMENT_CHECKLIST.md` listing: name, address, phone, hours, primary category (Real Estate Agency), secondary categories (Property Management Company, Real Estate Consultant), website URL, social URLs, attributes, photo plan, services list — all matching `companyNAP.ts` exactly.
- Cannot mutate GBP from code; user runs through it in the GBP console.

### Phase 7 — Validation
- Run `seoChecks.ts` (existing validator).
- Read tool: `seo_chat--list_findings` before + after to capture deltas.
- Trigger `seo_chat--trigger_scan` post-deploy.
- Provide a final audit report with: issues found, fixes applied, GBP checklist, remaining manual actions (GSC sitemap submission, GBP edits, review acquisition strategy).

---

## Technical details

```text
Files to ADD
  scripts/generate-sitemap.ts          # dynamic sitemap builder
  src/config/companyNAP.ts             # single source of truth
  GBP_ALIGNMENT_CHECKLIST.md           # off-platform checklist

Files to EDIT
  index.html                           # strip duplicate canonical/hreflang/JSON-LD
  src/components/GlobalSEO.tsx         # consume companyNAP, dedupe entities
  src/components/SEOHead.tsx           # stop writing canonical/hreflang
  src/contexts/LanguageContext.tsx     # set <html lang> + dir
  src/App.tsx                          # ensure <SEOBreadcrumbs/> mounted globally
  package.json                         # predev/prebuild → generate-sitemap
  src/pages/services/*.tsx             # add Service schema via existing catalog

Files to LEAVE ALONE
  src/components/CanonicalAndHreflang.tsx
  src/components/SEOFaqSchema.tsx
  src/components/seo/ProjectStructuredData.tsx
  public/robots.txt                    # already correct
  src/seo/serviceSeoCatalog.ts
```

No deletion of any feature, page, or content. Pure consolidation + augmentation.

## Open question

The phone number diverges across files (`+971 56 591 1000` vs `+971 54 716 7107`). Which is the canonical public number? I'll proceed with the footer's current value if you don't specify.
