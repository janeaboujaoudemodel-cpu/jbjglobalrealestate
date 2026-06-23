# Restore the approved Emerald→Black Ombre gradient (revert flattening)

## What went wrong last turn

In the previous pass I flattened the brand's locked ombre tokens in `src/index.css` to a solid `#064E3B`. That is a forbidden change — the only approved emerald fill across the site is the **Emerald → Black Ombre** gradient, never a flat `#064E3B`.

Tokens that were wrongly flattened:
- `--jj-emerald-ombre`
- `--jj-emerald-ombre-hover`
- `--jj-official-emerald-surface`
- `--jj-emerald-light-ombre`
- `--jj-emerald-neon`
- `--jj-emerald-metallic-sheen`
- `--gradient-ink`
- `--gradient-ink-hover`
- `--emerald-ink`, `--emerald-ink-soft`

## Plan

### 1. Restore the ombre tokens (single source of truth)

In `src/index.css` (the `:root` block around lines 6417–6435), restore the canonical Emerald → Black Ombre values (the same family already referenced later in the file at line 10593):

```css
--gradient-ink:       linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%);
--gradient-ink-hover: linear-gradient(135deg, #0A6B53 0%, #064E3B 52%, #031B12 100%);

--jj-emerald-ombre:        linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%);
--jj-emerald-ombre-hover:  linear-gradient(135deg, #0A6B53 0%, #064E3B 52%, #031B12 100%);

--jj-official-emerald-surface: linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%);
--jj-emerald-light-ombre:      linear-gradient(135deg, #0A6B53 0%, #064E3B 52%, #042C1C 100%);
--jj-emerald-neon:             linear-gradient(135deg, #0A6B53 0%, #064E3B 60%, #042C1C 100%);

/* Restore the metallic top-light sheen (was zeroed-out last turn) */
--jj-emerald-metallic-sheen:
  linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.18) 100%);

/* Emerald accent (titles, area labels) stays ink-emerald */
--emerald-ink:      #064E3B;
--emerald-ink-soft: #0A6B53;
```

Update the comment block above these tokens so it reads "Approved Emerald → Black Ombre — solid flat green is forbidden."

### 2. Keep the white-foreground lock — do NOT remove it

The Gate-1 Global Emerald Lock starting at line 11154 (white text, white SVG icons, no border colour flips on hover) stays exactly as-is. The user's complaint is about the *fill*, not the foreground.

The only adjustment: in the white-icon block, the rule currently sets `border-color: #FFFFFF !important` on every emerald surface. The user has explicitly banned white borders on emerald surfaces in the project memory. Change `border-color: #FFFFFF !important;` → `border-color: transparent !important;` so the ombre pill stays borderless.

### 3. Kill the split-overlay rules I added last turn

Remove the `::before` / `::after` neutralising blocks I appended at lines ~13224 and ~13417 (the "Kill split-color pseudo overlays" / "Kill any leftover ::after/::before split overlays on primary pills" blocks). The original metallic sheen overlay is part of the approved ombre look — those kills were the cause of the flat appearance.

### 4. Sanity sweep

Search the file for any other place where I substituted a flat `#064E3B` for what used to be a gradient (e.g. anywhere the value reads `background: #064E3B !important` and the surrounding selector is `.jj-cta-primary` / `.jj-pill-emerald` / `.jj-emerald-solid` / `[data-cta="primary"]`). Revert each one to `background: var(--jj-emerald-ombre)`.

### 5. Visual validation (Playwright, 1280×1800)

After the edits, run a fresh Playwright pass and capture screenshots on:

1. `/` — hero CTA pills (Explore Properties, AI Home Finder, Get Started), header mode chip, AED/filter/favourite pills
2. `/auth` — Sign In pill
3. `/owner` (Command Center) — "Welcome back" band + primary CTAs
4. `/ai-hub` — emerald band + tool tiles
5. `/broker-portal` — sidebar active tile + primary CTAs

Each screenshot must visibly show:
- Pill fill = Emerald → Black Ombre (deeper toward the bottom-right corner, with the subtle top-light sheen)
- Text + icons = pure white at rest **and** hover
- No white border ring on emerald pills
- No flat half-and-half / split appearance

Only after the screenshots confirm all five surfaces will I report done.

## Files touched

- `src/index.css` — restore ombre tokens, change `border-color` to `transparent`, delete the two split-overlay kill blocks I appended last turn.

No other files change.
