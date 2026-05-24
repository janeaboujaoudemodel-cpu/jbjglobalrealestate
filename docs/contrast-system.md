# Contrast System — Rules of the Road

This document is the canonical reference for **what color pairings are allowed** in the JBJ codebase and **why the contrast gate blocks the rest**. Read this before adding new surfaces, theming a new component, or asking to bypass a CI failure from the contrast scripts.

The runtime + CI enforcement lives in `scripts/contrast/` (see `scripts/contrast/README.md` for the script-level reference) and the runtime guards in `src/utils/contrastGuard.ts` + `src/index.css`. This doc explains the *design intent* those checks enforce.

---

## 1. The four canonical surfaces

Every region of the app must be pinned to exactly one of these tones, either via the `<Surface tone="…">` primitive (`src/components/ui/Surface.tsx`) or by setting `data-surface="…"` on the wrapping element. Token rebinding happens in `src/index.css` under `[data-surface="…"]` blocks.

| Surface | `data-surface` | Background | Foreground | Use for |
|---|---|---|---|---|
| **Page** | `page` (default) | `#FDFBF7` | `#1A1A1A` ink | Body of every route |
| **Champagne** | `champagne` / `light` | `#F7F2EA` | `#1A1A1A` ink | Cards, panels, raised surfaces |
| **Gold** | `gold` | `#B89555` | `#FFFFFF` (large UI only) | CTA tiles, accent badges — **never body copy** |
| **Ink** | `ink` / `dark` | `#1A1A1A` | `#FDFBF7` champagne | Footer, dark hero sections |

Rule: if a section is none of those tones, it doesn't ship. The runtime guard (`contrastGuard.ts`) treats anything else as `__unknown__` and leaves authored color alone — meaning silent bugs become visible bugs fast.

---

## 2. Allowed token pairs (WCAG AA ≥ 4.5:1 unless noted)

The script `scripts/contrast/check-tokens.mjs` validates **every** `:root`, `.dark`, `[data-theme=…]`, and `[data-surface=…]` block in `src/index.css` against the pairings below. Adding a new semantic token pair? Add it to the `PAIRS` array in that script.

| Foreground token | Background token | Floor |
|---|---|---|
| `--foreground` | `--background` | 4.5:1 |
| `--card-foreground` | `--card` | 4.5:1 |
| `--popover-foreground` | `--popover` | 4.5:1 |
| `--primary-foreground` | `--primary` | 4.5:1 |
| `--secondary-foreground` | `--secondary` | 4.5:1 |
| `--muted-foreground` | `--muted` / `--background` / `--card` | 4.5:1 |
| `--accent-foreground` | `--accent` | 4.5:1 |
| `--destructive-foreground` | `--destructive` | 4.5:1 |
| `--sidebar-foreground` | `--sidebar-background` | 4.5:1 |
| `--sidebar-primary-foreground` | `--sidebar-primary` | 4.5:1 |
| `--sidebar-accent-foreground` | `--sidebar-accent` | 4.5:1 |
| `--gold-foreground` | `--gold` / `--gold-dark` | 3:1 (large UI only) |
| `--surface-fg` / `--surface-fg-muted` | `--surface-bg` | 4.5:1 (3:1 on gold) |
| `--surface-cta-fg` | `--surface-cta-bg` | 4.5:1 |

### Documented exceptions

The allowlist (`scripts/contrast/allowlist.json`) is the **only** place to register exceptions, and every entry requires a written justification. Currently allowlisted:

- `muted-foreground/muted` — 4.35:1 decorative-only pair; not used behind body copy.
- `champagne-1/foreground` — decorative champagne tile behind iconography.
- `gold-foreground/gold` + `sidebar-primary-foreground/sidebar-primary` — 2.87:1, restricted to **large UI labels (≥18pt or 14pt bold)**, which fall under WCAG's 3:1 component threshold.
- `surface-fg/surface-bg` + `surface-fg-muted/surface-bg` — gold-surface exception, large CTA labels only.
- `gold-foreground/gold-dark` — 3.7:1 ink-on-gold-dark, hover/active states of large CTAs only.

If you need a new exception, open a PR that adds the `pair` + `reason` to `allowlist.json` and link the design review.

---

## 3. The white-on-bright rule

**Solid `text-white` (or any near-white hex `#EEE`+) is banned on any surface whose background luminance is > 0.52.** This includes `bg-white`, all champagne tones (`#FDFBF7`, `#F7F2EA`, `#EFE6D6`), and the gold accent (`#B89555`).

Enforced in three places:

1. **Static lint** — `scripts/contrast/check-white-on-light.mjs` blocks `text-white` statically nested inside a known light wrapper (`bg-white`, champagne, gold, pearl, …). Runs on every PR.
2. **CSS guard** — `src/index.css` `[data-surface="light"] .text-white` → forced to ink.
3. **Runtime sweep** — `contrastGuard.ts → fixWhiteOnBright()` walks every `.text-white` / `text-white/*` node after each route change and DOM mutation. If the effective background luminance > 0.52 it overrides `color: #1A1A1A !important`.

