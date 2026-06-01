
## 1. Home — Get Verified + Mode Portal banners (premium pair)

Goal: two stacked banners with **inverted contrast**, separated from the section above by a clean divider, touching each other with **zero gap**.

`src/pages/Index.tsx`
- Replace the two separate `PremiumSectionCard` wrappers (Verification + ModePortal) with **one** full-bleed wrapper that renders, in order:
  1. `SectionDividerGoldFullBleed` (clean gold hairline between Developer Partners Marquee and the banner pair).
  2. `<VerificationBanner />` (navy bg, champagne CTA — unchanged contrast).
  3. `<ModePortalBanner />` (NEW champagne bg, navy text/icon, navy CTA with white text+arrow — inverted).
  4. No vertical padding between #2 and #3 (`-mt-px` on the portal banner to overlap the hairline so they read as one block).
- Move/push the Get Verified pair **down** so it sits **immediately above** the Mode Portal banner (currently they're not adjacent because of intervening sections). New order on the homepage will be:
  - Hero → Marquee → Featured Listings → … (existing flow) → **Gold divider → Get Verified → Mode Portal Banner** → next section.
- Remove the standalone `<PartnerVerifyHeroCTA />` placement inside the verification card (keep file, just stop rendering it next to the new pair) to avoid a third stacked strip.

## 2. New look for `ModePortalBanner.tsx` (inverted of Get Verified)

`src/components/home/ModePortalBanner.tsx` — full rewrite of presentation only; mode-aware logic kept.

- Background: champagne gradient `from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA]` with 1px gold hairline top+bottom.
- Icon tile: cream `#FDFBF7` with `#B89555` ring; icon stroke `#102540` (navy).
- Eyebrow + Title text: navy `#102540`; body copy: `#1A1A1A`/80.
- CTA "Open {Mode} Portal": navy pill (`bg-[#102540]` / hover `#1a3d63`), `text-white`, white `ArrowRight` — **same shape, padding, radius, shadow, hover-lift** as the Get Verified champagne pill (uses `data-cta="dark"` + `data-allow-dark-cta` to satisfy the navy-pill lock).
- Same width container, same vertical padding as `VerificationBanner` so the two strips line up pixel-for-pixel.
- Mode-aware routes preserved:
  - investor → `/investor-dashboard`
  - broker → `/broker/portal`
  - developer → `/developers-portal`

This rule applies to all three modes identically (only icon + label change).

## 3. Kill all raw white page backgrounds (mother-of-pearl globally)

- `src/pages/Index.tsx`: change root `bg-[#FDFBF7]` to `bg-[#F7F2EA]` (mother-of-pearl page).
- `src/index.css`: add a guard that remaps any element using `bg-white` / `bg-[#FFFFFF]` / `bg-[#ffffff]` at the page/layout level to `#F7F2EA`, while preserving white inside dark CTAs, modals, and `[data-allow-white]` opt-outs (cards, popovers, dialogs keep their own bg via existing tokens). Scope guard to `body, main, section, [data-home-page] > div` to avoid touching badge/input fills.
- Verify with browser screenshot of home + 2 other routes after.

## 4. Fix global header search (broken & cropped popover)

`src/components/header/MegaMenuSearch.tsx` is the panel that opens from the header search icon. Current issues observed: white card on white page (looks cropped), `absolute right-0 top-full mt-2 w-[min(95vw,900px)]` overflows the L-shaped 88px frame on small/medium viewports, and Enter currently relies on parent `onOpenSearch` which may not be wired.

Fixes:
- Recompute panel positioning to anchor under the header icon and clamp inside the viewport: switch to a fixed-position dropdown with `right: 16px; top: 96px; max-width: min(95vw, 900px); max-height: calc(100vh - 120px); overflow-y: auto`.
- Replace white card bg with champagne `#F7F2EA` + gold hairline (matches new no-white rule).
- Wire the search input to navigate directly: on Enter or "Search" click, `navigate(\`/search?q=\${encodeURIComponent(query)}\`)` using `useNavigate`, and still call `onOpenSearch?.(q)` for parents that override.
- Confirm `/search` page exists and accepts `?q=`. If it doesn't, route to existing global search (the `GlobalSearch` modal triggered by `jbj:open-global-search` event) by dispatching that event with the query as fallback.
- Verify by clicking the header search icon in browser after the fix, typing "marina", pressing Enter, confirming results render.

## 5. Wire & upgrade Investor Portal

Currently `/investor-dashboard` exists (`src/pages/InvestorDashboard.tsx`) with two sub-pages (Portfolio Views, Report Access). Keep it as the entry, but add a portal shell similar to `PortalShell.tsx` for developers:

- Create `src/pages/investor/InvestorPortalShell.tsx` mirroring `developers-portal/PortalShell.tsx` (sidebar with: Overview, My Shortlist, Portfolio, Market Reports, Saved Searches, Documents, Concierge, Settings).
- Register nested routes under `/investor-dashboard/*` in `PublicRoutes.tsx`. Reuse existing `PortfolioViews` and `ReportAccess`; add stubs for Shortlist/Saved Searches/Documents that pull from existing data hooks (`useFavorites`, `useSavedSearches`, `useUserDocuments`) so no new tables are required.
- `ModePortalBanner` investor CTA already targets `/investor-dashboard` — will land on the new shell.

## 6. Wire & upgrade Developer Portal

`/developers-portal` is the canonical shell (`PortalShell.tsx`). Audit and add the missing sales-rep + admin areas the user requested:

- Add sidebar entries: Overview, Projects, Submissions, Sales Reps (Directory / Availability / Applications), Leads, Marketing Assets, Reports, Admin (role-gated), Settings.
- Reuse existing pages from `src/pages/developers-portal/reps/*` and `access/AccessRequestQueue.tsx`. Add two new placeholder pages (`SalesRepLeadsBoard.tsx`, `DeveloperPortalAdmin.tsx`) that render existing data via current hooks — no schema changes.
- Verify role gating: admin section visible only when `useUserRole().isAdmin || isOwner`; sales-rep section visible to owners + portal devs + reps.

## 7. JBJ Academy — Training Module cropping (TrainingCard padding)

In `src/pages/broker/BrokerLearning.tsx`, the `TrainingCard` renders an absolutely-positioned bottom strip `REQUEST ACADEMY ACCESS TO UNLOCK` overlapping the topic pills above it (visible in the screenshot — pills overlap the gold band).

Fix:
- Add bottom padding to the card content (`pb-12`) when `locked && lockReason` so the topic-pill row never touches the lock strip.
- Reduce the `lockReason` strip to 28px height (`py-1.5`) and ensure it sits flush at the card bottom with a subtle gold hairline above (no overlap).
- Change topic pill area to `gap-1.5 mb-2` and wrap with `flex-wrap` allowance.
- Re-check at 1178px (current viewport) and at mobile in browser after.

## Out of scope

- Broker portal content/features remain as built; only code cleanup along the way (remove unused imports surfaced by edits).

## Verification

After implementation:
1. Browser-screenshot the home page top→middle: confirm gold divider above the pair, Get Verified directly above Mode Portal with zero gap, mode-aware copy swaps when switching mode in header.
2. Click header search icon: panel renders inside viewport, search query routes to results.
3. Switch mode → investor: portal banner CTA opens new Investor Portal shell.
4. Visit `/developers-portal`: new sidebar entries render, role-gated admin link appears only for owners.
5. `/jbj-academy`: topic pills no longer touch the gold "REQUEST ACADEMY ACCESS TO UNLOCK" strip.
