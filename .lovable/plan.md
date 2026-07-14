
## Goal

Every page under Insights, Guides, Services, Company, Legal, and Help & Support renders with the exact same structure as `/market-intelligence`:

1. Full-screen deep emerald Prada hero (title + subtitle + CTAs)
2. MI-style right-side navigator ("In This Section") that hides while inside the hero
3. Champagne body sections at `max-w-4xl`, consistent padding/rhythm
4. Single-card style — champagne surface + 1px gold hairline border. No nested double-cards, no beige-inside-beige.
5. Pre-footer "Ready to…" CTA (`PreFooterSeparator`) before the global footer
6. Hero CTAs locked to the sidebar obsidian-emerald gradient

The canonical implementation is `src/components/shell/MIPageShell.tsx`. Every migrated page will render through it — no per-page hero components, no per-page card variants.

## Execution — one group per turn, screenshot proof per route

I ship in six groups. For each group I:

1. Migrate every route in the group to `MIPageShell` (or wrap it, when the page has heavy custom body content).
2. Delete legacy hero components and nested card wrappers inside that group.
3. Run Playwright with the authenticated session, capture hero + body screenshot for every route in the group at 1280×1800.
4. Post the screenshots inline before moving to the next group.
5. Stop and wait for your ✅ before starting the next group.

### Groups

**Group A — Insights (Market Intelligence family)** — DONE last turn (9 routes: MI, Overview, Areas, Area Detail, Reports, Monthly, Quarterly, Annual, Methodology). I'll re-shoot with the auth session and re-post proof.

**Group B — Insights (News + Guides articles)** — News list, News detail, all Guides landing + article routes (`buyer-guide`, `investor-guide`, `off-plan-guide`, `future-of-real-estate-2026`, etc.).

**Group C — Services + Products** — every route under Services and Products in the sidebar.

**Group D — Company** — About, Careers, Contact, Team, Press, Partners, Media, etc.

**Group E — Legal** — Terms, Privacy, Cookies, Disclaimers, DIFC, RERA, all legal pages.

**Group F — Help & Support** — FAQ, Help Center, Contact Support, all help routes.

## Card style — locked default

Single champagne card everywhere:

- Surface: `#FDFBF7`
- Border: `1px solid #B89555 / 60%`
- No nested cards. No inner beige panels. No gradient wrappers around cards.

Applied via a single utility class in `src/index.css` (`.jj-mi-card`) so every page picks it up automatically.

## What I will NOT touch

- Backend, data, RLS, auth — none of it
- Business logic inside these pages (charts, calculators, forms keep working)
- `/access` gate portal
- Owner / broker / developer portals
- Any route not in the six groups above

## Technical details

- Canonical shell: `src/components/shell/MIPageShell.tsx` (already exists, verified against `/market-intelligence`).
- Delete/short-circuit these legacy heroes so nothing else can render a different hero: `GuideHero`, `FAQHero`, `PremiumEmeraldHero` custom overrides — all re-export `MIPageShell`'s hero.
- Card style enforced via `src/index.css` `.jj-mi-card` class and a `[data-mi-page] .card` fallback selector so accidental legacy cards still conform.
- Navigator: reuse `MarketIntelligenceTableOfContents` unchanged. Each migrated page supplies its own `tocItems` list (section id + title + icon).
- Hero CTA: `.jj-mi-hero-cta-emerald` class already locked to the obsidian-emerald gradient; every migrated page uses it.
- Validation: Playwright script under `/tmp/browser/group-{X}/` with Supabase session injection (auth is currently `injected`), viewport 1280×1800, one hero shot + one body shot per route. Screenshots posted inline before I mark the group done.

## Order of operations for this turn

Confirm this plan → I re-shoot Group A with the auth session and post proof → wait for your ✅ → start Group B.
