# Stabilize and Rebuild the Global Visual System (No Design Change)

Read-only audit complete. **No files were modified.** Baseline screenshots captured at desktop 1440px and mobile 390px for Home, Access, Properties, Cookies, Auth and the Owner CRM shell (including the vertical sidebar in its approved state).

## 1. Audit findings (measured, not estimated)

| Signal | Count | Where |
| --- | --- | --- |
| Total lines | 37,446 | `src/index.css` |
| `!important` declarations | 11,073 | `src/index.css` |
| `html body #root` specificity chains | 4,795 | `src/index.css` |
| Global `-webkit-text-fill-color` paints | 1,320 | `src/index.css` |
| Tailwind class-fragment selectors (`[class*=`, `[class^=`, `[class~=`) | 1,420 (249 of them `bg-` inference) | `src/index.css` |
| Generic tag-descendant painters (`div/span/p/a/button/svg/h1-h6`) | 1,264 rule heads | `src/index.css` |
| Numbered override passes ("PASS n", "final", "nuclear", "terminal") | 325 references, passes numbered up to 249 | `src/index.css` |
| `data-surface` occurrences | 773 | `src/index.css` |
| Opt-out escape hatches (`data-no-contrast-guard`, `data-allow-bright-gold`, `allow-white`) | 266 in CSS + ~60 component files | CSS + components |
| Competing stylesheets | 1,204 lines `src/styles/theme-tokens.css`, 4,861 lines `src/pages/owner/crm/shell/crmShell.css` | separate cascades |
| Hard-coded emerald hexes | 960 × `#064E3B`, 487 × `#042C1C` | should be tokens |

### Root defect classes

1. **Surface inferred from Tailwind class fragments.** Rules such as `[class~="bg-black"]`, `[class^="bg-[#0A0A0A]/"]` treat any dark-looking utility as one semantic surface. Any new component picks up foreign colors by accident.
2. **Broad descendant repaint with exclusion chains.** Around `src/index.css:6412-6740` single rules paint `:is(h1..h6, p, span, a, li, label, button, svg, [class*="lucide"])` under a surface and then carry 40-60 `:not(...)` escape clauses. Every new component needs another `:not()` — this is why chips, dropdowns and icon buttons keep breaking.
3. **Late passes repairing earlier passes.** PASS 230c/230d/230e, 242, 245, 246, 248, 249 exist only to out-specify earlier blocks (comments literally say "nuclear", "beats old 4-ID highlighted rule"). Each is dead weight once the surface contract is authoritative.
4. **Overlays and portals cannot inherit.** Radix portals render outside the surface ancestor, so overlay/panel color is decided by whichever global fragment rule matches — the cream backdrop and dark-text-on-emerald chip defects both originate here.
5. **Three cascades compete.** `theme-tokens.css` and `crmShell.css` both redefine foreground/background contracts that `index.css` then re-overrides.
6. **Runtime recoloring residue.** `src/utils/contrastGuard.ts` is already a no-op (good), but `src/hooks/useAdaptiveHairline.ts`, `src/contexts/BrandPaletteContext.tsx` and several components still read `getComputedStyle` / call `style.setProperty` for visual decisions.
7. **Visible baseline defect confirmed in the captured screenshot:** in Owner CRM card headers, the emerald icon buttons next to "All Open Tasks"/"All Leads"/"This Month" render as empty emerald squares — the icon stroke is painted emerald on emerald by a descendant surface rule. This is an acceptance test, not a design change.

## 2. Architecture map (target)

```text
src/main.tsx
  └── src/index.css            (entry only: @import order + Tailwind directives)
        ├── styles/tokens.css      semantic tokens (single source of truth)
        ├── styles/base.css        reset, typography, page defaults
        ├── styles/surfaces.css    data-surface contract (boundary paint only)
        ├── styles/components.css  narrowly scoped shared component contracts
        └── styles/utilities.css   intentional helpers
  theme-tokens.css  → merged into tokens.css
  crmShell.css      → keeps layout/geometry only; foreground contract removed
```

## 3. Obsolete rule groups (to remove, in order, only after their dependents are migrated)

- G1 Tailwind class-fragment surface inference (all `[class*="bg-`, `[class^="bg-`, `[class~="bg-` matchers).
- G2 Generic tag-descendant repaint blocks with `:not()` chains.
- G3 Numbered repair passes 200-249 plus earlier "final/nuclear/terminal" blocks superseded by the contract.
- G4 Global `-webkit-text-fill-color` paints (kept only where a gradient-clipped text effect genuinely needs it).
- G5 `html body #root` specificity escalation used purely to win a fight.
- G6 Duplicate token definitions in `theme-tokens.css` and `crmShell.css`.
- G7 Opt-out attributes used as routine styling (`data-no-contrast-guard`, `allow-white`, `data-allow-dark-cta`) — replaced by real surface declarations.

Active dependents to migrate first: search bar and filter modal (`src/components/search/**`), Radix primitives (`src/components/ui/**`), legal/content shells, Owner CRM shell, sidebars (`OwnerSidebarNav`, `BrokerPortalSidebar`, `DeveloperHubSidebarNav`, `JBJSidebar`), cards/badges/pills, footer.

