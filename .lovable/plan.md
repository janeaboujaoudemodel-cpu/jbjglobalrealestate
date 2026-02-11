
## Goal
Make the brochure “logo inside the round frame” render as a true full-fit mark: larger, centered, and without visible edges/padding that make it look like a photo sitting inside a circle.

## What’s happening now (root cause)
In `src/components/project-detail/PremiumBrochureCard.tsx`, the brand mark is rendered like this:
- Container: `w-14 h-14 ... overflow-hidden p-1.5`
- Image: `className="w-full h-full object-contain"`

`object-contain` + the extra `p-1.5` guarantees “empty edges” because the image is forced to fit entirely inside the frame, leaving padding (and if the asset itself has internal padding, it becomes even worse). Visually, this reads like a static square image sitting inside a circle rather than a full-fit logo.

## Implementation approach
### A) Make the logo full-fit purely via rendering (fast, guaranteed)
**File:** `src/components/project-detail/PremiumBrochureCard.tsx`

1) **Remove inner padding from the frame**
- Change the logo frame wrapper from `p-1.5` to `p-0`
- Keep `overflow-hidden` so the circle clips cleanly

2) **Switch the logo to “fill” mode**
- Change the logo `<img>` from `object-contain` to `object-cover`
- This fills the circle edge-to-edge and removes the “photo edges” look.

3) **Slight scale-up to counter any remaining internal buffer**
- Add a fixed transform scale (starting point: `scale(1.15)` to `scale(1.25)`)
- Example behavior: even if the asset has a little empty border, the mark still appears bold and full in the circle.

4) **Ensure the frame background matches the logo background**
- The current wrapper uses `bg-black/50`. If the logo asset has a solid black background, the semi-transparent background can create a visible “ring/edge” mismatch.
- Update to a more solid background like `bg-black/80` or `bg-black` so the edge visually disappears.

5) **Optional: keep it perfectly centered**
- If we see any optical offset (some logos are not perfectly centered), add tiny translate values:
  - `transform: translateX(px) translateY(px) scale(...)`
- Only if needed after visual check.

### B) (Optional, best long-term) Use a “no-buffer” logo asset
If the current asset `jbj-fulllogo-dark-bg.jpg` includes extra empty pixels, we can swap it to a cleaner variant already in the repo (example: `jbj-monogram-nobuffer.png`) for a perfect fit with less scaling.
- This is optional; the rendering fix above should already remove the visible edges.

## Exact area to change
In `PremiumBrochureCard.tsx` around the “Top: Brand mark with real monogram” block (the `w-14 h-14` circle + the `<img>` inside it):
- Wrapper: remove padding and make background more solid
- Image: use `object-cover` and add transform scale

## Verification checklist (what we’ll test after implementing)
1) Open any project detail page and scroll to the **Brochure** section.
2) Confirm the round logo frame:
   - has no visible “photo edges”
   - logo is larger and centered
   - looks like a proper full-fit brand mark (not a pasted square image)
3) Check on mobile + desktop (the circle should still look crisp and not clipped in a bad way).
4) Hover/tap effects still look premium (no layout shift).

## Files involved
- `src/components/project-detail/PremiumBrochureCard.tsx` (required)
- (Optional) swap asset import to a “no-buffer” logo file in `src/assets/` if needed
