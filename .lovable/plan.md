
Goal
- Fix the Dubai Properties logo in the homepage Developer Partners marquee so that:
  - “PROPERTIES” is fully readable (not cut off),
  - the logo looks visually centered inside its slot (equal left/right whitespace),
  - the perceived gap to Danube is reduced (push Dubai Properties left),
  - it’s lifted up and a bit bigger without looking cropped.

What I observed (proof)
- I opened the raw asset `/developers/logos/dubai-properties-logo.webp` and it contains a lot of empty padding around the actual logo inside a white box. This is why it still looks off-center and why spacing looks “wrong” even when the flex `gap-10` is constant.

Why the current fix isn’t enough
- Current config uses `fit:"cover"`, `scale: 1.12`, `offsetX: -6`, `offsetY: -3`, `objectPosition:"50% 40%"`.
- That can help, but it cannot reliably remove “internal padding” inside the image file. When the padding is large, we need an additional trimming mechanism (or replace the asset).

Implementation (single-file, config-driven)
File: `src/components/DeveloperPartnersMarquee.tsx`

1) Add a “trim” option to the per-logo config (to remove internal padding)
- Extend the `FEATURED_DEVELOPERS` type with an optional:
  - `clipInset?: string` (CSS inset syntax, e.g. `"10% 8% 18% 8%"`)
- Apply it to the `<img>` via `style.clipPath = developer.clipInset ? \`inset(${developer.clipInset})\` : undefined`
  - This lets us crop away the empty space inside the file while still keeping the same slot sizing rules.

2) Add a “slot spacing tweak” option for the real gap (not just visual centering)
- Extend the config with optional:
  - `slotMarginLeft?: number`
  - `slotMarginRight?: number`
- Apply these to the `<Link>` wrapper style:
  - `style={{ marginLeft: developer.slotMarginLeft, marginRight: developer.slotMarginRight }}`
- This is the cleanest way to reduce the Danube → Dubai Properties gap without touching the global `gap-10` or breaking other logos.

3) Re-tune Dubai Properties with stronger lift + size + left push (starting values)
- Update Dubai Properties entry from the current values to something that targets your exact complaints:
  - Keep `fit: "cover"`
  - Increase lift: `offsetY: -7` (from -3)
  - Slightly bigger: `scale: 1.18` (from 1.12)
  - Push left more: `offsetX: -12` (from -6)
  - Reduce actual gap to Danube: `slotMarginLeft: -12` (tighten only on the left side)
  - Keep width controlled to avoid “fake big gap”: `width: 155–160` (start at 158)
  - Add trimming to remove internal whitespace (key fix):
    - `clipInset: "10% 10% 22% 10%"` (starting point; we will visually tune)
  - Adjust cropping anchor if needed:
    - keep `objectPosition: "50% 45%"` (slightly lower than 40% to protect the “PROPERTIES” line if it’s still close to the bottom after scaling)

4) Verification (must show it, not claim it)
- Open homepage `/` and scroll to Developer Partners marquee.
- Confirm:
  - “PROPERTIES” is fully visible and readable (not cut off).
  - Left/right whitespace looks balanced in its slot.
  - Gap Danube → Dubai Properties looks consistent with the strap rhythm (no “big empty space”).
  - Check the loop seam Dubai Properties → DAMAC still feels natural.
- Check at 3 breakpoints:
  - mobile (36px height)
  - md (42px)
  - lg (48px)
- Capture a screenshot focused on the strap showing Dubai Properties beside Danube (and ideally the seam pass with DAMAC) as proof.

Fallback (if the asset is the real blocker)
- If the logo still can’t look perfect with `clipPath` tuning (because the real logo is too small inside the white box), the most robust fix is to replace `dubai-properties-logo.webp` with a trimmed version (same design, tighter bounding box). Then we can reduce CSS hacks (smaller offsets, potentially go back to `object-contain`).

Scope / impact
- Only affects the Dubai Properties rendering (via config), no global spacing changes, no layout redesign.
