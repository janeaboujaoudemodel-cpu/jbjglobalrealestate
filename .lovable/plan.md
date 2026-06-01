# Rebuild Broker Toolkit page

The current `/broker-toolkit` has a broken hero (invisible headline on champagne bg, no video, oversized bulky CTAs), faded icon tiles on the 5 stats cards, washed-out navigation pills, and inconsistent section surfaces. I'll rebuild it cleanly using the locked design system (champagne bands, `IconTile`, CTA primitives) — keeping every section intact (No Removal policy).

## Scope

Files touched (visual/structure only, no business logic changes):

- `src/pages/BrokerToolkit.tsx` — wrap sections in `<PremiumSectionCard>` + `.jj-band` alternation; remove the dark gradient page background.
- `src/components/broker-toolkit/BrokerToolkitHero.tsx` — full rebuild.
- `src/components/broker-toolkit/BrokerToolkitStats.tsx` — fix icon tiles & layout.
- `src/components/broker-toolkit/BrokerToolkitNavigation.tsx` — convert pills to locked `.jj-pill-active` primitive.
- Light pass on section wrappers (`Tools / Education / Academy / Operations / CRM / Support / Growth / Referral / CTA`) only to remove dark fills and align padding — no content/feature removal.

## Hero rebuild

- Full-bleed `.jj-band jj-band--page` with a real background video (reuse the home-hero video asset already used by `<HomeHeroSearch />` / hero section) layered behind a soft champagne→ink scrim so the headline is legible.
- `data-hero-dark` attribute so white-text rule applies inside the hero only.
- Headline: "Your Complete Broker Success System" (kept), `text-4xl md:text-6xl`, white, tight tracking; subhead one line, `text-white/80`.
- Two CTAs using locked primitives — compact (`h-11`, `px-5`, `text-sm font-medium`):
  - Primary: `.jj-cta-dark` → "Open My Dashboard" → `/broker/portal`
  - Secondary: `.jj-cta-outline` (on dark) → "See What's Included" → scrolls to `#toolkit-overview`
- Height capped at `min-h-[520px] md:min-h-[600px]` (not full-screen).

## Stats row rebuild

- 5 cards inside `<PremiumSectionCard>` on champagne (`#F7F2EA`), grid `md:grid-cols-5` with `gap-4`.
- Each card: `<IconTile tone="gold" size="md" icon={…} />` (Wrench, GraduationCap, BookOpen, Users, TrendingUp) — kills the faded black squares.
- Number `text-3xl font-semibold text-[#1A1A1A]`, label `text-sm text-[#1A1A1A]/70`, sub `text-xs text-[#1A1A1A]/60`. No raw gray.

## Navigation pills

- Replace current bulky pill styles with `.jj-pill-active` (active) and `.jj-cta-outline` (idle) — `h-9 px-4 text-sm`, sticky top under header (`top-[88px]`), champagne raised band.

## Section surfaces

- Every section wrapped in `<PremiumSectionCard>` with full-bleed `.jj-band` alternation: `page → surface → page → raised …`.
- Remove any `bg-[#1A1A1A]` / dark gradient backgrounds inside sections (they're being remapped anyway on marketing pages).
- Add `data-marketing-page` on the page root so the global band system applies.
- No content removed — only chrome cleaned up.

## Out of scope

- No route, sitemap, SEO, or business-logic changes.
- No new tools, sections, or copy beyond the hero headline tweak.
- AI features inside Tools section keep their purple theme (AI premium purple standard).

## Verification

After build, I'll navigate the preview to `/broker-toolkit`, screenshot hero + stats + one section, and confirm: video plays, headline legible white-on-dark, CTAs compact, stat icons are gold tiles (not faded squares), pills crisp, no gray surfaces.