## 4. Proposed semantic tokens (values sampled from the approved build — no new palette)

`--surface-page`, `--surface-raised`, `--surface-card`, `--surface-champagne`, `--surface-cream`, `--surface-emerald` (pair gradient `#064E3B → #042C1C → #000`), `--surface-navy`, `--surface-ink`, `--surface-overlay`; `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-dark`, `--text-on-emerald`, `--text-disabled`; `--border-subtle`, `--border-default`, `--border-strong`, `--border-on-dark`; `--accent-primary`, `--accent-hover`, `--accent-active`, `--focus-ring`.

Emerald Pair Lock is preserved: emerald fills always use the 3-stop pair, never `#064E3B` alone.

## 5. Surface contract

`data-surface="page|raised|card|champagne|cream|emerald|navy|ink|glass-dark|image-overlay-dark"`.

Rules paint the **surface boundary** (`color`, `background`, `border-color`, `--icon-color`) and let descendants inherit via `currentColor`. No descendant enumeration, no class-fragment matching, no cross-surface leakage. Nested surfaces override their own boundary. Every portal root (dialog, sheet, popover, dropdown, tooltip, toast) declares its own surface explicitly.

## 6. Shared component variants

`Button` / `IconButton` (`variant`: primary | secondary | outline | ghost | destructive; `surface`; `tone`), `Link`, `Card`, `Badge`, `Chip` (`selected`), `Input`/`Textarea`/`Select`/`Checkbox`/`Radio`/`Switch`, `Tabs`, `Dropdown`, `Popover`, `Tooltip`, `Dialog`, `Sheet`, `Drawer`, `Table`, `Alert`, `Toast`, `NavItem`, `SidebarItem` (own contract, untouched visuals), `SearchFilterTrigger`, `SearchFilterChip`. States covered explicitly: idle, hover, focus-visible, active, selected, checked, open, disabled, loading, error.

## 7. Migration phases with verification checkpoints

1. Tokens + base typography → screenshot diff all baseline routes.
2. Surface contract file added, no removals yet → diff.
3. Buttons, inputs, cards migrated → diff + computed-style probe.
4. Overlays/portals (dialog, sheet, popover, dropdown, tooltip, toast) → remove G1/G2 rules that only served them → diff.
5. Search + property filters → chip/overlay/panel acceptance tests → remove their repair passes.
6. Header and navigation → diff.
7. Property cards and listing pages → diff.
8. Owner Portal / dashboards; `crmShell.css` reduced to layout → diff, plus fix the emerald-icon-on-emerald defect.
9. Forms and auth, remaining pages → diff.
10. Sidebar **last**, internal only, pixel-equivalence required (screenshot + computed-style comparison in idle/hover/active/expanded/collapsed).
11. Final sweep: remove residual G3-G7, justify every remaining `!important` inline with a comment, reduce `index.css` to the entry file.

Each phase ends with desktop + mobile screenshots compared against the captured baseline, and a computed-style probe for `color`, `-webkit-text-fill-color`, `background-color`, `background-image`, `border-color`, `opacity`, `box-shadow`, `outline`, `fill`, `stroke`.

## 8. Acceptance tests

- Selected emerald chip → white text and white icons automatically.
- Unselected light chip → dark text.
- Modal overlay → translucent dark, never cream.
- Modal panel → intended light background with dark text.
- Hero search triggers → white text, visible light border, closed 48px borders unchanged.
- Portal components correct without ancestor inheritance.
- Owner CRM emerald icon buttons show their icons.
- Sidebar pixel-equivalent.

## 9. Files expected to change

`src/index.css` (reduced to entry), new `src/styles/{tokens,base,surfaces,components,utilities}.css`, `src/styles/theme-tokens.css` (merged/removed), `src/pages/owner/crm/shell/crmShell.css` (layout only), `src/components/ui/**` primitives, `src/components/search/**`, header/nav, card/badge/chip components, sidebar files (internal only), `tailwind.config.ts` (token wiring only). No business logic, database, routing or content changes.

## 10. Risks and rollback checkpoints

- **Risk:** removing a broad rule that silently held an unmigrated page together. **Mitigation:** remove only after that page group's batch passes its diff; each batch is an independent checkpoint.
- **Risk:** sidebar drift. **Mitigation:** sidebar migrated last, gated on pixel equivalence; skipped entirely if not needed.
- **Risk:** portal regressions in rarely visited flows. **Mitigation:** the route inventory sweep runs at every checkpoint, not only at the end.
- **Rollback:** every phase is a discrete, revertible step; the captured baseline is the acceptance reference.

## 11. Baseline and confirmation

Baseline screenshots captured (desktop + mobile) for Home, Access, Properties, Cookies, Auth, Owner CRM shell with sidebar. Interaction-state captures (dropdowns open, chips selected, filter modal, sidebar hover/collapsed) will be added as the first action after approval, before any edit.

**Confirmation: no files were modified during this audit.**
