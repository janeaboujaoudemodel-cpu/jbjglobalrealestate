
Goal
- Fix the contrast system properly: white text only on dark/image surfaces, black text only on white/champagne/light form surfaces.

What I confirmed in code
- `src/components/project-detail/ProjectDetailLayout.tsx` already marks the hero with `data-surface="dark"`, but the hero CTAs still depend on the shared `Button` hero variant, and that is still being beaten by broad global CSS.
- `src/index.css` still contains global force-black rules that are too aggressive:
  - gold/text overrides around `1993-2114`
  - white-on-light enforcement around `2174-2189`
  - button/link inner text overrides around `2339-2350`
  These are broad enough to hit dark hero buttons and nested text.
- The light-form side is also inconsistent because several form/modal components still rely on inherited color:
  - `Label` has no default text color
  - `LeadCaptureModal.tsx` headings/descriptions are not fully explicit
  - `LeadCapturePopup.tsx`, `ContactGatingModal.tsx`, `MeetingBookingModal.tsx`, and `Contact.tsx` mix champagne/light backgrounds with inherited typography
- `Contact.tsx` also has dark-hero copy using `text-gray-600` over a black video overlay, which is unreadable.
- There is no public `/cards` route in the router; the public route in code is `/card`. I will audit `/card` as the likely page you mean as well.

Implementation plan
1. Rework `src/index.css`
- Remove or narrowly scope the most dangerous global force-black rules so they stop touching dark/image sections.
- Keep light-surface enforcement only for actual white/champagne form containers.
- Add a dedicated light-form wrapper rule so labels, descriptions, placeholders, select values/items, inputs, textareas, and popovers stay dark on light surfaces.
- Strengthen the dark-surface rules so nested hero buttons, icons, links, breadcrumb text, and muted text stay white/amber on dark imagery.

2. Harden the project hero specifically
- Update `src/components/ui/button.tsx` so the `hero` variant keeps white text/icons reliably on dark hero backgrounds.
- In `src/components/project-detail/ProjectDetailLayout.tsx`, explicitly lock the title, developer line, location row, CTA row, and button inner spans/icons to dark-surface-safe styles.
- In `src/components/project-detail/ProjectBreadcrumb.tsx`, keep the dark variant but make link/separator/current-page colors fully explicit instead of inherited.

3. Fix the broken popups and light forms
- Patch these files:
  - `src/components/LeadCapturePopup.tsx`
  - `src/components/project-detail/LeadCaptureModal.tsx`
  - `src/components/MeetingBookingModal.tsx`
  - `src/components/ContactGatingModal.tsx`
  - `src/pages/Contact.tsx`
- Ensure on light/champagne surfaces:
  - headings/descriptions are black
  - labels are black
  - inputs/textarea/select triggers are black on white
  - dropdown menus/items are black on white
  - helper/privacy text is dark gray
  - only actual dark CTA buttons keep white text

4. Audit shared form primitives so the fix holds site-wide
- Review and tighten:
  - `src/components/ui/label.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/searchable-select.tsx`
  - `src/components/ui/phone-input.tsx`
- Goal: shared controls default to the required black-on-white standard on light surfaces, while existing dark variants still work on dark tools/pages.

5. Deep audit affected pages/sections
- `/project/tilal-al-furjan`
- opened project lead-capture modal
- opened smart lead popup
- `/contact`
- `/card` (since that route exists in code)
- plus any other hero/light-form sections that use the same inherited color pattern

Proof after implementation
- Capture screenshots of:
  - project hero with title, breadcrumb, location, Download Brochure, Register Interest
  - lead-capture modal open
  - smart popup open
  - contact hero + consultation form
  - `/card` if affected
- Deliver a page-by-page list of exactly what was fixed.

Constraint right now
- I’m in read-only mode, so I can’t apply the fixes or capture post-fix screenshots in this message. Once approved, I’ll implement the fixes and then provide screenshot proof plus the exact audit list of corrected pages/sections.
