Root cause identified:

- On `/company-profile`, the section wrapper `SectionShell` paints every post-hero section as champagne via `.jj-layer-2`.
- The section titles inside that champagne band still carry direct Tailwind utilities like `text-white`, `text-white/70`, `text-white/80`, and `text-white/90` in `src/pages/CompanyProfile.tsx`.
- A parent rule like `.jj-layer-2 { color: #1A1A1A }` cannot override a child’s direct `.text-white` class. That is why the previous fix did not repair the titles.
- The still-winning selectors/components are:
  - Component source: `src/pages/CompanyProfile.tsx`, repeated section headings/subcopy using `text-white*` inside `<SectionShell>`.
  - Global CSS source: Tailwind `.text-white` / `.text-white\/70` utilities still win on the element itself unless a later, more specific light-surface contract targets `.jj-layer-2` descendants.
  - Current global guard at `src/index.css` only covers `.jj-card-inner` and `.jj-box-active`, not `.jj-layer-2`; therefore headings outside cards remain white on champagne.

Repair plan:

1. Fix the global light-surface contrast contract
   - Extend the final contrast lock in `src/index.css` so `.jj-layer-2`, `.jj-card-inner`, `.jj-box-active`, `.jj-icon-box-active`, `.surface-champagne`, `.surface-cream`, `.surface-raised`, `.surface-gold`, `.bg-surface`, `.bg-raised`, and `[data-surface="champagne|cream|raised|gold|light|page|pearl"]` force direct descendants using `.text-white` or `text-white/*` to ink.
   - Include headings, paragraphs, spans, labels, list items, links, and SVG/lucide icons.
   - Keep exclusions for real dark CTA primitives (`.jj-cta-dark`, `.jj-navy-cta`, `[data-allow-dark-cta]`, `[data-icon-tile][data-surface="navy|ink"]`, `[data-hero-dark]`, `.jj-hero-fullscreen`) so white remains valid only on dark/photo/navy surfaces.

2. Fix the source component so the architecture is clean, not only patched by CSS
   - Update `SectionShell` in `src/pages/CompanyProfile.tsx` to mark the inner champagne band explicitly as a light surface: `data-surface="champagne"` / `surface-champagne`.
   - Replace all non-hero `text-white*` in `/company-profile` section titles/subcopy/card rows with ink semantic classes.
   - Keep white/bright text only in the actual dark hero image overlay and dark photo cards.

3. Repair known dark-surface conflicts still visible elsewhere
   - In `src/components/ui/phone-input.tsx`, remove the hover rule that turns dark phone triggers to ink (`hover:text-[#1A1A1A]`) on a black/navy background.
   - Ensure the phone trigger and `.jbj-form-trigger-filled` descendants stay white on navy at rest, hover, focus.
   - Preserve `IconTile` navy/ink behavior as white icons on navy/ink.

4. Add a technical rendered contrast audit script
   - Add/update a script under `scripts/contrast/` that uses Playwright to visit key public routes and detect:
     - white/near-white text or icons on champagne/light/gold surfaces;
     - ink/black text or icons on navy/dark surfaces;
     - failing selector/class/component context.
   - Target routes first: `/company-profile`, `/about`, `/contact`, `/founder`, `/join`, `/press-kit`, `/ai-hub`.

5. Validate before claiming completion
   - Run the contrast scripts and inspect the exact output.
   - Navigate as a user through the affected pages and capture screenshots at the relevant sections.
   - For `/company-profile`, explicitly verify the title rows: Table of Contents, Company Overview, Platform Positioning, Brand Story, Core Values, Services, AI Tools, Marketplace, Dubai Destination, Prime Areas, Platform Benefits, Portfolio Highlights, Investor Journey, Partner Network, Our Process, Why JBJ, Client Experience, Founder & CEO, Company Snapshot, Ready to Connect, and Download.
   - Only report complete after the rendered screenshots and computed styles confirm: ink on champagne/light; white on navy/dark.