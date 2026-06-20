
# Pass 16 — Sidebar, Category Pills, Hero Search Typing

## 1. Vertical sidebar — premium white + emerald
**File:** `src/components/navigation/GlobalVerticalNav.tsx` + `src/index.css`

- Replace champagne/gold sidebar shell with clean mother-of-pearl white (`#FFFFFF` → `#F7FAF8` subtle vertical wash), 1px emerald hairline divider on the right edge only (`rgba(6,78,59,0.12)`).
- Remove all gold borders, dividers and gold accents inside the sidebar (logo block, profile block, group separators, footer).
- All static text → ink `#1A1A1A`; secondary text → `#1A1A1A`/70.
- Emerald reserved for: active pill, icon tiles, micro-hairlines.

## 2. Main category rows — active-only emerald pill, no gold hover
Current bug: every main category (Tools & Workspace, My Account…) renders an emerald box; hover state uses gold.

Fix:
- **Idle state** for ALL main categories (AI Home Finder, List Your Property, Careers, Resale Properties, Tools & Workspace, My Account): match the AI Home Finder reference — transparent background, ink label, emerald-tile icon, no border, no fill.
- **Active state ONLY** (the currently-open/selected category): emerald-ombre filled pill (`var(--gradient-ink)` on `#064E3B`), white label, white icon, 1px inner highlight — the same chip currently used for "Tools & Workspace"/"My Account".
- **Hover state**: subtle emerald wash `rgba(6,78,59,0.06)` background + ink text. NO gold, NO champagne, NO `#B89555` anywhere on hover.
- Enforce a single uniform pill height across all category rows (44px) and identical horizontal padding so the active chip never looks larger than the others.

## 3. Hero search bar — clickable + pause typewriter on focus
**Files:** `src/components/home/HomeHeroSearch.tsx`, `src/hooks/useTypewriter.ts` (or wherever the placeholder typewriter lives)

Bug A — search not clickable: an overlay (likely the typewriter span or a decorative div) is sitting above the `<input>` capturing pointer events. Fix by adding `pointer-events-none` to the typewriter overlay and ensuring the `<input>` has `relative z-10` and a positive tab index.

Bug B — typewriter must pause while user types:
- Add `paused` state to the typewriter hook, controlled by input `onFocus` (pause) / `onBlur` (resume only if value is empty).
- Also pause on any `onInput` while value length > 0; resume automatically when value becomes empty again.
- Apply the same behaviour to the Newsletter "Stay in the Loop" email input (same hook, same pattern).
- When paused, the placeholder shows the static base text (no caret animation) so the user's typed value is never overwritten.

## 4. Validation
Screenshot proof after build:
- Sidebar collapsed + expanded (white shell, emerald hairlines, no gold).
- Sidebar with one category active — confirm only that one row shows the emerald pill; others are flat.
- Hover state on an inactive category — confirm emerald wash, no gold.
- Hero: click search, type "marina" — typewriter stops, text accepted. Clear field → typewriter resumes.
- Newsletter: click email field, type — typewriter stops. Clear → resumes.

## Files to edit
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/index.css` (sidebar shell + active/hover rules, kill gold hover overrides)
- `src/components/home/HomeHeroSearch.tsx`
- `src/components/marketing/NewsletterBrevo.tsx`
- `src/hooks/useTypewriter.ts` (add pause API)
