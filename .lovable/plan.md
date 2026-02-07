

# Comprehensive Fix Plan: Mode System Enhancement, Mobile Hero, and Filter Parity

## Overview

This plan addresses five distinct requirements from the owner:

1. **Mode Switcher Enhancement** - Add "Select your mode" label outside the dropdown + first-time login popup with guided arrow
2. **Mode Color Theme Update** - Investor=Green, Broker=Blue (not gold), Investor+Broker=Purple (consistent header + footer)  
3. **Hero Section Mobile Responsiveness** - Fix search bar visibility on phone
4. **Filters Parity with Reelly** - Ensure homepage Filters button shows full Reelly-style filters

---

## Issue 1: Mode Switcher - "Select your mode" Label + First-Time Popup

### Current Behavior
- Mode switcher shows current mode (e.g., "Investor Mode") when clicked
- First-time users see the role selection modal (Broker/Investor/Visitor) but NOT mode selection
- Mode is auto-defaulted to "investor" without user choice

### Required Behavior
1. **Outside Label**: Show "Select your mode" label above the mode button in account dropdown BEFORE user has made a mode selection
2. **First-Time Login Popup**: When user logs in for the first time (or has never selected a mode), show a popup asking them to select their mode
3. **Guidance Arrow**: After selection, show toast with guidance: "You can change your mode anytime from your profile menu" with visual hint

### Technical Approach

#### Step 1: Track Mode Selection State
**File:** `src/contexts/UserModeContext.tsx`

Add a new state: `hasMadeInitialSelection` that checks if user has explicitly selected a mode (vs auto-defaulted).

```typescript
interface UserModeContextType {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  isInvestorMode: boolean;
  isBrokerMode: boolean;
  isCombinedMode: boolean;
  hasMadeInitialSelection: boolean; // NEW - tracks if user explicitly chose
}
```

Store in localStorage: `jj_mode_selected` (separate from `jj_user_mode` value).

#### Step 2: Create Mode Selection Modal Component
**New File:** `src/components/ModeSelectionModal.tsx`

A popup that:
- Appears on first login if `hasMadeInitialSelection === false`
- Shows 3 mode options with themed cards:
  - Investor Mode (Green) - "Browse properties & invest"
  - Broker Mode (Blue) - "Access broker tools & dashboard"
  - Investor + Broker (Purple) - "Full access to both modes"
- After selection, shows guidance toast with arrow pointing to profile icon

#### Step 3: Update Account Dropdown
**File:** `src/components/header/MegaMenuAccount.tsx`

Add label above ModeSwitcher:

```tsx
<div className="flex flex-col items-end gap-2 shrink-0">
  {!hasMadeInitialSelection && (
    <p className="text-xs text-zinc-500 font-medium">Select your mode</p>
  )}
  <ModeSwitcher variant="header" />
</div>
```

#### Step 4: Add Popup to Coordinator
**File:** `src/contexts/PopupCoordinatorContext.tsx`

Add `'mode-selection-modal'` to PopupId type with priority 3 (after welcome/role but before lead-intent).

---

## Issue 2: Mode Color Theme Update

### Current Colors
- Investor: `text-emerald-500` + `bg-emerald-500/10` (Green) ✅ KEEP
- Broker: `text-gold` + `bg-gold/10` (Gold) ❌ CHANGE TO BLUE
- Investor+Broker: `text-purple-500` + `bg-purple-500/10` (Purple) ✅ KEEP

### Required Colors
- Investor: Green (`text-emerald-500`, `bg-emerald-500/10`, `border-emerald-500/30`)
- Broker: Blue (`text-blue-500`, `bg-blue-500/10`, `border-blue-500/30`)  
- Investor+Broker: Purple (`text-purple-500`, `bg-purple-500/10`, `border-purple-500/30`)

### Files to Update

#### File 1: `src/components/ModeSwitcher.tsx`

Update `MODE_CONFIG` object:

