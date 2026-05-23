# Fix all broken photos site-wide

## Goal
Whenever any `<img>` on the site fails to load (404, CORS, expired CDN URL, zero-dimensions), it is automatically replaced with a branded **champagne placeholder showing the project/brand initials** derived from `alt` text. No layout breakage, no broken icons, no missing thumbnails — anywhere.

## Why a global guard (not a 245-file rewrite)
There are ~245 raw `<img>` tags across the codebase plus a partial `SafeImage` wrapper. Migrating every tag is risky and slow. Instead we install a **global, capture-phase image error listener** that catches every failed `<img>` on the page — including ones inside third-party components, dangerouslySetInnerHTML, lightboxes, PDFs preview thumbs, etc. — and rewrites the `src` to a generated champagne-initials data URI.

`SafeImage` is upgraded in lockstep so explicit usages get the same fallback without double-handling.

## What gets built

### 1. `src/utils/champagneInitialsFallback.ts` (new)
- `getInitialsFromAlt(alt: string): string` — strip emojis, take first letters of up to 2 meaningful words, uppercase, max 3 chars. Empty → `"JBJ"`.
- `buildChampagneInitialsDataUri({ initials, w, h }): string` — inline SVG data URI:
  - Background `#F7F2EA` (champagne surface)
  - 1px inset hairline `#B89555` at 40% opacity (gold)
  - Centered initials in `#1A1A1A`, Inter, weight 600, size scaled to the smaller dimension
  - Aspect-aware viewBox so it never distorts inside any container
- Memoize results in a `Map` keyed by `initials|w|h` so repeated tiles share the same data URI.

### 2. `src/utils/imageRecoveryGuard.ts` (new)
- `installImageRecoveryGuard()` mounted once at app entry.
- Attaches a **capture-phase** `error` listener on `window` filtered to `HTMLImageElement`.
- On error, if the element does **not** carry `data-no-fallback`:
  1. **First recovery**: if src looks like a known CDN thumb pattern (e.g. `_thumb`, low-res `bayut`/`propertyfinder` size suffix), retry once with `getHighResImageUrl(src)` (already exists in `src/architecture/assets`).
  2. **Second recovery**: swap to champagne-initials data URI sized from `clientWidth`/`clientHeight` (fallback to `naturalWidth || 400`).
  3. Mark element with `data-img-recovered="initials"` so the swap never re-fires.
- Also covers the zero-dimensions case via a `load` listener (same logic).
- Mounted from `src/main.tsx` (or `src/App.tsx`, whichever owns app boot).

### 3. `src/components/SafeImage.tsx` (updated)
- Replace today's null-fallback behaviour with the same champagne-initials helper so explicit `<SafeImage>` consumers get the branded tile instead of a broken icon when no `fallbackSrc` is passed.
- Keep existing `logImageFailure` instrumentation.
- Add `data-no-fallback` opt-out passthrough for callers that explicitly want raw browser behaviour (e.g. canvas screenshot tools, OG image generators).

### 4. Opt-outs
- `data-no-fallback` attribute → skip guard entirely (logos already using transparent PNGs, PDF/canvas captures, signature builder previews).
- Apply this attribute to:
  - `src/components/JBJLogo.tsx`, `src/components/JJLogoImage.tsx` (logos shouldn't show "JJ" initials over themselves)
  - canvas-capture sources inside `e-signature`, `stamp-generator`, `corporate-suite/CompanyProfilePreview.tsx`
  - `imagegen`/PDF preview tools where a missing image must stay missing

### 5. No DB / no backend changes
Pure frontend. Respects existing "No Removal" policy, no-gray rule, champagne theme, and existing `getHighResImageUrl` standard.

## Files touched
```
src/utils/champagneInitialsFallback.ts        (new)
src/utils/imageRecoveryGuard.ts               (new)
src/components/SafeImage.tsx                  (update)
src/main.tsx                                  (1-line: install guard)
src/components/JBJLogo.tsx                    (add data-no-fallback)
src/components/JJLogoImage.tsx                (add data-no-fallback)
~3-4 canvas/PDF preview components            (add data-no-fallback)
```

## Memory to save after build
- `mem://features/media/global-broken-image-fallback-standard` — guard + champagne-initials standard, opt-out via `data-no-fallback`.

## Verification
1. Load `/project/...` → temporarily blackhole a few gallery URLs via DevTools network blocking → confirm tiles become champagne initials, layout preserved.
2. Visit homepage Featured Listings, Recommended Projects, News, Developer pages → confirm no broken-icon glyphs visible anywhere.
3. Confirm logos still render correctly (opt-out works).
4. Confirm console shows `logImageFailure` entries (instrumentation preserved).
