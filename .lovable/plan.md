## Goal

When you say **"emerald"**, treat it as the agreed **emerald-ombre gradient** already defined in tokens (`--jj-emerald-ombre`: `#064E3B → #042C1C → #000000`, same gradient used on the dark "View All Projects" / header "Mode" pill / "Invest in Dubai from anywhere in the world" surfaces). Never flat bright green. Apply globally.

## Fix 1 — "Explore Our Guides & Reports" title (homepage)

File: `src/components/home/HomepageBookMarquee.tsx`

- The H2 currently renders as flat `#064E3B`. Re-style the heading text using a gradient text clip:
  - `background-image: var(--jj-emerald-ombre)` + `-webkit-background-clip: text` + transparent fill, so the title visually fades emerald → near-black just like the headline on the dark pills.
- Apply the same ombre text-clip to the **"View Library"** / **"View Full Library"** inline links, and switch their icon `stroke` to `#064E3B` (darker end is fine for the chevron).
- The small `BookOpen` icon tile stays as is (emerald glyph on champagne).

## Fix 2 — Recently Viewed card overlays (replace black fade with emerald)

File: `src/components/ContinueSearching.tsx` (the `RecentCard3D` block, around lines 460–510)

Currently three overlay layers use solid `black/95`, `black/55`, `black/10`, plus an opaque `black/85` plate at the bottom. Replace those with an emerald-ombre palette so the bottom of every card fades into emerald, not black:

- Top legibility overlay: `bg-gradient-to-t from-[#031B12]/95 via-[#064E3B]/55 to-transparent`.
- Bottom 62% plate: `bg-gradient-to-t from-[#000000] via-[#042C1C]/95 to-transparent` (keeps text crisp but introduces the emerald mid-tone instead of pure grey-black).
- Bottom 38% solid plate: replace `bg-black/85` with `background: var(--jj-emerald-ombre)` at `opacity ~0.92` so the "BY SOBHA REALTY" + project-name strip sits on the ombre, not on pure black.
- Keep developer-name in white, project-name in white, accent ("by") stays gold `#B89555`. No text-color changes needed.

## Fix 3 — Vertical sidebar **expanded** item hover (main titles)

File: `src/components/navigation/GlobalVerticalNav.tsx` (lines 822–823 and the expanded `<Link>` rows around 1048+)

The expanded sidebar uses `navHoverUnderline` / `subNavHoverUnderline` which force hover text and the underline bar to `#0A0A0A` (pure black). Switch both to the emerald-ombre:

- Hover text color → emerald-ombre via background-clip text (so the label fades emerald → near-black on hover, matching the collapsed icon-tile hover state).
- Underline bar (`after:bg-[#0A0A0A]`) → `after:bg-[image:var(--jj-emerald-ombre)]` so the growing pill underline is the same ombre.
- Hover row background `hover:bg-[#EFE6D6]/60` stays champagne (no change) — only the text/underline accent flips to emerald-ombre.

The collapsed icon tiles (`.jj-side-tile`) already use `--jj-emerald-ombre-hover`; no change there.

## Fix 4 — Global sweep for "flat emerald" leaks

Add a single helper CSS utility in `src/index.css` and reuse it everywhere we need emerald text:

```css
.jj-emerald-ombre-text {
  background-image: var(--jj-emerald-ombre);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.jj-emerald-ombre-bg { background-image: var(--jj-emerald-ombre); }
```

Then audit and convert the remaining solid `#064E3B` / `bg-emerald-*` text usages on these surfaces only (no behavior change, presentation only):

- Homepage "Continue Searching for Your Dream Property" header chips ("Register Your Interest", "View Search History") — keep the metallic ombre fill they already have (already correct), but if any sibling label still uses flat emerald, swap to `.jj-emerald-ombre-text`.
- Any other H2/H3 currently set to flat `style={{ color: '#064E3B' }}` on champagne sections — switch to the new `.jj-emerald-ombre-text` class so all "emerald headings" share the same ombre.

## Out of scope

- No backend / data / route changes.
- No layout or copy changes.
- The bright-emerald icon tiles on champagne (e.g. `.jj-icon-emerald` glyphs inside small circular badges) stay as-is — they're glyphs, not headings, and removing them would break the icon contrast lock.

## Validation

After edits, screenshot the homepage at desktop:
1. "Explore Our Guides & Reports" — title visibly fades emerald → near-black, matches the "View All Projects" pill tone.
2. "Continue Searching" cards — bottom strip is emerald-ombre, no pure black plate.
3. Expand the sidebar, hover "AI Home Finder" / "List Your Property" — label text and underline animate in the emerald-ombre, not black.
