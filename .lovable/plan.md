## 1. Remove the "Try / Marina / … / Ask the Concierge" chips row (selected element)

**File:** `src/components/home/HomeHeroSearch.tsx` (lines 116–154)

Delete the entire `<div className="mt-3 flex flex-wrap …">…</div>` chip block in full (Try label + 5 quick-query chips + "Ask the Concierge" pill). Gone on every breakpoint. Keep the search shell above it untouched in this step.

## 2. Restyle the hero search bar — minimal "white pill" feel

**File:** `src/components/home/HomeHeroSearch.tsx` (lines 42–114)

- **Background:** swap the dark glass `bg-[rgba(253,251,247,0.10)]` shell for a brighter near-white champagne `bg-[rgba(253,251,247,0.92)]` with a soft `backdrop-blur-[10px]`, keep 1px champagne hairline `border-[#B89555]/40`, drop the dark inner shadow. Result reads as a clean white pill, not a heavy glass slab.
- **Input text** flips to ink `#1A1A1A` with placeholder `#1A1A1A/55` (no text-shadow needed on white).
- **Remove left magnifier:** delete the `<Search />` icon at line 60 entirely.
- **Right submit "Search" pill:** make it sit flush — remove the `pl-5 pr-2` form padding and the inner `h-10/h-11 px-4` sizing so the submit button stretches edge-to-edge of the shell on the right (full `h-full`, rounded only on the right `rounded-r-2xl`, no inner margin). Style: `bg-[#1A1A1A] text-white` premium pill with `ArrowRight`, sized to match shell height (no `h-10` inner cap).
- **Hair seam** (line 97) and the **"Ask our Concierge" right button** (lines 100–113) are removed — the right edge is now the Search submit only. (Concierge stays accessible from the global header button.)
- Mobile: same structure, no left icon, full-height Search pill on the right.

## 3. "Book a Free Consultation" — taller, more minimal, clearer bg

**File:** `src/pages/Index.tsx` (lines 301–344)

- Height `h-10 sm:h-11` → `h-12 sm:h-[52px]` (taller only, width unchanged via same `px-5 sm:px-6`).
- Base background swap from heavy glass `rgba(253,251,247,0.10)` + `blur(18px) saturate(160%)` to a lighter `rgba(253,251,247,0.18)` with `blur(8px)`, thinner border `rgba(212,184,150,0.45)`, softer shadow `0 6px 18px rgba(0,0,0,0.22)`. Reads minimal, less "frosted glass".
- Keep hover behavior (champagne fill + ink text), just match the new resting shadow.

## 4. Equalize padding between the three blocks

**File:** `src/pages/Index.tsx` (lines 365–393)

Current order: VerificationBanner → PartnerVerifyHeroCTA → DeveloperPortalCTA → `<SectionDivider fullWidth />` → FeaturedListings. The gap before FeaturedListings has an extra divider while the gap above the portal CTA has none → uneven spacing.

- Wrap each of the three sections in a uniform vertical-rhythm wrapper: `<div className="py-10 sm:py-14">…</div>` for VerificationBanner, DeveloperPortalCTA, and FeaturedListings.
- Remove the `<SectionDivider fullWidth />` at line 384 (no-op anyway per design memory, but it adds spacing) so the three gaps come purely from the wrappers and are visually identical.
- Strip any leftover `mt-*`/`mb-*` from inside those three components only if they break the rhythm (touch-only-if-needed; will verify after edit).

## 5. Get Verified — make the arrow icon premium-visible (idle + hover) and apply globally to CTAs

**File:** `src/components/verification/VerificationBanner.tsx` (line 62)

The dark `#1A1A1A` button with `text-white` is correct, but the `ArrowRight` has no explicit color and on some passes the universal icon contrast guard can flip it. Pin it:

```tsx
<ArrowRight
  className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform allow-white"
  data-no-contrast-guard
  style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.55))' }}
/>
```

Add a hover lift + glow + subtle 3D on the button itself:
```
hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35),0_0_22px_rgba(255,255,255,0.18)] active:translate-y-0
```
and on hover bump the icon's drop-shadow to `rgba(255,255,255,0.9)` for the glow.

**Global premium CTA hover (apply to all primary CTAs):** add a small utility class `.cta-premium` in `src/index.css` that bundles:
- `transition: transform .25s ease, box-shadow .25s ease;`
- `:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,.30), 0 0 22px rgba(255,255,255,.16); }`
- `:active { transform: translateY(0); }`

Then add `cta-premium` to:
- VerificationBanner "Get Verified" button
- Index.tsx "Book a Free Consultation" button
- PartnerVerifyHeroCTA "Get Verified / Open Portal" link

Icons inside these CTAs get `text-white allow-white data-no-contrast-guard` + a subtle white `drop-shadow` so they remain visible on dark CTAs and gain a glow on hover.

## Files touched

- `src/components/home/HomeHeroSearch.tsx` — chip row deleted, search bar restyled (white pill, no left icon, full-edge Search submit, no Concierge button).
- `src/pages/Index.tsx` — Book CTA height/background tweak; uniform `py-10 sm:py-14` wrappers around the three sections; remove redundant `SectionDivider`.
- `src/components/verification/VerificationBanner.tsx` — visible white arrow icon + premium hover.
- `src/components/home/PartnerVerifyHeroCTA.tsx` — premium hover + icon visibility.
- `src/index.css` — add `.cta-premium` utility.

No logic, no data, no routes changed — visual/layout only.
