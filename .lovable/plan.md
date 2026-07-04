
## Goal
Resolve every failing check in the Semrush Site Audit for `jbj.ae` (Jul 4 2026 export), verify visually + technically with Playwright + curl, and finish the two loose ends from the last pillar-article turn (BuyerGuide related-reading link + hub links landed correctly).

## Failing issues to fix (from `jbj.ae_issues_20260704.csv`)

| Priority | Issue | Failed | Fix |
|---|---|---|---|
| P0 | **Pages not crawled (80/98)** | 80 | Add prerendering (`vite-plugin-prerender-spa` or static route snapshots) for top public routes so bots get HTML, not empty `#root`. If not viable this turn, at minimum ship a machine-readable `/sitemap.xml` + `llms.txt` + rich static `<head>` fallbacks per route class. |
| P0 | **Hreflang conflicts (51)** | 51 | Audit `CanonicalAndHreflang.tsx` — remove duplicate `x-default` + duplicate `en/ar` emission when both index.html static tags and Helmet inject. Keep only Helmet-emitted set. |
| P0 | **Structured data markup errors (7)** | 7 | Validate each JSON-LD block (Article, FAQPage, BreadcrumbList, HowTo, Organization, LocalBusiness) with `schema.org` validator; fix missing required fields (`author.@type`, `image`, `datePublished`, `publisher.logo.url`). |
| P0 | **JSON-LD absent on all crawled pages** (Semrush structured-data export shows 0 across 80 URLs) | 80 | Root cause: Helmet injects client-side; Semrush's crawler doesn't execute JS. Emit critical schema (Organization, WebSite, BreadcrumbList) in **static `index.html`** already (kept) and add per-route static snapshots via prerender for Article/FAQ pages. |
| P1 | **Duplicate title tag (4)** + **Duplicate meta description (4)** | 4+4 | Identify the 4 URL pairs from the mega-export and give each a unique `<title>`/`meta description` in its page component's `SEOHead`. |
| P1 | **Duplicate content (4)** | 4 | Same 4 URLs — add unique intro paragraph + canonical self-reference. |
| P1 | **Incorrect pages found in sitemap.xml (1)** | 1 | Remove disallowed/private route from `scripts/generate-sitemap.ts` and regenerate `public/sitemap.xml`. |
| P1 | **Issues with incorrect hreflang links (2)** | 2 | Fix the 2 broken hreflang target URLs (likely stale slugs). |
| P1 | **Title element too long (1)** | 1 | Trim to ≤60 chars in the offending page component. |
| P2 | **Multiple h1 tags (7)** | 7 | Audit 7 pages, demote extra `<h1>` to `<h2>`. |
| P2 | **Low text-to-HTML ratio (7)** + **Low word count (4)** | 7+4 | Add real content (≥400 words) to the 4 thin pages; identified from mega-export. |
| P2 | **Uncached JS/CSS (7)** + **Unminified JS/CSS (7)** | 7+7 | Add Vite `build.minify: 'esbuild'` (default already), add long-lived `Cache-Control` headers for hashed assets via a small `public/_headers`-equivalent note (Lovable hosting handles automatically — verify by curl and mark N/A if already served with immutable headers). |
| P2 | **Temporary redirects (2)** | 2 | Convert two 302s to 301 via router `<Navigate replace>` (already replace, but Semrush treats client-side redirects as 302 — add server-side note or accept). |
| P2 | **Blocked from crawling (7 NOTICE)** | 7 | Review `robots.txt` disallow list; ensure no accidentally blocked public URL. |

## Previous-turn loose ends
1. Re-verify with Playwright that:
   - `/news` shows the new pillar-insight gold-emerald strip at top.
   - `/investor-hub` shows "New: The Future of Real Estate…" sub-line.
   - `/buyer-guide` Next-Step card shows "Related reading:" link.
2. Confirm `/insights/future-of-real-estate-2026` renders with all 4 JSON-LD blocks (Article, FAQPage, BreadcrumbList, HowTo) and canonical `https://www.jbj.ae/…`.
3. If any of the 3 hub links didn't render (component structure moved), reinsert.

## Google Search Console
- Run URL Inspection API on the pillar article + homepage to confirm indexing eligibility, mobile usability, and rich-results validity.
- Submit `/insights/future-of-real-estate-2026` to GSC via curl (`urlNotifications:publish` is deprecated; instead confirm site is verified and pillar is in sitemap — Google will crawl within days).

## Files to touch
- `src/components/CanonicalAndHreflang.tsx` — dedupe hreflang emission.
- `src/pages/insights/FutureOfRealEstate2026.tsx` — validate JSON-LD schemas, add missing fields.
- `src/pages/{4-duplicate-urls}.tsx` — unique titles/descriptions/intro paragraph (URLs identified from mega-export in build phase).
- `src/pages/{7-multi-h1-urls}.tsx` — demote extra h1.
- `src/pages/{4-thin-content-urls}.tsx` — expand copy to 400+ words each.
- `scripts/generate-sitemap.ts` + `public/sitemap.xml` — remove 1 incorrect entry, regenerate.
- `public/robots.txt` — no changes unless a public route is blocked.
- `index.html` — add static `WebSite` + `BreadcrumbList` JSON-LD fallback for crawler visibility (if not already present via `GlobalSEO`).
- `public/llms.txt` — create (Semrush notice; helps AI crawlers).

## Validation (Playwright + curl, before sign-off)
1. `curl -s https://www.jbj.ae/insights/future-of-real-estate-2026 | grep -c "application/ld+json"` → ≥4.
2. Playwright: visit `/news`, `/investor-hub`, `/buyer-guide`, `/insights/future-of-real-estate-2026`; screenshot each; assert hub links present, no console errors, correct h1/title.
3. For each of the 4 duplicate-title URLs, curl the rendered HTML and assert `<title>` is unique.
4. Fetch `/sitemap.xml`, assert entry count matches generator, no disallowed paths present.
5. GSC URL Inspection API on pillar + homepage → assert `verdict: PASS` on rich results.
6. Re-run `seo_chat--list_findings` after edits; mark all addressed findings fixed.

## Out of scope
- Full SSR migration (would fix "Pages not crawled" definitively but is multi-day). Instead we ship static-head + JSON-LD fallbacks in `index.html` and per-route prerender where cheap.
- Semrush Position Tracking PDF ideas (separate content-marketing effort).
- New pages beyond thin-content expansion of existing 4 URLs.
