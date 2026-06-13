Three mobile/tablet-portrait fixes on the home hero, plus the global support launcher on mobile.

## 1. Mobile/tablet-portrait header: transparent on initial load

File: `src/components/GlobalHeader.tsx` (lines ~302–339)

The current logic forces a champagne fiberglass tint on the homepage mobile header at rest (`homeMobileFiberglassActive` → `showMobileChampagne`). On `/` and `/index` at mobile + tablet-portrait widths and `scrollY <= 80`, the shell must be fully transparent (no background, no backdrop-filter, no inset hairline shadow) so the dark Burj hero shows through.

- When `isHomeHeroPath && isAtPageTop && shouldUseMobileHeader && !forceSolid`: render header shell with `background: transparent`, no `backdropFilter`, no `boxShadow`.
- Keep current champagne fiberglass behavior on non-home routes and after scroll (`isSolid`).
- Force the JBJ wordmark + monogram logo to render in WHITE with a soft text-shadow only while in this transparent-home state, so they stay legible over the dark hero (mirrors the existing `useLightHeaderIdentity` branch used at desktop). Apply `text-shadow: 0 2px 12px rgba(0,0,0,0.55)` and `color:#FFFFFF` on the wordmark; ensure the monogram uses its light/white variant.
- Hamburger icon: white stroke in this state (same shadow).

## 2. Mobile "Free Consultation" CTA: champagne fiberglass

File: `src/components/home/HomeHeroSearch.tsx` (lines 240–267, mobile-only stacked CTA block)

Replace the navy gradient with a champagne mother-of-pearl fiberglass:
- `background: linear-gradient(180deg, rgba(247,242,234,0.78) 0%, rgba(239,230,214,0.72) 100%)`
- `backdropFilter / WebkitBackdropFilter: blur(16px) saturate(150%)`
- `border: 1px solid rgba(184,149,85,0.55)` (gold hairline)
- `boxShadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 22px rgba(26,26,26,0.18)`
- Text + calendar icon → ink `#1A1A1A`; remove `allow-white`, `data-no-contrast-guard` tweaks and the white `textShadow`. Keep `data-hero-consultation-lock`.

Do not touch the desktop variant (lines 196–235), which is the inline pill segment.

## 3. Mobile support launcher: "Contact us" tag, not a black orb

File: `src/components/support/SupportLauncher.tsx` (lines 178–242, mobile branch)

Replace the floating `bg-[#1A1A1A]` circular button with a small horizontal "Contact us" pill that visually matches the desktop edge tag (navy `#102540` background, gold `#B89555` hairline, white text + white Sparkles icon, emerald pulse dot), pinned to `fixed bottom-5 right-4 z-[60]`.

- Pill layout: `inline-flex items-center gap-1.5 h-9 px-3 rounded-full`, `bg-[#102540] hover:bg-[#1a3d63]`, `border border-[#B89555]/70`, white text `text-[11px] font-semibold uppercase tracking-[0.22em]`, content `Sparkles` icon + `Contact us` + emerald dot.
- Keep `data-no-contrast-guard`, `data-allow-dark-cta`, `allow-white` so the global guards don't flip it to ink.
- Tap still toggles the existing `open` state and renders the same channel-orbs panel above the pill (`absolute bottom-12 right-0`). The scrim and channel list stay as-is. Open-state icon switches to `X` inside the same pill (label hides to keep pill compact).
- Remove the now-unused emerald notification dot on the old circular button.

## 4. Visual proof

After changes, browser-test at iPhone 12 viewport (390×844):
- Load `/` — screenshot showing transparent header + white wordmark over Burj hero.
- Screenshot of champagne Free Consultation button.
- Screenshot of bottom-right "Contact us" navy pill (closed) and one tap-open showing the channel orbs panel.

Then iPad portrait (820×1180):
- Confirm header is transparent at rest and wordmark remains legible.

Report screenshots inline.

## Out of scope

- Desktop header, desktop support tag, desktop hero pill — all unchanged.
- No business-logic / route changes.