### Opt-outs (use sparingly, justify in PR)

- Add `data-no-contrast-guard` to the element to skip the runtime sweep entirely. Use for tokens that intentionally render white-on-dark via gradients the guard can't average.
- Add the class `allow-white` for the same effect on `.text-white` nodes specifically (e.g. mode-color pills with a known dark base).
- For static lint only, put `// contrast-ok` on the offending line. Reviewer must agree the underlay is genuinely dark.

The mirror rule — `text-black` (or `text-zinc-900`, `#1A1A1A`, …) on dark surfaces — is enforced by `scripts/contrast/check-black-on-dark.mjs` + the matching CSS guard `[data-surface="dark"] .text-black`.

---

## 4. The opacity rule

**Text-bearing nodes may not render at effective alpha < 40.** That means:

- ❌ `text-foreground/10`, `text-black/20`, `text-white/15`
- ❌ `opacity-0`, `opacity-10`, `opacity-[0.08]` on `<p>`, `<h*>`, `<li>`, `<span>` with text content
- ✅ `text-*/60`+ for body copy
- ✅ `text-*/40`–`/60` for tertiary microcopy (use `text-muted-foreground` instead when possible)
- ✅ Decorative-only dividers/dots — mark them with `data-decorative="true"`, the class `jj-watermark`, or `// contrast-ok` on the line

Enforced by:

1. **Static lint** — `scripts/contrast/check-low-opacity-text.mjs` scans for `text-*/NN` and `opacity-NN` < 40 on text-bearing tags. State-driven reveals (`hover:`, `disabled:`, `group-hover:`, `data-state=…`) are excluded.
2. **Baseline** — `scripts/contrast/allowlist.json → lowOpacityTextBaseline.entries[]` captures pre-existing hits. New regressions block; historical entries are tolerated until cleaned up. Refresh with `node scripts/contrast/check-low-opacity-text.mjs --print-baseline`.
3. **CSS guard** — any text-bearing node ending up with alpha < 25 is lifted back to `opacity: 1; color: hsl(var(--foreground))`, except elements opting out via `data-decorative="true"` / `.jj-watermark`.

Faded **icons** (`<svg>` with low alpha) are reported as **non-blocking warnings** — fix when you touch the file, but they won't fail CI.

---

## 5. Same-tone guard (`bg-X text-X`)

`scripts/contrast/check-same-tone.mjs` catches the specific class of bug where a class string contains both `bg-[#1A1A1A]` and `text-[#1A1A1A]` (or any matched-hex pair). The baseline at `scripts/contrast/same-tone-baseline.json` is currently **empty** — any new same-tone hit blocks the merge.

Runtime backup: `contrastGuard.ts → fixIfLowContrast()` walks interactive + text-bearing nodes and forces an inverse color when the computed contrast ratio drops below ~3.5:1 for text or ~2.5:1 for UI.

---

## 6. Workflow when you hit the gate

1. **Read the error** — the script tells you the exact file, line, and class combination.
2. **Fix the source class** — don't rely on the runtime guard. The guard is belt-and-braces for production safety, not a license to ship low-contrast Tailwind.
3. **If you genuinely need an exception:**
   - Token pair → add to `allowlist.json → tokens[]` with a `reason`.
   - White-on-light → add `data-no-contrast-guard` + `// contrast-ok` and justify in PR.
   - Low-opacity → add `data-decorative="true"` or refresh the baseline if an intentional cleanup landed.
   - Same-tone → fix it. There is no allowlist for new same-tone hits.
4. **Re-run locally** before pushing:
   ```bash
   npm run check:contrast:pr-gate
   ```

---

## 7. Quick reference

| Need to… | Do this |
|---|---|
| Add a themed region | Wrap in `<Surface tone="…">` or set `data-surface="…"` |
| Add a new semantic token pair | Add to `PAIRS` in `scripts/contrast/check-tokens.mjs` |
| Justify a failing token pair | Add to `allowlist.json → tokens[]` with a `reason` |
| Use white text on a gradient | Add `data-no-contrast-guard` to the wrapper |
| Render decorative faded text | Add `data-decorative="true"` or class `jj-watermark` |
| Refresh the low-opacity baseline | `node scripts/contrast/check-low-opacity-text.mjs --print-baseline` |
| Refresh the same-tone baseline | `node scripts/contrast/check-same-tone.mjs --print-baseline > scripts/contrast/same-tone-baseline.json` |
| Run the full PR gate locally | `npm run check:contrast:pr-gate` |

---

**Related docs**
- `scripts/contrast/README.md` — script-level reference, all six gate layers
- `src/components/ui/Surface.tsx` — the `<Surface>` primitive
- `src/utils/contrastGuard.ts` — runtime same-tone + white-on-bright sweep
- `src/index.css` — token definitions and CSS-level guards
- Memory: `mem://ui-ux/visual-standards/universal-same-tone-contrast-guard`, `mem://ui-ux/visual-standards/white-on-light-contrast-guard`, `mem://ui-ux/visual-standards/global-surface-theme-standard`
