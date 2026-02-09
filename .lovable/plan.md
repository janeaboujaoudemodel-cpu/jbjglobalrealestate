
# Premium Card Style Unification - Header Dropdowns & Footer

## Summary

Apply the premium champagne card style from the **MegaMenuInsights** dropdown to:
1. **All other header mega-menu dropdowns** (content sections only - featured photo cards remain unchanged)
2. **Footer navigation grid** (same 4-column card layout)

The key styling to replicate is the `MenuBlock` pattern:
- Champagne gradient background: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- Gold border with hover enhancement: `border border-gold/30 hover:border-gold/50`
- Rounded corners: `rounded-xl`
- Inner padding: `p-4`
- Section title with icon using `MegaMenuSectionTitle`

---

## Current vs Target State

### Current State
- **MegaMenuInsights**: Uses premium champagne gradient cards in 4x2 grid
- **Other mega menus (Buy, Sell, Rent, Areas, Developers, Services, Projects)**: Use plain list-style links without card containers
- **Footer navigation**: Uses plain text links in a grid without card styling

### Target State
- **All mega menus**: Content sections wrapped in champagne gradient cards (photo sections unchanged)
- **Footer**: Navigation sections wrapped in champagne gradient cards in 4-column grid, matching the Insights dropdown

---

## Technical Implementation

### Part 1: Create Reusable MenuBlock Component

Extract the `MenuBlock` pattern from MegaMenuInsights into the shared mega-menu-primitives file so all menus can use it:

**File: `src/components/header/mega-menu-primitives.tsx`**

Add new `MegaMenuCard` component:
```tsx
export function MegaMenuCard({
  icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]",
      "border border-gold/30 rounded-xl p-4",
      "hover:border-gold/50 transition-all",
      className
    )}>
      <MegaMenuSectionTitle icon={icon} title={title} />
      <div className="space-y-0 max-h-[220px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

### Part 2: Update Header Mega Menus

For each mega menu, wrap the link sections in the new `MegaMenuCard` component:

| Menu | Current Structure | New Structure |
|------|-------------------|---------------|
| MegaMenuBuy | 2 columns of plain links | 2 `MegaMenuCard` blocks |
| MegaMenuSell | 2 columns of plain links | 2 `MegaMenuCard` blocks |
| MegaMenuRent | 2 columns of plain links | 2 `MegaMenuCard` blocks |
| MegaMenuAreas | Grid of plain links | 1 or 2 `MegaMenuCard` blocks |
| MegaMenuDevelopers | Grid of plain links | 1 or 2 `MegaMenuCard` blocks |
| MegaMenuServices | Grid of plain links | 2 `MegaMenuCard` blocks |
| MegaMenuProjects | Single list of links | 1 `MegaMenuCard` block |
| MegaMenuMore | 5-6 columns of plain links | 5-6 `MegaMenuCard` blocks |
| MegaMenuToolkit | 5 suite cards | Already styled, minor alignment |
| MegaMenuInsights | Already using MenuBlock | No change needed |

**Example transformation for MegaMenuBuy:**

Before:
```tsx
<div className="relative flex flex-col">
  <MegaMenuSectionTitle icon={Building2} title="Properties by Type" />
  <div className="space-y-1 min-h-[180px]">
    {propertyTypes.map((item) => (
      <MegaMenuIconLink ... />
    ))}
  </div>
</div>
```

After:
```tsx
<MegaMenuCard icon={Building2} title="Properties by Type">
  {propertyTypes.map((item) => (
    <MegaMenuIconLink ... />
  ))}
