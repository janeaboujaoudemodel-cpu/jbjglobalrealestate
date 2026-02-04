
# Homepage Hero Redesign & Listings Cleanup Plan

## Overview
This plan addresses the hero section layout refinements, color system corrections, currency/unit positioning, filter enhancements, and deletion of unapproved fake listings from the database.

---

## Part 1: Hero Section Layout Adjustments

### 1.1 Text Order (My Recommendation)
Based on marketing best practices, I recommend:

**Order: "Buy · Sell · Rent" FIRST (as the main headline), then "Luxury Licensed Real Estate Brokerage" below it**

**Rationale:**
- "Buy · Sell · Rent" immediately communicates what the user can DO on the platform
- The action-oriented headline creates stronger engagement
- "Luxury Licensed Real Estate Brokerage" serves as a credibility badge/subtitle
- This matches patterns used by top-tier real estate portals

### 1.2 Layout Changes

**Current Layout:**
```
[Luxury Licensed Real Estate Brokerage] (subtitle)
[Buy · Sell · Rent] (headline)
[Delivered with Intelligence]
[Search Bar]
[Buy/Rent/Off Plan pills] (bottom-left)
```

**New Layout:**
```
[Buy · Sell · Rent ·] (main headline - with gold dot after Rent)
[Luxury Licensed Real Estate Brokerage] (smaller subtitle)
[Delivered with Intelligence]
[Currency: AED/USD/EUR/GBP/INR/etc] [sqft/sqm] ← OUTSIDE search bar
[Search Bar] ← pushed down slightly
[Buy/Rent/Off Plan pills] (bottom-left, using WHITE/CHAMPAGNE active color, NOT gold)
```

### 1.3 Specific CSS/Layout Changes

**File**: `src/pages/Index.tsx` (Hero content section)

1. **Swap order**: Move "Buy · Sell · Rent" ABOVE "Luxury Licensed Real Estate Brokerage"
2. **Add gold dot after Rent**: `Buy<dot>Sell<dot>Rent<dot>`
3. **Make "Luxury Licensed Real Estate Brokerage" smaller**: Change from `text-xs sm:text-sm` to `text-[10px] sm:text-xs`
4. **Align text left**: Change `text-center` to `text-left` on the content container
5. **Push search bar down**: Add `mt-6 md:mt-8` margin before HeroSearchBar

**File**: `src/components/home/HeroSearchBar.tsx`

1. **Move Currency/Unit selectors OUTSIDE the filter bar** - Add them as pill buttons above the search bar, aligned left
2. **Remove yellow/gold from Buy/Rent/Off Plan pills** - Use `bg-white/20 text-white` for inactive, `bg-white/90 text-black` for active (matching search bar glassmorphism)
3. **Add more currencies**: Include GBP, INR, SAR, CNY, RUB, CAD, AUD in the currency options
4. **Make filter more detailed**: Add property type dropdown directly in the main bar

---

## Part 2: Color System Correction

### 2.1 Problem

The user has repeatedly stated that the "yellow gold" (`bg-gold`) is being used incorrectly for UI elements like:
- Buy/Rent/Off Plan toggle pills
- Currency selector active state
- Square foot selector active state

The **correct "active color"** is the **champagne gradient** (`--jj-gradient-active`) or **primary HSL** (`--primary: 38 38% 85%`) which is a **muted champagne**, NOT bright yellow-gold.

### 2.2 Current Color Values

```css
/* Wrong - bright gold (yellow-ish) */
--gold: 42 45% 59%;  /* #C8A766 - too yellow/saturated for UI toggles */

/* Correct - champagne active color */
--primary: 38 38% 85%;  /* Muted champagne - proper active state */
--champagne-1: 39 52% 90%;
--champagne-2: 38 38% 85%;
--champagne-3: 38 28% 74%;
```

### 2.3 Changes Required

**File**: `src/components/home/HeroSearchBar.tsx`

Replace active states from `bg-gold` to use the glassmorphism/white-on-dark style matching the search bar:

```tsx
// BEFORE (wrong)
purpose === 'buy'
  ? 'bg-gold text-black shadow-lg'
  : 'bg-white/10 text-white ...'

// AFTER (correct - matching search bar style)
purpose === 'buy'
  ? 'bg-white/90 text-black shadow-lg'  // White-on-dark, not gold
  : 'bg-white/10 text-white hover:bg-white/20 ...'
```

**File**: `src/components/home/HeroSearchBar.tsx` (More Filters dialog)

Replace currency/unit button active states:

```tsx
// BEFORE (wrong)
currency === c ? 'bg-gold text-black shadow-md' : '...'

// AFTER (correct)
currency === c ? 'bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8] text-black border-2 border-gold/50 shadow-md' : '...'
```

---

## Part 3: Currency & Unit Selectors Outside Filter

### 3.1 New Layout

Position currency and area unit selectors as small pills **above** the search bar, aligned left:

```
[AED] [USD] [EUR] [GBP] [INR]  |  [sqft] [sqm]

[Area, project...] [Beds ▼] [Price ▼] [Filters] [SEARCH]

[Buy] [Rent] [Off Plan]
```

