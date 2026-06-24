
# Global Layout Unification

Goal: every page (home, project, developer, broker, owner, investor, dashboards, landings) reads as one consistent shell — same left edge, same right edge, same rhythm — at every breakpoint. Full-bleed straps stretch edge-to-edge inside the main content area, and "card" sections (Ready to Get Started, Top Areas, etc.) sit on the same inner content track.

## 1. Single source of truth — layout tokens + primitives

Extend `src/index.css` `:root` with the canonical layout contract (replaces ad-hoc `max-w-7xl mx-auto px-4` everywhere):

```text
--shell-px-mobile: 16px
--shell-px-tablet: 24px       (≥768px)
--shell-px-desktop: 32px      (≥1024px)
--shell-px-xl: 40px           (≥1440px)
--shell-max-w: 1760px         (matches PremiumSectionCard "full")
--shell-rail-safe: 56px       (right-side Contact rail clearance, lg+)
--section-gap-y: clamp(40px, 5vw, 72px)
--hero-min-h: clamp(420px, 70vh, 760px)
```

Build (or harden) **five primitives** that every page must use — no other container patterns allowed:

| Primitive | File | Role |
|---|---|---|
| `<PageShell>` | `src/components/layout/PageShell.tsx` (new) | Page root. Vertical stack, sets `--section-gap-y`, applies rail-safe right padding on lg+, no horizontal padding itself. |
| `<SectionStrap>` | `src/components/layout/SectionStrap.tsx` (new) | Full-bleed band. Spans the entire main-content width (edge-to-edge between sidebar and viewport edge). Inner child auto-wrapped in `<ContentTrack>`. Used for hero, Get Verified, Developers strap, Recently Viewed, Handpicked, Top Areas, Ready to Get Started, emerald campaign banners. |
| `<ContentTrack>` | `src/components/layout/ContentTrack.tsx` (new) | The inner content rail. `max-w: var(--shell-max-w)`, centered, horizontal padding from shell tokens, rail-safe on lg+. Every card/grid lives inside one of these so they all share an identical left/right edge. |
| `<HeroFrame>` | `src/components/layout/HeroFrame.tsx` (new) | Hero wrapper. Full-bleed background layer (image/video) + `<ContentTrack>` for copy. Guarantees `min-h: var(--hero-min-h)`, no random side gaps, no unfinished corners. |
| `<CardGrid>` | `src/components/layout/CardGrid.tsx` (new) | Responsive grid (`1 / 2 / 3 / 4` cols) with consistent gap tokens. |

Retire/alias the legacy helpers (`.jj-page`, `.jj-band`, `.jj-fullbleed-band`, `PremiumSectionCard width="full"`) to delegate to these primitives so older call sites pick up the new contract automatically — no behavioural change for sections already on the new track.

## 2. Edge-to-edge rule

`<SectionStrap>` is the ONLY way to render a full-bleed band. It:

- spans the main column (sidebar to viewport right edge, minus rail-safe on lg+),
- never has horizontal margin,
- alternates tone via `tone="page" | "surface" | "raised" | "emerald" | "ink"`,
- wraps children in `<ContentTrack>` so the inner copy/cards line up with every other section's content edge.

Every section listed by the user — Hero, Developers strap, Project hero, Recently Viewed / Continue Searching, Get Verified, Invest in Dubai, Explore Guides & Reports, Handpicked For You, Featured Properties, Top Areas in Dubai, Ready to Get Started, animated/emerald banners — is converted to `<SectionStrap><...>...</SectionStrap>`. Their inner content all sits on the same `<ContentTrack>` rail → identical left/right edges.

## 3. Hero fix

`<HeroFrame>` standardises every hero:

- background layer = absolute, inset-0, full bleed (no gaps, no rounded corners cutting the image),
- overlay = dark gradient token,
- content = `<ContentTrack>` so headline/CTA align with the rest of the page,
- `min-height: var(--hero-min-h)` so heroes never look short or floaty,
- responsive: same behaviour on mobile/tablet/desktop/xl.

Applies to Home hero, Project hero, Developer hero, Broker/Owner/Investor portal landings, AI Home Finder hero, etc.

## 4. Migration sweep

Run an automated sweep + targeted manual replacement:

1. `rg` for legacy width/margin patterns to inventory call sites:
   - `max-w-7xl`, `max-w-6xl`, `max-w-[1280px]`, `max-w-[1440px]`, `max-w-[1600px]`, `max-w-[1760px]`
   - `container mx-auto`
   - `px-4 md:px-6 lg:px-8`, `px-4 sm:px-6 lg:px-8`
   - hand-rolled `w-screen`, `-mx-*`, `ml-[200px]`, `left-[200px]`
2. Replace with `<PageShell>` / `<SectionStrap>` / `<ContentTrack>` / `<HeroFrame>` / `<CardGrid>`.
3. Delete local section width overrides; if a page truly needs a narrower rail, it passes `<ContentTrack width="narrow">` (820px) or `width="wide"` (1440px) — no inline pixel values.
4. Update `PremiumSectionCard` to render as `<SectionStrap><ContentTrack>` under the hood so existing usages auto-conform.
5. Update `GlobalFilterBar` and the project-detail sticky sub-nav to use the same shell tokens (already partly done — finish by removing breakpoint-specific `left-[…]` offsets and using `var(--sidebar-w)` from the existing sidebar context).

## 5. Pages touched (non-exhaustive)

- `src/pages/Index.tsx` (Home) and every homepage strap component
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/pages/Developers*.tsx` and `src/routes/DevelopersPortalRoutes.tsx` landings
- Broker portal landings under `src/routes/BrokerPortalRoutes.tsx`
- Owner dashboards under `src/pages/owner/*`
- Investor portal pages under `src/pages/investor/*`
- All AI tool landings under `src/routes/AIToolRoutes.tsx` / `ToolkitRoutes.tsx`
- Marketing/guide/news/FAQ neon pages (kept neon, layout primitive still applies)

## 6. Responsive validation

Playwright run that visits ~14 representative pages at 4 viewports each (375, 834, 1280, 1760) and:

1. Measures the left and right edge of every `<SectionStrap>` and every `<ContentTrack>` on the page. Asserts they match within 1px across all sections on that page.
2. Asserts no hero has horizontal gaps (background layer bounding box == strap bounding box).
3. Captures full-page screenshots saved to `/tmp/browser/layout-audit/<page>-<viewport>.png`.
4. Prints a per-page pass/fail table.

Pages in the audit: `/`, `/properties`, `/project/<slug>`, `/developers`, `/developers/<slug>`, `/broker-dashboard`, `/owner-dashboard`, `/investor/portfolio-views`, `/ai-home-finder`, `/market-intelligence`, `/services`, `/about`, `/guides/legal`, `/areas`.

## 7. Done criteria

- One primitive set, used everywhere.
- Every strap section listed by the user is full-bleed and shares the exact same inner content rail.
- Every hero fully fills its frame at every breakpoint.
- Playwright audit passes on all 14 pages × 4 viewports with edge-alignment within 1px.
- Screenshots attached in the final reply as visual proof.
