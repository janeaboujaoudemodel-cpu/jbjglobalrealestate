
## Current state (from audit)

The project already has strong perf foundations:

- All routes lazy-loaded via `React.lazy` + Suspense across 8 route files
- Vite `manualChunks` splits react/motion/icons/radix/react-query/supabase/recharts/leaflet/pdf/excel/canvas/parse/voice into separate vendor bundles
- Fonts preloaded with `display=optional` (no FOIT blocking)
- 607 raster images (399 PNG + 208 JPG), **0 WebP, 0 AVIF** — biggest remaining opportunity

A "Performance ≥95 sitewide" claim requires per-page Lighthouse runs, which I cannot execute for 200+ pages in one turn. I'll do it in phases and measure the deltas honestly.

## Phase 1 — Baseline & measurement infrastructure (this turn)

1. Run production `npm run build` and capture per-chunk sizes
2. Add `rollup-plugin-visualizer` (dev-only) so you can open `stats.html` to see what's fat
3. Playwright + Lighthouse against `/`, `/properties`, `/ai-hub`, `/developers`, `/contact` on the built preview — capture LCP, CLS, INP, TTFB, TBT, total transfer size
4. Report the actual numbers so we can prioritize by impact

## Phase 2 — Image pipeline (biggest LCP win)

1. Install `vite-imagetools` for build-time WebP/AVIF conversion of images imported from `src/assets/`
2. Add a `<Picture>` helper that emits `<picture><source type=image/avif><source type=image/webp><img></picture>`
3. Convert LCP images first (hero on `/`, `/properties`, `/services`, `/ai-hub`), then the top ~30 by size
4. For static `public/` images, batch-convert with `sharp` and keep originals as fallback
5. Ensure LCP `<img>` gets `fetchpriority="high"` + `loading="eager"`; everything below-the-fold `loading="lazy"` + `decoding="async"`
6. Add explicit `width`/`height` on every `<img>` to lock CLS to 0

## Phase 3 — JS bundle & INP

1. Analyze `stats.html`; identify any dep pulled in by first-paint that shouldn't be (common culprits: full lodash, moment, unused radix modules, framer-motion in above-fold marketing)
2. Convert any static `import` in first-paint routes to `import()` where the module is only used on interaction
3. Audit `<MainLayoutWrapper>` and `GlobalHeader`/sidebar for expensive synchronous work (heavy context providers, map init, chart init) — defer non-critical
4. Debounce/throttle scroll+resize handlers to protect INP

## Phase 4 — CSS

1. Confirm Tailwind purge is on (default in v3) — check `content` globs in `tailwind.config.ts`
2. `index.css` is 4300+ lines; measure post-purge output. If large: split page-scoped CSS into per-route stylesheets or convert to Tailwind utilities
3. Remove unused `@font-face` fallbacks and any dead selectors flagged by build stats

## Phase 5 — Fonts

1. Currently loading 3 families × 8 weights from Google Fonts (~14 files). Subset to the weights actually used (grep JSX for `font-weight`/`font-*` classes) and drop unused weights from the Google URL
2. Consider self-hosting the used subset (`@fontsource/*`) — removes 2 extra DNS hops
3. Keep `display=optional` to prevent FOUT blocking LCP

## Phase 6 — Caching & network

1. Confirm Lovable's edge caches static assets under `/assets/*` with immutable+long-max-age (Lovable default — verify)
2. Add `<link rel="preconnect">` to the Supabase URL + Cloudflare CDN
3. `preload` the LCP image after Phase 2 lands
4. Verify Brotli/gzip on responses

## Phase 7 — Validation

1. Re-run Lighthouse on the 5 key pages after each phase, report deltas
2. If Performance ≥95 not hit on a page, drill in with a per-page recommendation (usually a specific image or a specific chart lib)

## Non-goals (call out explicitly)

- **TTFB is Lovable's edge/SSG concern** — this is a client-rendered SPA, so TTFB improvements are bounded by hosting. Real TTFB wins would require SSR/SSG, which is a separate large project.
- **Not touching backend / RLS / features** — pure frontend perf pass
- **Not converting every asset immediately** — will target highest-impact first, then iterate

## What I need from you

Confirm scope: **(A)** do all 7 phases now (I estimate ~4–6 tool-heavy turns before Phase 7 validation), **(B)** just Phase 1 baseline + Phase 2 images (biggest visible win, safer), or **(C)** a different priority ordering. I'll proceed on your signal.
