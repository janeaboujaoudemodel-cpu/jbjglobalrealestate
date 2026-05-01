## Goal

Make the "Trending Projects in Dubai" / "Continue Searching" section on the homepage fully readable, premium, and on-brand. Fix the title contrast, restore project photos, fix the Clear button, and ensure every label/CTA in the section is legible.

## Root causes found in `src/components/ContinueSearching.tsx`

1. **Title invisible** — section uses a black backdrop (lines 183–184: `from-black via-[#0a0a0a] to-black`) while the rest of the homepage is champagne, so the white `h2` clashes with the surrounding page and feels broken/unreadable in context.
2. **Card subtitle invisible** — line 472 sets the location/subtitle text to `text-[#1A1A1A]` (ink) on a dark image gradient, so locations like "Dubai Marina" disappear.
3. **"Clear" button unreadable** — line 208 uses `text-muted-foreground hover:text-foreground`, which on the black backdrop renders as faded gray on black.
4. **Empty/fallback copy low contrast** — lines 222–223 use `text-white/70` and `text-white/85`, dim and inconsistent once the surface flips to champagne.
5. **No photos showing for trending** — the trending query (lines 133–141) selects `cover_image_url` but the card only renders the image when `isUrlValid` passes (must start with `http(s)://`). Many DB rows store storage paths or relative URLs, so `imgBroken` flips immediately and the dark fallback gradient is shown. The self-heal path also re-fetches the same broken URL.
6. **Type badge low contrast** — line 455 "PROPERTY/AREA/DEVELOPER" pill uses gold-on-translucent-ink, fine on dark images but illegible over light photos.

## Plan

### 1. Re-skin the section to premium champagne (matches site standard)

- Replace the black radial backdrop (lines 182–185) with a subtle champagne surface: page `#FDFBF7` base, soft `#F7F2EA` raised band, hairline gold top/bottom dividers using `<AdaptiveHairline />`.
- Title `h2` becomes solid ink `text-[#1A1A1A]` with Inter semibold, sized `text-xl md:text-2xl`. Keep the gold history disc icon to its left.
- Add a small ink/gold eyebrow above the title ("Recently viewed" / "Editor's picks") for institutional polish.

### 2. Header controls (Register Interest + Clear)

- "Register Your Interest" stays as a gold-bordered champagne pill but force solid ink text (`text-[#1A1A1A]`) and a stronger hover (`hover:bg-[#EFE6D6]`).
- Replace the faded "Clear" button with a solid, readable control: ink text on a thin gold-bordered chip (`border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]`), red `X` icon for clarity. Min tap area 32px.

### 3. Cards — fix images and contrast

- **Image resolution fix**: in `RecentCard3D`, when `isUrlValid` returns false but a non-empty `imageUrl` exists, treat it as a Supabase storage path and resolve via `supabase.storage.from(...).getPublicUrl(...)` OR upgrade the validator to accept `/`-prefixed and storage URLs. Combined with the existing `fetchCoverImage` self-heal, this restores cover photos for trending projects.
- **Subtitle visible**: change line 472 from `text-[#1A1A1A]` to `text-white/95` with a soft text-shadow (already sitting over the dark bottom-gradient overlay at line 427), or move it onto a small frosted ink chip. Pick the chip approach for premium feel: `bg-[#1A1A1A]/55 backdrop-blur px-2 py-0.5 rounded-md text-white text-[10px]`.
- **Title on card**: keep white but bump weight to `font-semibold` and add `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` so it stays readable on bright photos.
- **Type badge**: switch to solid `bg-[#1A1A1A]/80` with `text-[#F7F2EA]` and gold-tinted icon for guaranteed contrast on any photo.
- **Image fallback** (no photo): replace the navy gradient (line 421) with a champagne-to-gold gradient and a gold icon, so cards never look "broken/empty" while resolving.

### 4. Empty state

- Re-skin to champagne: gold disc icon, ink primary copy (`text-[#1A1A1A]`), muted ink secondary (`text-[#1A1A1A]/70`), and gold CTA button "Explore Now" with ink text.

### 5. Marquee polish

- Add fade masks on the left/right edges of the WalkingStrip viewport (linear-gradient mask-image from `#F7F2EA`) so cards drift in/out elegantly instead of clipping.
- Keep the existing pause-on-hover behavior.

## Files to edit

- `src/components/ContinueSearching.tsx` — backdrop, header, Clear button, empty state, RecentCard3D image validator/fallback, subtitle chip, type badge, fade masks.

## Out of scope

- No changes to `useRecentSearches`, `LeadCaptureModal`, `DeveloperLogo`, or routing.
- No DB migrations; image fix is purely client-side URL resolution + self-heal already in place.

## Acceptance checklist

- Title "Trending Projects in Dubai" / "Continue Searching…" is fully readable on the champagne homepage.
- Every trending card shows a real photo (or a branded champagne fallback while loading).
- Subtitle (location), title, and type badge on each card are legible over any photo.
- "Register Your Interest" and "Clear" are both clearly readable, with proper hover states.
- Empty state copy and CTA are high-contrast ink/gold on champagne.
- No white-on-light or ink-on-dark regressions; respects the champagne-gold and white-on-light contrast guards.
