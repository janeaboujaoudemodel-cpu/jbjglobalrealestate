
## Goal

One locked layout standard for every content page (Guides, Insights, Services, Company, Legal, Help & Support). No more broken vertical crops, no more striped emerald hero, no more TOC scroll bugs.

## The 3 locked rules (system-wide)

1. **Hero** — solid premium emerald ombré only. No diagonal lines, no cubes, no grid pattern, no oblique sweeps, no shimmer bars. Title is **center-aligned**. Small compliance/eyebrow chip centered above title. Sub-line centered below.
2. **Content width** — content column is **full page width** (max-w-4xl centered, or the Buyer's Guide card width). TOC does **NOT** shrink the content — TOC floats on top.
3. **TOC / "In This Guide"** — fixed floating panel, **right side**, emerald-filled (`--jj-emerald-ombre`) with pure white text, `z-index: 60` (above every section), collapsible, and each item uses `scrollIntoView` with the exact section id — no offset drift, no jumping 3 sections.

Lock these in a new file `.lovable/memory/ui-ux/visual-standards/content-page-layout-standard.md` so the rules survive future edits.

## Deliverables

### A. New shared primitives (build once, reuse everywhere)

1. `src/components/content-page/PremiumEmeraldHero.tsx`
   - Solid emerald ombré background (`#064E3B → #042c1c → #000`), **no SVG pattern, no stripe overlay, no motion sweep**.
   - Center-aligned: eyebrow chip → H1 (Cormorant Garamond) → italic sub-line → optional meta row.
   - Props: `eyebrow`, `title`, `subtitle`, `meta?`, `height` (`sm` | `md` | `lg`).

2. `src/components/content-page/FloatingTOC.tsx`
   - Fixed panel `right: 24px; top: 50%; transform: translateY(-50%); z-index: 60`.
   - Emerald ombré background, white text, gold hairline, collapsible (chevron), scrollable when >8 items.
   - Sticky above every section; never falls behind.
   - Items: `{ id, label, icon? }`. Click → smooth `scrollIntoView({ block: "start" })` with correct 96px header offset via `scroll-mt-24` on target sections.
   - Active-section highlight via `IntersectionObserver` (rootMargin `-40% 0px -55% 0px`) so highlight matches the section actually in view — no 3-section drift.
   - Mobile: collapses into a bottom-sheet trigger (same emerald, white text).

3. `src/components/content-page/ContentPageShell.tsx`
   - Wraps hero + main content + `FloatingTOC`.
   - Main content: `max-w-4xl mx-auto px-6` (Buyer's Guide card size). Sections wrapped in champagne cards with the standard gold hairline.
   - Guarantees content is **not** squeezed by the TOC.

### B. Retire the striped hero

Delete/replace usages of `GuideHero`, `FAQHero`, `MarketIntelligenceHero`, `BrandEmeraldPage` hero variant, and any inline hero using `data-*-hero` with diagonal-line SVG/`bg-[image:...]` stripes. Route them all through `PremiumEmeraldHero`.

Also delete the offending stripe SVG/pattern layers inside those components so no other page can accidentally re-import them.

### C. Migrate pages to `ContentPageShell` + `FloatingTOC`

Batch 1 — **Legal** (currently broken, per screenshots):
`AmlKycPolicy`, `Terms`, `Privacy`, `Cookies`, `Disclaimers`, `IntellectualProperty`.

Batch 2 — **Guides**:
`Guides`, `BuyerGuide`, `SellerGuide`, `RentGuide`, `TenantGuide`, `LandlordGuide`, `InvestorEducation`, `GoldenVisaGuide`, `DubaiRentalYieldGuide`, `SellingOffPlanBeforeHandover`, `AreaGuides`.

Batch 3 — **Insights**:
`Insights`, `FutureOfRealEstate2026`, `News`, `AINeighborhoodInsightsPage`.

Batch 4 — **Services**: all 18 files under `src/pages/services/*` + `Services.tsx`, `InvestorServices.tsx`, `BrokerResources.tsx`, `BrokerEducation.tsx`.

Batch 5 — **Company**: `About`, `CompanyProfile`, `MeetTheTeam`, `Developers`, `Sitemap`.

Batch 6 — **Help & Support**: `FAQ`, `BuyerFAQ`, `SellerFAQ`, `LandlordFAQ`, `TenantFAQ`, `InvestorFAQ`, `BrokerFAQ`.

### D. Buyer's Guide fix (also referenced in screenshots)

Its hero currently pushes the book cover / title to the left because the old TOC steals column space. After migration the hero returns to full-width centered and the TOC floats over the section — matching the reference the user marked as correct.

### E. Validation (per batch, before moving to next batch)

Playwright script at `/tmp/browser/content-layout-audit.py`:
- Loads each migrated route at 390 / 820 / 1440.
- Asserts: (1) no `<svg>` inside the hero with `pattern`/`line`/`stripe` markers, (2) hero H1 `text-align: center`, (3) main content column ≥ 720px wide at 1440, (4) TOC element has `position: fixed`, `z-index >= 60`, right offset < 40px, (5) clicking a TOC item scrolls to a section whose `getBoundingClientRect().top` is between 80 and 140px.
- Saves screenshots for every route in `/tmp/browser/content-layout/` and I attach them per batch.

## Execution order

I'll ship in this order and pause for approval after each batch so you can eyeball screenshots:

1. Build primitives + retire striped hero component + lock memory rule.
2. Batch 1 Legal (starts with `/aml-kyc` — the one you flagged).
3. Batch 2 Guides (fixes `/buyer-guide`).
4. Batch 3 Insights.
5. Batch 4 Services.
6. Batch 5 Company.
7. Batch 6 Help & Support.

## Out of scope

- No backend/schema changes.
- No copy rewrites — only layout, hero, and TOC.
- Owner/CRM backend pages untouched.

## Technical notes

- `FloatingTOC` uses one shared `IntersectionObserver` per page; unmount cleanup on route change.
- Section ids come from a single `sections` prop passed to `ContentPageShell` so the TOC and DOM ids can never drift out of sync (root cause of the "jumps 3 sections" bug).
- `scroll-mt-24` applied to every section via the shell wrapper, so anchor navigation lands cleanly below the sticky header.
- Hero uses CSS var `--jj-emerald-ombre` already defined in tokens — zero new colors.
