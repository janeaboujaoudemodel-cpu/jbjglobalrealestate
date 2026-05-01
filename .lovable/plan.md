# Fix hero readability + Category card icons

Three fixes confirmed from the live preview screenshots and code inspection.

## 1. Merge label + title into a single premium hero line

**Where:** `src/pages/Index.tsx` (hero block, ~lines 220-245)

- Remove the small pill that says `Dubai's Trusted Real Estate Technology Platform`.
- Replace the H1 `Your Gateway to Dubai's Finest Real Estate` with a single combined premium line:
  - **`Your Trusted Gateway to Dubai's Real Estate Ecosystem`**
  - "Platform" → "Ecosystem" as requested.
  - Slightly larger fluid type: `clamp(1.75rem, 4.8vw + 0.5rem, 4rem)`.
  - Triple-stacked `text-shadow` (sharp + soft + ambient) so it stays crisp on any video frame.
  - `color` and `-webkit-text-fill-color` both pinned to `#FFFFFF` to defeat any cascaded `text-fill-color` override.

## 2. Make the three pillar cards (Premium Marketplace / AI-Powered Tools / Brokerage Services) fully readable

**Where:** `src/pages/Index.tsx` (pillar grid, just below the H1)

Issue: cards used `bg-[#1A1A1A]/75 backdrop-blur-md`. `backdrop-blur` re-samples the busy hero photo every frame and visually washes out white text + gold icons (this matches the documented anti-pattern in our knowledge base).

Changes:
- Drop `backdrop-blur-md`. Use **solid `bg-[#0A0A0A]`** (near-black) for guaranteed contrast.
- Border upgraded from `white/40` to `gold/40`, plus an outer `shadow-[0_10px_40px_rgba(0,0,0,0.5)]` so the whole pill bar reads as one premium ribbon.
- Icon size bumped (`w-6 h-6 sm:w-7 sm:h-7`) with `drop-shadow` so the gold glyph keeps definition even at small sizes.
- Title text bumped to `text-[13px] sm:text-sm` with hardened white fill + heavy text-shadow.
- Description text bumped to `text-[11px] sm:text-xs` at 92% white with the same shadow recipe.

## 3. Fix invisible icons in "Tell us who you are" cards (CategorySelectorSection)

**Where:** `src/components/home/CategorySelectorSection.tsx`

Issue (confirmed in code at lines 100-106): the icon tile is `bg-[#F7F2EA]` (champagne) with a `text-[#1A1A1A]` icon — but the icon visually disappears at rest because the runtime `contrastGuard.ts` scans every `<button>` and forces an inverse color on the parent button, which cascades into the icon via `currentColor`. On hover it switches to `bg-[#1A1A1A] text-white`, but the user reports both states are unreadable.

Changes — bring icons up to a high-contrast premium gold treatment in BOTH states:

- **Icon tile (rest):** keep `bg-[#F7F2EA]` champagne tile, but switch the icon to `text-[#B89555]` (solid gold) with a `drop-shadow(0 1px 2px rgba(26,26,26,0.35))` so it pops on the champagne surface. Add `data-no-contrast-guard` on the button so the runtime guard cannot strip the colour.
- **Icon tile (hover):** `bg-[#1A1A1A]` (ink), icon stays `text-[#B89555]` (gold) — same drop-shadow but darker — so the gold icon is always visible against either champagne or ink. No more white-on-light or black-on-black flips.
- **Continue arrow** on the bottom of each card: also switch to `text-[#B89555]` with a soft drop-shadow so it never blends into the card surface.
- **Bullet check icons** (`CheckCircle2`): keep gold (already correct), unchanged.

Result: the three category cards have a consistent gold icon language at rest and on hover, with shadows giving them dimension so they read as premium and never disappear.

## Technical details

```tsx
// CategorySelectorSection.tsx — icon tile
<motion.button
  data-no-contrast-guard
  className="group relative text-left bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl p-6
             hover:border-[#1A1A1A] hover:shadow-xl transition-all duration-300
             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]"
>
  <div className="w-12 h-12 rounded-xl bg-[#F7F2EA] border border-[#B89555]/40
                  flex items-center justify-center
                  group-hover:bg-[#1A1A1A] group-hover:border-[#B89555]
                  transition-colors flex-shrink-0">
    <Icon
      className="w-6 h-6 text-[#B89555]"
      style={{ filter: "drop-shadow(0 1px 2px rgba(26,26,26,0.35))" }}
    />
  </div>
  ...
  <ArrowRight
    className="w-4 h-4 text-[#B89555] group-hover:translate-x-1 transition-transform flex-shrink-0"
    style={{ filter: "drop-shadow(0 1px 2px rgba(26,26,26,0.25))" }}
  />
</motion.button>
```

No other files change. No content removed (per the No-Removal policy). Memory entries `Universal Same-Tone Contrast Guard` and `Champagne-Gold Design Standard` remain authoritative; this change adds a per-card opt-out that is consistent with both.
