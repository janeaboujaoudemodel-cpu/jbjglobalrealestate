## Goal

Make `/broker-toolkit` more premium, vibrant and on-brand by (1) turning the hero into a true full-screen section and (2) replacing the academy course-card grid with the same 3D book shelf model used in the Broker Portal, populated with broker and investor books.

## Changes

### 1. Full-screen hero — `BrokerToolkitHero.tsx`
- Replace `min-h-[520px] md:min-h-[600px]` with `min-h-[100svh]` so the hero fills the viewport on every device (mobile, tablet, desktop).
- Keep existing video, scrim, copy and CTAs (no business-logic changes).
- Tighten vertical padding so the centered block sits balanced inside the full-screen frame.
- Keep the scroll-down chevron behavior anchored to `#what-you-get` / next section.

### 2. Academy section — `BrokerToolkitAcademy.tsx`
Remove the current "Professional development courses" card grid (Digital Marketing Mastery, Quality & Service Excellence, etc.) and the "Why get certified?" benefits block.

Replace with the **Broker Portal book shelf model**:
- Reuse the canonical `<BookCard size="md">` (3D engraved covers) from `src/components/books/BookCard.tsx` — same component the broker portal/homepage uses.
- Data source: combine `BROKER_BOOKS` (Broker Training Manual, Broker Certification Guide, Broker FAQ) + the investor-facing books a broker needs to sell confidently from `INVESTOR_BOOKS` (Investor Education Guide, Market Intelligence, Golden Visa, Buyer/Seller/Landlord/Tenant/Rental Guides + matching FAQs). Both pulled from `src/data/bookCollections.ts` — no duplicated data.
- Layout: responsive grid (2 cols mobile → 3 → 4 → 5 desktop), generous spacing, champagne band, gold hairline accents, soft section heading "JBJ Academy — Broker & Investor Library".
- Each book links via its existing `href` (book reader / guide page).
- Keep the "Open JBJ Academy" CTA at the bottom pointing to `/jbj-academy`.

### 3. Visual polish (presentation only)
- Apply the existing champagne/gold tokens already in use (`#FDFBF7`, `#B89555`, ink `#1A1A1A`) — no new colors.
- Subtle motion: stagger the book entries with framer-motion on view (no heavy effects).
- Headings use the standard tracking-tight Inter weights already used elsewhere on the page.

### Files touched
- `src/components/broker-toolkit/BrokerToolkitHero.tsx` — full-screen sizing only.
- `src/components/broker-toolkit/BrokerToolkitAcademy.tsx` — full rewrite of body, same export name.

No route, sidebar, backend, sitemap or SEO changes. No removal of any other section.
