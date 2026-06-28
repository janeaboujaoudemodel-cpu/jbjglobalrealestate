
# Global Fix Plan

This is a multi-axis fix. I'll execute it in one batch, taking screenshots after each major area.

## 1. Performance (scroll lag, slow dropdowns/header)
- Audit `useScrollUnlocker.ts` — remove the 56ms wheel-replay setTimeout fallback if it's still there; it queues per-wheel timers and causes jank.
- Remove every `backdrop-blur` over animated/hero sections (header, sticky bars, popovers over video). Replace with solid `bg-*/95` + `text-shadow` for legibility.
- Audit `transition-all` → narrow to `transition-colors`/`transition-transform` on hover-heavy primitives (DropdownMenu, Select, Button, NavigationMenu, popovers, chips).
- Add `will-change:auto` reset where pinned and check for stray `content-visibility` / huge box-shadows.

## 2. Mode picker active state contrast
- The "Mode: Broker" active row renders a near-black pill where the label should be. Fix `ModePicker` (or `ModeSelector`) so the selected row uses emerald metallic surface + WHITE label/icon (per Emerald Box Lock + CTA Hierarchy memories), never black fill swallowing text.

## 3. Universal dropdown hover contrast
- Find the winning rule: dropdown items currently flip to emerald-dark gradient on hover with white text — but the IDLE state on some items is dark/emerald already, so hover keeps dark-on-dark or flips emerald-on-emerald.
- Standardize in `src/components/ui/dropdown-menu.tsx`, `select.tsx`, `command.tsx`, `navigation-menu.tsx`, `popover.tsx` content classes:
  - Idle: `bg-popover text-foreground`
  - Hover/focus: `bg-emerald-metallic text-white [&_svg]:text-white` (no black, no gradient flash)
  - Active/selected: same emerald with white FG, gold hairline accent only
- Remove any `hover:bg-gradient-to-*` involving black on these primitives.

## 4. Full-bleed "Invest in Dubai from anywhere" + all `.jj-band`
- Bug: full-bleed uses `100vw` math that ignores the 88px sidebar, so the section slides behind it.
- Fix `.jj-band` in `index.css` to compute width from the content rail, not viewport:
  ```css
  .jj-band {
    margin-left: calc(50% - 50vw + var(--jj-sidebar-w, 88px));
    margin-right: calc(50% - 50vw);
    width: calc(100vw - var(--jj-sidebar-w, 88px));
  }
  ```
- Set `--jj-sidebar-w` from `GlobalVerticalNav` on `:root` (88px expanded, 0 on mobile, full width when collapsed-to-icon stays 88px).

## 5. Icon contrast (white-on-dark) — global winning rule
- Universal contrast guard already flips ink on champagne. The inverse case (icons rendering dark/black on emerald/dark surfaces) is leaking through.
- Extend `index.css` Emerald Box Lock selector to force `svg, [data-lucide], .lucide { color: #fff !important; fill: currentColor }` on any element whose computed bg is emerald/dark (use `[data-surface="emerald"]`, `.jj-emerald`, `.bg-emerald-*`, `[data-hero-dark]`, `.jj-band--emerald`).
- Audit the "FREE PROFESSIONAL TOOLS" pill sparkle, "Explore JBJ Tools" CTA arrow, hero chips — ensure they inherit white.

## 6. Wire each guide book → its page
In `src/components/home/GuidesBooksSection.tsx` (or equivalent):
- Landlord Guide → `/guides/landlord`
- Rental Guide → `/guides/rental`
- Tenant Guide → `/guides/tenant`
- Investor FAQ → `/faq/investor`
- Buyer FAQ → `/faq/buyer`
- Seller Guide → `/guides/seller`
- News → `/news`, Market Intel → `/market-intelligence`, etc.
- Wrap each book in `<Link>` with proper aria-label.

## 7. Services section — remove AI tools, tag remaining
- In `ExploreServices` / `ServicesGrid`: remove AI Home Finder, Compare Projects, Compare Units, Mortgage Calc, Property Evaluator from this grid.
- They already live in the Royal Tools Hub above; in that hub mark each AI tool with a small "AI" emerald chip on the label (so "AI Home Finder", "Compare (AI)" etc.).
- Keep "List for Sale", "List for Rent", concierge etc. in Services.

## Validation
- Playwright on desktop + iPad + phone:
  - screenshot homepage top, mode picker open, dropdown hover, full-bleed section vs sidebar, services grid, books row
  - measure scroll FPS via `requestAnimationFrame` sampler over 3s scroll
- Confirm: no black fills behind labels, no dropdown text repaint flash, sidebar never overlaps bands.

If you approve, I'll execute all of the above and return with screenshots.
