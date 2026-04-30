# Global Champagne/Gold Theme Rollout

You confirmed: roll out the Owner Command Center palette **everywhere** (public + backend), replace grays with **champagne neutrals**, apply the **gold icon-tile** style to **every icon**, and override the existing locked monochrome rules. This is a large, breaking change to the design system and CI guards. Below is the plan.

## What changes

```
Owner Command Center palette (single source of truth)
─────────────────────────────────────────────────────
Champagne 1 (page bg)     #FDFBF7
Champagne 2 (surface)     #F7F2EA
Champagne 3 (raised)      #EFE6D6
Gold accent (primary)     #B89555
Gold deep (hover/active)  #A68444
Hairline / border         #B89555 @ 30% alpha
Body text (on champagne)  #1A1A1A (true black, WCAG AA)
Muted text (on champagne) #5A4A2E (warm brown, replaces gray-500/600)
```

## 1. Owner Command Center padding fix (immediate)

`src/pages/OwnerDashboardOverview.tsx` — the page root `<div class="space-y-8">` butts the H1 against the shell header. Add `pt-6 md:pt-8` to the outer wrapper (line 464) and bump the header block (`mb-4` → `mb-6`). Also audit the shell `<main>` in `src/pages/OwnerDashboardShell.tsx` to ensure `pt-6` exists below the sticky header so this padding rule applies to every Owner sub-route, not just Overview.

## 2. Design tokens — rewrite `src/index.css`

Repoint the existing CSS variables so every component automatically picks up the new palette without per-file edits:

```
--background           : 36 50% 98%   /* #FDFBF7 */
--foreground           : 0 0% 10%
--card / --popover     : 36 50% 98%
--secondary / --muted  : 36 40% 94%   /* #F7F2EA */
--accent               : 36 38% 88%   /* #EFE6D6 */
--muted-foreground     : 33 35% 27%   /* warm brown, NOT gray */
--border / --input     : 40 35% 65%   /* #B89555 @ ~50% L */
--ring                 : 40 35% 53%   /* #B89555 */
--primary              : 40 35% 53%   /* gold becomes primary */
--primary-foreground   : 0 0% 100%
--gold / --gold-light / --gold-dark / --gold-muted : restored to real gold values
--sidebar-* tokens     : champagne surfaces + gold accent
```

`tailwind.config.ts` — remove the comment "Gold mapped to white/grayscale"; gold is gold again.

This single token swap is what makes the change "global" — it propagates to every `bg-background`, `text-muted-foreground`, `border-border`, shadcn primitive, KPI card, tab, dialog, etc. without touching individual files.

## 3. Gray → champagne sweep

Tailwind grays bypass tokens, so we still need a controlled find-and-replace. Build a small codemod (`scripts/theme/champagne-sweep.mjs`) that walks `src/**/*.{ts,tsx}` and rewrites class names per this map:

```
bg-white            → bg-[#FDFBF7]
bg-gray-50/100      → bg-[#F7F2EA]
bg-gray-200/300     → bg-[#EFE6D6]
bg-gray-800/900     → bg-[#1A1A1A]   (kept for dark sections)
text-gray-400/500   → text-[#8A7556]
text-gray-600/700   → text-[#5A4A2E]
text-gray-900/black → text-[#1A1A1A]
border-gray-*       → border-[#B89555]/30
ring-gray-*         → ring-[#B89555]/30
divide-gray-*       → divide-[#B89555]/20
```

Skip files: `src/components/ui/**` (let tokens do that work), `remotion/**`, generated types, the dark `Footer.tsx` obsidian surface, Company Profile premium dark theme, AI purple components. Allowlist file: `scripts/theme/champagne-sweep.allowlist.json`.

Run the codemod, hand-review the diff, commit.

## 4. Universal `<IconTile>` component (every icon)

Create `src/components/ui/icon-tile.tsx` mirroring the Owner overview KPI/QuickAction pattern:

```tsx
<IconTile icon={Users} tone="gold" size="md" />
// → 40×40 rounded-xl, bg-[#B89555]/10 ring-1 ring-[#B89555]/30,
//   icon stroke #B89555. tones: gold | emerald | red | blue | amber | purple
//   (semantic data colors keep their hue; gold is default)
```

Replace the existing `ThemedIcon` (`src/components/ui/themed-icon.tsx`) so it forwards to `IconTile` — keeps backward compat. Then sweep the codebase with `scripts/theme/icon-tile-sweep.mjs` to wrap bare `<Icon className="w-5 h-5 text-..." />` patterns sitting next to titles inside cards. Conservative rules — only converts when the icon is the first child of a known card/list-item shell, otherwise leaves it.

## 5. Button system update

