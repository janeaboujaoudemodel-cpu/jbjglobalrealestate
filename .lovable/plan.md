# Performance, Responsiveness & SEO Hardening

Targeted fixes across the existing app (no new features, no architectural rewrites). Audit-first, then ship the high-impact changes below.

## 1. Image pipeline (biggest win for "slow photos")

- **Global `<SmartImage />` primitive** wrapping `<img>` with:
  - `loading="lazy"` + `decoding="async"` defaults; `eager` + `fetchpriority="high"` only for above-the-fold/LCP.
  - `srcset` + `sizes` using existing `getHighResImageUrl` helper to request right-sized renditions (card ≤ 480w, hero ≤ 1600w) instead of full-res blobs.
  - Built-in champagne skeleton + `onError` recovery (re-uses logic from browsing-history-image-recovery).
- Migrate all card + section images in `src/components/home/*`, `src/components/properties/*`, `src/components/property-card/*`, listing grids, developer cards, and project detail gallery to `<SmartImage />`.
- Convert oversized `public/*.png` brand assets (logo, monograms) to optimized WebP variants; keep PNG fallback via `<picture>`.
- Mark only the first hero image per route as LCP (`fetchpriority="high"`, `loading="eager"`); remove `eager` from every other card.

## 2. Section / data loading

- Audit homepage (`src/pages/Index.tsx`) and major listing pages for parallel `useQuery` calls; add `staleTime`/`select` to slim payloads.
- Add `<Suspense>` boundaries with branded skeletons around heavy sections (Handpicked For You, Recommended, Resale, Podcast) so they don't block the rest of the page.
- Defer below-the-fold sections with an `IntersectionObserver`-based `<LazySection />` wrapper (mount on near-viewport), so the first paint isn't blocked by 6+ section trees.
- Verify route-level `React.lazy` covers every heavy page (already 168 in PublicRoutes — confirm no eager imports leak via shared barrel files).

## 3. Bundle & runtime

- Tighten `manualChunks` in `vite.config.ts`: split `docs-vendor` further (jspdf, exceljs, html2canvas, xlsx are huge — they should only load inside Document Studio / export flows, not on first paint). Confirm via dynamic `import()` at call sites.
- Remove eager imports of `framer-motion` from list pages where a CSS transition suffices.
- Audit `src/App.tsx` providers; collapse rarely-used contexts behind lazy boundaries where safe (e.g., `PodcastVisibilityProvider`, `ConsVisibilityProvider`).
- Preconnect already in `index.html` is good; add `<link rel="preload">` only for the actual LCP image of the homepage (currently nothing preloaded).

## 4. Responsiveness

- Sweep listing card grid breakpoints — ensure 1/2/3-col grids use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` consistently and cards don't overflow on 360px.
- Audit sticky header (88px) + sidebar `L-frame` on tablet (768–1024px) for cramped layouts; collapse sidebar to drawer below `lg`.
- Confirm all `<img>` have explicit `width`/`height` (or aspect-ratio class) to eliminate CLS.

## 5. SEO

- Per-route `<title>` + `<meta description>` audit via `CanonicalAndHreflang` + `GlobalSEO`; ensure every public page sets unique values (project detail, developer pages, area pages, blog, tools landing).
- JSON-LD: confirm `RealEstateListing` schema on `/project/:slug` and `BreadcrumbList` on every nested page.
- Add `<link rel="preload" as="image">` for project detail hero based on slug.
- Generate `public/sitemap.xml` dynamically from published projects + static routes; reference in `robots.txt`.
- Image alt text sweep on cards (currently many use developer name only — make descriptive: `"{Project} by {Developer} in {Area}"`).
- Run `seo--trigger_scan` after deploy to verify findings cleared.

## Technical execution order

1. Create `<SmartImage />` + `<LazySection />` primitives.
2. Migrate home + properties + project-detail card images.
3. Vite chunk split + remove eager doc/vendor imports.
4. Per-route SEO meta + JSON-LD + dynamic sitemap.
5. Responsive sweep on header/sidebar/grids.
6. Trigger SEO rescan, report Lighthouse before/after.

## Out of scope

- No CRM/backend logic changes, no new features, no design system redesign. Champagne/gold palette, listing-card layout, and all existing memory rules remain untouched.
