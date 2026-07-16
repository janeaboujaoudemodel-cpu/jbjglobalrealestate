## What's broken (from the message)

1. **Contact page** — layout structure is broken, not just colors. Needs a real rebuild, not another CSS override.
2. **Investor FAQ** — contrast + layout still broken, and a **vertical line runs top-to-bottom on the right side** (the old floating Navigator / TOC is bleeding through as a stripe).
3. **PublicAccess "gate portal" property strap-line on phone** — not scrolling by finger, not auto-animating.
4. **Guide books (desktop left side)** — hover-to-move interaction is dead.
5. **Sweep** — apply the same rebuild pattern to every sibling page still off-standard: sales / seller / buyer / broker / tenant / landlord FAQs, Guides, Insights, News, Account pages (Billing, Passkeys, Profile), Legal (Terms, Privacy, Cookies, Disclaimers, IntellectualProperty, AML/KYC).

---

## Fixes

### 1. Investor FAQ (`src/pages/InvestorFAQ.tsx`)

Rebuild on the locked `ContentPageShell` the same way `/investor-education` was rebuilt last turn:

- Solid emerald hero via `PremiumEmeraldHero` (removes the `data-neon-page` container + the champagne wrapper sections that caused the layout to feel "off").
- Kill the **duplicate TOC**. Today the page renders **both** `<FAQFloatingSidebar>` (fixed right, z-80) **and** `<FAQTableOfContents sticky>` in a mobile-only sticky wrapper. On some breakpoints the desktop-only sidebar's outer wrapper leaves a persistent right-edge line (that's the "vertical blue-like line down the right side"). Use only `GuideTableOfContents` via `ContentPageShell`.
- White champagne section cards for each category, emerald icon plate, gold hairline, `#0d3a2b` headers, `#1A1A1A` body, WCAG-safe.
- Accordion open-state: emerald fill, pure white text (already the locked FAQ rule).
- Bottom CTA card in solid emerald (same primitive used on Investor Education).

### 2. Contact page (`src/pages/Contact.tsx`)

The current file is 900 lines of ad-hoc scoped `<style>` blocks. Rebuild the **structure** into three clean stacked sections inside a single page shell:

```text
┌───────────────────────────────────────┐
│  Emerald hero (video bg, centered)    │  ← already good
├───────────────────────────────────────┤
│  4 contact tiles (Location/Phone/     │
│  Email/Hours) — champagne row         │
├───────────────────────────────────────┤
│  2-col on lg:                         │
│   • Left: emerald consultation form   │
│     (max-w-xl, compact fields)        │
│   • Right: "Need Help" support card   │
│     + "Our Commitment" card           │
├───────────────────────────────────────┤
│  MI pre-footer CTA                    │
└───────────────────────────────────────┘
```

- Drop the giant inline `<style>` block; move the emerald-input contract into a small scoped CSS class in `index.css` (`.jj-emerald-form`) so the file stops being 900 lines.
- Form fields shrink to `h-10`, single column on mobile, 2-col on md+.
- Right column ("Need Help" + "Our Commitment") stays **champagne white** with pure black text — no override needed because they live outside the `.jj-emerald-form` scope.
- Remove any duplicated "reach us directly" / phone-actions blocks that survived earlier fixes.

### 3. PublicAccess strap-line (`src/pages/PublicAccess.tsx`)

The handpicked strap-line uses a horizontal scroll rail that on mobile currently has:
- `overflow-x-hidden` on an ancestor (kills touch scroll), and
- an auto-marquee `@keyframes` animation gated behind `md:` (so mobile gets neither auto nor manual scroll).

Fix:
- Add `overflow-x-auto touch-pan-x` and `[-webkit-overflow-scrolling:touch]` on the rail itself.
- Move the marquee animation out of the `md:` gate so it runs on mobile too, pausing on touch (`onTouchStart` → pauses; user can then swipe).
- Ensure no parent has `overflow-x-hidden` blocking the swipe (App.css sets it on `#root` — the rail must be a stacking context that doesn't inherit — use `-mx-4 px-4` bleed so scroll happens inside the rail, not the page).

### 4. Guide books hover (Guides page)

The book strap on Guides uses `BookCarousel.tsx` which was patched for iOS a few turns back. On desktop `hover` isn't translating the covers because the hover class was accidentally scoped to `md:` after the iOS fix. Restore the desktop hover:

- `hover:-translate-y-2 hover:rotate-[-1deg]` on the card (not gated behind a breakpoint).
- Keep the touch-friendly variant for phones.

### 5. Sibling page sweep

Same pattern (kill duplicate TOCs, use `ContentPageShell` + `GuideTableOfContents`, champagne section cards, emerald open-state) applied to:

- `BuyerFAQ.tsx`, `SellerFAQ.tsx`, `BrokerFAQ.tsx`, `LandlordFAQ.tsx`, `TenantFAQ.tsx`, `FAQ.tsx`
- Guides: any guide page still not on `ContentPageShell` (audit `src/pages/guides/*` + `BuyerGuide/SellerGuide/RentGuide/LandlordGuide/TenantGuide`)
- Insights & News landing pages (Insights.tsx, News.tsx) — only fix contrast/TOC-stripe, keep editorial layout.
- Account pages (AccountBilling, AccountPasskeys, UserProfile) — enforce champagne section cards + emerald open-state; no full rebuild.
- Legal (Terms, Privacy, Cookies, Disclaimers, IntellectualProperty, AmlKycPolicy) — enforce ContentPageShell if missing.

I'll audit each of these first with a single ripgrep sweep for the two smoking-gun markers (`data-neon-page`, `FAQFloatingSidebar` co-rendered with `FAQTableOfContents`, and `mx-[0.125rem] md:mx-2 ... rounded-2xl` band pattern) and only touch the files that match.

---

## Validation

- Playwright screenshots on desktop (1280×1800) and mobile (390×844) for: `/contact`, `/investor-faq`, `/`, `/investor-education`, one buyer FAQ, one legal page.
- Manually check that the right-side vertical stripe is gone on `/investor-faq` (screenshot with mouse in center of viewport, no hover on TOC).
- Manually swipe the PublicAccess strap-line at 390px width and confirm the rail scrolls.

## Technical notes

- `ContentPageShell` already implements the locked hero + floating emerald TOC; do not add a second TOC alongside it (that's what caused the stripe).
- `.jj-emerald-form` will live in `src/index.css` under an existing PASS block; no new global tokens needed.
- No backend changes. No design-token changes. No routing changes.

## Out of scope (won't touch)

- Any security findings.
- Sidebar / global header / footer.
- Any developer-hub / broker-portal / admin routes.
- Business logic in `Contact.onSubmit` — form wiring stays byte-identical.