`src/components/ui/button.tsx` — primary/secondary/hero/dark presets stay structurally identical but:
- Primary: `bg-[#1A1A1A] text-white` (unchanged — black still primary CTA for contrast)
- Secondary: `bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6] hover:border-[#B89555]`
- Tertiary/Ghost: champagne hover instead of gray
- New `variant="gold"` for in-dashboard CTAs (`bg-[#B89555] text-white hover:bg-[#A68444]`)

The "no gold text in buttons" rule is intentionally lifted per your direction — gold *background* with white text is fine; we still avoid faded gold *text* on light backgrounds for contrast.

## 6. CI / lint guard updates

These existing scripts WILL fail on the new palette. They must be retuned, not deleted, so we keep guarding readability:

- `scripts/contrast/check-faded-gold.mjs` — keep banning `text-gold/XX` (low-alpha gold text). Solid `text-[#B89555]` and `bg-[#B89555]/10` remain allowed.
- `scripts/contrast/check-white-on-light.mjs` — keep as-is (still bans white text on champagne).
- `scripts/contrast/check-black-on-dark.mjs` — keep as-is.
- `scripts/contrast/check-tokens.mjs` — regenerate `artifacts/contrast/tokens.json` against the new HSL values; verify all token pairs still pass WCAG AA.
- `scripts/contrast/allowlist.json` — refresh entries that referenced old gray pairs.
- `scripts/icon-tile-audit/rules.mjs` — extend to recognize the new `<IconTile />` primitive.

Run all checks and fix any genuine contrast regressions before merging.

## 7. Memory updates

The following Core memory rules contradict this rollout and must be rewritten:

- `mem://style/color-palette/monochrome-design-standard` → replace with `champagne-gold-design-standard` (champagne neutrals, gold accent, black text).
- `mem://constraints/faded-gold-prohibition` → narrow scope: bans only `text-gold/XX` low-alpha utility, allows solid gold and gold backgrounds.
- `mem://ui-ux/visual-standards/cta-system-standard` → allow new `variant="gold"`, still prohibit faded gold text in buttons.
- `mem://ui-ux/visual-standards/typography-monochrome-standard` → rename to `typography-standard` (Inter unchanged, color guidance updated).
- Update `mem://index.md` Core block: replace "White-dominant monochrome" with "Champagne-dominant. Page #FDFBF7, surface #F7F2EA, accent #B89555, text #1A1A1A. Inter only. No raw grays."
- New memory `mem://ui-ux/visual-standards/icon-tile-standard` documenting `<IconTile />` as the only sanctioned icon container.

## 8. Verification

After the sweep + token swap:
1. Run `bunx vitest run` — existing tests should still pass.
2. Run `node scripts/contrast/check-tokens.mjs` and the three contrast guards.
3. Visit (in preview): `/`, `/properties`, `/owner` (overview), `/owner/crm`, `/developer-hub`, `/jbj-broker-dashboard`, `/auth`, `/legal`. Spot-check that no surface still shows `bg-gray-*` or `text-gray-*` and that every dashboard icon sits in a champagne tile.
4. Take before/after screenshots of `/`, `/owner`, `/properties`, `/jbj-broker-dashboard` and attach to the PR notes.

## Files touched (high level)

```
src/index.css                                    (token rewrite)
tailwind.config.ts                               (gold mapping comment + values)
src/pages/OwnerDashboardOverview.tsx             (header padding)
src/pages/OwnerDashboardShell.tsx                (main pt audit)
src/components/ui/button.tsx                     (palette + new gold variant)
src/components/ui/icon-tile.tsx                  (new)
src/components/ui/themed-icon.tsx                (forwards to IconTile)
scripts/theme/champagne-sweep.mjs                (new codemod)
scripts/theme/icon-tile-sweep.mjs                (new codemod)
scripts/theme/champagne-sweep.allowlist.json     (new)
scripts/contrast/*.mjs                           (retune thresholds)
scripts/contrast/allowlist.json                  (refresh)
artifacts/contrast/tokens.json                   (regenerated)
mem://index.md + 5 memory files                  (update locked rules)
src/**/*.tsx                                     (codemod-driven, hundreds of files)
```

## Risks I want you to acknowledge

- This contradicts five locked Core design memories and will visibly change every public page (home, listings, auth, legal). Reverting later means a second sweep.
- A code-mod that touches hundreds of files cannot be 100% perfect — expect a manual cleanup pass on edge cases (gradients, inline `style={{}}`, third-party widgets).
- WCAG AA on light champagne with gold accent is achievable, but `#B89555` text on `#FDFBF7` only reaches ~3.4:1 — we keep gold for backgrounds/icons and use `#1A1A1A` for body copy to stay compliant.

If you approve, I'll execute in this order: (1) padding fix, (2) tokens, (3) IconTile, (4) button, (5) codemod sweep, (6) CI retune, (7) memory updates, (8) verification screenshots.