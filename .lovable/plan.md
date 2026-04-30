## Goal

Make the Market Intelligence hero text (badge, title, description) fully legible against any background image/video — including bright or busy frames — without darkening the scene so much that the imagery disappears.

## Current state

`src/components/market-intelligence/MarketIntelligenceHero.tsx` uses a single linear overlay:

- `bg-gradient-to-b from-black/70 via-black/70 to-black`

Plus decorative gold radial/blur layers that can actually *reduce* contrast where text sits, and a description at `text-white/85` which on bright backgrounds can dip below AA.

## Changes (single file: `MarketIntelligenceHero.tsx`)

1. Replace the flat dark overlay with a **two-layer composite** behind content:
   - Base vertical gradient: `from-black/85 via-black/70 to-black/95` (stronger top + bottom anchoring, slight midtone breathability so the image still reads).
   - Centered radial "spotlight" darkener focused on the text column: `bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(0,0,0,0.55)_0%,transparent_75%)]` — boosts contrast exactly where copy sits without globally crushing the image.

2. Move the decorative gold radial + blur orbs **behind** the darkening overlay (lower z-index than overlays) so they no longer lighten the area under the headline. They remain visible at the edges as ambience.

3. Tighten text tokens for AA safety:
   - Title: keep `text-white`, add `drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]`.
   - Description: bump `text-white/85` → `text-white/95` and add a soft `drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]`.
   - Badge label keeps gold; add the same subtle text shadow for legibility on light frames.

4. Add a thin **bottom fade-to-page** layer (`from-transparent to-background`) on the last ~25% so the hero blends into the next section and the description never sits over a bright horizon line.

## Layer order (back → front)

```text
[image/video]
[gold decorative orbs + radial]   ← z-[1], lowered behind overlays
[base vertical black gradient]    ← z-[2]
[centered radial spotlight]       ← z-[2]
[bottom fade-to-background]       ← z-[2]
[content: badge / title / desc]   ← z-10
```

## Validation

- Run `npm run check:contrast` to confirm no regressions in the static + runtime contrast gates.
- Spot-check the hero at 1920, 1366, 768, 390 widths against the configured `backgroundImage` / `videoSrc` to verify title and description remain solid white with visible separation from the image.

## Out of scope

- No changes to subpage hero variants outside `MarketIntelligenceHero.tsx`.
- No change to brand gold accents or badge styling beyond the small text-shadow.
- No new assets or image swaps.
