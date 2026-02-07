
# Add "Sell" Main Hub to Header Navigation

## Overview
This plan adds a new "Sell" mega menu to the desktop header navigation (following the existing pattern of Buy/Rent/Projects/Areas/Developers/Insights) and adds a corresponding "Sell" section to the Footer.

**Important Note**: The current memory states the header is "locked to exactly six items". Adding Sell will make it 7 items: Buy | Sell | Rent | Projects | Areas | Developers | Insights. If this violates project constraints, please confirm before proceeding.

---

## What Will Be Added

### Header Changes
- New "Sell" button in the desktop navigation pill (positioned after "Buy")
- New `MegaMenuSell.tsx` component with:
  - Featured card with selling hero image/video
  - Property Types column (what sellers can list)
  - Seller Resources column (guides, valuation, services)
  - Full-width CTA button

### Footer Changes  
- New "Sell" section in the Properties/Services column area with links to:
  - Sell Your Property (main listing form)
  - Seller's Guide
  - Property Valuation
  - Selling Advisory

### Mobile Menu Changes
- New collapsible "Sell" section with relevant links

---

## File Changes

### 1. Create New File: `src/components/header/MegaMenuSell.tsx`
A new mega menu component following the exact pattern of MegaMenuBuy and MegaMenuRent:
- Featured card with video on hover using existing assets (`sell-property-bg.jpg` and `dubai-selling-hero.mp4`)
- Two link columns: "What You Can Sell" and "Seller Resources"
- CTA button linking to `/seller-listing`

### 2. Modify: `src/components/GlobalHeader.tsx`
- Import the new `MegaMenuSell` component
- Add "Sell" button to the desktop navigation pill (after Buy, before Rent)
- Add separator after Sell button
- Add mega menu panel rendering for `activeMegaMenu === 'sell'`
- Add `mobileSellLinks` array for mobile menu
- Add new collapsible "Sell" section in mobile menu

### 3. Modify: `src/components/Footer.tsx`
- Add new `sellLinks` array with relevant seller resources
- Add "Sell" section in Column 1 (Properties column) between Buy Properties and Rent Properties links, OR as a dedicated subsection

---

## Technical Details

### MegaMenuSell Structure
```text
+------------------------------------------+
|  [Featured Image/Video Card]   |  Links  |
|  - Kicker: "SELL"              |  -------|
|  - Title: "Sell Your Property" |  Types: |
|  - CTA: "Get Started"          |  - Apt  |
|                                |  - Villa|
|                                |  -------|
|                                |  Help:  |
|                                |  - Guide|
|                                |  - Value|
+------------------------------------------+
|       [See Selling Services CTA]         |
+------------------------------------------+
```

### Links to Include in Sell Mega Menu

**What You Can Sell:**
- Apartments
- Villas
- Townhouses
- Penthouses
- Commercial

**Seller Resources:**
- Seller's Guide (`/seller-guide`)
- Property Valuation (`/sell/valuation`)
- Selling Advisory (`/services/selling-advisory`)
- List Your Property (`/seller-listing`)

### Footer Sell Links
- Sell Your Property (`/seller-listing`)
- Seller's Guide (`/seller-guide`)  
- Property Valuation (`/sell/valuation`)
- Selling Advisory (`/services/selling-advisory`)

---

## Assets Used
- Image: `src/assets/services/sell-property-bg.jpg`
- Video: `src/assets/videos/dubai-selling-hero.mp4`

---

## Navigation Order After Implementation
Desktop header pill: **Buy | Sell | Rent | Projects | Areas | Developers | Insights** (7 items)
