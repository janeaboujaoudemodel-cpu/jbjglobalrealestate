# Global Fix Pass — Project Page, Emerald System, Layout, Mortgage Slider

## 1. Project detail page (`/project/:slug`) — Velora screenshot
- **Cover photo missing**: investigate `ProjectHero` image resolver — likely falling back to gradient when `cover_image_url` is null but `gallery[0]` exists. Use first available of `cover_image_url → card_image_url → gallery[0]`, with `getHighResImageUrl`.
- **CTA borders gold instead of white**: Hero sits on dark emerald, so "Download Brochure" / "Register Interest" / "Download branded presentation" must be emerald-filled with **white text + white icon + white 1px border** (matches header pills). Remove gold hairline override on `[data-hero-dark]` scope.
- **Register Interest** still painted with old palette → repaint to same emerald token.
- **Download Brochure** click is dead → wire `onClick` to existing `brochureFlow` handler (currently the button is rendered without handler after recent refactor).
- **Download branded presentation** dead → wire to `generateBrandedPresentation()` (already exists in `presentationEngine.ts`); add loading + toast.
- **Below-hero layout broken**: stats cards have no horizontal page padding and run edge-to-edge incorrectly. Apply the standard page shell:
  - Full-bleed champagne band (`.jj-band surface`) edge-to-edge.
  - Inner container `max-w-[1240px] mx-auto px-6 lg:px-10`.
  - Card size reduced ~12% to match Emaar-card scale used on `/projects` after homepage refresh.

## 2. Card sizing & spacing consistency (all pages EXCEPT `/`)
- Audit listing/area/developer cards across: `/projects`, `/areas`, `/developers`, `/project/:slug` related sections, `/compare`, search results, favorites, browsing history grids.
- Standardize to the homepage-matched scale: card width tokens, image aspect 4:3, title 16/22, meta 13/18.
- Standardize section rhythm: `py-16 lg:py-20` between sections; inner container `max-w-[1240px] px-6 lg:px-10`.
- Marketing bands stay full-bleed champagne via `.jj-band` (Core rule).
- Homepage untouched.

## 3. Global Emerald Surface Rule (front + back facing UI)
New universal rule: **anywhere we use the emerald fill (chip/button/box/badge/header pill), the icon AND text MUST be solid white at idle + hover + focus + active** — never gold, never ink.
- Update `.jj-emerald-chip`, `.jj-emerald-pill`, `[data-emerald]`, emerald `<Button variant="emerald">`, and all ad-hoc `bg-emerald-*` usages.
- Add CSS PASS-9 guard in `index.css`: any element whose computed bg matches emerald token forces `color:#fff` + descendant `svg{stroke/fill:#fff}`; opt-out via `data-no-contrast-guard`.
- Audit + repaint forms, Company Profile, document templates, lead capture, CRM badges, dashboard tiles, toolkit cards — wherever icons currently render in gold on an emerald surface, switch to white.
- Save as new memory: `mem://ui-ux/visual-standards/emerald-surface-white-foreground-rule` and add to Core.

## 4. Mortgage Calculator — "Compare Two Bank Rates" slider
- Re-debug the scroller properly this time:
  - Match the EXACT track/thumb dimensions used by Loan Term / Down Payment / Interest Rate / Property Price sliders (single source of truth in `index.css` `.jj-slider`).
  - Remove the bespoke override in `MortgageParityPanel.tsx` that resized it.
  - Verify thumb is vertically centered AND drag actually mutates Bank B rate state.
- Validate via browser tool: navigate `/mortgage-calculator`, drag Bank B slider, screenshot before/after, confirm rate number updates.

## 5. Verification (mandatory before reply)
- Browser tool: `/project/velora` — screenshot hero (photo present, white CTAs, all 3 buttons fire), screenshot below-hero (padding + card size).
- Browser tool: `/projects` — screenshot grid (card sizing parity with Emaar reference).
- Browser tool: `/mortgage-calculator` — screenshot slider centered, drag interaction working.
- Attach all screenshots in the reply.

## Technical notes
- Files likely touched: `src/pages/ProjectDetail.tsx`, `src/components/project/ProjectHero.tsx`, `src/components/project/ProjectStats.tsx`, `src/components/mortgage/MortgageParityPanel.tsx`, `src/index.css` (PASS-9 emerald rule, slider unification), `src/components/ui/button.tsx` (emerald variant), card primitives under `src/components/ui/` and `src/components/listings/`, mem://index.md.
- No DB / edge-function changes required.
- Strict no-removal: every existing feature preserved.
