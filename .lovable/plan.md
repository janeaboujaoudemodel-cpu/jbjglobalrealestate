## What's wrong

1. **Header & sidebar look white** — they should be champagne. Code already uses `#F7F2EA` champagne in `GlobalHeader`, `HorizontalUtilityBar`, and `GlobalVerticalNav`, but recent global contrast rules (`src/index.css` 2459–2502) force any `.text-white` *and* white surfaces toward ink whenever an ancestor matches a light-surface selector. The header gradient is fine, but the visual "white" feel comes from the gradient stops being too pale and a missing warm tint at top. Restore the previous warmer champagne stops (`#F7F1E6 → ECE2D2 → D8C7A6`) used in `JBJSidebar` for consistency.

2. **Homepage hero is unreadable** — `src/pages/Index.tsx` line 163 wraps the hero in `<div className="jj-hero-fullscreen relative ... bg-gradient-to-br from-[hsl(32,28%,13%)] ...">` but does **not** set `data-surface="dark"`. The global contrast guard's "dark surface" detector (index.css 2571) recognizes `[class*="from-[hsl(32,28%,13%)]"]`, but the white-text rescue at 2520 requires the ancestor to match `[class*="bg-black"]` etc. — which the hero does not. The result: `.text-white` is preserved by Tailwind specificity, but every child `text-white/85`, `text-white/90` on the three pillar cards (`bg-[#1A1A1A]/50` → not matched by `[class*="bg-black"]`) gets visually washed because no `text-shadow`/scrim is applied and the video is bright. Fix by tagging the hero with `data-surface="dark"` and strengthening the scrim.

3. **Six quick-action cards are unreadable + misaligned** — Index.tsx 252-260 uses `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2` with `text-[10.5px] sm:text-xs`, `whitespace-normal break-words`. The labels wrap to 2-3 lines causing height mismatch across cards, and `bg-[#1A1A1A]/60 backdrop-blur-md` with `text-white` becomes muddy over the bright video. Fix by: locking each card to a fixed grid row, equalizing padding, raising background opacity, adding a uniform `text-shadow`, and removing the `flex-col → flex-row` switch (use a single layout).

4. **"Dubia's Trusted Real Estate Technology Platform" tagline + 3 pillar cards** — same root cause; the tagline relies on a single inline `text-shadow` that's too subtle, and the pillar cards use `text-white/85` and `text-white/85` paragraph that is dimmed by the video.

## Plan

### A. Restore champagne to chrome
- `src/components/GlobalHeader.tsx` (lines 635-639): change the solid background gradient from `#F7F2EA → #F3ECDB → #EFE6D6` to the warmer `#F7F1E6 → #ECE2D2 → #D8C7A6` so it visibly reads as creamy champagne, not near-white.
- `src/components/navigation/HorizontalUtilityBar.tsx` (line 192): change `bg-[#F7F2EA]` to `bg-gradient-to-b from-[#F7F1E6] to-[#ECE2D2]`.
- `src/components/navigation/GlobalVerticalNav.tsx`:
  - Line 1081 (logo header): change `bg-[#F7F2EA]` to `bg-gradient-to-b from-[#F7F1E6] to-[#ECE2D2]`.
  - Line 1302, 1308 (collapsed sidebar bg): same change.
  - Line 1397 (expanded 200px sidebar): change `bg-[#F7F2EA]` to `bg-gradient-to-b from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]`.

### B. Make the hero readable (Index.tsx)
- Line 163: add `data-surface="dark"` to the `<div className="jj-hero-fullscreen ...">`. This lets the global guard treat it as a true dark surface and stops any future ink-overrides.
- Line 194: strengthen the bottom-third scrim from `from-black/50 via-black/30 to-black/70` to `from-black/60 via-black/45 to-black/85` so headlines remain crisp.
- Line 221-226 (tagline `<motion.p>`): keep `text-white` but bump font-weight, add a stronger `text-shadow: 0 2px 12px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.6)`, and increase tracking. Add a subtle pill background `bg-black/35 backdrop-blur-sm rounded-full px-4 py-1.5 inline-block` so it stands off the video.
- Line 230-245 (h1): the gradient `WebkitTextFillColor: transparent` can fail over bright frames. Add a `filter: drop-shadow(0 4px 24px rgba(0,0,0,0.7)) drop-shadow(0 2px 6px rgba(0,0,0,0.6))` so the gradient text stays legible.

### C. Fix the six quick-action CTA cards (Index.tsx 247-262)
Replace the flex layout with a uniform grid cell:
- Container: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 max-w-md sm:max-w-3xl lg:max-w-5xl mx-auto`.
- Each `<Link>`:
  - Layout: `flex flex-col items-center justify-center gap-1.5 px-3 py-3 min-h-[76px]` (single layout — no row/col switch).
  - Background: `bg-[#1A1A1A]/75 hover:bg-[#1A1A1A]/90 backdrop-blur-md` (raise from /60 to /75 for legibility).
  - Border: `border border-white/40 hover:border-gold/70`.
  - Text: `text-white text-[11px] sm:text-xs font-semibold tracking-tight` with `style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}`.
  - Icon: `w-4 h-4 text-gold` (gold accent for visual hierarchy, keeps brand consistency).
  - Label span: `whitespace-normal text-center leading-[1.15] line-clamp-2`.

This guarantees all six cards are exactly the same height, label text is centered + readable, and icons use gold for premium feel.

### D. Fix the three pillar badges (Index.tsx 264-279)
- Container: keep grid but raise `border-white/20` to `border-white/40` and use `bg-[#1A1A1A]/70` instead of `/50`.
- Card:
  - `bg-[#1A1A1A]/70 backdrop-blur-md p-4 sm:p-5 text-center`.
  - Icon: `w-5 h-5 sm:w-6 sm:h-6 text-gold` (was `text-white`).
  - Title: `text-sm font-bold text-white` with `textShadow: '0 1px 3px rgba(0,0,0,0.8)'`.
  - Desc: `text-xs text-white` (drop the `/85`) — solid white reads cleanly over the darker card.

### E. QA
- After edits, navigate to `/` in the preview, take a screenshot of:
  1. Top of homepage — verify hero tagline, h1, six CTA cards, and three pillar cards are all readable.
  2. Header — verify champagne (not white) tone.
  3. Sidebar — verify champagne gradient (not flat white).
- If any element still washes out, raise the scrim and card opacities one more step and re-screenshot. Do not declare done without actually inspecting the screenshots.

## Files to edit
- `src/index.css` — no changes needed (the existing rules are correct once `data-surface="dark"` is added to hero).
- `src/pages/Index.tsx` — hero `data-surface`, scrim strength, tagline pill, h1 drop-shadow, six CTA grid + styling, three pillar cards.
- `src/components/GlobalHeader.tsx` — warmer champagne gradient.
- `src/components/navigation/HorizontalUtilityBar.tsx` — warmer champagne gradient.
- `src/components/navigation/GlobalVerticalNav.tsx` — warmer champagne on logo header (1081), collapsed sidebar (1302, 1308), expanded sidebar (1397).

No features removed. All copy preserved. Only color tones, opacities, layout alignment, and one `data-surface` attribute change.
