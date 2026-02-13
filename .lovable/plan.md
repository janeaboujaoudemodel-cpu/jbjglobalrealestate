

## Fix Area Guides Page: Background Edges, Filter UI, Advanced Dialog, and Layout Issues

### Issues Identified

1. **Black edges visible on card listing** -- When vertical nav appears, sections use `lg:ml-[200px]` which reveals the parent's dark `bg-[hsl(var(--premium-bg))]` background on the left/right edges. All section backgrounds must stretch edge-to-edge (full viewport width) while only the inner content shifts right.

2. **Row 2 filter pill icons** -- Remove all icons (DollarSign, CreditCard, Calendar, Building2, Bed, Activity, HardHat, EyeOff) from the filter pills in Row 2. Keep text labels only.

3. **Advanced Filter dialog shape** -- Make it wider/more rectangular (increase max-width from `max-w-2xl` to `max-w-3xl` or `max-w-4xl`).

4. **Wrong project count** -- Currently queries ALL projects (2,484) without filtering by `is_published = true`. Should show 1,808 (published only). Affects both the dialog header and the "Show X projects" button.

5. **Emirates and Developers as collapsible fields** -- Instead of showing the full list immediately, display them as input-like fields ("All Emirates", "All Developers") that expand the list when clicked.

6. **Developer logo frames** -- Make logos fully fit inside rounded frames (not square, use `rounded-lg` instead of `rounded`).

7. **Payment Plan section** -- Currently hidden behind a popover click. Make it visible inline with proper slider layout, not broken.

8. **Price per sqft/sqm/unit layout** -- Fix broken layout in the Advanced Filter dialog for the price tabs and inputs.

9. **"Show X projects" button color** -- Change from gold/yellow gradient to premium champagne-gold color matching the site's design system.

---

### Technical Changes

**File: `src/pages/AreaGuides.tsx`**
- Remove `lg:ml-[200px]` from all section backgrounds (filter bar section, divider, areas grid, DLD widget wrapper, CTA section)
- Instead, keep backgrounds at full width and apply `lg:pl-[200px]` only to inner content containers, OR use padding instead of margin so backgrounds stretch edge-to-edge
- This ensures the champagne gradients cover the full viewport width while content aligns next to the vertical nav

**File: `src/components/filters/FilterShortcutBar.tsx`**
- Row 2 pills: Remove icon components from all filter trigger buttons (remove `<DollarSign>`, `<CreditCard>`, `<Calendar>`, `<Building2>`, `<Bed>`, `<Activity>`, `<HardHat>`, `<EyeOff>` from the pill triggers)
- Keep only text labels and chevron arrows on pills

**File: `src/components/filters/AdvancedFilterPanel.tsx`**
- Change dialog `max-w-2xl` to `max-w-3xl` for a wider, more rectangular shape
- Fix project count query: add `.eq('is_published', true)` to the count query (line 100)
- **Emirates section**: Convert from always-visible list to a collapsible field -- render as an input-like button ("All Emirates" or "X selected") that toggles the list visibility on click
- **Developers section**: Same pattern -- render as an input-like button ("All Developers" or "X selected") that toggles visibility
- **Developer logo frames**: Change `rounded` to `rounded-lg` on the logo container div, ensure `object-contain` fills properly
- **Payment Plan**: Ensure the slider and labels render visibly with proper spacing (fix any broken flex/grid layout)
- **Price section**: Verify grid layout for min/max inputs renders correctly with proper spacing
- **"Show X projects" button**: Change gradient from `from-[#C8A766] to-[#D4AF37]` to the champagne standard: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black`

