# /access Portal — Mobile Rebuild, Packages Consolidation & Broker Academy

All work is on the members entrance page (`/access`) plus two shared carousel components and the property filter list. No backend or business-logic changes.

## 1. Live inventory — full-bleed on every device

- The "Live inventory from Dubai's top developers." block currently sits inside a boxed card (`max-w-7xl` + rounded border). Make the rail itself full-bleed edge-to-edge on phone, tablet, laptop and desktop; keep the heading/subcopy and the "Unlock the catalogue" button inside the readable gutter.
- Phone: reduce the left/right white fade masks from `w-20` to a narrow ~24px fade (or none under 640px) so covers are never washed out.
- Auto-scroll: keep the existing rAF marquee running on phone exactly like desktop, and keep finger drag/swipe in both directions with a short pause-then-resume after the user lets go.

## 2. JBJ library (books) — full-bleed + phone gestures

- Remove the boxed `max-w-7xl` card around `BookCarousel` on `/access` so the strip runs edge to edge on laptop and phone (header stays in the gutter).
- `BookCarousel` currently uses a CSS keyframe marquee with `touch-action: pan-y`, so it cannot be dragged. Add drag/swipe support (pointer events + momentum) while keeping the auto-animation, and resume auto-scroll after release. Applies wherever the strip is used (homepage marquee included).

## 3. "Real estate services, handled properly." — phone cleanup

- Hide the circular arrow controls on the service cards below the `sm` breakpoint (this also removes the black-arrow-on-emerald contrast defect). Laptop/desktop stay unchanged.
- Remove the progress dots under the frame (arrows/numbered pagination already handle navigation).

## 4. Packages — one "Explore our packages" section with in-page expanders

- Replace the four stacked package straps (`investor-packages`, `broker-packages`, `agency-packages`, `developer-packages`) with a single **Explore our packages** section: three cards in one line — Investor, Broker, Developer — each showing that path's cheapest tier (price + one-line summary) and an **Explore more** action.
- Clicking a card expands the full three-tier grid for that audience inline, on the same page, with no navigation and nothing else rendered until clicked. Only one expands at a time; anchors `#packages`, `#investor-packages`, etc. still resolve and auto-open the matching panel.
- Agency packages are kept, but reachable from inside the Broker panel (as a secondary toggle) so the top row stays three cards. Confirm if you'd rather have a fourth Agency card.
- Delete the standalone "Signature perks" 5-card grid. Its perks stay listed inside the Signature tier card so nothing is lost.

## 5. Broken white CTA contrast

- `Talk to an advisor` and `Speak to broker desk` use the white-on-white-prone shimmer button. Give the resting state a solid white background, a firm emerald hairline border and locked deep-emerald ink (`#0d3a2b`) with `-webkit-text-fill-color`, so it reads correctly on first paint with no hover. Same primitive fix covers every occurrence of that button on the page.

## 6. JBJ Certified Broker Program — full section

- Rename/expand the broker block so it clearly reads **JBJ Certified Broker Program**, and add a three-tier mentorship + certification ladder inside the broker packages panel:
  - **Tier 1 — Foundation (1 month)**: core UAE/off-plan curriculum, DLD-aligned material, certificate on completion, group live sessions, WhatsApp support.
  - **Tier 2 — Professional (3 months)**: everything above + weekly 1:1 video mentorship, live deal shadowing, listing & CRM access, warm client introductions.
  - **Tier 3 — Elite Partner (6–12 months)**: everything above + personal mentor, private developer desk introductions, commission-share pathway, market access across UAE, Cyprus, Greece, Lebanon and Georgia, launch/gala invitations, hiring pathway into JBJ Global.
- Each tier lists price, duration, what's included, and the level of personal support (live video sessions, session count, response times). Copy is written for an international or UAE-based broker who wants to learn and earn — the pitch is the certificate plus access to the full UAE market and our expanding international network.
- Prices: I'll propose AED 1,499 / 3,999 / 9,900 as placeholders — tell me your numbers and I'll lock them in.

## 7. Multi-market property filter

- Add **Greece**, **Lebanon** and **Georgia** to the International group in the property location filter (Cyprus already exists), so filtering surfaces the expanding markets.

## Technical notes

- Files: `src/pages/PublicAccess.tsx` (marquee bleed/fades, services arrows + dots, packages restructure, broker tiers, CTA primitive), `src/components/books/BookCarousel.tsx` (drag + auto-scroll), `src/constants/filterConfig.ts` (markets).
- Full-bleed uses the existing `jj-bleed-allow` / full-bleed band pattern already used by `HomepageBookMarquee`, so page-gutter guards are respected.
- All colours stay on brand tokens: emerald `#064E3B` → `#042c1c` → black, champagne `#F7F2EA`, ink `#0d3a2b`. White ink only on emerald, ink only on champagne.
- Validation: Playwright screenshots at 390px, 768px, 1024px and 1440px covering the inventory rail, book strip, services frame, the three package cards with one panel expanded, and both repaired CTAs.
