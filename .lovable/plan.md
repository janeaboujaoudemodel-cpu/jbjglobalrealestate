

## Plan: 6 Fixes — Rental Buttons, Company Setup Hero, Nav Overlay Width, Filter Position, Mode Selector, Support Links

### 1. Short-Term Rentals — Faded Hero Buttons

**File**: `src/pages/services/ShortTermRentals.tsx`

The `PremiumHeroButton` component is designed for dark backgrounds (white text/borders on dark). But the Short-Term Rentals hero uses a light champagne background (`bg-gradient-to-br from-[#FDFBF7]`), making white text invisible.

**Fix**: Pass `variant="light-bg"` to both `PremiumHeroButton` calls on lines 191-196. This switches to black text, gold borders, and a champagne fill — perfectly visible on light backgrounds. On hover, they get a stronger gold shadow for 3D depth.

### 2. Company Setup — Hero Video & Section Polish

**File**: `src/pages/services/CompanySetup.tsx`

Currently the hero (lines 105-146) has a plain black background with no video — just a comment `{/* Video placeholder */}`. 

**Fix**:
- Add the `dubai-landmarks-hero.mp4` video background (the authorized hero video per brand standards) with the same pattern used in other service pages
- Tighten section spacing/padding to connect sections visually (remove excessive gaps between hero and "What We Provide")
- Ensure consistent padding across all sections

### 3. Vertical Nav Mega Menu — Wider Content Panels

**File**: `src/components/navigation/GlobalVerticalNav.tsx`

The mega menu overlay panels are capped at `w-[min(440px,calc(100vw-240px))]` (line 878). When clicking Company → About, the content panel feels narrow with a huge gap to the right.

**Fix**: Increase default mega menu panel width from 440px to 600px: `w-[min(600px,calc(100vw-240px))]`. Apply the same increase to the developers/areas panels (line 792) and shortcuts panel (already 560px, bump to 640px). This fills the right-side gap.

### 4. Properties Page — Sticky Filter Overlapping Sidebar Logo

**File**: `src/pages/Properties.tsx`

The sticky filter portal (line 1140) uses `left-0` which covers the vertical nav logo. It should start after the sidebar.

**Fix**: Change the fixed filter from `left-0` to respect the sidebar width. Add a CSS class or inline style `left: var(--sidebar-width, 200px)` (or use `lg:left-[200px]`) so the filter bar starts next to the sidebar, not over it. Also ensure the horizontal utility bar remains visible above it.

### 5. Mode Selector Visibility in Horizontal Header

**Current state**: The `ModeSwitcher` component IS already in the horizontal bar (line 326) and `DisplayModeIconToggle` is also present (line 303). Both are visible on all pages.

**Fix**: The `DisplayModeIconToggle` (line 303-307) is redundant and confusing — it's the "trending/back" mystery buttons the user complained about before. Remove it entirely. The `ModeSwitcher` (line 326) already provides full mode selection. This eliminates confusion and makes the mode selector the single, clear mode control.

### 6. Contact Support vs Create Ticket — Different Destinations

**File**: `src/components/navigation/GlobalVerticalNav.tsx`

Both buttons currently link to `/ticket-hub?tab=new` (lines 1062 and 1069). They should go to different places.

**Fix**:
- **"Contact Us"** (rename from "Contact Support"): Link to `/contact` — the contact page with phone numbers, email, and office info
- **"Create or Follow Up Ticket"** (rename from "Create Ticket"): Link to `/ticket-hub` — opens the ticket hub where users can create new tickets or view existing ones

Apply the same fix in:
- Expanded sidebar (lines 1061-1074)
- Collapsed sidebar tooltips (lines 1145-1160)
- Mobile header (`GlobalHeader.tsx` lines 1022-1025)

### Files

| File | Changes |
|------|---------|
| `src/pages/services/ShortTermRentals.tsx` | Add `variant="light-bg"` to hero buttons |
| `src/pages/services/CompanySetup.tsx` | Add video background to hero, tighten section spacing |
| `src/components/navigation/GlobalVerticalNav.tsx` | Widen mega menu panels; fix Contact/Ticket links and labels |
| `src/pages/Properties.tsx` | Offset sticky filter to respect sidebar width |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Remove `DisplayModeIconToggle` |
| `src/components/GlobalHeader.tsx` | Fix Contact/Ticket links and labels in mobile menu |

