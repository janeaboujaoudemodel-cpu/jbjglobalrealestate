

## Improve Vertical Navigation Mega Menu Behavior

### Changes Overview

The vertical sidebar navigation (`PropertiesVerticalNav.tsx`) needs several UX improvements. These changes apply ONLY to the vertical nav mode -- the horizontal GlobalHeader mega menus remain untouched.

### 1. Click-to-Open Instead of Hover

Currently, hovering over nav items with mega menus (Buy, Sell, Rent, etc.) opens the full mega menu panel immediately. This will be changed to:
- **Hover**: Only highlights the nav item (visual feedback), does NOT open the mega menu panel
- **Click**: Opens the mega menu panel
- Clicking again or clicking outside closes it immediately (no 80-120ms delay)

### 2. Smaller, Centered Mega Menu Panel

When a mega menu opens in vertical nav mode, it currently fills the entire right side of the screen. This will be changed to:
- Panel width: max ~700px instead of filling to the right edge
- Centered horizontally in the remaining space (right of the sidebar)
- Slightly rounded corners and shadow for a premium card-like appearance
- The panel will NOT overlap the left sidebar (stays to the right of the 200px sidebar)

### 3. Background Blur Effect

When the mega menu panel is open:
- The main page content behind it gets a subtle backdrop blur effect
- The vertical sidebar itself stays clear and fully visible (no blur on the sidebar)

### 4. Instant Close on Outside Click

- Remove the 80-120ms timeout delays on mouse leave
- Clicking anywhere outside the mega menu panel closes it instantly
- Clicking on a different nav item switches the panel instantly

### 5. Logo Links to Homepage

The JBJ monogram/logo at the top of the vertical sidebar currently has no link. It will be wrapped in a `<Link to="/">` so clicking it navigates to the homepage.

### 6. Hero Section Scroll Behavior (Project Detail Pages)

On project detail pages (`/project/...`), the vertical nav appears only after scrolling past the hero section. The existing behavior already handles this:
- In the hero section: horizontal transparent header is shown
- After scrolling past hero: vertical nav appears, horizontal header hides

This is already working via the `showStickyNav` state in `ProjectDetailLayout.tsx`. No changes needed here -- the user confirmed this is working correctly.

For the `/properties` page (PropertiesReelly), the vertical nav is always shown since there is no hero section. This stays the same.

### Technical Details

**File: `src/components/navigation/PropertiesVerticalNav.tsx`**

| Change | Detail |
|--------|--------|
| Replace `onMouseEnter` with `onClick` on nav items | Mega menus open only on click |
| Remove `handleNavLeave`, `handlePanelEnter`, `handlePanelLeave` hover handlers | No hover-based open/close |
| Wrap logo `<img>` in `<Link to="/">` | Logo navigates to homepage |
| Update `renderMegaMenu()` panel styles | Smaller panel: `max-w-[700px]`, centered in available space |
| Add `backdrop-blur-sm` to the backdrop overlay | Blurs main content behind mega menu |
| Make backdrop click close instantly (already does, but remove timeouts) | Instant close behavior |
| Keep nav item hover styling for visual feedback only | Gold highlight on hover, but no panel opening |

No other files need to be modified. The GlobalHeader mega menus are completely separate and remain unchanged.

