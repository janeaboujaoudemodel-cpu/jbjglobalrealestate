## What's actually broken

Both bugs share one root cause: the PASS 9 ink-emerald rule (added in the last session at the bottom of `src/index.css`) is too aggressive.

That rule paints `background-image: var(--gradient-ink) !important; background-color: transparent !important;` on **any** element matching `[data-surface="dark"]` / `.surface-dark` / `[data-surface="ink"]` / `[data-surface="navy"]` — not just real CTAs.

`data-surface="dark"` is used in 28+ places across the app purely as a **text-color hint** for the contrast guard (it tells the cascade "white text is allowed inside me"). It was never meant to repaint the element's own background. PASS 9 hijacks it and:

1. **Explore Our Services card (image cropped to right half).**
   `ExploreServicesExpander.tsx` line 172 — the inner text overlay `<div data-surface="dark" className="… max-w-xl">` covering the left half of the hero photo gets repainted with the solid emerald gradient. That's the dark-green wall the user circled. The image is fine; it's just hidden behind a PASS-9-painted overlay.

2. **Hero search bar ("Search" word white-on-white / invisible placeholder).**
   `HomeHeroSearch.tsx` line 108 — the pill wrapper has `data-surface="dark"`. PASS 9 makes its background transparent and paints emerald behind it, then a separate cascade rule forces white text on every non-excluded descendant. Combined with the white input/Search-button segments inside the pill, the visible result is "Search" rendered white on the white button surface.

Same family of regressions will appear anywhere else a `data-surface="dark"` wrapper holds a photo, glass surface, or white inner segment (Footer, AssistantChat, AreaHeroSection, FeaturedListings, ToolkitShowcaseCard, HeroPropertySearch, ModeSwitcher, ProjectDetailLayout, etc.). 28 files use this attribute today.

## Fix

Tighten PASS 9 so it only repaints elements that **explicitly opt in** to the emerald ink, never the generic text-color hint attributes.

### 1. `src/index.css` — PASS 9 block (lines 6395–6465)

Replace the surface list in the repaint selector with the opt-in attributes and the locked CTA primitives only.

Before (current):
```
.jj-cta-dark, .jj-navy-cta, [data-cta="dark"],
[data-surface="dark"], [data-surface="ink"], [data-surface="navy"],
.surface-dark, .surface-ink, .surface-navy,
[data-ink-emerald], [data-hero-dark],
[class~="bg-[#0A0A0A]"], [class~="bg-[#1A1A1A]"], [class~="bg-[#1F1F1F]"], [class~="bg-black"]
```

After:
```
.jj-cta-dark, .jj-navy-cta, [data-cta="dark"],
[data-ink-emerald], [data-hero-dark]
```

Drop the broad `data-surface="dark|ink|navy"`, `.surface-dark|ink|navy`, and raw `bg-[#0A0A0A]/bg-[#1A1A1A]/bg-[#1F1F1F]/bg-black` selectors from PASS 9. Those classes/attributes remain valid for the contrast contract but no longer trigger an emerald repaint.

Update the hover block identically (only `.jj-cta-dark`, `.jj-navy-cta`, `[data-cta="dark"]` stay).

Net effect: the emerald gradient survives **only** on real dark CTA buttons (already gold-hairlined, white text, opt-in) and on any wrapper the developer explicitly tags `data-ink-emerald` / `data-hero-dark` (Property Measurement hero, etc. — already done last session).

### 2. `src/pages/Index.tsx` — no change required, but verify

Once PASS 9 stops repainting `data-surface="dark"`, the HomeHeroSearch pill returns to its intended transparent state over the hero video. The Search button reads black-on-white again, the placeholder is visible, and the typed text uses its inline `#1A1A1A` color.

### 3. `src/components/home/ExploreServicesExpander.tsx` — small cleanup

Remove the stray `data-surface="dark"` from the **inner text overlay** at line 172. It was only there as a text-color hint and is structurally wrong (the overlay sits on top of a photo, not on a dark surface). Keep `data-surface="dark"` on the hero panel root (line 164) — it's now harmless after the PASS 9 scope-down and still helps the existing contrast contract keep the headline/description white over the photo.

### 4. Sweep for similar regressions

After step 1, walk every page that uses `data-surface="dark"` over imagery or white inner content. Files to spot-check in the preview (no edits expected, just verify the emerald wall is gone):

- `src/components/home/ToolkitShowcaseCard.tsx`
- `src/components/home/FeaturedListings.tsx`
- `src/components/home/HeroPropertySearch.tsx`
- `src/components/home/OverseasInvestorsStrip.tsx`
- `src/components/area-detail/AreaHeroSection.tsx`
- `src/components/market-intelligence/MarketIntelligenceHero.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/PropertiesHeroVideo.tsx`
- `src/components/ModeSwitcher.tsx`
- `src/components/Footer.tsx`
- `src/pages/About.tsx`, `src/pages/Awards.tsx`

If any still need the emerald gradient as their actual background, tag them explicitly with `data-ink-emerald` (the opt-in path).

### 5. Memory

Update `mem://style/color-palette/ink-emerald-gradient-standard` to record the scope correction: **PASS 9 paints only `.jj-cta-dark`, `.jj-navy-cta`, `[data-cta="dark"]`, and explicit `[data-ink-emerald]` / `[data-hero-dark]` opt-ins. It must never auto-paint `data-surface="dark"` or raw `bg-[#0A0A0A]` utilities, because those are used as contrast hints and would bleed the gradient over photos, glass surfaces, and white inner segments.**

## Verification

After the edit, in the live preview:

1. `/` — Explore Our Services card: the full Buy Property / Sell / Rent photo is visible edge-to-edge, only a soft bottom gradient remains for text legibility.
2. `/` — Hero pill: placeholder "Search projects, developers, areas, tools…" is visible in mid-gray, "Search" button reads as black-on-white, "Free Consultation" reads as white-on-dark.
3. Spot-check 3–4 of the sweep files above; confirm no green wall appears over imagery or glass panels.
