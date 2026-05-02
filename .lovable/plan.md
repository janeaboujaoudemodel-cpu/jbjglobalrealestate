## Goal

Add premium vertical dividers between the three hero pillar cards on the home page: **Premium Marketplace**, **AI-Powered Tools**, and **Brokerage Services**.

## Scope

Single file: `src/pages/Index.tsx` (lines 250–277, the `pillars.map()` grid inside the merged hero).

No other section is touched — homepage marquee, CTAs, video background, and other cards stay exactly as they are.

## Current state

The three pillar cards sit in a `grid grid-cols-3 gap-px` with a gold border around the whole strip. The `gap-px` creates a 1px black seam between cards but reads as touching/edge-to-edge — there is no visible divider.

## Change

Replace the seam with a true **premium divider** between each pair of cards:

- **Hairline:** vertical 1px line using a gold gradient (transparent → gold 85% → transparent) so the line fades out at the top and bottom edges instead of butting into the card border.
- **Center diamond:** a small 6×6 gold square rotated 45° at the vertical midpoint with a soft gold glow — a recognisable "premium / editorial" divider mark consistent with the champagne-gold standard.
- **Placement:** rendered as an absolutely-positioned element on the **left edge** of cards 2 and 3 only (`idx > 0`), inset 12px top and bottom so it never touches the outer gold frame.
- Remove the `gap-px` so the cards sit flush and the divider is the only visual separator. Keep the outer `border border-gold/40`, rounded corners, and shadow unchanged.

Colors used: `#B89555` (gold token) at varying alphas, on the existing `#0A0A0A` card surface — fully on-palette, no new tokens.

## Technical detail

```text
{pillars.map((pillar, idx) => (
  <div className="relative bg-[#0A0A0A] p-4 sm:p-5 text-center">
    {idx > 0 && (
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-3 bottom-3 w-px"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(184,149,85,0.85) 50%, transparent)" }}
      >
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-1.5 h-1.5 rotate-45 bg-gold shadow-[0_0_6px_rgba(184,149,85,0.8)]" />
      </div>
    )}
    {/* existing icon, title, desc unchanged */}
  </div>
))}
```

Grid container className change: `grid grid-cols-3 gap-px ...` → `grid grid-cols-3 ...` (drop `gap-px`, add `bg-[#0A0A0A]` on the wrapper so no seam shows through).

## Out of scope / locked

- Pillar icons, titles, descriptions, and order — unchanged.
- Outer gold border, rounded corners, drop shadow — unchanged.
- Mobile responsiveness — unchanged (still `grid-cols-3` on all breakpoints, matching current behavior).
- Homepage marquee, CTA pills, video hero — untouched.

## Verification

After implementing, on `/` confirm:
1. Three pillar cards now show a faint gold hairline + small gold diamond between each pair.
2. Dividers do not appear before card 1 or after card 3.
3. Card text and icons render exactly as before; layout/height unchanged.
