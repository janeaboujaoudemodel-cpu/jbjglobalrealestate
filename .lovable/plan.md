## 1. Guides page — remove the homepage-style book strip

In `src/pages/Guides.tsx`:
- Delete the `BookMarquee` component and its usage inside the Explore Guides section. The auto-scrolling strip was a homepage promo for this page — it doesn't belong here.
- Keep the book **grid** (and the Company Profile row) exactly as it is. No removal of guides.
- Tighten the `Explore Guides` header copy (champagne ink on champagne) so it reads cleanly without the strip above it.

## 2. Guides hero — fix contrast + shrink height (page-level)

Same file, hero section (lines ~126–172):
- **Eyebrow chip**: `text-[#1A1A1A]` on a dark video overlay is invisible. Switch the chip text + icon to champagne `#F7F2EA` on an ink/60 backdrop with a gold hairline ring; mark it `data-no-contrast-guard` + `allow-white` so the global guards don't flip it back to ink.
- **H1**: keep white, add a real text-shadow for readability over the moving video.
- **Description**: bump from `text-white/70` to `text-[#F7F2EA]/95` with text-shadow.
- **CTAs**: replace the two `PremiumHeroButton`s with the standard high-contrast hero button pair (primary = champagne fill + ink label + gold ring; secondary = transparent + champagne label + gold ring). Both `data-no-contrast-guard` so the runtime guard leaves them alone on dark video.
- **Scroll cue** ("Explore"): swap `text-[#1A1A1A]/70` → `text-[#F7F2EA]/80`.

## 3. Global hero standard — every hero EXCEPT the homepage

Add a new opt-out class `jj-hero-compact` and apply it to every `.jj-hero-fullscreen` **except** `src/pages/Index.tsx`. In `src/index.css`:

- New rule scoped to `.jj-hero-fullscreen.jj-hero-compact` overriding the height:
  - mobile: `min-height: 70vh; height: auto;`
  - ≥640px: `min-height: 72vh;`
  - ≥1024px: `min-height: 78vh; max-height: 820px;`
- Keep the existing 100dvh rule for the homepage hero only (no `.jj-hero-compact`).
- Strengthen the existing hero contrast override block so it covers `.jj-hero-fullscreen` chips, eyebrows and CTA labels (not just `.text-white/*`): add rules forcing `text-[#1A1A1A]` inside hero overlays to champagne `#F7F2EA` with text-shadow, so any page that still ships ink-on-dark stays readable until each page is migrated. Homepage `.jj-hero-fullscreen` (no `.jj-hero-compact`) keeps its current behaviour.

Pages to receive the `jj-hero-compact` class on the hero `<section>` (all of these already use `.jj-hero-fullscreen`):

- `src/pages/Guides.tsx`
- `src/pages/About.tsx`, `MeetTheTeam.tsx`, `Philanthropy.tsx`
- `src/pages/Services.tsx` + every page under `src/pages/services/*`
- `src/pages/Developers.tsx`, `CompanyProfile.tsx`, `MarketIntelligence.tsx`, `MarketReport.tsx`, `Sitemap.tsx`
- `src/pages/BrokerEducation.tsx`, `BrokerResources.tsx`
- `src/pages/investor/ReportAccess.tsx`, `investor/PortfolioViews.tsx`
- `src/pages/market-intelligence/AreaDetail.tsx`
- Shared hero wrappers: `src/components/PropertiesHeroVideo.tsx`, `src/components/market-intelligence/MarketIntelligenceHero.tsx`, `src/components/faq/FAQHero.tsx`, `src/components/guides/GuideHero.tsx`

`src/pages/Index.tsx` and `src/components/MainLayout.tsx` (homepage usage) are **not** touched.

## 4. SEO

Only finding open today is:

- **Google Search Console isn't fully set up** — requires user action: connect the `google_search_console` connector, verify ownership of `https://jbjglobalrealestate.lovable.app/`, and submit the sitemap. I'll surface this in chat after the build. Nothing in code to change for it.

A fresh SEO scan will run once the visible changes ship.

## Out of scope (per your instruction)

- Homepage hero in `Index.tsx` — untouched.
- Any guide content, route, or book removed — strictly visual + height + the book-strip removal you asked for.

## Technical notes

- New CSS class lives next to the existing `.jj-hero-fullscreen` block in `src/index.css`.
- Hero CTA contrast pattern reuses the existing champagne/gold tokens; no new design tokens.
- `data-no-contrast-guard` + `.allow-white` are the documented escape hatches for the runtime contrast guard on dark surfaces — already standard in the project.
- The `jj-hero-compact` opt-in keeps the homepage's full-bleed 100dvh hero intact while every other hero collapses to a calmer 70–78vh frame.
