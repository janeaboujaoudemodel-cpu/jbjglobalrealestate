
## Mobile readability & UX fix — full sweep

The mobile experience has multiple compounding problems: faded/invisible text, broken hero loading state, mis-sized header/footer logos, and pages that look "white-on-white" on phones. This plan fixes them at the root so the entire site becomes readable on every device.

## Problems found

1. **Hero loading state on mobile** — `Index.tsx` shows a dark gold-brown gradient with a small monogram + faint white text ("Your Gateway to Dubai's Finest Real Estate" at `text-white/60`). On slow mobile networks the video takes seconds; the user sees only this washed-out placeholder, no scroll cue, no skeleton.
2. **Header logo on mobile** — `GlobalHeader.tsx` renders the monogram at `w-20 h-20` (80px) with `scale-1.25` when transparent → effectively 100×100 on a 360px-wide screen. Combined with two text lines (`JBJ Global Real Estate` + `Excellence in Real Estate`), the header overflows and text gets truncated/mashed against the hamburger.
3. **Footer logo on mobile** — renders at `h-28` (112px) which is oversized for a 360px viewport and dominates the footer.
4. **Faded titles/labels everywhere on mobile** — many sections use `text-white/60`, `text-white/40`, `text-gray-400` on light/champagne backgrounds, or `text-[8px]`/`text-[9px]` micro-type that becomes illegible on small screens. The existing global safety net handles `text-white-on-light` for forms but does NOT cover the dimmed `/40` `/50` `/60` opacity text used throughout marketing sections.
5. **Icons washed out** — gray-400/500 icons on champagne/white sections lose contrast on mobile glare.

## Fix plan

### 1. Hero loading state (`src/pages/Index.tsx`)
- Brighten fallback tagline from `text-white/60` to `text-white/90` and bump from `text-sm` to `text-base sm:text-lg`.
- Add a clear "Loading experience…" micro-label under the shimmer line so users know it's loading, not broken.
- Increase mobile monogram from `w-36` to `w-44` for better presence, add subtle scale-in animation.
- Ensure video `preload` is `metadata` (not `none`) so first frame shows faster on mobile.

### 2. Header (`src/components/GlobalHeader.tsx`)
- Shrink mobile logo: `w-12 h-12 sm:w-16 sm:h-16` (was `w-20 h-20 sm:w-24 sm:h-24`), remove the `scale-1.25` blow-up on transparent state for `<sm` breakpoint.
- Bump primary brand text on mobile: `text-xs sm:text-sm` (was `text-[10px]`), keep on one line by hiding "Excellence in Real Estate" tagline `<sm:hidden`.
- When transparent, add a subtle text-shadow to brand text so it stays readable over any video frame.
- Hamburger icon: stays `w-6 h-6` but ensure color contrast — add background pill `bg-white/90 rounded-full` when hero is transparent so the menu trigger is always visible.

### 3. Footer (`src/components/Footer.tsx`)
- Shrink mobile logo: `h-16 sm:h-24 md:h-32` (was `h-28 sm:h-36 md:h-40`).
- Center alignment preserved; reduce `mb-6` to `mb-4` for tighter mobile rhythm.

### 4. Global mobile readability safety net (`src/index.css`)
Add a mobile-only `@media (max-width: 767px)` block that:
- Bumps any `text-white/40`, `text-white/50`, `text-white/60` to minimum `0.85` opacity.
- Bumps any `text-gray-400` / `text-gray-500` on light surfaces to `text-gray-700` equivalent.
- Enforces minimum readable font size: any element with `text-[8px]` / `text-[9px]` / `text-[10px]` upgraded to `11px` floor on mobile.
- Increases icon opacity floor to `0.85` on mobile.
- Adds text-shadow to any `text-white` directly on `.jj-hero-fullscreen` to survive bright video frames.

### 5. CTA pills + pillar badges in hero
- Increase pill border opacity from `border-white/30` to `border-white/60` on mobile.
- Bump pillar description from `text-[8px]` / `text-white/60` to `text-[10px]` / `text-white/85` on mobile.
- Make pillar icons fully opaque (`text-white` not `text-white/80`).

## Files touched
- `src/pages/Index.tsx` — hero loading state + CTA pill / pillar contrast on mobile
- `src/components/GlobalHeader.tsx` — mobile logo size + brand text + hamburger contrast
- `src/components/Footer.tsx` — mobile logo size
- `src/index.css` — global mobile readability safety net (opacity floor, font-size floor, hero text-shadow)

## Deliverable
- Mobile (390×844) screenshots: home hero loading state, home hero loaded, header transparent + solid, footer, one project page (current `/project/tilal-al-furjan`).
- Confirmation that all titles, labels, prices, icons are readable at arm's length on a phone.
- Global rule documented so future components inherit mobile-safe defaults automatically.
