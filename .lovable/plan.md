## What's broken on `/rent-guide` (and every other guide that follows the same recipe)

Pulled apart `src/pages/RentGuide.tsx`, `src/components/guides/*`, `src/components/books/GuideBookSection.tsx`, `src/components/guides/GuideCTA.tsx`, `src/components/FounderPhilosophySection.tsx`, and the hero CSS in `src/index.css`. The complaints all trace back to a handful of root causes:

1. **The "book" is just a thumbnail.** `GuideBookSection` renders a static 3D cover plus a TOC that scrolls the page when clicked. There is no actual reader, so clicking "Renting in Dubai: Getting Started" jumps to whatever section happens to share the index (`sectionIds[0]`). The book has 10 chapters but only 5 `tocItems` exist → mismatched anchors → wrong jump (e.g. lands on "How Renting Works").
2. **Page root is brown.** `RentGuide.tsx:198` wraps everything in `bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]` (dark brown). Every `jj-section-champagne` is wrapped in container padding, so the brown background bleeds through between sections — that is the "two-colour brown" the user circled in screenshots 2, 4, 5. It also kills the floating "scroll-to-top" arrow (same brown on brown).
3. **CTA band is solid black.** `GuideCTA.tsx:77` uses `bg-[#1A1A1A]`. On a marketing page that violates the champagne-band rule and produces a black strip around the "Ready to Find Your Next Home" card (screenshot 2 top + bottom red bands).
4. **WhatsApp / Phone buttons render dark-on-navy.** `GuideCTA.tsx:138/146` declares `bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white`. The global "Black-CTA → Navy" guard sees `bg-[#1A1A1A]` + white-ish hover text on an anchor and repaints the button to navy `#102540` + white text — but the **idle** state still has `text-[#1A1A1A]` baked in and the `<svg>` (MessageSquare / Phone) inherits that ink colour. Result: navy pill, white label, black icon.
5. **Founder CTA is a solid-gold fill.** `FounderPhilosophySection.tsx:80` "Learn More About the Founder" is a gold-filled rectangle — direct breach of the `No Gold Fills` core rule.
6. **Hero is not full-screen.** `jj-hero-fullscreen.jj-hero-compact` caps at `78vh` / `820px` (`src/index.css:649-674`). The user wants a true full-viewport hero.
7. **Hero copy is unreadable.** Title splits across `text-white` ("Your Guide to") and a `text-[#1A1A1A]` span that the contrast guard repaints to champagne `#F7F2EA`. Over the bright window photo with only a `from-black/70` gradient overlay, both halves wash out and the description (`text-white/85`) sits over the bright window blowout on the right.
8. **Read the Full Guide / View Rental Properties buttons are ghostly.** Inline `border: '2px solid rgba(255,255,255,0.8)'` + `bg-transparent` + a hover-only champagne gradient = invisible at rest, half-painted on hover.
9. **Broker mode wording is wrong.** "Ready to Find Your Next Home?" doesn't apply to a broker — they want "Ready to Close Your Next Deal" with copy + CTA tuned for sellers/brokers.
10. **Spacing.** Each section uses `py-16 md:py-24` on top of the page-level brown bg, so empty brown stripes appear between champagne content blocks (screenshots 4, 5).

## Fix plan (frontend only — no DB, no routing)

### A. Real book reader, not a thumbnail
Build a new component `src/components/books/GuideBookReader.tsx`:

- Champagne card with the 3D cover on the left and a paginated reader on the right.
- "Open Book" → expands into a full-bleed `<Dialog>` (champagne page background, gold hairline frame, no gray).
- Two-page spread on `lg+`, single page on mobile. Visible page numbers, Prev / Next + keyboard arrows.
- Page content comes straight from `book.tableOfContents[i]` — each chapter's `title`, `summary`, and `bullets` (BookData already has these in `src/data/bookCollections.ts`; nothing fabricated).
- Closing the dialog returns to the page.

Wire `GuideBookSection` to render `GuideBookReader` instead of the static cover + TOC scroll-shim. **The TOC chapter list inside the reader controls pagination, NOT page-scroll**, so the "wrong anchor" bug disappears completely.

### B. Page chrome — kill the brown, restore champagne bands
- `RentGuide.tsx:198` → replace the brown gradient with `bg-page` (champagne page tone) + `data-marketing-page` on the root so the global band system applies.
- Wrap every top-level section already using `jj-section-champagne` in the existing `.jj-band` primitives (`page` / `surface` / `raised`) so alternation is tone, not gap.
- Reduce inter-section gap: drop section padding from `py-16 md:py-24` to `py-12 md:py-16` and remove the bleeding root color entirely.
- Repeat the same root swap on the sibling guide pages: `BuyerGuide.tsx`, `SellerGuide.tsx`, `LandlordGuide.tsx`, `TenantGuide.tsx`, `BuyerFAQ.tsx`, `SellerFAQ.tsx`, `LandlordFAQ.tsx`, `BrokerFAQ.tsx`, `BrokerResources.tsx`, `EducationHub.tsx` — any page that imports `GuideHero` or `GuideBookSection` (grep already confirms the list).

