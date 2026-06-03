## Mobile/Tablet polish — Hero header + Mode picker modal

Scope is presentation-only. No business logic, no data, no desktop regressions.

### 1. Header on mobile/tablet — transparent state (`src/components/GlobalHeader.tsx`)

Today the transparent (top-of-page) state paints a heavy dark scrim behind the header (`linear-gradient rgba(0,0,0,0.55)…`) so the white wordmark stays legible over the hero video. On phones this reads as a solid navy bar that visually crops the hero.

Change (mobile + tablet only, i.e. `< lg`):
- Replace the dark scrim with a **frosted "fiberglass" bar**: `backdrop-blur-md` + very light translucent wash (`bg-white/10`) + a subtle bottom edge fade for legibility. Keep the existing gold hairline.
- Keep the logo image (`jbjMonogramLightTransparent`) and wordmark **white** in this state — no color change to text/logo.
- Desktop (`lg+`) keeps today's gradient mask exactly as-is to avoid touching the approved desktop look.

On-scroll state (`showSolidBackground` true) already paints champagne `#FDFBF7` + gold hairline — that already matches the desktop chrome. We will additionally switch the logo back to the dark monogram and wordmark to `#111111` on scroll (already wired via `isFullyTransparent`). No change needed there beyond confirming the transition is smooth at the mobile breakpoint.

Result: at rest the hero feels full-bleed behind a frosted bar; on scroll the bar becomes the same champagne+gold chrome as desktop.

### 2. Mode Selection modal cropped CTA on mobile (`src/components/ModeSelectionModal.tsx`)

`DialogContent` has no height cap, so on a 414×896 phone with the browser chrome the Continue button + skip link fall under the iOS bottom bar.

Changes:
- Cap dialog height: `max-h-[calc(100svh-2rem)]` and turn the body into a flex column (`flex flex-col`).
- Make the middle block (header + 3 mode cards) the only scrollable region (`flex-1 overflow-y-auto`) so the footer with the **Continue** button + skip link is **always pinned and visible**.
- Add `pb-[env(safe-area-inset-bottom)]` to the footer so it clears the iOS home indicator.
- Tighten paddings on `< sm` (`p-4` instead of `p-6`) and reduce per-card padding to `p-3` so all three cards + CTA fit on a single 390px viewport without scroll in most cases.
- Keep desktop look identical (only `sm:` overrides change).

### 3. General phone/tablet responsiveness sweep (scoped, no removals)

Limited to the two surfaces above plus the hero search bar visible in the screenshot:
- Hero search input wrap: ensure `min-w-0` + `truncate` on the placeholder container so "Search projects, developers, areas, tool…" no longer overflows under the Search button on 360–414px widths.
- Verify the "Free Consultation" CTA below stays full-width and respects the safe area.

### Verification (visual only, per the user's instruction)

1. `browser--set_viewport_size` 390×844 → screenshot `/` hero at rest, then scroll 200px and screenshot again. Confirm: frosted bar at rest with white logo/text, champagne+gold bar on scroll.
2. Same flow at 768×1024 (tablet).
3. Trigger mode picker (clear `sessionStorage` key `jj_mode_modal_dismissed`), screenshot on 390×844 and 768×1024. Confirm Continue button + skip link are visible without page scroll.
4. Spot-check 1440×900 desktop to confirm zero visual regression.

### Files touched

- `src/components/GlobalHeader.tsx` — transparent-state background swap, scoped to `< lg`.
- `src/components/ModeSelectionModal.tsx` — dialog height cap, flex layout, pinned footer, safe-area padding, mobile padding tightening.
- Possibly `src/components/HomeHeroSearch.tsx` (or wherever the hero search lives) — `min-w-0` fix on the placeholder wrapper.

No memory rules are violated: champagne/gold chrome preserved on scroll, white-on-dark allowed because the frosted bar sits over the dark hero video (covered by `data-hero-dark` / `allow-white` opt-outs that already exist on the hero).
