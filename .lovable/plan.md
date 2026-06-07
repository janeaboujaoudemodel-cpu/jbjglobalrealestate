## What's actually slow

The preview you were testing runs **Vite dev mode** (unbundled — 248 separate script requests, FCP ~9.9s). That is not what real visitors get on `jbj.ae` — but the deployed production build still has real bottlenecks that I want to fix:

- `App.tsx` eagerly imports ~14 heavy components on every page for every visitor:
  - `WebDevDock` (owner-only floating tool), `WebDevChangeHighlight`, `OwnerOverrideLoader` — owner-only, but currently shipped to all users
  - `GlobalSEO`, `SEOServiceArea`, `SEOBreadcrumbs`, `CanonicalAndHreflang`, `SeoHighlightOverlay`, `GlobalVisitorTracking` — useful only after first paint
  - 11 global context providers loaded before first paint
- `Index.tsx` pulls 18 icons from `lucide-react` and several home sections eagerly that aren't above the fold
- `src/index.css` is **122 KB** raw (5,962 lines) — adds 1.6 s on the network for everyone
- No service-worker prefetch of route chunks
- Some popups (`PropertyRecommendationPopup`, `AIChatWidget` ~40 KB, cookie/consent banners) mount before user interaction

## Plan — production-first performance pass

### 1. Defer everything owner-only and post-paint in `App.tsx`
- Convert to `React.lazy` + render after `requestIdleCallback`/first paint:
  - `WebDevDock`, `WebDevChangeHighlight`, `OwnerOverrideLoader` (gated to owner email — currently the *code* still ships to every visitor; move to dynamic import inside an owner-only effect so anonymous users never download it)
  - `GlobalVisitorTracking`, `SeoHighlightOverlay`, `OwnerVisitorToggle`
- Keep SEO meta components (`GlobalSEO`, `CanonicalAndHreflang`, `SEOBreadcrumbs`) eager — they must run for crawlers — but verify they don't fetch anything synchronously.

### 2. Shrink the home page (`Index.tsx`)
- Replace barrel `lucide-react` import with per-icon imports (tree-shake-friendly even in dev)
- Move below-the-fold blocks (`DeveloperPartnersMarquee`, `VerificationBanner`, the secondary CTA bands) behind `LazyVisible` so they don't block hero paint
- Keep the hero video preload as-is

### 3. Trim `src/index.css`
- Audit for unused `@keyframes`, dead `.jj-*` classes, duplicated contrast guards
- Target: reduce from 122 KB → under 70 KB (target gzipped ≤ 18 KB)
- No visual changes — purely removing dead rules.

### 4. Vendor chunk hygiene (`vite.config.ts`)
- Split `lucide-react` into its own chunk (currently it lands in the main bundle, 157 KB)
- Add `framer-motion` to its own chunk so home animations don't pull it into shared UI vendor
- Keep existing manualChunks for pdf/excel/zip/canvas/voice

### 5. Defer non-critical providers
- Move `BrandPaletteProvider`, `PodcastVisibilityProvider`, `ConsVisibilityProvider`, `TeamPageVisibilityProvider`, `FounderVisibilityProvider` into a single deferred wrapper that mounts after first paint (their state is only read after user navigates into owner/marketing sections).

### 6. Defer popups/widgets
- `AIChatWidget` (40 KB) — load on first scroll OR first interaction, not on mount
- `PropertyRecommendationPopup` — already minimizes, but make sure code is dynamic-imported behind an idle callback

### 7. Verification
- Run production build (`vite build`) locally, inspect `dist/assets` sizes, confirm: initial JS ≤ 250 KB gz, CSS ≤ 25 KB gz
- Record before/after numbers in the reply

### What I will NOT touch
- No visual changes (champagne theme, hero, CTA primitives, listing cards all untouched)
- No DB/RLS/edge-function changes
- No removal of any feature — only deferral of *when* it loads
- No layout shifts — every deferred component renders into its existing reserved space

## Technical notes (for reference)

Current measured baseline (preview, dev mode):
- FCP 9.9 s, DCL 9.4 s, 248 script requests, 4.7 s total task time
- Real production baseline will be measured at start of the pass (`curl -w` on `jbj.ae`) and again at the end.

Files I expect to edit:
- `src/App.tsx` (lazy + defer)
- `src/main.tsx` (only if needed for deferred guard install)
- `src/pages/Index.tsx` (icon imports + LazyVisible wrap)
- `src/index.css` (dead-rule prune)
- `vite.config.ts` (manualChunks)
- One new helper: `src/components/util/DeferredOwnerTools.tsx`

Approve and I'll execute end-to-end and report measured before/after.