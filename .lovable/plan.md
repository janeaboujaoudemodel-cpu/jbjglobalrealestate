

## Audit & Fix Plan: Join Pages, Investor Dashboard, CTA Sections, Portfolio Borders, Draft Bars

### Issues Identified

**1. Join Investor/Broker/Developer Pages — UI Upgrade**
- All three pages (`JoinInvestorList.tsx`, `JoinBrokerList.tsx`, `JoinDeveloperList.tsx`) have inline draft bars instead of the reusable `FormDraftBar` component. They should use the shared component for consistency.
- UI is functional but needs premium polish: larger hero section with trust indicators, testimonial/stat strip, more visual depth on form cards, and sharper sectioning.
- All three pages already have draft save/reset/new — but they're hand-coded instead of using `FormDraftBar`.

**2. Investor Dashboard — Cropped Emails & Need Assistance Section**
- Profile dropdown button truncates email at `max-w-[160px]` (line 345) — needs wider truncation or tooltip.
- "Need Assistance?" section (line 799-826) uses a dark strip with gold borders but has cramped layout and lacks edge-to-edge styling. Needs upgrade: sharper borders, better spacing, edge-to-edge with `rounded-none`.

**3. Portfolio View Cards — Border Upgrade**
- `PortfolioOverview.tsx` uses `border border-gold/40` — needs upgrade to `border-2 border-stone-200 shadow-sm` style (cleaner, premium, no gold border).
- Investor Dashboard portfolio cards (lines 596-627) use `border-2 border-gold/30` — same fix needed.

**4. CTA "Ready to Get Started" Sections — Sharp Edge-to-Edge**
- `CombinedContactNewsletter.tsx` (line 59) uses `rounded-none` already but the inner container has margins (`mx-1 sm:mx-2`) creating visual gaps. Need to make it truly edge-to-edge with zero margins and `rounded-none` on all inner elements including contact cards.
- The contact cards use `rounded-xl` (line 86) — must change to `rounded-none` per user mandate.

**5. Submission Forms Missing Draft Bar**
- `ListingPortalSubmit.tsx` (1393 lines) does NOT use `FormDraftBar` — needs integration.

---

### Changes

**File 1: `src/pages/JoinInvestorList.tsx`** — Premium UI upgrade
- Replace inline draft bar with `<FormDraftBar theme="gold" />` component
- Add stats strip (e.g., "500+ Active Investors", "AED 5B+ Portfolio Value")
- Upgrade form card: remove `border-2 border-gold/30`, use `bg-white shadow-lg border border-stone-200`
- Upgrade hero with larger trust badge and refined gradient

**File 2: `src/pages/JoinBrokerList.tsx`** — Premium UI upgrade
- Replace inline draft bar with `<FormDraftBar theme="blue" />`
- Same card upgrade: `bg-white shadow-lg border border-stone-200`
- Add broker-specific stat strip

**File 3: `src/pages/JoinDeveloperList.tsx`** — Premium UI upgrade
- Replace inline draft bar with `<FormDraftBar theme="purple" />`
- Same card and stat strip treatment

**File 4: `src/pages/InvestorDashboard.tsx`** — Fix cropped emails, upgrade sections
- Widen profile name truncation from `max-w-[160px]` to `max-w-[220px]`
- Upgrade "Need Assistance?" section: edge-to-edge, `rounded-none`, larger padding, better CTA layout
- Upgrade Portfolio Views cards: replace `border-2 border-gold/30` with `border border-stone-200 shadow-sm bg-white`
- Upgrade all KPI/stat cards similarly: cleaner borders, white bg, subtle shadow

**File 5: `src/components/investor/portfolio/PortfolioOverview.tsx`** — Border upgrade
- Replace `border border-gold/40 shadow-[0_2px_12px_...]` with `border border-stone-200 shadow-sm bg-white`

**File 6: `src/components/CombinedContactNewsletter.tsx`** — Edge-to-edge sharp corners
- Remove side margins (`mx-1 sm:mx-2 md:mx-3 lg:mx-4`)
- Change inner container `rounded-none` (already set, but also ensure contact cards use `rounded-none`)
- Contact cards: `rounded-xl` → `rounded-none`

**File 7: `src/pages/ListingPortalSubmit.tsx`** — Add `FormDraftBar`
- Import and add `<FormDraftBar>` at top of form with save/reset/new actions

