# Gold → Cream Champagne (Site-Wide Debrand)

## Goal

Strip the dominant gold from every active state, button, badge, tile, hover, sidebar, header, modal, chip, focus ring and tab — front end **and** back end — and replace it with a cream champagne fill + ink (`#1A1A1A`) text. Gold (`#B89555`) survives **only** as a 1px hairline border / underline accent, the corporate monogram, and the existing `--price-orange` and AI-purple systems (those are not gold).

## Approach: token-level remap, not a 629-file rewrite

The brand is centralized in `src/index.css` under three primitives:

- The Tailwind `gold` color token → `hsl(var(--gold))`
- The hex literals `#B89555` and `#A68444` (sidebar active gradient, button fills, badges)
- The `[data-surface="gold"]` system

Touching all 629 files would be destructive and slow. Instead we change the **token outputs** so every consumer (`bg-gold`, `bg-[#B89555]`, gradients, active states, badges, focus rings) automatically resolves to cream champagne, then we restore gold ONLY as a thin border accent through a small set of utility classes.

## Color mapping

| Old usage | New value |
|---|---|
| `bg-gold`, `bg-[#B89555]`, `bg-[#A68444]`, gold gradients | `#EFE6D6` (raised cream) |
| `text-gold` *as foreground on cream* | `#1A1A1A` ink |
| `text-gold` *as small accent label* | kept (1px context, e.g. eyebrow text) |
| Active sidebar item background | `#EFE6D6` cream + 1px `#B89555` left border + ink text |
| Active tab fill | `#EFE6D6` cream + 1px gold underline + ink text |
| Primary CTA fill | ink `#1A1A1A` on cream OR cream on ink (variant-dependent) — gold fills removed |
| Hover wash on champagne nav | `rgba(184,149,85,0.10)` cream-gold tint, ink text |
| Focus ring | `#B89555` 1px (kept as hairline) |
| Hairline dividers | unchanged (already gold-tinted hairline) |
| Brand monogram / logo | unchanged |
| `[data-surface="gold"]` containers | repainted to cream surface; foreground flips to ink |
| `--price-orange` | unchanged |
| AI purple system | unchanged |

## Files to edit

1. **`src/index.css`** — single source of truth for the swap:
   - Override `--gold` consumers used as **fills** to resolve to the cream raised tone (`40 30% 89%` ≈ `#EFE6D6`) via a new `--gold-fill` variable, and rewrite Tailwind `bg-gold` / `from-gold` / `to-gold` utility outputs to use it.
   - Repaint `[data-surface="gold"]` background to `#EFE6D6`, foreground to `#1A1A1A`, and add a 1px `#B89555` border so the accent survives.
   - Add a global override block that catches the inline literals `bg-[#B89555]`, `bg-[#A68444]`, `from-[#B89555]`, `to-[#A68444]`, `from-[#B89555]/22`, etc. and forces them to `#EFE6D6` with `#1A1A1A` text. (Tailwind generates these as escaped class selectors — we target them by attribute selector `[class*="bg-[#B89555]"]` etc.)
   - Add `.jj-active-cream` utility: cream fill + 1px gold left border + ink text + bold — to be applied wherever the previous black/gold gradient was the "active" indicator.
   - Keep `text-gold` (foreground use) intact so eyebrow labels, hairlines and small accents stay gold.
   - Keep `--ring`, `--border`, `--hairline-*` variables exactly as they are (these are the 1px gold accent the user asked to preserve).

2. **`src/components/owner-dashboard/OwnerSidebarNav.tsx`** — replace the recently-shipped `from-[#B89555] to-[#A68444]` active gradient with the new `.jj-active-cream` pattern (cream bg, 1px gold left border, ink bold text). Hover wash stays the soft gold tint already there.

3. **`src/pages/OwnerDashboardShell.tsx`** — any remaining gold-fill chips/badges in the top bar (verified-owner pill, role badge) move to cream + 1px gold border + ink.

4. **`src/components/ui/icon-tile.tsx`** — the `tone="gold"` variant is repainted: cream tile, 1px gold border, ink icon. All other tones (emerald/red/blue/amber/purple/rose/ink) untouched.

5. **`src/components/ui/button.tsx`** — the `variant="gold"` button: cream fill, 1px gold border, ink text, bold. Hover deepens cream slightly. Other variants untouched.

6. **Front-end header / nav** (`src/components/SiteHeader*` or equivalent — confirm by grep at implementation time) — active link indicator becomes cream pill + ink text + 1px gold underline.

Everything else (629 files using `bg-gold`, `bg-[#B89555]`, gold gradient classes, active-state badges, KPI gold tiles) is corrected automatically by the CSS token + attribute-selector overrides in step 1. No per-file edits required.

## What does NOT change

- Brand monogram and logo PNGs
- `--price-orange` (property prices)
- AI-purple gradient system
- Semantic data viz (emerald/red/blue/amber)
- Hairline dividers (`AdaptiveHairline`, gold border tokens) — these are the "thin gold accent" the user kept
- `text-gold` used as small foreground label text on champagne

## Memory updates

- Update **Champagne-Gold Design Standard** memory: gold is now a hairline-only accent. No gold fills anywhere.
- Update **Core** index line: `gold #B89555` → `gold #B89555 (1px hairline accent only — never as a fill)`.
- Update **CTA System Standard**: `variant="gold"` is now cream-fill + 1px gold border, not solid gold.
- Update **IconTile Standard**: `tone="gold"` is cream tile + 1px gold border + ink icon.
- Update **Segmented Control Tab Standard**: active tab is cream + 1px gold underline + ink, never gold fill.

## Verification after implementation

- Visit owner dashboard → active sidebar item is cream with thin gold left bar and ink text.
- Visit `/`, `/properties`, `/crm`, `/owner` → no solid gold pills, badges, CTA fills, or active backgrounds anywhere.
- Hover any nav item → soft cream-gold tint, ink text stays readable.
- Confirm price tags still orange, AI panels still purple, brand monogram still gold.
- Run the existing contrast guard / a11y suite — should now report fewer same-tone failures (gold-on-gold cases disappear).