### 3.2 Expanded Currency List

Add all major currencies:
- AED (UAE Dirham) 🇦🇪
- USD (US Dollar) 🇺🇸
- EUR (Euro) 🇪🇺
- GBP (British Pound) 🇬🇧
- INR (Indian Rupee) 🇮🇳
- SAR (Saudi Riyal) 🇸🇦
- CNY (Chinese Yuan) 🇨🇳
- RUB (Russian Ruble) 🇷🇺
- CAD (Canadian Dollar) 🇨🇦
- AUD (Australian Dollar) 🇦🇺

---

## Part 4: Delete Fake Listings from Database

### 4.1 Current State

The database contains **6 listings** that were auto-imported without user approval:
1. Manchester City Residence
2. Inaura Hotels & Residences
3. Grove Ridge
4. Artistry One Residences
5. Greencrest
6. Capeside Marina Residences

**There is NO "Sunset Bay Grand" listing** in the database currently.

### 4.2 Action Required

**DELETE ALL 6 listings** from the `projects` table:

```sql
DELETE FROM projects WHERE id IN (
  '826cc038-0947-42fb-bb6e-14e3086a3f91',  -- Manchester City Residence
  'cdd71301-1039-4787-bbe3-cb276bd57788',  -- Inaura Hotels & Residences
  '2204202c-44e5-4c72-9509-82291c810578',  -- Grove Ridge
  '8acaa396-da48-4af3-9463-dc588bcd4095',  -- Artistry One Residences
  'dfc0b970-5528-4b01-a95f-3324fda2e5f0',  -- Greencrest
  'b48bfa08-49a8-4a3e-8519-b7e5cbad1fbb'   -- Capeside Marina Residences
);
```

**Note**: The user mentioned keeping "Sunset Bay Grand" listings since they provided the brochures, but this listing does not currently exist in the database. If the user wants to add it, we'll need to create it manually with the correct data from the provided brochures.

---

## Part 5: Make Filter More Detailed

### 5.1 Enhanced Main Bar Components

Update the main search bar to include:
1. **Location/Area input** (existing)
2. **Property Type dropdown** (new - add to main bar)
3. **Beds dropdown** (existing)
4. **Price Range dropdown** (existing)
5. **Size Range dropdown** (new - move from More Filters to main bar)
6. **More Filters button** (existing)
7. **Search button** (existing)

### 5.2 More Filters Dialog Enhancements

Move currency and area unit to the pills above the search bar, keeping in More Filters:
- Handover status (Ready/Off-Plan/Close to Handover)
- Views (Sea View, Golf View, etc.)
- Amenities
- Furnishing status

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Swap text order, make subtitle smaller, add gold dot after Rent, left-align, push search bar down |
| `src/components/home/HeroSearchBar.tsx` | Move currency/unit outside filter, replace gold with white/champagne active states, add more currencies, enhance filter detail |
| Database | Delete 6 fake listings |

---

## Technical Implementation

### Hero Text Order Change (Index.tsx lines 123-143)

```tsx
<div className="max-w-4xl mx-auto pt-16 md:pt-20">
  {/* Buy · Sell · Rent - NOW FIRST AND MAIN HEADLINE */}
  <motion.h1 
    variants={fadeInUp} 
    className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.1] mb-2 md:mb-3 px-2 sm:px-0 text-left"
  >
    <span className="block whitespace-nowrap">
      {t('hero.buy')}<span className="inline-block w-1.5 h-1.5 rounded-full mx-2 align-middle bg-gold" style={{ boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
      {t('hero.sell')}<span className="inline-block w-1.5 h-1.5 rounded-full mx-2 align-middle bg-gold" style={{ boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
      {t('hero.rent')}<span className="inline-block w-1.5 h-1.5 rounded-full mx-2 align-middle bg-gold" style={{ boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
    </span>
  </motion.h1>

  {/* Luxury Licensed Real Estate Brokerage - NOW SECOND AND SMALLER */}
  <motion.p 
    variants={fadeInUp}
    className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium mb-2 md:mb-3 text-left"
  >
    {t('hero.subtitle')}
  </motion.p>

  {/* Delivered with Intelligence */}
  <motion.span ... className="... text-left">
    {t('hero.deliveredWith')}
  </motion.span>

  {/* Currency & Unit Pills - NEW SECTION */}
  <motion.div variants={fadeInUp} className="flex items-center gap-2 mt-4 mb-2 text-left">
    {/* Currency pills */}
    {/* Unit pills */}
  </motion.div>

  {/* Search Bar - pushed down */}
  <motion.div variants={fadeInUp} className="w-full max-w-5xl mt-4 mb-4 md:mb-6">
    <HeroSearchBar />
  </motion.div>
</div>
```

### Buy/Rent/Off Plan Pills Color Fix (HeroSearchBar.tsx lines 382-416)

```tsx
<button
  onClick={() => setPurpose('buy')}
  className={cn(
    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
    purpose === 'buy'
      ? 'bg-white/90 text-black shadow-lg'  // WHITE active, not gold
      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
  )}
>
  Buy
</button>
```
