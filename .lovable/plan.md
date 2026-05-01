## What's wrong

On the homepage **"Handpicked For You"** grid:

1. The price badge is loud — full orange gradient with white drop-shadowed text. Too heavy for the calm champagne palette.
2. **Tilal Al Furjan** (Nakheel) shows no price because its `price_from` is `NULL` in the database. Confirmed via DB query. Cards with no price look incomplete next to priced cards.
3. The 8 cards already aim for one card per developer, but the fallback pass at the end can let a developer repeat if a primary one fails to load.
4. The **handover-date pill** (`.jj-handover-pill`) renders soft gold-on-gold (`hsl(--handover-gold / 0.12)` background, `hsl(--handover-gold)` text) — the user can see that something is there but it's not legible.

The issues live in two files: `src/components/home/FeaturedListings.tsx` and `src/index.css` (`.jj-handover-pill`).

## Fix

### 1. `src/components/home/FeaturedListings.tsx` — query selection

In `useFeaturedProjects`, prefer projects that have a real price for every developer slot:

- Inside `addOne(devName, nameFilter?)`: build a `priced` pool first (where `typeof p.price_from === 'number' && p.price_from > 0`). Use the priced pool when it's non-empty; only fall back to the full developer list if no priced project exists. This swaps Tilal Al Furjan for another priced Nakheel project automatically.
- In the post-fill loop, sort `all` so priced projects come first before filling remaining slots.
- Tighten the **last-resort** fill to keep enforcing `usedDevs` (today the very last loop drops that check, allowing developer repeats). Result: 8 unique developers, guaranteed.

### 2. `src/components/home/FeaturedListings.tsx` — price badge + always-on price

Replace the heavy orange gradient badge with a calm, premium chip and always render a price line so cards feel uniform:

- Remove the bottom-right orange gradient overlay on the image.
- In the content area (after the divider, beside the handover pill), render a small price block:
  - When `price_from > 0`: small `from` label in `#5A4A2E`, then the number in `text-price-orange` (uses the global `--price-orange` token), Inter, weight 700, ~14px.
  - When no price: the same slot shows `Price on request` in `#5A4A2E` italic, same size — so every card has equal vertical rhythm.
- Move the price into the same flex row as the handover pill (so price-left, handover-right, both at the bottom of every card).

### 3. `src/index.css` — `.jj-handover-pill` contrast

Replace the low-contrast gold-on-gold with a readable institutional chip:

- `background`: solid `#F7F2EA` (champagne surface).
- `border`: `1px solid hsl(var(--handover-gold) / 0.55)`.
- `color`: `#1A1A1A` (ink) — drop the `!important` gold color.
- Keep the existing size, padding, font-weight, tabular numerals.
- Mobile + desktop sizes unchanged.

This keeps the gold accent on the border (premium signal) while the date itself is clearly legible on champagne. No raw grays introduced.

### 4. Smaller, quieter card chrome

Minor restraint tweaks in the same file to match "more premium, smaller, calm":

- Reduce price/handover row to `text-[11px] md:text-xs` so the row reads as a quiet caption.
- Reduce payment-breakdown chip and price chip to the same height for visual harmony.

No structural layout changes — just typography sizing within the existing footer row.

## Why this satisfies the request

- "More premium, smaller, calm with premium orange for prices" → calm champagne chips, ink labels, the price number itself in `--price-orange` (the project-wide premium price token), no loud gradient.
- "Tilal Al Furjan has no price — not acceptable" → query now prefers priced projects per developer, and every card always shows a price line (real number or "Price on request").
- "8 different developers, no repeats" → last-resort fill now also enforces `usedDevs`.
- "Handover date not visible" → pill rebuilt with ink-on-champagne and a gold border for accent.

No memory rules touched (champagne palette preserved, `--price-orange` honored, no faded gold text, IconTile/CTA standards untouched).
