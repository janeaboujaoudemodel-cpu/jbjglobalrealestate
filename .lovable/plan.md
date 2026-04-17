
Goal: restore white text only on dark/image hero sections, while keeping black text on white/champagne/light surfaces.

What I found
- The project hero is already tagged with `data-surface="dark"` in `ProjectDetailLayout.tsx`.
- `ProjectBreadcrumb.tsx` already has a dark variant.
- The remaining issue is `src/index.css`: there are still broad global overrides forcing dark/gold-to-black styles across links, buttons, icons, and text tokens, and the current dark-surface rescue block is too narrow to fully win in all nested cases.

Why it is still broken
- Global rules like `.text-gold { color: #111 !important; }`, `[class*="text-gold/"] { color: rgba(0,0,0,.85) !important; }`, and button/link-wide overrides still hit hero content.
- The dark-surface block restores some classes, but not enough descendants/states:
  - breadcrumb internals from the shared UI component
  - hero buttons and their inner icons/text
  - amber/gold link variants
  - generic links/spans inheriting `text-foreground` / `text-muted-foreground`

Implementation plan
1. Tighten the dark-surface override in `src/index.css`
- Expand `[data-surface="dark"]` rules so they explicitly restore:
  - `.text-white`, `.text-white/*`
  - `.text-muted-foreground`, gray/zinc/neutral text
  - `.text-gold`, amber/yellow/champagne hex classes
  - `a`, `button`, `svg`, `span`, headings, paragraphs inside dark surfaces
- Add specific overrides for hero CTA descendants so “Download Brochure” and “Register Interest” stay white on transparent dark-image buttons.
- Make the dark-surface block come after the aggressive global overrides so it wins consistently.

2. Harden the project hero in `src/components/project-detail/ProjectDetailLayout.tsx`
- Keep `data-surface="dark"` on the hero wrapper.
- Add an explicit dark-surface utility/class to the CTA row if needed.
- If any title/location/developer line is still inheriting forced dark text, give those elements explicit safe-on-dark classes.

3. Harden breadcrumb rendering in `src/components/project-detail/ProjectBreadcrumb.tsx`
- Keep `surface="dark"`.
- Add stronger explicit classes on the breadcrumb root/list/items so shared breadcrumb defaults cannot flip them dark.
- Ensure separators remain white/40 and current page remains amber-200.

4. Deep audit all similar dark sections
I will inspect and patch any other dark/image sections where the same regression can happen, especially:
- project detail hero
- area hero
- developer hero
- homepage/video hero sections
- dark overlay cards/modals using gold or muted text

Files I expect to update
- `src/index.css`
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/project-detail/ProjectBreadcrumb.tsx`
- possibly other dark hero components found in the audit

Verification after implementation
- Capture screenshots of:
  - `/project/tilal-al-furjan`
  - one area hero
  - one developer hero
  - homepage dark hero/video section
- Confirm:
  - title is white on dark hero
  - breadcrumb is readable
  - location/developer text is readable
  - CTA button text/icons are readable
  - light/champagne forms and dropdowns still use dark text
- Deliver a page-by-page list of every section fixed.

Constraint
- I’m in read-only mode right now, so I can’t apply the fixes or take screenshots in this message. Once you approve, I’ll implement the CSS/component corrections and then provide screenshot proof plus the exact list of pages/sections fixed.
