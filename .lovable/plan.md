## Goal

On every listing card, move the **price** to the bottom-right of the image (overlay on the photo) and move the **handover date** down into the card footer. This applies to all listing cards across the site, not just the homepage.

## Cards affected

1. `src/components/home/FeaturedListings.tsx` — homepage "Handpicked For You" grid (currently no price overlay; price + handover both live in the footer).
2. `src/components/ProjectCard.tsx` — main card used on Properties, Favorites, DeveloperDetail, CommunityDetail, QuizResults, etc. (currently handover sits bottom-right on image, price sits in footer).
3. `src/components/ReellyProjectCard.tsx` — Reelly variant on PropertiesReelly (same layout as ProjectCard).

`ResalePropertiesSection.tsx` shows resale (no `price_from`/`handover_date` schema — uses `asking_price` and `handover_status`); leaving its layout untouched unless the user asks, since it's a different data shape.

## Changes per card

### FeaturedListings.tsx (ProjectCard sub-component)

- Inside the image container (line ~154), add an absolute-positioned price pill at `bottom-3 right-3`:
  - Use the premium price-orange treatment that matches the rest of the site: solid pill, white text on `bg-price-orange`, with a soft shadow so it stays legible over any photo. "From" prefix kept small and uppercase.
  - Renders only when `project.price_from > 0`.
- Replace the existing footer "Price line" block (lines 224–240) with a **handover date line** in the same slot, using the same typographic rhythm:
  - "Handover" label in small uppercase `#5A4A2E`, value in solid ink `#1A1A1A`.
  - Falls back to "Handover TBA" when `handover_date` is missing, so card heights stay consistent.
- Remove the duplicate handover pill from the bottom row (lines 255–262) so handover only appears once (in the new line). Keep the payment-plan pill on the left of that row; right side becomes empty spacer to preserve rhythm.

### ProjectCard.tsx

- The handover badge currently at `absolute bottom-3 right-3` on the image (lines 282–286) is replaced by a **price badge** at the same position:
  - Solid `bg-price-orange` pill, white bold text, `shadow-[0_10px_25px_hsl(0_0%_0%/0.25)]`, with optional small "From" prefix.
  - Uses `formatPriceWithCurrency(project.price_from, currency)`.
  - Renders only when a real price exists; otherwise renders nothing (no overlay).
- The footer "Starting from" block (lines 316–328) is replaced with a **handover date line** ("Handover · 2026" style) using the existing `text-gold` accent for the label and `text-foreground` for the value, matching the surrounding gold card theme. When missing, render "Handover TBA" in muted tone.

### ReellyProjectCard.tsx

- Same swap as ProjectCard.tsx: image bottom-right becomes the price pill (price-orange, white text); footer "Starting from" line becomes a Handover line.

## Visual notes

- Price overlay is the only badge in the bottom-right of the photo, so it never collides with the developer logo (top-left) or the sale-status pill (bottom-left).
- "Sold Out" top-left badge and payment-plan pill in the footer stay where they are.
- The price-orange token (`--price-orange`) is already the site-wide standard for prices, satisfying the existing memory rule.

## Out of scope

- Resale cards (`ResalePropertiesSection.tsx`) — different data model; will revisit if the user wants the same rule applied there.
- No data-fetching or query changes; purely layout.

## QA after implementation

- Homepage "Handpicked For You": price visible bottom-right on each photo, handover row visible in footer.
- `/properties` grid (ProjectCard): same.
- `/properties-reelly`: same.
- Cards with missing price still render cleanly (no empty pill on the photo).
- Cards with missing handover render "Handover TBA" so heights stay aligned.