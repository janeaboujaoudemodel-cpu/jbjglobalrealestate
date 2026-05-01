
## What is actually broken

I verified the database: it has **2,504 published projects**, including **908 published apartments**. Data is intact — nothing was deleted. The filter logic for `?type=apartment&transaction=buy` (the URL the sidebar opens) correctly maps to `propertyType='apartment'` and matches against `property_type_label`, so it should return ~908 results.

So "0 properties" is **not a data problem**. It is a combination of three real issues that make the page look broken:

1. **Slow load** — the Properties page fetches the entire 2,500+ project catalogue in one shot before anything renders, so during those seconds the listing area shows the empty state and the hero looks frozen.
2. **Faded hero (Properties + Homepage)** — the hero headlines use white text on a dim video background with a dark gradient overlay; on the homepage the headline is also rendered with a `linear-gradient(white→#E0E0E0)` clipped to text, which loses contrast against the brown-tinted video.
3. **Unreadable filter toggles** — the inactive toggle pills (`togglePillOff`) use `text-[#5A4A2E]` (faded brown) on a champagne pill background. The number/letter inside is barely visible at rest.

## Fix plan

### 1. Properties hero — make text actually readable

File: `src/components/PropertiesHeroVideo.tsx`
- Strengthen the gradient overlay to a more uniform dark layer (`from-black/85 via-black/65 to-black/95`) so any white text on top has guaranteed contrast on every frame of the video.
- Add a soft radial vignette behind the heading area so the headline never sits over a bright/sky frame.

File: `src/pages/Properties.tsx` (hero block, lines ~493–531)
- Add a stronger `textShadow` on the H1 (`0 2px 12px rgba(0,0,0,0.85)`) and bump subtitle from `text-white/95` to solid `text-white` with the same shadow, matching the institutional pattern already used elsewhere.
- Keep the section's `data-surface="dark"` so the contrast guard does not invert these whites.

### 2. Homepage hero — restore solid headline

File: `src/pages/Index.tsx` (hero block, lines ~163–250)
- Replace the gradient-clipped white→silver headline (`WebkitTextFillColor: transparent`) with **solid `#FFFFFF`** plus a strong dual drop-shadow. Gradient text on a dim brown video is what the user is reading as "faded".
- Strengthen the dark overlays: `from-black/70 via-black/55 to-black/90` (currently 60/45/85).
- Keep the video, the orbs, and the CTA pills exactly as they are.

### 3. Filter toggle pills — make inactive state ink, not faded brown

File: `src/components/filters/FilterShortcutBar.tsx` (line 352)
- Change `togglePillOff` from `text-[#5A4A2E]` to **`text-[#1A1A1A]`** (solid ink) and bump weight from `font-medium` to `font-semibold`. Border becomes `border-[#B89555]/50`. Hover stays champagne.
- This matches the Faded-Gold Prohibition and Universal Same-Tone Contrast standards already in `mem://`.
- Also fix the same pattern in `pillInactive` if it inherits any faded brown — it already uses `text-[#1A1A1A]`, so no change needed there.

### 4. Properties page perceived zero-results — fix the slow first paint

File: `src/hooks/useProjects.ts` — `useProjectsListing()`
- Today: counts rows, then issues `Math.ceil(2504/1000) = 3` parallel `range()` queries before *any* listing is shown. On a slow connection that's the entire wait the user complained about.
- Change to a **progressive two-stage fetch**:
  - **Stage 1**: fetch the first 200 published projects ordered by `created_at desc` and return them immediately (this is what fills the visible viewport).
  - **Stage 2**: in a `setTimeout(..., 0)` after Stage 1 resolves, fetch the rest in the background and append to the React Query cache via `queryClient.setQueryData`.
- Add a `placeholderData: keepPreviousData` so the list does not flash to "0" between stages.

File: `src/pages/Properties.tsx`
- While `isLoading` is true, render a skeleton grid instead of letting the empty-state ("No properties matched…") component show. Currently nothing gates the empty state on `isLoading`, so during the load the user sees the "no results" copy and concludes the database is gone.

### 5. Light cleanup (no behaviour change)

- Confirm the `data-no-contrast-guard` attribute stays on the red sidebar Contact/Support buttons (already in place from prior turn).
- Leave all CRM, mode-switching, and footer logic alone — strictly the four files listed above.

## Files touched

```
src/components/PropertiesHeroVideo.tsx        -- darker overlay + vignette
src/pages/Properties.tsx                      -- hero text shadow + skeleton while loading
src/pages/Index.tsx                           -- solid white headline + stronger overlay
src/components/filters/FilterShortcutBar.tsx  -- togglePillOff to ink
src/hooks/useProjects.ts                      -- progressive listing fetch
```

## Out of scope (explicitly NOT changed)

- No DB schema changes.
- No removal of any sections, filters, ads, marquees, or CTAs (No-Removal policy).
- Mode switcher, CRM auto-categorisation, footer, and login-first gating from previous turns are untouched.
- No new packages, no design-system token changes.

## Why this addresses what the user said

- "Hero is very faded, content not readable" → solid white headlines + stronger overlays on both heroes.
- "Toggles in the filter are completely horrible and not readable" → inactive toggle pills go from faded brown to solid ink.
- "Showing 0 properties for sale, where is all the database" → DB is fine (verified 908 apartments). The skeleton + progressive fetch fixes the misleading empty state during load.
- "It took too much time to open the page" → first paint shrinks from "fetch all 2,504 then render" to "fetch first 200, render, then backfill".