</MegaMenuCard>
```

### Part 3: Update Footer Navigation Grid

Transform the footer navigation sections to use the same card styling:

**File: `src/components/Footer.tsx`**

Create a `FooterCard` component (or reuse MegaMenuCard if importing):

```tsx
const FooterCard = ({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) => (
  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-xl p-4 hover:border-gold/50 transition-all">
    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-[0.12em] mb-3 pb-2 border-b border-gold/30 text-black flex items-center gap-2">
      <span className="w-4 h-4 text-gold">✦</span>
      {title}
    </h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);
```

Transform footer grid from:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 border-b border-gold/20">
  <div className="p-2 sm:p-3 md:p-5 border-r border-gold/20">
    <h4 className="font-bold ... text-gold">Properties</h4>
    <ul>...</ul>
  </div>
  ...
</div>
```

To:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <FooterCard title="Properties">
    {propertiesLinks.map((link) => (
      <Link to={link.href} className="block text-zinc-700 hover:text-gold text-sm">
        {link.label}
      </Link>
    ))}
  </FooterCard>
  <FooterCard title="Services">...</FooterCard>
  <FooterCard title="Guides">...</FooterCard>
  <FooterCard title="About & Careers">...</FooterCard>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/header/mega-menu-primitives.tsx` | Add `MegaMenuCard` component |
| `src/components/header/MegaMenuBuy.tsx` | Wrap link sections in `MegaMenuCard` |
| `src/components/header/MegaMenuSell.tsx` | Wrap link sections in `MegaMenuCard` |
| `src/components/header/MegaMenuRent.tsx` | Wrap link sections in `MegaMenuCard` |
| `src/components/header/MegaMenuAreas.tsx` | Wrap link section in `MegaMenuCard` |
| `src/components/header/MegaMenuDevelopers.tsx` | Wrap link section in `MegaMenuCard` |
| `src/components/header/MegaMenuServices.tsx` | Wrap link sections in `MegaMenuCard` |
| `src/components/header/MegaMenuProjects.tsx` | Wrap link section in `MegaMenuCard` |
| `src/components/header/MegaMenuMore.tsx` | Wrap each column in `MegaMenuCard` |
| `src/components/header/MegaMenuInsights.tsx` | Refactor to use shared `MegaMenuCard` |
| `src/components/Footer.tsx` | Replace navigation grid with `FooterCard` components |

---

## Visual Design Specification

### Card Styling (Consistent Across All)
- **Background**: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` (champagne gradient)
- **Border**: `border border-gold/30` (subtle gold)
- **Border Hover**: `hover:border-gold/50` (enhanced gold on hover)
- **Corners**: `rounded-xl`
- **Padding**: `p-4`
- **Title**: Bold, uppercase, black text with gold icon
- **Links**: Black text with gold hover, compact spacing

### Footer-Specific Adjustments
- Cards arranged in 4-column grid on desktop, 2 on tablet, 1 on mobile
- Each card contains section title + list of links
- Maintains existing link structure but wrapped in premium cards
- Gap between cards: `gap-4`

### Header Menu Layout
- Featured photo card remains on the left (unchanged)
- Right side content wrapped in premium cards
- Vertical gold divider between photo and content sections (unchanged)
- CTA buttons at bottom remain outside the cards

---

## Implementation Order

1. Add `MegaMenuCard` component to `mega-menu-primitives.tsx`
2. Update `MegaMenuInsights.tsx` to use the shared component (refactor)
3. Update each header mega menu to use `MegaMenuCard`:
   - MegaMenuBuy
   - MegaMenuSell
   - MegaMenuRent
   - MegaMenuAreas
   - MegaMenuDevelopers
   - MegaMenuServices
   - MegaMenuProjects
   - MegaMenuMore
4. Update Footer.tsx navigation grid with `FooterCard` pattern
5. Test on all breakpoints (mobile, tablet, desktop)

---

## Acceptance Criteria

1. All header mega-menus use champagne gradient cards for link sections
2. Featured photo sections remain unchanged
3. Footer navigation uses same card style as header dropdowns
4. 4-column grid layout in footer matches Insights dropdown
5. Cards have gold borders with hover enhancement
6. Responsive behavior maintained (stacks on mobile)
7. No visual regression in other areas
8. Consistent typography and spacing across all cards
