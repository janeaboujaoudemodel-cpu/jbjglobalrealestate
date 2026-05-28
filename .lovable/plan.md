## 1. Align "Ready to Get Started" with "Top Areas in Dubai"

In `src/pages/Index.tsx` the two sections use different width modes on `<PremiumSectionCard>`:

- Top Areas: default `width="contained"` → centered `max-w-[1760px]` with `px-3 sm:px-5 lg:px-8`
- Ready to Get Started (CTABand): `width="full"` → edge-to-edge, no gutter

Change the CTABand wrapper (and any other obvious misaligned "full" wrappers immediately around it) to `width="contained"` so its outer frame lines up exactly with Top Areas.

## 2. Reduce vertical gap between sections

Every section wrapper on the home page currently uses `wrapperClassName="cv-auto py-8"` (= 64px top + 64px bottom of empty space between cards). Tighten the rhythm globally:

- Replace `py-8` → `py-4` on all home `<PremiumSectionCard>` wrappers in `src/pages/Index.tsx` (Top Areas, Ready to Get Started, Mortgage Calculator, Toolkit, AI Comparison, Podcast, etc.).
- Also reduce the `#category-selector` wrapper from `py-8` → `py-4`.

Result: ~32px between cards instead of ~64–96px. Sections stay clearly separated but no longer feel "floating in space".

## 3. Performance — fix slow / half-loading images

Root causes found in the home page:

a. **Top Areas uses CSS `background-image`** (`AreasWeCover.tsx` line 79). CSS backgrounds cannot be lazy-loaded, cannot get `decoding="async"` or `fetchpriority` hints, and the browser cannot pick a smaller variant. They block paint until fully decoded → that's the "half / half / half" effect.

→ Replace the `<div style={{backgroundImage}}>` with an `<img>` element absolutely positioned to fill the card:
   - `loading="lazy" decoding="async"`
   - explicit `width`/`height` to prevent layout shift
   - `object-cover` for the same visual result
   - keep the existing zoom-on-hover by moving the transform to the `<img>`

b. **Request images at display size, not full size**. Where Supabase Storage is the source, append the storage `?width=` transform (e.g. 800px wide for area cards, 200px for dev logos) so we stop pulling multi-MB originals into 260px cards. Audit and fix the obvious offenders on the home page only:
   - `AreasWeCover` (cards ~520×260 → request width=800)
   - `HeroSearchBar` dev logos (20×20 → request width=80)
   - `ExploreServicesCard`, `ResalePropertiesSection` card images (request width=800)

c. **Add `loading="lazy" decoding="async"`** to any `<img>` in those four home components that doesn't already have it.

d. **Preconnect to the image host** in `index.html` (`<link rel="preconnect" href="https://mdafrewypkkrildjgtey.supabase.co" crossorigin>`) so DNS + TLS handshake happens once at page start instead of per-image.

Scope is limited to home-page section spacing/alignment and the image-loading hot path the user reported. No backend, no copy, no other layout changes.

## Files touched

- `src/pages/Index.tsx` — width + spacing
- `src/components/home/AreasWeCover.tsx` — bg-image → `<img>` + lazy + width transform
- `src/components/home/HeroSearchBar.tsx` — width transform + lazy on dev logos
- `src/components/home/ExploreServicesCard.tsx` — width transform + lazy
- `src/components/home/ResalePropertiesSection.tsx` — width transform + lazy
- `index.html` — `preconnect` to storage host

## Validation

After build: open `/`, confirm Top Areas and Ready to Get Started have matching left/right edges, confirm gaps between sections are visibly tighter (~32px), and confirm area-card images appear in a single paint instead of progressively filling.