```typescript
const MODE_CONFIG: Record<UserMode, { ... }> = {
  investor: {
    label: 'Investor Mode',
    shortLabel: 'I',
    icon: User,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Browse properties & invest'
  },
  broker: {
    label: 'Broker Mode',
    shortLabel: 'B',
    icon: Briefcase,
    color: 'text-blue-500',  // CHANGED from text-gold
    bgColor: 'bg-blue-500/10 border-blue-500/30',  // CHANGED from bg-gold/10
    description: 'Access broker tools & dashboard'
  },
  investor_broker: {
    label: 'Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Full access to both modes'
  }
};
```

Also update the dropdown item styling to use mode-specific colors for active state backgrounds (instead of generic gold).

#### File 2: `src/components/Footer.tsx`

Update the footer mode switcher section styling to match the new color scheme.

---

## Issue 3: Hero Section Mobile Responsiveness

### Current Problem
The search bar in the hero section is not fully visible on mobile devices:
- Dropdowns and controls overflow on small screens
- Text truncates or wraps awkwardly
- Some controls are hidden but still take up space

### Analysis
**File:** `src/components/home/HeroSearchBar.tsx` (928 lines)

Current structure:
1. Top row: Buy/Rent, Currency, Area Unit dropdowns (flex-wrap)
2. Main row: Location input + Beds + Price + Filters + Search button

The main search bar uses:
```tsx
<div className="flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-xl overflow-hidden w-full max-w-4xl">
```

On mobile, this single-line layout doesn't adapt.

### Solution

#### Step 1: Make Search Bar Stack on Mobile
Add responsive breakpoints to convert horizontal layout to vertical on mobile:

```tsx
// Top controls - already flex-wrap, add gap adjustments
<div className="flex flex-wrap items-center gap-2 sm:gap-2 mb-3">

// Main search bar - stack on mobile
<div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/10 ...">
```

#### Step 2: Simplify Mobile View
On mobile (< 640px):
- Show only essential controls: Location search + Search button
- "Beds", "Price", and "Filters" move to a second row or collapse into Filters
- Buy/Rent and Currency move above as compact pills

#### Step 3: Touch-Friendly Sizing
Increase tap target sizes on mobile:
- Minimum 44px height for all buttons/inputs
- Larger padding on touch targets

### Technical Changes

**File:** `src/components/home/HeroSearchBar.tsx`

Update lines 617-700 for responsive layout:

```tsx
// Main Search Bar - Responsive stacking
<div className="flex flex-col sm:flex-row items-stretch w-full max-w-4xl gap-2 sm:gap-0">
  {/* Location Search - Full width on mobile */}
  <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-xl sm:rounded-l-xl sm:rounded-r-none px-3 py-3 sm:flex-1">
    <Search className="w-5 h-5 text-gold shrink-0" />
    <input
      type="text"
      placeholder="Area, project or community"
      value={locationSearch}
      onChange={(e) => setLocationSearch(e.target.value)}
      className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60 px-3 text-sm font-medium min-w-0"
    />
  </div>
  
  {/* Secondary controls - Row on desktop, hidden or compact on mobile */}
  <div className="hidden sm:flex items-center">
    {/* Beds, Price, Filters, Search button */}
  </div>
  
  {/* Mobile: Full-width search button + Filters side by side */}
  <div className="flex sm:hidden items-center gap-2">
    <button
      onClick={() => setIsFiltersOpen(true)}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white text-sm"
    >
      <SlidersHorizontal className="w-4 h-4 text-gold" />
      Filters
    </button>
    <Button
      onClick={handleSearch}
      className="flex-1 h-12 bg-gold hover:bg-gold-dark text-black font-bold rounded-xl"
    >
      <Search className="w-4 h-4 mr-2" />
      Search
    </Button>
  </div>
</div>
```

---

## Issue 4: Filters Parity with Reelly

### Current State
The Filters dialog in HeroSearchBar.tsx (lines 706-912) already includes:
- Property Type (apartments, villa, townhouse, etc.)
- Property Status (Ready, Off-Plan)
- Sale Status with Reelly-style color dots (Announced, Presale, Start of Sales, On Sale, Sold Out)
- Emirates filter
- Price Range
- Size Range
- Sort By
- Developer
- Community/Area
- AI Home Finder link

