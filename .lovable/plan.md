## Goal

Three coordinated upgrades:
1. **Global contrast fix** — eliminate white icons/text on light backgrounds anywhere in the app (logos, icons, labels).
2. **Premium user avatar** — high-resolution, centered photo with a gold ring (replacing the gray fallback).
3. **Gold sidebar icons** — every icon in the vertical sidebar rendered in gold inside a thin gold-bordered tile.

Strict no-removal: no nav items, sections, or features are removed — only styling/markup tweaks.

---

## 1. Global contrast guard (white-on-light)

Add a defensive runtime + static pass:

- **Static sweep** — `rg "text-white"` across `src/components` and `src/pages`; for each match, check if its container background is light (`bg-white`, `bg-pearl-*`, `bg-[#F…]`, gradients on light, `bg-gold/10`, etc). Replace with `text-black` (or `text-foreground`) — or, where a hover swap is required (e.g. CategorySelectorSection's `group-hover:text-white` on a black hover bg), keep the hover swap but only when the hover bg is dark.
- **Sidebar mega-menu close buttons** (`GlobalVerticalNav.tsx` lines 866, 949, 1036) — currently `bg-gradient-to-br from-gold to-gold-dark` with `text-white` X. Gold gradient is light-ish; switch X icon to `text-black` for guaranteed contrast.
- **Logos / brand marks** — audit any `<img>` with `filter: invert/brightness(0)` on light surfaces, and any `text-white` brand wordmarks rendered on `bg-pearl/bg-white/bg-[#ECE2D2]`. Force dark token (`#111`).
- **Add a global CSS guard** in `src/index.css`:
  ```css
  /* Defensive: any element forced white on a light surface gets black text */
  .text-white.on-light, [data-surface="light"] .text-white { color: #111 !important; }
  ```
  and document the `data-surface="light"` opt-in for new components.
- **Lint rule (script)** — extend `scripts/contrast/check-tokens.mjs` (already exists) with a "white-on-light" rule that fails the build when `text-white` is statically nested in a known light wrapper class. Wire into the existing `contrast-check.yml` workflow.

## 2. Premium user avatar (high-res, centered, gold ring)

Single source of truth for the user avatar — used by header dropdown, dashboard ProfileSummaryCard, and anywhere else `photo_url` is rendered.

- **New component** `src/components/account/UserAvatarPremium.tsx`:
  - Reads `crm_users_profile.photo_url` → `user_metadata.avatar_url` → `picture` (same precedence we already use).
  - Pipes the URL through `getHighResImageUrl(url, '512x512')` (`src/lib/imageUtils.ts`) so Google/CDN thumbs are upgraded.
  - `<img>` with `object-cover object-center` + `loading="eager"` + `referrerPolicy="no-referrer"` (Google avatars 403 otherwise) so the face is always centered and crisp.
  - Wrapper: `rounded-full p-[2px] bg-gradient-to-br from-[hsl(var(--gold))] via-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]` with a soft `shadow-[0_0_0_1px_rgba(217,194,146,0.45),0_8px_24px_-8px_rgba(217,194,146,0.55)]` gold glow.
  - Inner ring: `bg-white` so the gold reads as a true ring on every surface.
  - Fallback (no photo): black initials on `from-[#F7F1E6] to-[#D8C7A6]` champagne, NOT gray.
  - Sizes: `sm` 32px, `md` 48px, `lg` 64px, `xl` 96px.
- **Replace existing avatars**:
  - `src/components/dashboard/ProfileSummaryCard.tsx` (line 108) — swap the shadcn `Avatar` for `<UserAvatarPremium size="lg" />`. The `border-2 border-gold/40` is replaced by the component's own ring. Skeleton remains.
  - `src/components/GlobalHeader.tsx` (account button area near line 958) — render `<UserAvatarPremium size="sm" />` next to "Signed in as" and in the My Account trigger if there's a slot. (No structural removal; only visual upgrade.)
  - Any other `photo_url` consumer that visually shows the user (quick scan: `InvestorDashboard.tsx`, `DeveloperCheckin.tsx`) — opt-in only if the design currently shows a gray ring.

## 3. Gold sidebar icons with gold borders

Goal: every icon tile in `GlobalVerticalNav.tsx` reads as a small gold "chip" — gold glyph inside a 1px gold-bordered rounded tile, on the existing champagne sidebar.

- **Refactor `getIconStyle`** (line 820):
  - Drop the rose / violet / sky / emerald / amber per-route colors. ALL icons return `text-[hsl(var(--gold))]` in the resting state. (The colored route-row backgrounds in `getItemStyle` remain — only icon glyphs go gold.)
  - When `shouldHighlight` is true AND the row background is a saturated color (the rose/violet/sky/emerald rows), keep `text-white` so the icon stays legible on the dark fill — that is dark-on-dark safe.
  - When `shouldHighlight` is true on the standard champagne row, return `text-[hsl(var(--gold-dark))]` for extra contrast.
- **Wrap every nav-item icon in a gold-bordered tile**:
  - In the three render sites (line 1128, 1208, plus highlight items), wrap `<Icon …/>` in:
    ```tsx
    <span className="w-6 h-6 rounded-md flex items-center justify-center
                     border border-gold/45 bg-gold/[0.06]
                     group-hover:bg-gold/[0.12] group-hover:border-gold/70
                     shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]">
      <Icon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
    </span>
    ```
  - Active state: `bg-gold/20 border-gold/80`.
  - Saturated colored rows (rose/violet/sky/emerald) override: tile becomes `bg-white/15 border-white/40` so the gold tile pattern doesn't fight the colored fill.
- **Section headers** (line 1174) — already use `bg-gold/[0.08]` tiles; tighten the border to `border border-gold/30` (currently borderless) for parity.
- **Mega-menu close X** — also gets a thin gold border tile with a black X (per §1).
- **Collapsed-rail mode** — apply the same gold tile wrapper at the rail width so collapsed icons also look like gold chips.

---

## Files

**New**
- `src/components/account/UserAvatarPremium.tsx`

**Edited**
- `src/index.css` — defensive `.text-white` guard on light surfaces.
- `scripts/contrast/check-tokens.mjs` — add white-on-light rule.
- `src/components/navigation/GlobalVerticalNav.tsx` — gold icon tiles + simplified `getIconStyle` + gold X buttons.
- `src/components/dashboard/ProfileSummaryCard.tsx` — use `UserAvatarPremium`.
- `src/components/GlobalHeader.tsx` — use `UserAvatarPremium` in account dropdown.
- `src/components/home/CategorySelectorSection.tsx` and any other components flagged by the white-on-light sweep.

## Out of scope

- No changes to nav structure, routes, sections, ordering, or labels (no-removal policy).
- No changes to AI Premium Purple surfaces (those are dark — white icons stay).
- No changes to footer monochrome obsidian (dark surface — white text stays).
