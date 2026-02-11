

# Restore Dropdown Color, Add Dividers, Remove "What You Can Sell"

## Changes

### 1. Restore Dropdown Background Color
The mega menu shell (`MegaMenuShell`) was changed to a dark background (`#1a1815`). This will be reverted to the champagne-gold gradient to match the cards inside it.

- **File:** `src/components/header/mega-menu-primitives.tsx`
- **Change:** Replace `background: '#1a1815'` with the champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) using Tailwind classes instead of inline style.

### 2. Add Dividers Under Category Titles
Add a horizontal gold divider line beneath each card title (e.g., "Properties by Type", "Buyer Resources", "Seller Resources") inside the `MegaMenuSectionTitle` component.

- **File:** `src/components/header/mega-menu-primitives.tsx`
- **Change:** Add a `border-b border-gold/30` or a thin gold gradient line after the title text in `MegaMenuSectionTitle`.

### 3. Remove "What You Can Sell" Card from Sell Menu
Remove the entire first card that lists property types (Apartments, Villas, Townhouses, etc.) from the Sell mega menu. Sellers can sell anything, so this categorization is unnecessary.

- **File:** `src/components/header/MegaMenuSell.tsx`
- **Change:** Remove the `propertyTypes` array and the `MegaMenuCard` that renders "What You Can Sell". The "Seller Resources" card will remain and can expand to use the full width.

## Technical Details

| File | Change |
|------|--------|
| `src/components/header/mega-menu-primitives.tsx` | Revert `MegaMenuShell` background from dark `#1a1815` to champagne gradient; add divider line in `MegaMenuSectionTitle` |
| `src/components/header/MegaMenuSell.tsx` | Remove `propertyTypes` array and "What You Can Sell" `MegaMenuCard`; adjust layout for single card |

