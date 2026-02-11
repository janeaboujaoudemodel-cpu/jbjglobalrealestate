
Goal (what “fixed” means)
- On the homepage Developer Partners strap, the “DUBAI PROPERTIES” logo must be:
  1) fully readable (the word “PROPERTIES” must be 100% visible),
  2) not cropped at all (no cutting any part of the logo),
  3) visually centered (balanced left/right whitespace in the slot),
  4) with a smaller perceived gap to Danube (Dubai Properties shifted slightly left),
  5) lifted up so “PROPERTIES” sits visually aligned (not sitting too low).

What I found (root cause)
- The raw asset `/developers/logos/dubai-properties-logo.webp` itself contains a small “DUBAI PROPERTIES” logo inside a larger white box (extra internal padding).
- In the marquee we currently use:
  - `fit: "cover"` plus `clipPath inset(...)` plus `scale: 1.18`
  - These are all “cropping tools” (cover + clipPath + big scale inside an overflow-hidden container).
- This is why “PROPERTIES” can become partially hidden in the strap: we are literally trimming parts of the image to fight the internal padding. That conflicts with your requirement: “Don’t crop the logo at all”.

Why the previous approach can’t satisfy your requirement
- If we keep `object-cover` and/or `clipPath`, we will always risk cutting off the bottom word (“PROPERTIES”) depending on scale/position and breakpoint.
- To guarantee “no crop”, we must render Dubai Properties with `object-contain` and remove any clip/cover trimming for that logo.

Implementation (single file)
File: `src/components/DeveloperPartnersMarquee.tsx`

A) Make Dubai Properties strictly “no-crop”
- Update the Dubai Properties entry to:
  - Remove `clipInset` entirely (delete it from the Dubai Properties config entry)
  - Change `fit` from `"cover"` to `"contain"`
  - Reduce `scale` back to `1` (or very close to 1) to avoid overflow-hidden cropping
  - Keep `objectPosition` neutral (usually `"50% 50%"`)

Rationale:
- `object-contain` guarantees the entire logo stays visible.
- Removing clipPath eliminates the “hidden PROPERTIES” risk completely.

B) Lift the logo without cropping
- Increase the upward translation using the existing `offsetY` (more negative), but keep scale at 1.
- Because the asset has lots of internal padding, we can “move the content up” within that padding without cutting off the logo.

Starting values (to be tuned visually after implementation):
- `offsetY: -10` (lift more than current -7)
- Keep `scale: 1` so we’re not enlarging into the overflow-hidden bounds.

C) Reduce the perceived gap to Danube (push Dubai Properties left)
- Keep and slightly strengthen the existing left tightening using `slotMarginLeft`:
  - e.g. change from `-12` to `-16` (small controlled improvement)
- Keep `offsetX` modest (e.g. `-10` to `-12`) to compensate for uneven internal padding and make it look centered.

D) Make it “bigger” while still guaranteeing no crop
- Since we cannot scale up much (overflow-hidden would crop), we increase the slot width slightly instead:
  - Increase Dubai Properties `width` from `158` to something like `170–180`.
- This makes the logo appear larger while still fully visible via `object-contain`.

Proposed Dubai Properties config (first-pass values to implement, then verify in Preview)
- `scale: 1`
- `width: 175` (tune 170–180)
- `fit: "contain"`
- `offsetX: -10` (tune -8 to -14)
- `offsetY: -10` (tune -8 to -14)
- `objectPosition: "50% 50%"`
- remove `clipInset` completely
- `slotMarginLeft: -16` (tune -12 to -20)

Verification (proof, not claims)
1) Open homepage `/` and scroll to the developer marquee.
2) Confirm on-screen that:
   - “PROPERTIES” is fully visible (no clipping/cropping).
   - The logo looks centered inside its own slot (left/right whitespace looks balanced).
   - The gap Danube → Dubai Properties is reduced versus before (Dubai Properties appears closer to Danube).
   - The logo is lifted (baseline looks aligned; “PROPERTIES” not sitting too low).
3) Check all three breakpoints:
   - mobile (36px)
   - md (42px)
   - lg (48px)
4) Take a screenshot of the strap with Danube + Dubai Properties visible.
5) Only after the screenshot shows full readability will we consider it “done”.

Fallback (if it’s still too small even with wider slot)
- Replace the logo file with a trimmed version that removes only the empty padding/white border area, without removing any part of the actual logo.
- This is the only way to make it significantly larger and perfectly centered while still honoring “no crop” in CSS.

Scope
- Only changes the Dubai Properties rendering rules in the homepage marquee.
- No global strap redesign and no change to other logos unless needed.

Deliverable
- One code edit in `src/components/DeveloperPartnersMarquee.tsx`, then a verified screenshot of the strap showing “DUBAI PROPERTIES” fully readable, aligned, and with improved spacing vs Danube.
