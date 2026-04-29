## Premium Footer Upgrade — Plan

Make the footer logo and social icons crisp/legible, then layer in luxury polish across the dark footer surface. No removals — all existing links stay.

### 1. Fix the social icons (legibility first)

In `src/components/marketing/SocialLinks.tsx`:

- Add a new `variant="premium"` and switch the footer to use it (we keep `glow` for legacy callers).
- Render each icon inside a 36×36 circular gold-bordered tile instead of a bare drop-shadow glyph:
  - Resting: `bg-white/[0.04]`, `border border-[hsl(var(--gold))]/45`, gold glyph at `text-[hsl(var(--gold))]` (full opacity).
  - Hover: `bg-[hsl(var(--gold))]`, glyph flips to `text-black`, soft `shadow-[0_0_18px_rgba(200,167,102,0.55)]`, `scale-[1.06]`.
  - Focus-visible: `ring-2 ring-[hsl(var(--gold))]/70 ring-offset-2 ring-offset-[#0A0908]`.
- Bump default `iconClassName` to `w-[18px] h-[18px]` so glyphs sit nicely in the 36px tile.
- In `Footer.tsx`, switch the footer call to `variant="premium"` and remove the `iconClassName="w-4 h-4"` override (the new variant ships its own sizing).
- Verify the static contrast script still passes — the gold tiles use `bg-white/[0.04]` (translucent), and the gold hover swaps to `text-black`, so neither matches the white-on-light rule.

### 2. Fix the footer monogram (looks faded)

In `Footer.tsx` brand block:

- Replace the bare `<img>` with a framed lockup:
  - 64×64 square, `bg-white/[0.04]`, `border border-[hsl(var(--gold))]/40`, `rounded-md`, soft inner highlight `shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]` plus outer `shadow-[0_8px_24px_rgba(200,167,102,0.18)]`.
  - Monogram inside at 44×44, `object-contain`, full opacity (drop the `30` alpha drop-shadow).
- Brand wordmark: keep "JBJ GLOBAL REAL ESTATE" at `text-white` `font-semibold`, but add a thin champagne hairline (`w-10 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/70 to-transparent`) above the tagline for a couture feel.
- Tagline color stays `text-white/55` (acceptable on `#0A0908`).

### 3. Premium polish across the whole footer

All within `src/components/Footer.tsx`:

- **Background depth.** Replace the flat `#0A0908` with a layered surface:
  - Base color stays `#0A0908`.
  - Add a subtle vignette: top radial `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200,167,102,0.06), transparent 70%)`.
  - Add a faint noise/grain via an inline SVG `data:` background at `opacity-[0.03]` for that printed-paper luxury texture.
  - Implement as two absolutely-positioned `pointer-events-none` overlays inside the existing `<footer>` (no new components required).
- **Hairlines.** Keep the existing top/bottom champagne hairlines but soften the inner two grid hairlines: `linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 20%, rgba(200,167,102,0.35) 50%, rgba(255,255,255,0.10) 80%, transparent)`.
- **NavColumn typography.**
  - Section headings get a tiny gold square bullet before the label and a 24px champagne underline beneath:
    ```text
    ▪ EXPLORE
    ────
    ```
  - Lift link color from `text-white/65` to `text-white/75` (better readability on dark) and add a subtle left border slide-in on hover (`hover:border-l hover:border-[hsl(var(--gold))]/60 hover:pl-2`) with `transition-all`.
  - "View All" link gets an arrow that translates 2px on hover.
- **Utility row chrome.** Wrap the whole utility cluster (Connect / GMB / ModeSwitcher / Currency) in a thin pill: `bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2`. Add subtle vertical dividers between the four groups (`w-px h-5 bg-white/10`).
- **Currency & unit pills.** Upgrade to the same gold-tile language: bordered with `border-[hsl(var(--gold))]/30`, active state uses `bg-[hsl(var(--gold))]/15` and `text-white`, dropdown panel gets `shadow-[0_20px_40px_rgba(0,0,0,0.5)]` + champagne hairline at top.
- **Contact strip.** Each item becomes a small chip: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/8 hover:border-[hsl(var(--gold))]/40 hover:bg-white/[0.06]`. Drop the bullet `·` separators (the chips visually separate themselves).
- **Legal/copyright row.** Center-aligned, small caps, `tracking-[0.12em]`, `text-white/55`. Keep the bidi `<bdi>` wrappers exactly as-is.

### 4. Files touched

- `src/components/Footer.tsx` — brand lockup, background overlays, hairlines, NavColumn styling, utility row chrome, currency pills, contact chips, legal row.
- `src/components/marketing/SocialLinks.tsx` — add `premium` variant with gold-tile rendering; default size bump.

### 5. Guardrails

- No-Removal Policy: every existing link/feature stays — only styling changes.
- Static contrast guard (`scripts/contrast/check-white-on-light.mjs`) must continue to pass — all new white text sits on `#0A0908` or translucent overlays.
- Inter font only, single champagne hairline language preserved.
- Preview the footer on desktop + mobile widths after build to confirm the chips and 4-col grid wrap cleanly.