

## Goal
Three things: (1) Fix the "My Account" section toggle in the vertical nav so it opens/closes instantly on a single click, (2) upgrade site speed across devices, and (3) massively expand SEO coverage for Google indexing.

---

## 1. Fix "My Account" Toggle Getting Stuck

**Root cause:** The `toggleSection` function in `GlobalVerticalNav.tsx` triggers a `scrollIntoView` with a 150ms `setTimeout` after every open. Combined with the `max-h-[2000px]` CSS transition and the accordion state update, rapid clicks or partial-open states can cause the section to appear "stuck" -- the scroll animation interferes with the DOM height transition. Additionally, the `useEffect` on line 574-583 auto-opens a section on every route change, which can override the user's manual toggle.

**Fix:**
- In `toggleSection`: Remove the `setTimeout` + `scrollIntoView` when *closing* (only scroll when opening).
- Add `e.stopPropagation()` to the section button to prevent any parent click handlers from interfering.
- Change the `max-h` transition from `max-h-[2000px]` to a grid-based or `display` toggle approach that doesn't fight with scroll animations.
- Guard the auto-open `useEffect` (line 574) so it only runs on *initial mount*, not on every pathname change, preventing it from re-opening a section the user just closed.

**Files:** `src/components/navigation/GlobalVerticalNav.tsx`

---

## 2. Speed Upgrades Across All Devices

**a) Add route-level code splitting for heavy pages**
- Split the `manualChunks` in `vite.config.ts` to isolate heavy libraries: `leaflet` (map pages), `exceljs`/`jspdf`/`pdf-lib` (document tools), `@elevenlabs/react` (voice tools).
- This prevents users who visit the homepage from downloading map/PDF/Excel libraries.

**b) Add `loading="lazy"` and `fetchpriority` hints**
- Audit key image-heavy components (hero sections, property cards) to ensure they use native lazy loading below the fold and `fetchpriority="high"` for LCP images.

**c) Preload critical route chunks**
- Add `<link rel="modulepreload">` for the homepage chunk and properties chunk in `index.html` so the most common landing pages load faster.

**d) Reduce initial JS by deferring non-critical providers**
- Defer `PopupCoordinatorProvider`, `PodcastVisibilityProvider`, and `ActiveLeadProvider` initialization until after first paint (lazy-init pattern).

**Files:** `vite.config.ts`, `index.html`, select page/component files

---

## 3. SEO & Google Indexing Expansion

**a) Expand `sitemap.xml` with 40+ missing pages**
The current sitemap has ~60 URLs but the site has 100+ public routes. Missing high-value pages include:
- `/sell`, `/rent`, `/listing-portal`, `/resale-properties`
- `/guides`, `/education-hub`, `/golden-visa-guide`, `/relocation-guide`
- `/ai-hub`, `/quiz` (already present but many AI tool pages missing)
- `/join` (careers), `/career-portal`, `/press-kit`
- `/map`, `/insights`, `/market-report`
- `/sell/valuation`, `/partners/mortgage`
- All individual service pages not yet listed
- `/disclaimers`, `/intellectual-property`, `/aml-kyc`, `/accessibility`, `/trust-and-audit-center`
- `/ticket-hub`, `/landlord-portal`

**b) Add FAQ structured data (JSON-LD) on FAQ pages**
- Create a reusable `SEOFaqSchema` component that injects `FAQPage` structured data on `/faq`, `/buyer-faq`, `/seller-faq`, `/investor-faq`, `/landlord-faq`, `/tenant-faq`. This targets Google's FAQ rich snippets directly.

**c) Add `SiteNavigationElement` structured data**
- Inject a `SiteNavigationElement` JSON-LD schema listing the primary navigation links. This helps Google understand site hierarchy.

**d) Add per-page meta tags for engagement signals**
- Ensure every public page uses `<SEOHead>` with unique title, description, and canonical URL. Pages missing this will get a default from `index.html` but won't rank individually.

**e) Update `robots.txt`**
- Remove `Disallow: /*?*` -- this blocks all query-string URLs including `/properties?type=apartment` which are valid, crawlable pages. Replace with specific query parameter blocks only for internal params.

**f) Add `lastmod` dates to today's date in sitemap**
- Update all `<lastmod>` from `2026-03-05` to `2026-03-11` (today).

**Files:** `public/sitemap.xml`, `public/robots.txt`, `src/components/GlobalSEO.tsx`, new `src/components/SEOFaqSchema.tsx`, select page files

---

## Summary of Changes

| Area | Files | Impact |
|------|-------|--------|
| My Account toggle fix | `GlobalVerticalNav.tsx` | Instant open/close, no stuck state |
| Speed: chunk splitting | `vite.config.ts` | Smaller initial bundle |
| Speed: lazy loading | `index.html`, component files | Faster LCP |
| SEO: sitemap expansion | `public/sitemap.xml` | 40+ new indexed pages |
| SEO: robots.txt fix | `public/robots.txt` | Unblock valid property URLs |
| SEO: structured data | `GlobalSEO.tsx`, new `SEOFaqSchema.tsx` | Rich snippets in search |

