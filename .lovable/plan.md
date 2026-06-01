# Resale Properties — Navy/Champagne/Gold Restyle + Popup Close Fix

## 1. /resale-properties full re-skin (`src/pages/ResaleProperties.tsx`)

Currently the page uses `#2563EB` (bright royal blue) for headings, borders, badges, CTAs, and empty-state — this is not the approved navy. Replace with the project's locked navy `#102540` (hover `#1a3d63`) + champagne surfaces + 1px gold `#B89555` hairlines + ink `#1A1A1A` body text. White is allowed only inside navy CTAs.

Concrete swaps across the whole file:

- **Hero band**: keep champagne gradient. H1 + sub-headline → `#1A1A1A` (ink), eyebrow chip → champagne pill with gold hairline + ink text. Drop the `#2563EB` H1 color.
- **Sticky search/filter bar** (`section` at line 252):
  - Change `sticky top-0` → `sticky top-[88px]` (clears 88px fixed header per project standard) with `z-30`.
  - Wrap in `<PremiumSectionCard>`-style chrome: champagne raised surface `#EFE6D6`, 1px gold hairline, `rounded-2xl`, `shadow-[0_8px_24px_rgba(16,37,64,0.06)]`, backdrop blur, add a subtle navy left-accent bar (3px) for premium feel.
  - Reorganize: Row 1 = large prominent search input (h-12, gold hairline, ink text) with a navy "Search" submit pill on the right. Row 2 = chips. Row 3 (right-aligned): result count + sort. Wider gap, consistent h-9 chips.
  - Active chip = `.jj-pill-active` (cream + gold hairline + ink) — replace ad-hoc styles where they conflict.
- **Listings grid cards**: keep champagne card, replace the `bg-gold/10` image fallback (uses non-existent token after restyle) with `bg-[#EFE6D6]`. Premium badge stays cream+ink+gold. "Register Interest" button → navy `.jj-cta-dark` (white text, white arrow).
- **Empty state card** (lines 542–620): replace every `#2563EB` border/text/bg with `#102540` for borders/CTA bg and `#1A1A1A` for headings/body. Subscribe + "Browse Off-Plan" buttons → `.jj-cta-dark` (navy, white text). "List Your Property" outline → 1px navy border, ink text. The "Stay in the Loop" heading drops faded gold and becomes ink.
- **List-your-resale CTA band** (lines 625–676): same swap — navy border, navy chip bg with white text (`data-allow-dark-cta`), ink heading, navy primary CTA, navy-outline secondary. Remove `style={{ color: "#B89555" }} data-no-contrast-guard` muddy gold text.
- Remove every remaining `data-no-contrast-guard` opt-out that was only there to allow bright-blue or faded-gold — those colors are gone after the swap.

## 2. Exclusive Access popup X close button (`src/components/LeadCapturePopup.tsx` line 125–130)

The screenshot shows the X rendering as dark-on-dark inside a navy-blue circle. Cause: the global black-CTA → navy guard repaints `bg-[#1A1A1A]/10` to solid navy, but the inner `<X>` stays `text-[#1A1A1A]/60`, so the icon disappears.

Fix: make the close button explicitly opt out of the guard and own its colors:
- Wrapper: `bg-[#1A1A1A]/10 hover:bg-[#1A1A1A]/20` with `data-no-contrast-guard` so it stays a soft ink-tinted bubble on champagne (not navy).
- Icon: keep `text-[#1A1A1A]` (full strength), no opacity.
- If we instead want it to be navy: set bg to `#102540`, icon to `#FFFFFF`, add `data-allow-dark-cta` + `data-no-contrast-guard` + `allow-white`.
- Choosing **option A (soft ink bubble)** — matches the champagne header better and is consistent with other modal closers.

## 3. Visual verification (mandatory before completion)

Using browser tools:
1. `navigate_to_sandbox` → `/resale-properties` at 1280×900.
2. Screenshot hero + sticky bar at scroll-top.
3. Scroll 600px, screenshot — confirm the search bar is pinned at `top:88px` directly under the global header with no overlap, and listings/empty-state are navy-themed.
4. Screenshot empty state + CTA band; verify no `#2563EB` bright-blue remains anywhere.
5. Trigger the Exclusive Access popup (scroll triggers `LeadCapturePopup`), screenshot, zoom into top-right corner to confirm the X icon is clearly visible.
6. If any check fails, iterate and re-screenshot before marking done.

## Files touched

- `src/pages/ResaleProperties.tsx` — full color/style migration + sticky offset + reorganized filter bar.
- `src/components/LeadCapturePopup.tsx` — close button contrast fix.

No business logic, no schema, no route changes.
