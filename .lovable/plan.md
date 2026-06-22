## Goal
Fix Gate 1 properly: every emerald surface must use the same approved dark emerald/black primitive seen on the sidebar Collapse button, with white text/icons, and no light/restricted green variants.

## What I will change
1. **Remove the broken emerald drift**
   - Delete/replace the recent high-specificity rule that introduced a white border and glow around emerald surfaces.
   - Stop using light emerald tokens like `--jj-emerald-light-ombre`, neon emerald, and rgba green glow values for buttons/badges/labels.
   - Make `--jj-emerald-primitive` the single source of truth and alias all old emerald/green button classes to it.

2. **Make the official primitive match the Collapse button**
   - Use the Collapse button’s visual style as the canonical primitive: dark emerald to black gradient, white content, no light green fill, no white card border/ring.
   - Apply it globally to:
     - heart favorite buttons
     - shortlist buttons
     - Add Badge buttons
     - Email / Call / Chat buttons
     - EOI and handover/date labels
     - AI labels and badges
     - mortgage CTA/buttons/sliders
     - View Library / Explore Our Guides icon and CTA
     - header mode/action chips and sidebar emerald controls where they are emerald surfaces

3. **Fix Explore Our Guides & Reports directly**
   - The book icon tile will be emerald primitive with a white book icon.
   - The `View Library` desktop button will be emerald primitive with white text and white arrow.
   - The mobile `View Full Library` link will also become an emerald primitive button instead of green text.
   - Remove the hardcoded `#064E3B` title styling if it causes black/light green conflicts; labels that are surfaces will be emerald+white.

4. **Fix component-level overrides that fight the global system**
   - Remove inline hardcoded green backgrounds from favorite/shortlist/badge components where they prevent the primitive from winning.
   - Replace them with the single `jj-emerald` primitive class and `data-emerald="true"` only where the element itself is an emerald surface.
   - Ensure child SVG paths are forced white without using black filters or light-green text.

5. **Visual validation only before claiming completion**
   - Use Playwright against the live preview after implementation.
   - Capture zoomed screenshots/crops of:
     - sidebar Collapse button reference
     - homepage project card heart / shortlist / Add Badge
     - Email / Call / Chat row
     - Continue Searching heart buttons
     - Explore Our Guides & Reports icon and View Library button
     - Mortgage calculator CTA/sliders
   - Compare rendered/computed backgrounds against the Collapse button primitive.
   - Repeat fixes until screenshots show no mismatched light/restricted greens and all emerald surfaces have white content.

## Files I expect to edit
- `src/index.css`
- `src/components/home/HomepageBookMarquee.tsx`
- `src/components/FavoriteButton.tsx`
- `src/components/ShortlistBadgeButton.tsx`
- `src/components/toolkit/DesignFavoriteButton.tsx`
- Possibly `src/components/ProjectCard.tsx`, mortgage components, and any remaining component found by the green/emerald audit that visually mismatches.

## Acceptance criteria
- One emerald primitive only.
- No light green or alternate green on emerald buttons, badges, labels, icons, sliders, or CTAs.
- White text/icons/arrows inside every emerald surface.
- No visible white borders/rings around project card heart/shortlist/Add Badge controls.
- Completion message only after visual screenshots confirm the fix.