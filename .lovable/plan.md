# PASS XX-C — Global Emerald Identity + Dropdown Fix

One pass, applied at the **token + primitive layer** so every page inherits it. No per-page patches.

## 1. Lock the Emerald gradient as the ONE brand accent

Source of truth: the gradient already on the active vertical sidebar item.

In `src/index.css` `:root`:
- Re-point `--emerald-1/2/3`, `--gradient-emerald`, `--gradient-emerald-hover`, `--emerald-ring`, `--emerald-soft-bg`, `--emerald-soft-fg`, `--emerald-on` to that exact sidebar-active gradient + ink token.
- Re-point legacy aliases used across the app to the same tokens (no parallel palettes):
  - `--primary`, `--ring`, `--accent`, `--sidebar-primary`, `--sidebar-ring`, `--sidebar-accent`
  - `--ai-emerald`, `--ink-emerald-1/2/3`
- Add `--brand-accent` = emerald and `--brand-accent-on` = white. All primitives below read from this.

## 2. Repaint shared primitives (one edit each — cascades site-wide)

- `src/components/ui/button.tsx` — `primary`/`default`/`destructive` → emerald gradient + white fg + emerald ring. `secondary`/`outline`/`ghost` → champagne fill + emerald fg + emerald hairline. Keep `dark`/`hero` for dark surfaces.
- `src/components/ui/badge.tsx` — `default` → emerald solid, `secondary` → champagne + emerald fg, `outline` → emerald hairline.
- `src/components/ui/tabs.tsx` — active trigger → emerald underline + emerald fg (champagne tab strip). Same primitive used by horizontal tabs everywhere.
- `src/components/ui/card.tsx` — champagne surface + emerald hairline on hover; add `data-tone="emerald"` variant = emerald gradient surface + white content (for KPI/feature cards).
- `src/components/ui/input.tsx`, `select.tsx`, `textarea.tsx` — focus ring → emerald.
- `src/components/ui/table.tsx` — header divider + row hover → emerald wash; selected row → emerald soft.
- `src/components/ui/sidebar.tsx` — active item already emerald; mirror the EXACT styles into `premium-backend-layout.tsx` so frontend + backend sidebars are byte-identical.
- `src/components/ui/icon-tile.tsx` — default tone switches from gold to **emerald** for active/interactive contexts; gold reserved for hairline accents only.
- Charts: update `src/lib/dataColors.ts` primary series to emerald scale.

## 3. Dropdown checkbox fix (global)

The square boxes come from `CommandItem` / `SelectItem` rendering a check indicator slot even in single-select menus.

- `src/components/ui/select.tsx` — `SelectItem` removes the leading square frame. Checkmark only on `data-state="checked"`, rendered as a 14px emerald check glyph (no box).
- `src/components/ui/dropdown-menu.tsx` — same: plain rows for `DropdownMenuItem`. `DropdownMenuCheckboxItem` keeps a real 16px checkbox (emerald when checked, champagne hairline when not), aligned with 10px gap, never overlapping label.
- `src/components/ui/command.tsx` — `CommandItem` renders plain row; only show a check when explicitly `data-selected` AND parent has `data-multi="true"`.
- `src/components/ui/popover.tsx` content — keep champagne `#FDFBF7` + gold hairline (already locked).
- Audit `MultiSelect`/filter components to opt-in via `data-multi="true"`; everything else inherits plain rows automatically.

## 4. Sidebar parity (frontend ↔ backend)

- Extract sidebar item styles into a single class `.jj-sidebar-item` + `.jj-sidebar-item-active` (emerald gradient pill, white icon + label, emerald ring) in `index.css`.
- Rewrite the active-state CSS in both `Sidebar` (frontend) and `premium-backend-layout.tsx` (backend) to use those classes. Icon tiles inside both use `<IconTile tone="emerald-active" />` when active.

## 5. Global de-fade

In `index.css` add a scoped rule (NOT on disabled): replace `text-muted-foreground` usage on KPI numbers, card titles, empty-state titles by giving them `--ink: #1A1A1A`. Leave true secondary copy at 70% ink, never below.

## 6. Verification (Playwright, 1280x1800 + 390x844)

Walk these routes, screenshot each, assert: (a) sidebar active item uses emerald gradient, (b) at least one emerald CTA visible, (c) no `bg-black` primary CTA, (d) open one select on each page and confirm no square box on single-select items.

Routes: `/`, `/news`, `/careers`, `/guides`, `/ai-tools`, `/owner`, `/owner/crm`, `/owner/inbox`, `/owner/calendar`, `/owner/tasks`, `/owner/reports`, `/broker`, `/developer-hub`, `/investor`, `/404`.

Screenshots saved to `/mnt/documents/passxx-c/` and surfaced inline.

## Files touched (≈15, all primitives — no per-page edits)

```
src/index.css
src/lib/dataColors.ts
src/components/ui/button.tsx
src/components/ui/badge.tsx
src/components/ui/tabs.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/textarea.tsx
src/components/ui/table.tsx
src/components/ui/sidebar.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/command.tsx
src/components/ui/icon-tile.tsx
src/components/ui/premium-backend-layout.tsx
```

Plus a Playwright verification script under `/tmp/browser/passxx-c/`.

## Out of scope (intentionally)

- No per-page rewrites. If a page still looks wrong after primitives ship, it's because it bypassed primitives — those get a follow-up surgical fix listed in the verification report, not in this pass.
- No content/copy changes.
- No backend/data changes.

Approve and I execute end-to-end, then post the Playwright screenshot grid as proof.
