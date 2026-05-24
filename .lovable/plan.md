## Goal
Make every developer badge on `ProjectCard` look like one premium, unified plate — Reelly-style — sitting half on the photo, half on the content card, with no cropped names, no foreign backgrounds, no size variation.

## What's wrong today (`src/components/ui/DeveloperLogo.tsx` + `src/components/ProjectCard.tsx`)
1. `bare` plate = `h-12 w-20`, `nameplate` plate = `h-12 w-16` → two different widths on the same grid.
2. Logo images render as-is, so brands with built-in backgrounds (Ritz-Carlton black, others white) clash with our champagne plate.
3. `nameplate` uses `line-clamp-2` → long names like "Expo City Development" get truncated to "Expo City Develop…" (the three-dot crime).
4. The plate is anchored at `top-3 left-3` of the card → it sits inside the photo instead of straddling the photo/card seam like Reelly.

## Plan

### 1. One unified plate (size + skin)
In `DeveloperLogo.tsx`, both `bare` and `nameplate` variants get the exact same outer container:
- Fixed size: `h-14 w-24` (wider than today so wordmarks fit without cropping, taller so it overlaps cleanly).
- Skin: `rounded-xl bg-[#FDFBF7] border border-[#B89555]/45 shadow-[0_4px_14px_rgba(0,0,0,0.18)]`.
- Inner padding: `px-2 py-1.5`.

### 2. "Our own render" — strip foreign backgrounds from logo images
Inside the `bare` variant `<img>`:
- Apply `mix-blend-mode: multiply` so white logo backgrounds disappear into the champagne plate.
- Add a small per-developer overrides map (`src/utils/developerLogoOverrides.ts`) keyed by slug/name with two flags:
  - `invert: true` → for white-on-dark marks like Ritz-Carlton; applies `filter: invert(1) brightness(0)` so the wordmark becomes solid ink on champagne. Seed it with `ritz-carlton` (and we'll add others as we spot them).
  - `forceNameplate: true` → opt-out of the image entirely and render the nameplate wordmark instead (escape hatch for any logo we can't clean).
- Keep `object-contain` so nothing gets cropped.

### 3. Kill the "…" forever on the nameplate
Replace `line-clamp-2` + fixed text-size buckets with:
- `whitespace-normal break-words leading-[1.05] text-center`.
- A small auto-shrink: start at `text-[11px]`, drop one step per length bucket down to `text-[8px]` so names up to ~22 chars ("Expo City Development") render fully on two lines without ellipsis.
- No `overflow: hidden`-driven truncation; the plate is tall enough (h-14) to hold two lines.

### 4. Reelly-style position — straddle photo & card
In `ProjectCard.tsx` (lines ~210–226), move the `<Link><DeveloperLogo /></Link>` wrapper out of the absolute-positioned top-left slot and re-anchor it to the bottom of the image area:
- New classes: `absolute left-4 z-30` + `bottom-0 translate-y-1/2` measured against the `<div className="aspect-[16/10] ...">` image wrapper (lines 230–258). So the plate sits exactly on the seam — top half over the photo, bottom half over the body card — and floats just above the title.
- Add a touch of bottom margin on the title row so text never collides with the floating plate.
- Adjust the favorite/shortlist stack only if needed (they live top-right, no conflict).

### 5. Missing logos
Out-of-scope for this edit: no scraping in this turn. Any developer with no `logo_url` automatically renders the unified `nameplate` (ink wordmark in our box) — same size, same skin, no "…". You'll see the developer name immediately and we can backfill real logos later via the existing logo-ingestion flow.

## Files to touch
- `src/components/ui/DeveloperLogo.tsx` — unify sizes, multiply-blend + invert support, kill line-clamp.
- `src/utils/developerLogoOverrides.ts` — new tiny lookup (seed Ritz-Carlton invert).
- `src/components/ProjectCard.tsx` — reposition the developer plate to straddle image/content seam.

## Out of scope
- Auto-scraping new logos from Google.
- Touching developer cards on the directory page (`card` variant) — those already use the Reelly hero plate.
- The "majority looks good" cards keep their existing real logos; we just normalize the plate around them.
