
## Honest verification — and the real fixes still needed

I took live mobile screenshots (390×844). Here is the truthful state — **partial success**, not "all fixed":

### What the previous fix DID solve
- Header logo is now small (~32px) and the "JBJ GLOBAL REAL ESTATE" wordmark is readable on mobile
- Hamburger menu has the white pill background and is clearly visible
- Project page hero (Tilal Al Furjan) — title, developer, location, brochure CTA all render crisply

### What is STILL broken (visible in screenshots)
1. **Homepage hero loading state** — the placeholder still shows only a gold "LOADING..." label on a brown gradient. The brighter tagline and "Loading experience…" line that the plan promised are **not actually rendering** on the loading state — they only appear after the video loads.
2. **Hero content overlap when video loads** — the JBJ monogram, the "DUBAI'S TRUSTED REAL ESTATE TECHNOLOGY PLATFORM" eyebrow, the "Your Gateway to Dubai's Finest Real Estate" headline, and the 5 CTA buttons (Sell Your Property, AI Home Finder, Explore AI Tools, Create Your CV, Update Profile) are all stacked on top of each other in the same vertical band — text is unreadable through the buttons.
3. **Faded eyebrow line** — "DUBAI'S TRUSTED REAL ESTATE TECHNOLOGY PLATFORM" is barely legible because the CSS opacity floor doesn't catch its specific class.
4. **Pillar card descriptions** ("Premium Marketplace", "AI-Powered Tools", "Brokerage Services") render correctly in size but the supporting text under each is still very faint.

## Real fixes to apply

### 1. Fix homepage hero loading-state placeholder (`src/pages/Index.tsx`)
The previous edit put the "Loading experience…" label inside a branch that only renders when the video is ready. Move the bright tagline + "Loading experience…" microcopy into the actual fallback `<div>` shown before video load, so users see real copy instead of just "LOADING…".

### 2. Fix hero stacking on mobile (`src/pages/Index.tsx`)
On `<sm` breakpoints:
- Hide the giant centered JBJ monogram (it's redundant — the header already shows it)
- Add proper vertical spacing (`space-y-4`) between eyebrow → headline → CTA grid → pillar cards so nothing overlaps
- Reduce CTA grid from 5 buttons to a 2×2 grid + "More" expansion, OR convert to a vertical stack at full width

### 3. Force-readable eyebrow + faint copy on hero
Add `.jj-hero-fullscreen .text-white\/50, .jj-hero-fullscreen .text-white\/60 { opacity: 1 !important; color: #fff !important; }` and a stronger text-shadow so the eyebrow line and pillar descriptions are crisp regardless of video frame.

### 4. Pillar card description contrast (`src/pages/Index.tsx`)
Bump pillar description text from current opacity to solid `text-white` with `text-shadow` so "2,400+ Off-Plan & Resale Properties" / "Smart Search & Investment Intelligence" / "Licensed Brokers & Expert Services" are fully legible.

### 5. Re-verify with live screenshots (mandatory)
After the fix I will take fresh 390×844 screenshots of:
- Homepage during loading (network throttle simulated by reload)
- Homepage hero loaded
- Confirm no overlap, all text readable

## Files to edit
- `src/pages/Index.tsx` — loading state copy, hero stacking, monogram hide on mobile, CTA grid layout, pillar text
- `src/index.css` — hero-scoped opacity overrides for `.text-white/50` and `/60`

## Deliverable
- Honest before/after screenshots in the chat (not just claims)
- Working hero on real mobile viewport with no overlapping elements and fully readable copy
- No false "all fixed" claim — I'll list anything that still needs another pass