### C. `GuideCTA` champagne lift + correct button colors
- Outer `<section>` → `bg-page` (no more black band).
- WhatsApp button: use the locked `.jj-cta-dark` primitive + `data-cta="whatsapp"`; icon gets `allow-white` class so the contrast guard doesn't flip the SVG to ink. Hover stays navy.
- Phone button: same `.jj-cta-dark` primitive + `allow-white` on the icon.
- Primary "View Rental Properties" → `.jj-cta-champagne` (cream pill, ink text, gold hairline).
- Broker copy branch: read `useUserModeContext().isBrokerMode` inside `GuideCTA`; when broker, swap defaults:
  - title → "Ready to Close Your Next Deal?"
  - description → "Coordinate with a JBJ partner desk to move your client from offer to handover."
  - primary action label/href → "Open Broker Toolkit" / `/broker-toolkit`
  - Pass-through props still win — pages can keep custom copy by passing it.

### D. Hero — full-screen + readable
- `src/index.css` `.jj-hero-fullscreen.jj-hero-compact` → `min-height: 100dvh` (fallback `100vh`), remove the `max-height: 820px` cap.
- `GuideHero.tsx` overlay: replace `from-black/70 via-black/70 to-black` with a stronger two-layer scrim — base `bg-black/55` + bottom gradient `bg-gradient-to-b from-black/35 via-black/55 to-black/85` and a subtle right-side fade `bg-gradient-to-l from-black/40 to-transparent` so the bright window doesn't blow out copy.
- Title: drop the inline `text-[#1A1A1A]` span; render the whole H1 in `text-white` with a unified `text-shadow`. Inside the H1 wrap the keyword phrase in a gold underline (1px hairline accent) — no per-word colour swap, no contrast guard rewrite.
- Description: switch to `text-white` (full opacity) + `text-shadow: 0 2px 14px rgba(0,0,0,.7)`.
- Replace the two ghost buttons in `RentGuide.tsx:215-242` with the locked CTA primitives:
  - Primary → `.jj-cta-champagne` ("Read the Full Guide", `ArrowDown` icon, scrolls to `#rental-process`).
  - Secondary → `.jj-cta-outline` on dark hero (`data-on-dark`, `allow-white` so the white/gold outline survives the contrast guard).

### E. Founder Philosophy CTA — kill the gold fill
- `FounderPhilosophySection.tsx` "Learn More About the Founder" → swap to `.jj-cta-champagne` (cream + ink + 1px gold hairline). Keeps the gold accent on the hairline only, per the `No Gold Fills` core rule.

### F. Float-arrow contrast
The page-end "scroll to top" arrow was invisible on the brown bg. Once the root becomes champagne (step B) it is automatically readable. Confirm visually after the swap; no extra code unless it still fails contrast.

### G. Validate
1. `browser--navigate_to_sandbox /rent-guide` at 1280×720 and 375×812.
2. `browser--screenshot full_page=true` on both viewports.
3. Visually confirm:
   - Hero spans 100dvh, title + description fully legible, two CTA buttons solid (champagne and outline, not ghost).
   - Page is one continuous champagne surface with tone alternation, **zero brown stripes** between sections.
   - Open the book — first chapter shows as **page 1** of a 2-page spread with title + bullets, Next/Prev works.
   - CTA card sits inside a champagne band; WhatsApp + Phone show white icons, white label, navy fill at idle and hover.
   - Switch mode to Broker → CTA card title reads "Ready to Close Your Next Deal?".
   - "Learn More About the Founder" is cream + ink + 1px gold hairline, not a gold rectangle.
   - Floating "scroll to top" arrow visible on champagne.
4. Spot-check `/buyer-guide`, `/seller-guide`, `/landlord-guide`, `/tenant-guide`, `/buyer-faq` to confirm the global guide chrome fix took.

### Files touched
- `src/pages/RentGuide.tsx` (+ all sibling guide/FAQ pages listed in step B — same root-bg swap only)
- `src/components/guides/GuideHero.tsx`
- `src/components/guides/GuideCTA.tsx`
- `src/components/books/GuideBookSection.tsx`
- new `src/components/books/GuideBookReader.tsx`
- `src/components/FounderPhilosophySection.tsx`
- `src/index.css` (hero min-height + scrim refresh only)

No business logic, no DB, no routing changes.
