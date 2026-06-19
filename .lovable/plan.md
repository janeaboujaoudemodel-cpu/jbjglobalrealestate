# Plan: Navy → Black + Off-Palette Sweep + SEO/Sitemap Cleanup

## Scope confirmed
- **Navy → Black**: full reversal site-wide (all surfaces).
- **Color sweep**: public marketing pages only (Home, AI Hub + tools, Services, Properties browse, Communities, News, Market Intel public, Guides, FAQ, Contact, public Developer/Project/Area profile pages). Owner dashboard, CRM, broker portal, developer portal, admin internals are untouched.
- **Database**: no changes (palette is CSS only).

## Locked palette after this pass
| Token | Hex | Use |
|---|---|---|
| Page | `#FDFBF7` | Page background |
| Surface (champagne) | `#F7F2EA` | Section band |
| Raised (cream) | `#EFE6D6` | Cards, active pills |
| Gold | `#B89555` | 1px hairline ONLY |
| Ink | `#1A1A1A` | Body text |
| **Black (new dark CTA)** | **`#0A0A0A`** | All dark buttons, banners, dark bands — replaces navy |
| Black hover | `#1F1F1F` | Hover state |
| Price orange | unchanged | `<PricePill />` only |
| AI purple | unchanged for AI-internal owner tools | already retired on public AI Hub |

## Pass 1 — Navy → Black global flip
Retire the locked "Black-CTA → Navy global" rule and replace with the inverse.

- Edit `src/index.css`:
  - Remove the existing `bg-[#102540]` / `bg-[#1a3d63]` auto-paint rules.
  - Add new guard: any `bg-[#102540]`, `bg-[#1a3d63]`, `bg-[#0f1e35]`, `bg-navy*`, `bg-blue-9*` on a `[data-marketing-page]` root → `background-color: #0A0A0A !important`; hover → `#1F1F1F`; keep white text + white icons + 1px gold hairline ring.
- Edit CTA primitives in `src/index.css` (`.jj-cta-dark`, `.jj-pill-active`, locked navy classes): swap navy hex for `#0A0A0A` (rest) / `#1F1F1F` (hover). Keep gold hairline + white foreground.
- Search-replace in public components (Header, Footer, Hero CTA bars, AI Hub bottom CTA band, Get Verified banner, support launcher tag, mode chips) every literal `#102540`, `#1a3d63`, `#0f1e35`, `bg-navy-*`, `bg-blue-900/950` → `#0A0A0A` / `#1F1F1F`.
- Footer: confirmed dark already — repaint navy accents to `#0A0A0A`, keep single champagne hairline.

## Pass 2 — Off-palette sweep on public marketing pages
Targets only routes flagged "public marketing". For each file, replace:
- Purple/violet/indigo/fuchsia (`bg-purple-*`, `from-violet-*`, `text-indigo-*`, raw `#7c3aed/#8b5cf6/#a78bfa/#6366f1/#d946ef`) → champagne `#F7F2EA` surfaces, ink `#1A1A1A` text, gold `#B89555` hairline.
- Cyan/teal/sky decorative gradients → champagne band.
- Zinc/slate/gray surface tints → champagne or page.
- Raw `bg-black` / `bg-[#000]` CTAs → `#0A0A0A` via new primitive.
- Neon glow shadows → soft gold hairline ring.

Files in scope (initial sweep list, expanded after exploration):
`src/pages/Index.tsx`, `src/pages/AIHub.tsx` (final pass), all `src/pages/AI*.tsx` public tool pages, `src/pages/Services.tsx`, `src/pages/Properties.tsx`, `src/pages/Communities.tsx`, `src/pages/News.tsx`, `src/pages/MarketIntelligence*.tsx`, `src/pages/AreaGuides.tsx`, `src/pages/Guides/*`, `src/pages/FAQ*`, `src/pages/Contact.tsx`, `src/pages/Developer.tsx`, `src/pages/Project.tsx`, `src/pages/Area.tsx`, plus shared marketing components under `src/components/home/*`, `src/components/marketing/*`, `src/components/ai-tools/AIToolPremiumLayout.tsx`.

Owner/CRM/broker/developer-portal/admin files are explicitly skipped — no edits.

## Pass 3 — CI + memory rewrites
- Extend `scripts/contrast/check-no-purple.mjs` to also fail on raw `#102540` / `#1a3d63` / `bg-navy-*` outside opt-out files.
- Update memories:
  - `mem://ui-ux/visual-standards/black-cta-to-navy-global` → **RETIRED — superseded by Navy→Black**.
  - `mem://constraints/navy-pill-white-text-lock` → **RETIRED**.
  - New: `mem://ui-ux/visual-standards/navy-to-black-global` describing the inverse guard, `#0A0A0A`/`#1F1F1F`, white text + gold hairline, opt-outs (`data-allow-navy`, `data-no-contrast-guard`).
  - Update `mem://index.md` Core lines that reference navy `#102540` to point at `#0A0A0A`.

## Pass 4 — SEO + sitemap cleanup
- `public/sitemap.xml`: regenerate from current public routes in `src/routes/PublicRoutes.tsx`. Remove any lingering `/services/ai-tools`, duplicate `/ai-hub` variants, dead AI tool sub-routes. Single canonical `/ai-hub`.
- `src/seo/serviceSeoCatalog.ts`: drop any service entries that point at removed AI tool URLs.
- `src/components/SEOHead.tsx` / `CanonicalAndHreflang.tsx`: verify canonical helper points self-route; no edits unless drift found.
- `public/robots.txt`: confirm `Sitemap:` directive matches `https://jbjglobalrealestate.lovable.app/sitemap.xml`.
- Run `seo_chat--list_findings`, fix anything flagged, then `seo_chat--trigger_scan` (needs your approval).

## Pass 5 — Visual validation
Take screenshots at desktop (1440) and mobile (390) for:
`/`, `/ai-hub`, `/services`, `/properties`, `/communities`, `/news`, `/market-intelligence`, `/guides`, `/faq`, `/contact`, plus one sample `/developer/:slug` and `/project/:slug`.

Confirm: no purple/violet/indigo/cyan visible, no navy visible, all dark CTAs are clean black `#0A0A0A` with white text + gold hairline, header/footer match.

## Out of scope
- Owner dashboard, CRM, broker/developer portals, admin pages.
- Data-viz semantic colors (Emerald/Red/Blue/Amber) — untouched even on public marketing.
- Any content, copy, layout, business logic, backend, or database changes.
- AI purple is already retired on public AI Hub; owner-only AI tools keep purple.
