
Goal
- Fix the Dubai Properties logo in the homepage developer marquee so it:
  1) looks visually centered inside its own “frame” (equal left/right padding),
  2) has the correct perceived spacing vs Danube (and also the loop boundary vs DAMAC),
  3) is lifted up slightly so “Properties” is fully readable,
  4) is a bit bigger without getting cropped.

Why it’s still wrong
- The marquee uses a fixed flex “slot” per logo (width = developer.width, height = 36/42/48px) with the image set to `w-full h-full object-contain`.
- If the Dubai Properties image file itself has uneven transparent/white padding (common in logos), `object-contain` will faithfully keep that padding, making the logo look off-center and creating a “fake” big gap with the neighboring logo even though the actual flex gap is constant.
- Simply increasing width (to 180) makes that perceived gap worse.

Implementation approach (minimal change, config-driven like the rest of this marquee)
File to change
- src/components/DeveloperPartnersMarquee.tsx

1) Add per-logo “image tuning” options in the FEATURED_DEVELOPERS config
- Add optional properties (used only when needed):
  - fit?: "contain" | "cover"        (default: "contain")
  - offsetX?: number                 (px; default 0)
  - offsetY?: number                 (px; default 0)
  - objectPosition?: string          (default "50% 50%")

2) Update renderPartner() to apply these overrides safely
- Keep container width logic as-is.
- Change the <img> class so object-fit can switch per logo:
  - If fit === "cover" => use `object-cover`
  - Else => `object-contain`
  (Both class names will be present as string literals so Tailwind includes them.)
- Replace the current scale-only transform with a combined transform that can lift/shift:
  - transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
  - Apply even when scale is 1 if offsets are non-zero.
- Apply `style.objectPosition` when provided.

3) Re-tune Dubai Properties entry (to fix centering + spacing + lift + size)
- Change Dubai Properties from the current “wider but small” approach to a “slightly narrower but bigger, centered” approach:
  - Reduce width from 180 down to ~160–170 to reduce perceived gap vs Danube.
  - Increase scale slightly (example starting point: 1.10–1.15).
  - Lift it up with offsetY (example starting point: -2 to -4).
  - Recenter it with offsetX (example starting point: -4 to -8) if the logo padding is heavier on one side.
  - If padding inside the image is the main issue, set fit:"cover" so the internal whitespace gets trimmed and the logo appears truly centered and “full”.

  Proposed starting values (to be visually tested/tuned quickly in Preview):
  - DUBAI PROPERTIES:
    - width: 165
    - scale: 1.12
    - fit: "cover"
    - offsetX: -6
    - offsetY: -3
    - objectPosition: "50% 40%"   (slightly higher anchor)

4) Verify end-to-end (homepage marquee)
- On / (homepage), confirm:
  - Dubai Properties text “Properties” is readable and not clipped.
  - The logo looks visually centered (balanced left/right whitespace).
  - The perceived gap between Danube and Dubai Properties matches the rhythm of other logos.
  - At the loop seam (Dubai Properties → DAMAC), spacing still feels consistent and there is no awkward “blank” interval.
- Check at common breakpoints:
  - Mobile (36px height), md (42px), lg (48px).

Notes / fallback if the asset itself is the blocker
- If the Dubai Properties logo file has extreme padding or an uneven bounding box, CSS tuning can only go so far.
- If after these adjustments it’s still not perfect, the most robust fix is to replace the logo asset with a properly trimmed version (same design, just cleaned bounding box), then we can revert fit to "contain" and reduce offsets.

Acceptance criteria
- Dubai Properties logo appears centered inside its slot, with even left/right space.
- “Properties” is clearly visible and aligned (logo lifted slightly).
- The spacing between Danube ↔ Dubai Properties and Dubai Properties ↔ DAMAC matches the rest of the marquee’s visual rhythm.
