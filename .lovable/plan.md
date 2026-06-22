Global UI contrast + button/slider styling correction. No layout, content, or section changes — pure CSS/component-styling pass.

## Approved tokens (locked)
- Emerald (only allowed green for buttons/CTAs/accents): the deep emerald already used in sidebar + Mode/AED header pills (`#064E3B` → `#042c1c` ombré family, per existing `.jj-pill-emerald-metallic`).
- Bright green: FORBIDDEN everywhere except the active half of the `sq ft / sq m` toggle.
- Champagne secondary surface: `#F7F2EA` / `#EFE6D6` with emerald text+icon.
- On any emerald / black / dark / hero-image surface → text+icons MUST be `#FFFFFF`. No black ever.

## Fixes (visual-only, screenshot-verified)

### 1. Homepage hero search/filter bar
- Force all text, placeholder, search icon, filter icon, heart icon inside the hero search bar to white `#FFFFFF`.
- Target: hero search container (`HomepageHero` search/filter row) — add `data-on-dark` + scoped rule in `index.css` overriding any ink/black inheritance on inputs, placeholders, and svg.

### 2. Top header pill controls (search / filter / heart circles)
- The 3 circular emerald pills next to `sq ft / sq m` currently show black or invisible icons. Force their svg + label to white via existing emerald-surface-white-foreground guard. Add the missing selector for these header icon buttons to the global emerald→white rule in `index.css`.

### 3. "Continue Searching for Your Dream Property" circular icon
- `ContinueSearching` section header icon: ensure icon glyph is white when tile is emerald/dark, OR emerald when tile is champagne. Remove any black fill.

### 4. Explore Our Guides & Reports / View Library / book titles
- Restore book cover titles to white `#FFFFFF` with strong text-shadow (revert any recent black-text override on `PremiumBook3D` compact titles).
- "View Library →" link + arrow: emerald `#064E3B` on champagne page bg.
- Section header icon tile + arrow icons: ensure proper contrast (white on dark tile, emerald on light).

### 5. Mortgage calculator sliders (all 5)
- Standardize via shared slider class:
  - Filled track behind knob: emerald gradient `#064E3B → #042c1c`.
  - Unfilled track: `#EFE6D6` (champagne raised).
  - Knob: white circle, 2px emerald border, soft emerald shadow.
- Fix "Compare to Bank Rates" slider (`MortgageParityPanel`) to use the exact same slider primitive as Property Price / Down Payment / Interest Rate / Loan Term — currently missing the knob styling and shows a red empty rectangle.

### 6. Mortgage calculator CTAs (and global CTA system)
- "Try Our AI Mortgage Calculator" → primary `.jj-cta-emerald` (emerald bg, white text, white icon).
- "Connect With Mortgage Partners" → secondary `.jj-cta-champagne-emerald` (champagne `#F7F2EA` bg, emerald `#064E3B` text + icon, 1px emerald hairline).
- Remove bright green variant from CTA primitives. Audit `.jj-cta-*` classes in `index.css` and replace any non-approved green hex with the approved emerald.
- Global rollout: any button currently using bright green becomes either primary emerald or secondary champagne-emerald based on existing role (primary submit vs secondary).

### 7. Hover states (global)
- Primary emerald CTA hover: darker emerald `#042c1c`, text+icon stay white.
- Secondary champagne CTA hover: subtle champagne darken + emerald hairline strengthens, text+icon stay emerald.
- Add `!important` overrides in the emerald-white guard block to prevent any descendant rule from flipping text/icon to black on `:hover`, `:focus`, `:active`.

## Technical notes
- All work is in `src/index.css` (emerald-white guard expansion, CTA primitives, slider primitive), `src/components/mortgage/MortgageParityPanel.tsx` (Compare Bank Rates slider markup → shared primitive), `src/components/broker-education/PremiumBook3D.tsx` (book cover title color revert to white), plus targeted `data-on-dark` attribute additions on the hero search bar and header icon buttons.
- No new components, no layout edits, no copy edits, no removed features.

## Validation gate (Playwright, headless Chromium, viewport 1280×1800)
Capture before/after PNGs for each fix area. Only declare complete when EVERY screenshot below shows zero black text/icon on emerald or dark and matches the rules above:
1. Homepage hero with search bar zoomed (all icons + placeholder white).
2. Top header pill row zoomed (search/filter/heart icons white on emerald).
3. "Invest in Dubai…" emerald band header icons (search/filter/heart).
4. Continue Searching section circular icon.
5. Guides & Reports row — book titles white, View Library emerald.
6. Mortgage calculator — all 5 sliders side-by-side (knob + track parity).
7. Mortgage CTAs — primary emerald + secondary champagne, idle + hover.
8. Global CTA spot-check on /tools and /careers (one screenshot each) to confirm no bright-green leftovers.

If any screenshot fails the rule, patch and re-shoot before reporting back. Do not claim completion without the 8 screenshots attached.
