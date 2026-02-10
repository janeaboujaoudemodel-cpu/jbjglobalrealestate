

# Comprehensive Fix: Mode Switcher, Homepage Cards, Lead Popup, Video Scene, Mega Menu Guides, and CTA Buttons

## Issues Identified and Fixes

### 1. Mode Switcher Dropdown (Footer + Header) -- Not Centered, Too Wide
**File:** `src/components/ModeSwitcher.tsx`
- The dropdown (`DropdownMenuContent`) is `w-72` (288px) which is much wider than the trigger button (approx 140-160px with "Investor Mode" text).
- `align="end"` causes it to hang off to the right instead of centering.

**Fix:**
- Change `align="end"` to `align="center"` so the dropdown centers under the trigger button.
- Reduce `w-72` to `w-56` (224px) to better match the trigger button width, making it proportional.
- On the trigger button, increase minimum width with `min-w-[180px]` so the label area is more visually balanced with the dropdown.

### 2. Homepage Layout Gap When Mode Changes
**File:** `src/pages/Index.tsx`
- When switching between Investor and Broker modes, sections that are conditionally shown/hidden may leave visual gaps.

**Fix:** Audit the homepage for mode-conditional sections. Ensure hidden sections don't leave empty space by wrapping them in containers that collapse cleanly (no `min-h` on hidden sections). If broker-specific cards disappear, the grid should reflow automatically with CSS grid.

### 3. Add "Guides" Link to Investor Hub and Broker Hub Mega Menus
**File:** `src/components/header/MegaMenuInvestorHub.tsx`
- Add `{ name: 'Investor Guides', href: '/guides?category=investor', icon: FileText }` to the `toolsLinks` array (or a new guides section).

**File:** `src/components/header/MegaMenuBrokerHub.tsx`
- Add `{ name: 'Broker Guides', href: '/guides?category=broker', icon: FileText }` to the `educationLinks` array.

These will link to the existing `/guides` page filtered by category. If dedicated investor/broker guide pages are needed later, these routes can be created separately.

### 4. Homepage "Handpicked For You" -- Diversify Developers, Fix Card Sizing
**File:** `src/components/home/FeaturedListings.tsx`

**Developer diversity fix:**
- Replace the current selection logic: instead of 2 Emaar, add diversity by including Nakheel, Dubai Properties, and Omniyat.
- New allocation: 1 Emaar, 1 ALDAR, 1 Omniyat, 1 Sobha (Pinnacle only), 1 Bugatti (Binghatti), 1 Mercedes (Binghatti), 1 Nakheel, 1 Dubai Properties.
- Update `ELITE_DEVELOPERS` array to include `'Nakheel'` and `'Dubai Properties'`.
- Remove "The Mirage at Sobha Central" from results (already in filter, but verify).

**Card sizing fix:**
- All cards use `aspect-[4/3]` for the image area, which is correct. The issue is likely inconsistent content height below the image. Add `h-full` and `flex flex-col` to the card container, and `flex-grow` to the content area so all cards stretch to the same height in the grid row.

**Price/Handover overlap fix:**
- Move the price from the image overlay (bottom-left) to the content area below the image, next to the developer name.
- Move the handover date to the bottom-right corner of the content area (not on the image).
- This prevents the price badge and handover badge from touching each other on the image.

### 5. Lead Generation Popup on Homepage
**File:** `src/components/PopupLayer.tsx` and new component `src/components/LeadCapturePopup.tsx`

- Create a new `LeadCapturePopup` component that auto-opens after 5 seconds on the homepage.
- Uses a simplified form: Name, Email, Phone, and "Interested In" dropdown.
- Stores submission in localStorage to avoid showing again (`lead_popup_dismissed`).
- Add it to `PopupLayer.tsx` so it renders globally but only triggers on the homepage route (`/`).
- This is separate from the existing `ContactGatingModal` which is triggered by specific actions.

### 6. JBJ Royal Tools Hub CTA Buttons -- Gold with Black Arrow
**File:** `src/components/home/ToolkitShowcaseCard.tsx`
- The CTA buttons (e.g., "Check Rates", "Get Evaluation") currently use `Button variant="primary"` which uses the champagne gradient.
- Change to an explicit gold background: `className="bg-gold hover:bg-gold-dark text-black"`.
- The `ArrowRight` icon should be `text-black` (it already is since text is black, but enforce it explicitly).

### 7. Remove Video Scene from Properties Hero
**File:** `src/components/PropertiesHeroVideo.tsx`
- The user previously asked to remove a specific scene. Currently there are 3 scenes: Downtown Dubai (Burj Khalifa), Palm Jumeirah, and Burj Al Arab.
- Based on previous conversation context, remove the Palm Jumeirah/Atlantis scene (`palmAtlantisVideo`).
- Update `VIDEO_SCENES` array to only include Downtown Dubai and Burj Al Arab (2 scenes).
- Remove the unused import for `palmAtlantisVideo`.

---

## Technical Summary

| File | Changes |
|---|---|
| `src/components/ModeSwitcher.tsx` | Center dropdown (`align="center"`), reduce width to `w-56`, add `min-w-[180px]` to trigger |
| `src/components/header/MegaMenuInvestorHub.tsx` | Add "Investor Guides" link to tools section |
| `src/components/header/MegaMenuBrokerHub.tsx` | Add "Broker Guides" link to education section |
| `src/components/home/FeaturedListings.tsx` | Diversify developers (add Nakheel, Dubai Properties, reduce Emaar to 1), fix card height uniformity, move price/handover out of image overlay into content area |
| `src/components/home/ToolkitShowcaseCard.tsx` | Change CTA buttons to gold background with black arrow |
| `src/components/PropertiesHeroVideo.tsx` | Remove Palm Jumeirah scene from VIDEO_SCENES |
| `src/components/LeadCapturePopup.tsx` | New: lead gen popup with 5-second delay, name/email/phone/interest fields |
| `src/components/PopupLayer.tsx` | Add LeadCapturePopup to render on homepage |
| `src/pages/Index.tsx` | Ensure mode-conditional sections collapse without leaving gaps |

## Execution Order
1. Fix ModeSwitcher dropdown centering and sizing
2. Add Guides links to Investor Hub and Broker Hub mega menus
3. Fix FeaturedListings developer diversity, card sizing, and price/handover layout
4. Update ToolkitShowcaseCard CTA buttons to gold with black arrow
5. Remove Palm Jumeirah video scene
6. Create LeadCapturePopup and add to PopupLayer
7. Audit homepage for mode-switch layout gaps

