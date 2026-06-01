## Plan: permanent contrast cleanup with visual proof

### What I will fix
1. **Remove the winning CSS conflicts**
   - Consolidate the scattered legacy contrast rules in `src/index.css` that currently compete with each other.
   - Stop broad selectors from repainting text based only on ancestor classes when the element belongs to an explicit CTA, modal, hero, or nested surface.
   - Fix the current escape problem where `allow-white` / `data-no-contrast-guard` can prevent the dark-surface lock from correcting ink text on dark heroes.

2. **Create one final contrast contract**
   - Light/champagne/gold surfaces: text and icons must resolve to ink `#1A1A1A` unless inside an approved dark CTA.
   - Navy/ink/dark/photo surfaces: text and icons must resolve to white/champagne unless inside an explicit light nested surface.
   - CTAs use the locked primitives only: `.jj-cta-dark`, `.jj-cta-champagne`, `.jj-cta-outline`, `.jj-pill-active`.
   - Gold remains hairline/accent only, never filled backgrounds.

3. **Clean source-level high-risk components**
   - Replace direct high-risk classes like `text-white` on `bg-[#FDFBF7]`, champagne dialogs, and light modal inputs.
   - Replace black/ink icon/text classes on dark/navy filled boxes.
   - Start with the files already identified as risky: `CompanyProfile`, `CommunitySearchModal`, `BrokerCircleSection`, `GlobalHeader`, `Contact`, `Founder`, `PressKit`, `AIHub`, `Properties`, and shared modal/header/support components.

4. **Upgrade the rendered contrast audit**
   - Extend route coverage beyond `/, /founder` to include:
     - `/company-profile`
     - `/about`
     - `/contact`
     - `/founder`
     - `/press-kit`
     - `/join`
     - `/properties`
     - `/developers`
     - `/areas`
     - `/legal/terms`
     - `/legal/privacy`
   - Make the audit report the actual winning computed color, text-fill color, nearest surface owner, nearest background owner, matching class list, and screenshot coordinates.
   - Add explicit checks for:
     - white text/icons on champagne/light/gold backgrounds
     - ink/black text/icons on navy/dark/photo backgrounds
     - gradient/text-fill cases that look readable in CSS but fail visually

5. **Visual validation before saying fixed**
   - I will capture screenshots after the fix, not just read code.
   - Required screenshot proof:
     - `/company-profile` hero and next content section
     - full-page `/company-profile`
     - `/about`
     - `/contact`
     - `/founder`
     - `/press-kit`
     - `/join`
     - `/properties`
     - `/developers`
     - `/areas`
   - I will only call the work fixed if the screenshots visually confirm:
     - no white text on champagne/gold/light sections
     - no black/ink text or icons on navy/dark/photo sections
     - no title disappearing because of text-fill, opacity, or gradient clipping

### Acceptance rule
The job is not complete until I provide visual screenshot proof and list exactly which pages were checked.