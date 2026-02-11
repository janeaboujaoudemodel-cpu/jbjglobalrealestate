
## Goal
Make the developer logo strap (homepage marquee under the hero) have truly consistent visual spacing and logo size—so you don’t see “big gap after Dubai Properties” and “too close after that”. Every logo should *look* equally sized with equal perceived spacing.

## What’s actually causing the uneven spacing (root cause)
In `src/components/DeveloperPartnersMarquee.tsx`, every logo item already has:
- a fixed container width (`w-[140px]`)
- a fixed gap between items (`gap-10`)

So the *layout spacing is already uniform*.

The reason it still looks uneven is that some logo image files contain large internal transparent/white padding (extra empty pixels around the logo). Example: **Dubai Properties** (and often Majid Al Futtaim) appears visually smaller inside its 140px slot, so the “visible logo edge” is far from the next logo even though the containers are evenly spaced.

To fix perceived spacing, we must normalize how each image is rendered (and optionally replace/crop the problematic image assets).

## Implementation approach (safe + reliable)
We’ll do two things:
1) **Rendering normalization in code (guaranteed fix in UI)**  
2) **Optional asset cleanup (best long-term, but not required to get consistent spacing)**

---

## Changes to implement

### 1) Add per-logo “visual normalization” settings (scale + nudge)
**File:** `src/components/DeveloperPartnersMarquee.tsx`

**Step A — Extend the featured developers config**
Add optional fields to each entry, for example:
- `scale?: number` (default 1)
- `nudgeX?: number` (default 0)
- `nudgeY?: number` (default 0)

Then apply them to the `<img>` style so logos with internal padding are visually enlarged slightly to match others.

**Step B — Make the image fill the container box consistently**
Change the logo `<img>` from:
- `max-h-full max-w-full object-contain`
to:
- `w-full h-full object-contain`

This ensures the image always uses the full 140×(36/42/48) box, and then we apply the per-logo scale on top.

**Step C — Prevent scaled logos from spilling outside**
Add `overflow-hidden` to the logo container so scaling doesn’t break the strap.

**Step D — Set scale overrides for the known offenders**
Start with targeted overrides (we will tune visually in preview):
- `dubai-properties`: scale ~ `1.25–1.45` (most likely needs the biggest correction)
- `majid-al-futtaim`: scale ~ `1.10–1.25`
If any other logo still looks off (e.g., Select Group, Danube), we add small corrections too.

This method keeps:
- the exact same `gap-10`
- the exact same `w-[140px]` container
- the same marquee animation approach (locked spec)

Result: equal perceived spacing and equal perceived logo size.

---

### 2) Optional but recommended: replace/crop the worst logo files (asset cleanup)
**Files (public assets):**
- `public/developers/logos/dubai-properties-logo.webp`
- `public/developers/logos/majid-al-futtaim-logo.webp`
(plus any other logo that has large internal padding)

If we replace these images with versions that are tightly cropped and ideally transparent (no white box), the strap will look perfect even with less scaling.

If you have official cropped/transparent brand assets, you can send them and I’ll drop them in with the same filenames so no code references change.

---

## Verification checklist (what I’ll validate after implementing)
1) Homepage strap: all logos appear the same “visual size”.
2) Gaps look consistent between every pair of logos (especially around Dubai Properties).
3) No logo is clipped/cut off after scaling (desktop + mobile).
4) Animation remains smooth and continuous (no jump at loop seam).

---

## Files involved
- `src/components/DeveloperPartnersMarquee.tsx` (required)
- `public/developers/logos/*.webp` (optional but recommended for best final quality)