### Missing from Reelly Parity
Based on memory `ui/filter-and-map-reelly-parity-v1`:
1. **Payment Plan Slider (0-100%)** - Missing
2. **Broker vs Investor Mode Toggle** - Not in filters (exists separately)
3. **Handover Year Filter** - Missing

### Solution

Add missing filters to the Filters dialog:

#### Step 1: Add Payment Plan Slider
```tsx
{/* Payment Plan Slider */}
<div>
  <label className="text-sm font-semibold text-black/80 mb-2 block">
    Down Payment (%)
  </label>
  <div className="flex items-center gap-4">
    <Slider
      value={[paymentPlan]}
      onValueChange={(v) => setPaymentPlan(v[0])}
      min={0}
      max={100}
      step={5}
      className="flex-1"
    />
    <span className="text-sm font-medium text-black min-w-[3rem] text-right">
      {paymentPlan}%
    </span>
  </div>
</div>
```

#### Step 2: Add Handover Year Filter
```tsx
{/* Handover Year */}
<div>
  <label className="text-sm font-semibold text-black/80 mb-2 block">
    Handover Year
  </label>
  <Select value={handoverYear} onValueChange={setHandoverYear}>
    <SelectTrigger className="h-11 bg-white border-gold/30">
      <SelectValue placeholder="Any Year" />
    </SelectTrigger>
    <SelectContent className="z-[10000]">
      <SelectItem value="all">Any Year</SelectItem>
      <SelectItem value="2024">2024</SelectItem>
      <SelectItem value="2025">2025</SelectItem>
      <SelectItem value="2026">2026</SelectItem>
      <SelectItem value="2027">2027</SelectItem>
      <SelectItem value="2028">2028</SelectItem>
      <SelectItem value="2029">2029</SelectItem>
      <SelectItem value="2030+">2030+</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Files to Update
- `src/components/home/HeroSearchBar.tsx` - Add state variables and UI for Payment Plan slider and Handover Year

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/contexts/UserModeContext.tsx` | Add `hasMadeInitialSelection` state |
| `src/components/ModeSelectionModal.tsx` | NEW - First-time mode selection popup |
| `src/components/ModeSwitcher.tsx` | Update colors: Broker from gold to blue |
| `src/components/header/MegaMenuAccount.tsx` | Add "Select your mode" label |
| `src/components/Footer.tsx` | Update mode switcher styling for new colors |
| `src/components/home/HeroSearchBar.tsx` | Mobile responsive + Payment Plan slider + Handover Year |
| `src/contexts/PopupCoordinatorContext.tsx` | Add mode-selection-modal to popup queue |

---

## Testing Checklist

1. **Mode Selection Flow**
   - [ ] New user logs in -> sees mode selection popup
   - [ ] User selects mode -> popup closes, toast appears with guidance
   - [ ] Account dropdown shows "Select your mode" label before first selection
   - [ ] After selection, label disappears, shows current mode

2. **Mode Colors**
   - [ ] Investor mode shows green theme everywhere
   - [ ] Broker mode shows blue theme everywhere
   - [ ] Investor+Broker shows purple theme everywhere
   - [ ] Footer mode switcher matches header colors

3. **Mobile Hero**
   - [ ] Search bar fully visible on iPhone SE (375px)
   - [ ] Search bar fully visible on iPhone 14 (390px)
   - [ ] All controls accessible via Filters button on mobile
   - [ ] Touch targets are 44px minimum

4. **Filters Parity**
   - [ ] Payment Plan slider appears (0-100%)
   - [ ] Handover Year dropdown appears
   - [ ] Sale Status shows Reelly-style color dots
   - [ ] All filters apply correctly to search

---

## Priority Order

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Mobile hero responsiveness | High |
| P1 | Mode color update (Broker gold → blue) | Low |
| P1 | Add "Select your mode" label | Low |
| P2 | First-time mode selection popup | Medium |
| P2 | Filters: Payment Plan + Handover Year | Medium |

